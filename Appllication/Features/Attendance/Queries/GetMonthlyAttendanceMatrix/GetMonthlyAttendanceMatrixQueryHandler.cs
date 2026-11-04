using Appllication.Common;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Appllication.Features.Attendance.Queries.GetMonthlyAttendanceMatrix
{
    public class GetMonthlyAttendanceMatrixQueryHandler
        : IRequestHandler<GetMonthlyAttendanceMatrixQuery, ApiResponse<MonthlyAttendanceMatrixDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetMonthlyAttendanceMatrixQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<MonthlyAttendanceMatrixDto>> Handle(
            GetMonthlyAttendanceMatrixQuery request, CancellationToken cancellationToken)
        {
            DateTime monthStart;
            DateTime monthEnd;

            if (request.IsPayrollCycle)
            {
                // Payroll cycle: 26th of previous month to 25th of current month
                monthEnd = new DateTime(request.Year, request.Month, 25);
                monthStart = monthEnd.AddMonths(-1).AddDays(1);
            }
            else
            {
                // Calendar month: 1st to last day of month
                monthStart = new DateTime(request.Year, request.Month, 1);
                monthEnd = new DateTime(request.Year, request.Month, DateTime.DaysInMonth(request.Year, request.Month));
            }

            // Build Day column metadata
            var daysList = new List<MatrixDayDto>();
            for (var dt = monthStart; dt <= monthEnd; dt = dt.AddDays(1))
            {
                var isWeekend = dt.DayOfWeek == DayOfWeek.Friday || dt.DayOfWeek == DayOfWeek.Saturday;
                daysList.Add(new MatrixDayDto
                {
                    Date = DateOnly.FromDateTime(dt),
                    DayNumber = dt.Day,
                    DayName = dt.ToString("ddd", CultureInfo.InvariantCulture),
                    IsWeekend = isWeekend
                });
            }

            // Query active employees
            var empQuery = _unitOfWork.GetRepository<Domain.Entities.Employee>()
                .GetQueryable()
                .AsNoTracking()
                .Include(e => e.Department)
                .Where(e => e.IsActive);

            if (request.DepartmentId.HasValue && request.DepartmentId.Value > 0)
            {
                empQuery = empQuery.Where(e => e.DepartmentId == request.DepartmentId.Value);
            }

            var employees = await empQuery
                .OrderBy(e => e.Department != null ? e.Department.Name : string.Empty)
                .ThenBy(e => e.Name)
                .ToListAsync(cancellationToken);

            var empIds = employees.Select(e => e.Id).ToList();

            // Pre-fetch all attendance records for these employees within the date range
            var attRecords = await _unitOfWork.GetRepository<Domain.Entities.AttendanceRecord>()
                .GetQueryable()
                .AsNoTracking()
                .Where(ar => empIds.Contains(ar.EmployeeId) && ar.Date >= monthStart && ar.Date <= monthEnd)
                .ToListAsync(cancellationToken);

            var attMap = attRecords
                .GroupBy(ar => (ar.EmployeeId, ar.Date.Date))
                .ToDictionary(g => g.Key, g => g.First());

            // Pre-fetch approved leave requests overlapping this date range
            var leaveRecords = await _unitOfWork.GetRepository<Domain.Entities.LeaveRequest>()
                .GetQueryable()
                .AsNoTracking()
                .Where(l => empIds.Contains(l.EmployeeId) &&
                            l.Status == LeaveStatus.Approved &&
                            l.StartDate <= monthEnd &&
                            l.EndDate >= monthStart)
                .ToListAsync(cancellationToken);

            var leaveMap = leaveRecords
                .GroupBy(l => l.EmployeeId)
                .ToDictionary(g => g.Key, g => g.ToList());

            var today = DateTime.UtcNow.Date;
            var employeeRows = new List<EmployeeMatrixRowDto>();

            int totalAllPresent = 0;
            int totalAllLateOccurrences = 0;
            int totalAllLateMinutes = 0;
            int totalAllAbsent = 0;
            int totalAllLeaves = 0;

            foreach (var emp in employees)
            {
                var row = new EmployeeMatrixRowDto
                {
                    EmployeeId = emp.Id,
                    EmployeeName = emp.Name,
                    BadgeNumber = emp.BadgeNumber,
                    DepartmentId = emp.DepartmentId,
                    DepartmentName = emp.Department?.Name ?? string.Empty
                };

                leaveMap.TryGetValue(emp.Id, out var empLeaves);

                for (var dt = monthStart; dt <= monthEnd; dt = dt.AddDays(1))
                {
                    var dateKey = dt.ToString("yyyy-MM-dd");
                    var dateOnly = DateOnly.FromDateTime(dt);
                    var isWeekend = dt.DayOfWeek == DayOfWeek.Friday || dt.DayOfWeek == DayOfWeek.Saturday;

                    if (attMap.TryGetValue((emp.Id, dt.Date), out var att))
                    {
                        var statusStr = att.Status.ToString();
                        int lateMins = att.LateMinutes;

                        if (att.Status == AttendanceStatus.Present)
                        {
                            row.TotalPresent++;
                            totalAllPresent++;
                        }
                        else if (att.Status == AttendanceStatus.Late)
                        {
                            row.TotalLate++;
                            row.TotalLateMinutes += lateMins;
                            row.TotalPresent++; // Late is also a present working day
                            totalAllLateOccurrences++;
                            totalAllLateMinutes += lateMins;
                            totalAllPresent++;
                        }
                        else if (att.Status == AttendanceStatus.Absent)
                        {
                            row.TotalAbsent++;
                            totalAllAbsent++;
                        }
                        else if (att.Status == AttendanceStatus.OnLeave)
                        {
                            row.TotalLeaves++;
                            totalAllLeaves++;
                        }

                        row.Days[dateKey] = new DayAttendanceStatusDto
                        {
                            RecordId = att.Id,
                            Date = dateOnly,
                            Status = statusStr,
                            ClockIn = att.ClockIn,
                            ClockOut = att.ClockOut,
                            LateMinutes = lateMins,
                            Note = att.Note
                        };
                    }
                    else
                    {
                        // Check if employee has an approved leave covering this day
                        bool onApprovedLeave = empLeaves != null &&
                            empLeaves.Any(l => dt.Date >= l.StartDate.Date && dt.Date <= l.EndDate.Date);

                        if (onApprovedLeave)
                        {
                            row.TotalLeaves++;
                            totalAllLeaves++;
                            row.Days[dateKey] = new DayAttendanceStatusDto
                            {
                                Date = dateOnly,
                                Status = "OnLeave",
                                Note = "إجازة معتمدة"
                            };
                        }
                        else if (isWeekend)
                        {
                            row.TotalWeekends++;
                            row.Days[dateKey] = new DayAttendanceStatusDto
                            {
                                Date = dateOnly,
                                Status = "Weekend",
                                Note = "عطلة أسبوعية"
                            };
                        }
                        else if (dt.Date > today)
                        {
                            row.Days[dateKey] = new DayAttendanceStatusDto
                            {
                                Date = dateOnly,
                                Status = "Future"
                            };
                        }
                        else
                        {
                            // Past working day without punch = Absent
                            row.TotalAbsent++;
                            totalAllAbsent++;
                            row.Days[dateKey] = new DayAttendanceStatusDto
                            {
                                Date = dateOnly,
                                Status = "Absent"
                            };
                        }
                    }
                }

                employeeRows.Add(row);
            }

            var matrixDto = new MonthlyAttendanceMatrixDto
            {
                Year = request.Year,
                Month = request.Month,
                IsPayrollCycle = request.IsPayrollCycle,
                StartDate = DateOnly.FromDateTime(monthStart),
                EndDate = DateOnly.FromDateTime(monthEnd),
                Days = daysList,
                Employees = employeeRows,
                Summary = new MatrixOverallSummaryDto
                {
                    TotalEmployees = employees.Count,
                    TotalPresentDays = totalAllPresent,
                    TotalLateOccurrences = totalAllLateOccurrences,
                    TotalLateMinutes = totalAllLateMinutes,
                    TotalAbsentDays = totalAllAbsent,
                    TotalLeaveDays = totalAllLeaves
                }
            };

            return ApiResponse<MonthlyAttendanceMatrixDto>.Ok(matrixDto, "Monthly attendance matrix retrieved successfully");
        }
    }
}
