using Appllication.Common;
using MediatR;

namespace Appllication.Features.Leave.Commands.RejectLeaveRequest
{
    public record RejectLeaveRequestCommand(
        int LeaveRequestId,
        string? RejectionNote)
        : IRequest<ApiResponse<string>>;
}
