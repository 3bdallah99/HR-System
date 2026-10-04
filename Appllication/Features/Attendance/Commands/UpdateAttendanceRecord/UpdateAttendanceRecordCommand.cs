using Appllication.Common;
using Domain.Enums;
using MediatR;

namespace Appllication.Features.Attendance.Commands.UpdateAttendanceRecord
{
    public record UpdateAttendanceRecordCommand(
        int Id,
        AttendanceStatus Status,
        DateTime? ClockIn,
        DateTime? ClockOut,
        int LateMinutes,
        string? Note)
        : IRequest<ApiResponse<string>>;
}
