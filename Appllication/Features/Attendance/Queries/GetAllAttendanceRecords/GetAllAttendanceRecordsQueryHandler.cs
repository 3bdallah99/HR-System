using Appllication.Common;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Attendance.Queries.GetAllAttendanceRecords
{
    public class GetAllAttendanceRecordsQueryHandler
        : IRequestHandler<GetAllAttendanceRecordsQuery, ApiResponse<AttendancePaginatedResult<GetAllAttendanceRecordsDto>>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetAllAttendanceRecordsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<AttendancePaginatedResult<GetAllAttendanceRecordsDto>>> Handle(
            GetAllAttendanceRecordsQuery request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.AttendanceRecord>();
            var baseQuery = repo.GetQueryable()
                .AsNoTracking()
                .Include(ar => ar.Employee)
                .AsQueryable();

            if (request.EmployeeId.HasValue)
            {
                baseQuery = baseQuery.Where(ar => ar.EmployeeId == request.EmployeeId.Value);
            }

            if (request.From.HasValue)
            {
                var fromDateTime = request.From.Value.ToDateTime(TimeOnly.MinValue);
                baseQuery = baseQuery.Where(ar => ar.Date >= fromDateTime);
            }

            if (request.To.HasValue)
            {
                var toDateTime = request.To.Value.ToDateTime(TimeOnly.MaxValue);
                baseQuery = baseQuery.Where(ar => ar.Date <= toDateTime);
            }

            // Calculate aggregate statistics across the entire filtered dataset
            var classifiedQuery = baseQuery.Select(ar => new
            {
                IsWeekend = ar.Note != null && (
                    ar.Note.Contains("عطلة") ||
                    ar.Note.Contains("جمعة") ||
                    ar.Note.Contains("سبت") ||
                    ar.Note.ToLower().Contains("weekend") ||
                    ar.Note.ToLower().Contains("friday") ||
                    ar.Note.ToLower().Contains("saturday")),
                IsExplicitLeave = ar.Status == AttendanceStatus.OnLeave || (ar.Note != null && (
                    ar.Note.Contains("إجازة") ||
                    ar.Note.Contains("أجازة") ||
                    ar.Note.Contains("اجازة") ||
                    ar.Note.ToLower().Contains("leave"))),
                IsLate = ar.Status == AttendanceStatus.Late || ar.LateMinutes > 0,
                IsPresent = ar.Status == AttendanceStatus.Present || ar.ClockIn != null,
                IsAbsent = ar.Status == AttendanceStatus.Absent
            });

            var summary = await classifiedQuery
                .GroupBy(_ => 1)
                .Select(g => new AttendanceSummaryDto(
                    g.Count(x => !x.IsWeekend && !x.IsExplicitLeave && !x.IsLate && x.IsPresent),
                    g.Count(x => !x.IsWeekend && !x.IsExplicitLeave && x.IsLate),
                    g.Count(x => !x.IsWeekend && !x.IsExplicitLeave && !x.IsLate && !x.IsPresent),
                    g.Count(x => !x.IsWeekend && x.IsExplicitLeave)
                ))
                .FirstOrDefaultAsync(cancellationToken) ?? new AttendanceSummaryDto(0, 0, 0, 0);

            // Apply optional Status filter to paginated items
            var itemQuery = baseQuery;
            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                var st = request.Status.Trim().ToLowerInvariant();
                if (st == "present" || st == "0")
                {
                    itemQuery = itemQuery.Where(ar =>
                        !(ar.Note != null && (ar.Note.Contains("عطلة") || ar.Note.Contains("جمعة") || ar.Note.Contains("سبت") || ar.Note.ToLower().Contains("weekend") || ar.Note.ToLower().Contains("friday") || ar.Note.ToLower().Contains("saturday")))
                        && !(ar.Status == AttendanceStatus.OnLeave || (ar.Note != null && (ar.Note.Contains("إجازة") || ar.Note.Contains("أجازة") || ar.Note.Contains("اجازة") || ar.Note.ToLower().Contains("leave"))))
                        && !(ar.Status == AttendanceStatus.Late || ar.LateMinutes > 0)
                        && (ar.Status == AttendanceStatus.Present || ar.ClockIn != null));
                }
                else if (st == "late" || st == "2")
                {
                    itemQuery = itemQuery.Where(ar =>
                        !(ar.Note != null && (ar.Note.Contains("عطلة") || ar.Note.Contains("جمعة") || ar.Note.Contains("سبت") || ar.Note.ToLower().Contains("weekend") || ar.Note.ToLower().Contains("friday") || ar.Note.ToLower().Contains("saturday")))
                        && !(ar.Status == AttendanceStatus.OnLeave || (ar.Note != null && (ar.Note.Contains("إجازة") || ar.Note.Contains("أجازة") || ar.Note.Contains("اجازة") || ar.Note.ToLower().Contains("leave"))))
                        && (ar.Status == AttendanceStatus.Late || ar.LateMinutes > 0));
                }
                else if (st == "absent" || st == "1")
                {
                    itemQuery = itemQuery.Where(ar =>
                        !(ar.Note != null && (ar.Note.Contains("عطلة") || ar.Note.Contains("جمعة") || ar.Note.Contains("سبت") || ar.Note.ToLower().Contains("weekend") || ar.Note.ToLower().Contains("friday") || ar.Note.ToLower().Contains("saturday")))
                        && !(ar.Status == AttendanceStatus.OnLeave || (ar.Note != null && (ar.Note.Contains("إجازة") || ar.Note.Contains("أجازة") || ar.Note.Contains("اجازة") || ar.Note.ToLower().Contains("leave"))))
                        && !(ar.Status == AttendanceStatus.Late || ar.LateMinutes > 0)
                        && !(ar.Status == AttendanceStatus.Present || ar.ClockIn != null));
                }
                else if (st == "onleave" || st == "4")
                {
                    itemQuery = itemQuery.Where(ar =>
                        !(ar.Note != null && (ar.Note.Contains("عطلة") || ar.Note.Contains("جمعة") || ar.Note.Contains("سبت") || ar.Note.ToLower().Contains("weekend") || ar.Note.ToLower().Contains("friday") || ar.Note.ToLower().Contains("saturday")))
                        && (ar.Status == AttendanceStatus.OnLeave || (ar.Note != null && (ar.Note.Contains("إجازة") || ar.Note.Contains("أجازة") || ar.Note.Contains("اجازة") || ar.Note.ToLower().Contains("leave")))));
                }
            }

            var totalCount = await itemQuery.CountAsync(cancellationToken);

            var page = request.Page < 1 ? 1 : request.Page;
            var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

            var items = await itemQuery
                .OrderByDescending(ar => ar.Date)
                .ThenBy(ar => ar.EmployeeId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(ar => new GetAllAttendanceRecordsDto(
                    ar.Id,
                    ar.EmployeeId,
                    ar.Employee != null ? ar.Employee.Name : string.Empty,
                    ar.Employee != null ? ar.Employee.BadgeNumber : null,
                    DateOnly.FromDateTime(ar.Date),
                    ar.Status.ToString(),
                    ar.ClockIn,
                    ar.ClockOut,
                    ar.LateMinutes,
                    ar.Note))
                .ToListAsync(cancellationToken);

            var result = new AttendancePaginatedResult<GetAllAttendanceRecordsDto>
            {
                Items = items,
                PageNumber = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                Summary = summary
            };

            return ApiResponse<AttendancePaginatedResult<GetAllAttendanceRecordsDto>>.Ok(
                result, "Attendance records retrieved successfully");
        }
    }
}
