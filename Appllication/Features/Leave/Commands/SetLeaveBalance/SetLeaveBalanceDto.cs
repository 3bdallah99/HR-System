using Domain.Enums;

namespace Appllication.Features.Leave.Commands.SetLeaveBalance
{
    public record SetLeaveBalanceDto(
        int EmployeeId,
        int Year,
        LeaveType LeaveType,
        int TotalDays);
}
