using Appllication.Common;
using MediatR;

namespace Appllication.Features.Attendance.Commands.ProcessDevicePunch
{
    public record ProcessDevicePunchesCommand(
        string DeviceSerial,
        string? TableName,
        string RawPayload
    ) : IRequest<ApiResponse<int>>;
}
