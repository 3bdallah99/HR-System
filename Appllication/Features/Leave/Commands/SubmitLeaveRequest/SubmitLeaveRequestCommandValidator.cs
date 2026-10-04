using FluentValidation;

namespace Appllication.Features.Leave.Commands.SubmitLeaveRequest
{
    public class SubmitLeaveRequestCommandValidator
        : AbstractValidator<SubmitLeaveRequestCommand>
    {
        public SubmitLeaveRequestCommandValidator()
        {
            RuleFor(x => x.EmployeeId)
                .GreaterThan(0).WithMessage("Employee ID must be a positive number.");

            RuleFor(x => x.StartDate)
                .GreaterThan(DateTime.UtcNow.Date)
                .WithMessage("Start date must be in the future.");

            RuleFor(x => x.EndDate)
                .GreaterThanOrEqualTo(x => x.StartDate)
                .WithMessage("End date must be on or after the start date.");

            RuleFor(x => x.Reason)
                .MaximumLength(500).WithMessage("Reason must not exceed 500 characters.")
                .When(x => x.Reason != null);
        }
    }
}
