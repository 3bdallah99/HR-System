using Appllication.Common;
using Domain.Enums;
using MediatR;

namespace Appllication.Features.Attendance.Commands.CreateAttendanceRecord
{
    public record CreateAttendanceRecordCommand(
        int EmployeeId,
        DateOnly Date,
        AttendanceStatus Status,
        DateTime? ClockIn,
        DateTime? ClockOut,
        int LateMinutes,
        string? Note)
        : IRequest<ApiResponse<int>>;
}
