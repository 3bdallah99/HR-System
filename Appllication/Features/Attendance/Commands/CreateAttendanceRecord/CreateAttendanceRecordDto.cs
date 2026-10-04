using Domain.Enums;

namespace Appllication.Features.Attendance.Commands.CreateAttendanceRecord
{
    public record CreateAttendanceRecordDto(
        int EmployeeId,
        DateOnly Date,
        AttendanceStatus Status,
        DateTime? ClockIn,
        DateTime? ClockOut,
        int LateMinutes,
        string? Note);
}
