using Appllication.Common;
using Domain.Enums;
using MediatR;

namespace Appllication.Features.Leave.Commands.SetLeaveBalance
{
    public record SetLeaveBalanceCommand(
        int EmployeeId,
        int Year,
        LeaveType LeaveType,
        int TotalDays)
        : IRequest<ApiResponse<string>>;
}
