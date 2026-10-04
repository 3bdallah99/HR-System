using FluentValidation;

namespace Appllication.Features.PerformanceReview.Commands.AcknowledgeReview
{
    public class AcknowledgeReviewCommandValidator : AbstractValidator<AcknowledgeReviewCommand>
    {
        public AcknowledgeReviewCommandValidator()
        {
            RuleFor(v => v.ReviewId)
                .GreaterThan(0).WithMessage("ReviewId must be greater than 0.");

            RuleFor(v => v.EmployeeId)
                .GreaterThan(0).WithMessage("EmployeeId must be greater than 0.");
        }
    }
}
