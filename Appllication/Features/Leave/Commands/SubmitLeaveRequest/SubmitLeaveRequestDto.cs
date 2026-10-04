using Domain.Enums;

namespace Appllication.Features.Leave.Commands.SubmitLeaveRequest
{
    public record SubmitLeaveRequestDto(
        int EmployeeId,
        LeaveType LeaveType,
        DateTime StartDate,
        DateTime EndDate,
        string? Reason);
}
