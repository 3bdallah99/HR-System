using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Payroll.Commands.RunPayroll
{
    public class RunPayrollCommandHandler
        : IRequestHandler<RunPayrollCommand, ApiResponse<RunPayrollResultDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        // Monthly tardiness allowance before deductions kick in (minutes)
        private const int TardinessAllowanceMinutes = 60;

        public RunPayrollCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<RunPayrollResultDto>> Handle(
            RunPayrollCommand request, CancellationToken cancellationToken)
        {
            // Build the list of employees to process
            var empQuery = _unitOfWork
                .GetRepository<Domain.Entities.Employee>()
                .GetQueryable()
                .AsNoTracking()
                .Where(e => e.IsActive);

            if (request.EmployeeId.HasValue)
                empQuery = empQuery.Where(e => e.Id == request.EmployeeId.Value);
            else if (request.DepartmentId.HasValue)
                empQuery = empQuery.Where(e => e.DepartmentId == request.DepartmentId.Value);

            var employees = await empQuery
                .Select(e => new { e.Id, e.Position.BaseSalary })
                .ToListAsync(cancellationToken);

            if (!employees.Any())
                throw new NotFoundException("No active employees found matching the criteria.");

            // Date boundaries for this payroll cycle (26th of previous month to 25th of current month)
            var monthEnd   = new DateTime(request.Year, request.Month, 25);
            var monthStart = monthEnd.AddMonths(-1).AddDays(1);

            var payrollRepo   = _unitOfWork.GetRepository<Domain.Entities.Payroll>();
            var salaryRepo    = _unitOfWork.GetRepository<SalaryStructure>();
            var attRepo       = _unitOfWork.GetRepository<Domain.Entities.AttendanceRecord>();
            var leaveRepo     = _unitOfWork.GetRepository<Domain.Entities.LeaveRequest>();

            var empIds = employees.Select(e => e.Id).Distinct().ToList();

            // ─── 4 Bulk Pre-fetch Queries (eliminating 5N+1 bottleneck) ───────
            // 1. Existing payroll records for recalculation / update
            var existingPayrolls = await payrollRepo.GetQueryable()
                .Where(p => p.Month == request.Month &&
                            p.Year == request.Year &&
                            empIds.Contains(p.EmployeeId))
                .ToListAsync(cancellationToken);
            var existingPayrollsMap = existingPayrolls.ToDictionary(p => p.EmployeeId);

            // 2. Salary structures for all target employees
            var salaryStructures = await salaryRepo.GetQueryable()
                .AsNoTracking()
                .Where(s => empIds.Contains(s.EmployeeId))
                .ToListAsync(cancellationToken);
            var salaryStructuresMap = salaryStructures.ToDictionary(s => s.EmployeeId);

            // 3. Attendance records within payroll cycle boundaries for present days, tardiness, and absences
            var attendanceRecords = await attRepo.GetQueryable()
                .AsNoTracking()
                .Where(ar => empIds.Contains(ar.EmployeeId) &&
                             ar.Date >= monthStart &&
                             ar.Date <= monthEnd)
                .Select(ar => new { ar.EmployeeId, ar.Date, ar.Status, ar.LateMinutes })
                .ToListAsync(cancellationToken);

            var attendanceByEmp = attendanceRecords
                .GroupBy(ar => ar.EmployeeId)
                .ToDictionary(
                    g => g.Key,
                    g => new
                    {
                        DaysPresent = g.Count(ar => ar.Status == AttendanceStatus.Present || ar.Status == AttendanceStatus.Late),
                        TotalLateMinutes = g.Where(ar => ar.Status == AttendanceStatus.Late).Sum(ar => ar.LateMinutes),
                        AbsentDates = g.Where(ar => ar.Status == AttendanceStatus.Absent).Select(ar => ar.Date.Date).Distinct().ToList()
                    });

            // 4. Approved leave requests overlapping this month
            var approvedLeaves = await leaveRepo.GetQueryable()
                .AsNoTracking()
                .Where(l => empIds.Contains(l.EmployeeId) &&
                            l.Status == LeaveStatus.Approved &&
                            l.StartDate <= monthEnd &&
                            l.EndDate >= monthStart)
                .Select(l => new { l.EmployeeId, l.StartDate, l.EndDate })
                .ToListAsync(cancellationToken);

            var approvedLeavesMap = approvedLeaves
                .GroupBy(l => l.EmployeeId)
                .ToDictionary(g => g.Key, g => g.ToList());

            int     processedCount = 0;
            int     skippedCount   = 0;
            decimal totalNetPay    = 0;
            var     paymentDate    = DateTime.UtcNow;

            foreach (var emp in employees)
            {
                // Load salary structure from pre-fetched map (fallback to Position.BaseSalary if not set)
                if (!salaryStructuresMap.TryGetValue(emp.Id, out var structure) || structure is null)
                {
                    structure = new SalaryStructure
                    {
                        EmployeeId = emp.Id,
                        BasicSalary = emp.BaseSalary
                    };
                }

                // ─── Earnings ─────────────────────────────────────────
                decimal grossPay = structure.BasicSalary
                                 + structure.HousingAllowance
                                 + structure.TransportationAllowance
                                 + structure.MealAllowance
                                 + structure.OtherAllowances
                                 + structure.OvertimePay;

                // ─── Attendance ───────────────────────────────────────
                int daysPresent = 0;
                int totalLateMinutes = 0;
                var absentDates = new List<DateTime>();
                if (attendanceByEmp.TryGetValue(emp.Id, out var attSummary))
                {
                    daysPresent = attSummary.DaysPresent;
                    totalLateMinutes = attSummary.TotalLateMinutes;
                    absentDates = attSummary.AbsentDates;
                }

                int approvedLeaveDays = 0;
                bool hasLeaves = approvedLeavesMap.TryGetValue(emp.Id, out var empLeaves);
                if (hasLeaves && empLeaves != null)
                {
                    approvedLeaveDays = empLeaves.Sum(l =>
                    {
                        var start = l.StartDate.Date < monthStart.Date ? monthStart.Date : l.StartDate.Date;
                        var end   = l.EndDate.Date   > monthEnd.Date   ? monthEnd.Date   : l.EndDate.Date;
                        return Math.Max(0, (end - start).Days + 1);
                    });
                }

                // DaysAbsent is based on recorded AttendanceStatus.Absent records within the payroll cycle (26th to 25th),
                // excluding any absent day that falls within an approved leave request (LeaveStatus.Approved).
                int daysAbsent = 0;
                if (absentDates.Count > 0)
                {
                    if (hasLeaves && empLeaves != null && empLeaves.Count > 0)
                    {
                        daysAbsent = absentDates.Count(absDate =>
                            !empLeaves.Any(l => absDate >= l.StartDate.Date && absDate <= l.EndDate.Date));
                    }
                    else
                    {
                        daysAbsent = absentDates.Count;
                    }
                }

                // ─── Absence deduction ────────────────────────────────
                // An employee cannot miss more working days than the working days scheduled in this cycle
                int maxPossibleAbsentDays = Math.Max(0, request.WorkingDaysInMonth - daysPresent);
                int effectiveAbsentDays   = Math.Min(daysAbsent, maxPossibleAbsentDays);

                decimal dailyRate        = request.WorkingDaysInMonth > 0 ? structure.BasicSalary / request.WorkingDaysInMonth : 0m;
                decimal absenceDeduction = Math.Min(Math.Round(dailyRate * effectiveAbsentDays, 2), structure.BasicSalary);

                // ─── Tardiness deduction ──────────────────────────────
                int deductibleMinutes = Math.Max(0, totalLateMinutes - TardinessAllowanceMinutes);

                // Per-minute rate = BasicSalary / (WorkingDays × 8 hours × 60 minutes)
                decimal perMinuteRate      = request.WorkingDaysInMonth > 0 ? structure.BasicSalary / (request.WorkingDaysInMonth * 8 * 60) : 0m;
                decimal tardinessDeduction = Math.Round(perMinuteRate * deductibleMinutes, 2);

                // ─── Fixed deductions ─────────────────────────────────
                decimal totalDeductions = absenceDeduction
                                        + tardinessDeduction
                                        + structure.SocialInsurance
                                        + structure.TaxAmount
                                        + structure.OtherDeductions;

                decimal netPay = Math.Max(0m, Math.Round(grossPay - totalDeductions, 2));

                // ─── Idempotent Upsert (Recalculate or Create) ─────────
                if (existingPayrollsMap.TryGetValue(emp.Id, out var existingPayroll))
                {
                    // Recalculate & update existing payroll record
                    existingPayroll.PaymentDate               = paymentDate;

                    existingPayroll.BasicSalary              = structure.BasicSalary;
                    existingPayroll.HousingAllowance         = structure.HousingAllowance;
                    existingPayroll.TransportationAllowance  = structure.TransportationAllowance;
                    existingPayroll.MealAllowance            = structure.MealAllowance;
                    existingPayroll.OtherAllowances          = structure.OtherAllowances;
                    existingPayroll.OvertimePay              = structure.OvertimePay;
                    existingPayroll.GrossPay                 = Math.Round(grossPay, 2);

                    existingPayroll.AbsenceDeduction         = absenceDeduction;
                    existingPayroll.TardinessDeductionMinutes = deductibleMinutes;
                    existingPayroll.TardinessDeduction       = tardinessDeduction;
                    existingPayroll.SocialInsurance          = structure.SocialInsurance;
                    existingPayroll.TaxAmount                = structure.TaxAmount;
                    existingPayroll.OtherDeductions          = structure.OtherDeductions;
                    existingPayroll.TotalDeductions          = Math.Round(totalDeductions, 2);

                    existingPayroll.NetPay                   = netPay;

                    existingPayroll.WorkingDaysInMonth       = request.WorkingDaysInMonth;
                    existingPayroll.DaysPresent              = daysPresent;
                    existingPayroll.DaysAbsent               = effectiveAbsentDays;
                    existingPayroll.ApprovedLeaveDays        = approvedLeaveDays;
                    existingPayroll.TotalLateMinutes         = totalLateMinutes;

                    payrollRepo.Update(existingPayroll);
                }
                else
                {
                    var newPayroll = new Domain.Entities.Payroll
                    {
                        EmployeeId                = emp.Id,
                        Month                     = request.Month,
                        Year                      = request.Year,
                        PaymentDate               = paymentDate,

                        // Earnings snapshot
                        BasicSalary               = structure.BasicSalary,
                        HousingAllowance          = structure.HousingAllowance,
                        TransportationAllowance   = structure.TransportationAllowance,
                        MealAllowance             = structure.MealAllowance,
                        OtherAllowances           = structure.OtherAllowances,
                        OvertimePay               = structure.OvertimePay,
                        GrossPay                  = Math.Round(grossPay, 2),

                        // Deductions snapshot
                        AbsenceDeduction          = absenceDeduction,
                        TardinessDeductionMinutes = deductibleMinutes,
                        TardinessDeduction        = tardinessDeduction,
                        SocialInsurance           = structure.SocialInsurance,
                        TaxAmount                 = structure.TaxAmount,
                        OtherDeductions           = structure.OtherDeductions,
                        TotalDeductions           = Math.Round(totalDeductions, 2),

                        NetPay                    = netPay,

                        // Audit
                        WorkingDaysInMonth        = request.WorkingDaysInMonth,
                        DaysPresent               = daysPresent,
                        DaysAbsent                = effectiveAbsentDays,
                        ApprovedLeaveDays         = approvedLeaveDays,
                        TotalLateMinutes          = totalLateMinutes
                    };

                    await payrollRepo.AddAsync(newPayroll, cancellationToken);
                }

                totalNetPay    += netPay;
                processedCount++;
            }

            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<RunPayrollResultDto>.Ok(
                new RunPayrollResultDto(processedCount, skippedCount, totalNetPay),
                $"Payroll run complete. Processed: {processedCount}, Skipped: {skippedCount}");
        }
    }
}
