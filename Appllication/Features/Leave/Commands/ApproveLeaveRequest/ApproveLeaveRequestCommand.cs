using Appllication.Common;
using MediatR;

namespace Appllication.Features.Leave.Commands.ApproveLeaveRequest
{
    public record ApproveLeaveRequestCommand(int LeaveRequestId)
        : IRequest<ApiResponse<string>>;
}
