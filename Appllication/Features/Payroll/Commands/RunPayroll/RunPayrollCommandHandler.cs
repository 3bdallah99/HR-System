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

            // Date boundaries for this month
            var monthStart = new DateTime(request.Year, request.Month, 1);
            var monthEnd   = monthStart.AddMonths(1).AddDays(-1);

            var payrollRepo   = _unitOfWork.GetRepository<Domain.Entities.Payroll>();
            var salaryRepo    = _unitOfWork.GetRepository<SalaryStructure>();
            var attRepo       = _unitOfWork.GetRepository<Domain.Entities.AttendanceRecord>();
            var leaveRepo     = _unitOfWork.GetRepository<Domain.Entities.LeaveRequest>();

            int     processedCount = 0;
            int     skippedCount   = 0;
            decimal totalNetPay    = 0;
            var     paymentDate    = DateTime.UtcNow;

            foreach (var emp in employees)
            {
                // Skip if already processed for this month
                var alreadyExists = await payrollRepo.AnyAsync(
                    p => p.EmployeeId == emp.Id &&
                         p.Month == request.Month &&
                         p.Year  == request.Year,
                    cancellationToken);

                if (alreadyExists) { skippedCount++; continue; }

                // Load salary structure (fallback to Position.BaseSalary if not set)
                var structure = await salaryRepo.FirstOrDefaultAsync(
                    s => s.EmployeeId == emp.Id, cancellationToken);

                if (structure is null)
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
                var daysPresent = await attRepo.GetQueryable()
                    .CountAsync(ar =>
                        ar.EmployeeId == emp.Id &&
                        ar.Date >= monthStart &&
                        ar.Date <= monthEnd &&
                        (ar.Status == AttendanceStatus.Present || ar.Status == AttendanceStatus.Late),
                    cancellationToken);

                var approvedLeaves = await leaveRepo.GetQueryable()
                    .Where(l =>
                        l.EmployeeId == emp.Id &&
                        l.Status     == LeaveStatus.Approved &&
                        l.StartDate  <= monthEnd &&
                        l.EndDate    >= monthStart)
                    .Select(l => new { l.StartDate, l.EndDate })
                    .ToListAsync(cancellationToken);

                int approvedLeaveDays = approvedLeaves.Sum(l =>
                {
                    var start = l.StartDate.Date < monthStart.Date ? monthStart.Date : l.StartDate.Date;
                    var end   = l.EndDate.Date   > monthEnd.Date   ? monthEnd.Date   : l.EndDate.Date;
                    return Math.Max(0, (end - start).Days + 1);
                });

                int daysAbsent = Math.Max(0,
                    request.WorkingDaysInMonth - daysPresent - approvedLeaveDays);

                // ─── Absence deduction ────────────────────────────────
                decimal dailyRate        = structure.BasicSalary / request.WorkingDaysInMonth;
                decimal absenceDeduction = Math.Round(dailyRate * daysAbsent, 2);

                // ─── Tardiness deduction ──────────────────────────────
                int totalLateMinutes = await attRepo.GetQueryable()
                    .Where(ar =>
                        ar.EmployeeId == emp.Id &&
                        ar.Status     == AttendanceStatus.Late &&
                        ar.Date       >= monthStart &&
                        ar.Date       <= monthEnd)
                    .SumAsync(ar => ar.LateMinutes, cancellationToken);

                int deductibleMinutes = Math.Max(0, totalLateMinutes - TardinessAllowanceMinutes);

                // Per-minute rate = BasicSalary / (WorkingDays × 8 hours × 60 minutes)
                decimal perMinuteRate    = structure.BasicSalary / (request.WorkingDaysInMonth * 8 * 60);
                decimal tardinessDeduction = Math.Round(perMinuteRate * deductibleMinutes, 2);

                // ─── Fixed deductions ─────────────────────────────────
                decimal totalDeductions = absenceDeduction
                                        + tardinessDeduction
                                        + structure.SocialInsurance
                                        + structure.TaxAmount
                                        + structure.OtherDeductions;

                decimal netPay = Math.Round(grossPay - totalDeductions, 2);

                var payroll = new Domain.Entities.Payroll
                {
                    EmployeeId               = emp.Id,
                    Month                    = request.Month,
                    Year                     = request.Year,
                    PaymentDate              = paymentDate,

                    // Earnings snapshot
                    BasicSalary              = structure.BasicSalary,
                    HousingAllowance         = structure.HousingAllowance,
                    TransportationAllowance  = structure.TransportationAllowance,
                    MealAllowance            = structure.MealAllowance,
                    OtherAllowances          = structure.OtherAllowances,
                    OvertimePay              = structure.OvertimePay,
                    GrossPay                 = Math.Round(grossPay, 2),

                    // Deductions snapshot
                    AbsenceDeduction         = absenceDeduction,
                    TardinessDeductionMinutes = deductibleMinutes,
                    TardinessDeduction       = tardinessDeduction,
                    SocialInsurance          = structure.SocialInsurance,
                    TaxAmount                = structure.TaxAmount,
                    OtherDeductions          = structure.OtherDeductions,
                    TotalDeductions          = Math.Round(totalDeductions, 2),

                    NetPay                   = netPay,

                    // Audit
                    WorkingDaysInMonth       = request.WorkingDaysInMonth,
                    DaysPresent              = daysPresent,
                    DaysAbsent               = daysAbsent,
                    ApprovedLeaveDays        = approvedLeaveDays,
                    TotalLateMinutes         = totalLateMinutes
                };

                await payrollRepo.AddAsync(payroll, cancellationToken);
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
