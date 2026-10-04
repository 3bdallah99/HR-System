using Domain.Enums;

namespace Appllication.Features.Attendance.Commands.UpdateAttendanceRecord
{
    public record UpdateAttendanceRecordDto(
        AttendanceStatus Status,
        DateTime? ClockIn,
        DateTime? ClockOut,
        int LateMinutes,
        string? Note);
}
