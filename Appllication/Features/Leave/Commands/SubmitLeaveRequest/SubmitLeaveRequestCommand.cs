using Appllication.Common;
using Domain.Enums;
using MediatR;

namespace Appllication.Features.Leave.Commands.SubmitLeaveRequest
{
    public record SubmitLeaveRequestCommand(
        int EmployeeId,
        LeaveType LeaveType,
        DateTime StartDate,
        DateTime EndDate,
        string? Reason)
        : IRequest<ApiResponse<int>>;
}
