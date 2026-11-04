using Appllication.Common;
using MediatR;

namespace Appllication.Features.Attendance.Queries.GetAllAttendanceRecords
{
    public record GetAllAttendanceRecordsQuery(
        int? EmployeeId = null,
        DateOnly? From = null,
        DateOnly? To = null,
        string? Status = null,
        int Page = 1,
        int PageSize = 10)
        : IRequest<ApiResponse<AttendancePaginatedResult<GetAllAttendanceRecordsDto>>>;

    public record GetAllAttendanceRecordsDto(
        int Id,
        int EmployeeId,
        string EmployeeName,
        string? BadgeNumber,
        DateOnly Date,
        string Status,
        DateTime? ClockIn,
        DateTime? ClockOut,
        int LateMinutes,
        string? Note);
}
