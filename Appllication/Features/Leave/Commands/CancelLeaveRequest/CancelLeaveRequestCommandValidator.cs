using FluentValidation;

namespace Appllication.Features.Leave.Commands.CancelLeaveRequest
{
    public class CancelLeaveRequestCommandValidator
        : AbstractValidator<CancelLeaveRequestCommand>
    {
        public CancelLeaveRequestCommandValidator()
        {
            RuleFor(x => x.LeaveRequestId)
                .GreaterThan(0).WithMessage("Leave request ID must be a positive number.");

            RuleFor(x => x.EmployeeId)
                .GreaterThan(0).WithMessage("Employee ID must be a positive number.");
        }
    }
}
