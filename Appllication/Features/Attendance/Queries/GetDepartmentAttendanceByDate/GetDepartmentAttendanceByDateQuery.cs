using Appllication.Common;
using MediatR;

namespace Appllication.Features.Attendance.Queries.GetDepartmentAttendanceByDate
{
    public record GetDepartmentAttendanceByDateQuery(
        int DepartmentId,
        DateOnly Date)
        : IRequest<ApiResponse<GetDepartmentAttendanceByDateDto>>;

    public record GetDepartmentAttendanceByDateDto(
        int DepartmentId,
        string DepartmentName,
        DateOnly Date,
        List<EmployeeAttendanceDto> Employees);

    public record EmployeeAttendanceDto(
        int EmployeeId,
        string EmployeeName,
        int? AttendanceRecordId,    // null if no record for that day
        string? Status,             // null if no record for that day
        DateTime? ClockIn,
        DateTime? ClockOut,
        string? Note);
}
