using FluentValidation;

namespace Appllication.Features.Leave.Commands.RejectLeaveRequest
{
    public class RejectLeaveRequestCommandValidator
        : AbstractValidator<RejectLeaveRequestCommand>
    {
        public RejectLeaveRequestCommandValidator()
        {
            RuleFor(x => x.LeaveRequestId)
                .GreaterThan(0).WithMessage("Leave request ID must be a positive number.");

            RuleFor(x => x.RejectionNote)
                .MaximumLength(500).WithMessage("Rejection note must not exceed 500 characters.")
                .When(x => x.RejectionNote != null);
        }
    }
}
