using FluentValidation;

namespace Appllication.Features.Leave.Commands.ApproveLeaveRequest
{
    public class ApproveLeaveRequestCommandValidator
        : AbstractValidator<ApproveLeaveRequestCommand>
    {
        public ApproveLeaveRequestCommandValidator()
        {
            RuleFor(x => x.LeaveRequestId)
                .GreaterThan(0).WithMessage("Leave request ID must be a positive number.");
        }
    }
}
