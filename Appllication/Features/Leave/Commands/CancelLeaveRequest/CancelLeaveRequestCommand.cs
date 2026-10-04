using Appllication.Common;
using MediatR;

namespace Appllication.Features.Leave.Commands.CancelLeaveRequest
{
    public record CancelLeaveRequestCommand(int LeaveRequestId, int EmployeeId)
        : IRequest<ApiResponse<string>>;
}
