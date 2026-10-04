using Appllication.Common;
using MediatR;

namespace Appllication.Features.Attendance.Commands.DeleteAttendanceRecord
{
    public record DeleteAttendanceRecordCommand(int Id)
        : IRequest<ApiResponse<string>>;
}
