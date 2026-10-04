using Appllication.Common;
using Domain.Enums;
using MediatR;

namespace Appllication.Features.Attendance.Queries.GetAttendanceByEmployee
{
    public record GetAttendanceByEmployeeQuery(
        int EmployeeId,
        DateOnly? From = null,
        DateOnly? To = null,
        int Page = 1,
        int PageSize = 31) // default to ~1 month
        : IRequest<ApiResponse<PaginatedResult<GetAttendanceByEmployeeDto>>>;

    public record GetAttendanceByEmployeeDto(
        int Id,
        DateOnly Date,
        string Status,
        DateTime? ClockIn,
        DateTime? ClockOut,
        string? Note);
}
