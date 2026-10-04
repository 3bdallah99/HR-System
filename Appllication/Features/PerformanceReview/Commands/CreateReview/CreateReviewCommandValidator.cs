using FluentValidation;

namespace Appllication.Features.PerformanceReview.Commands.CreateReview
{
    public class CreateReviewCommandValidator : AbstractValidator<CreateReviewCommand>
    {
        public CreateReviewCommandValidator()
        {
            RuleFor(v => v.EmployeeId)
                .GreaterThan(0).WithMessage("EmployeeId must be greater than 0.");

            RuleFor(v => v.ReviewerEmployeeId)
                .GreaterThan(0).WithMessage("ReviewerEmployeeId must be greater than 0.");

            RuleFor(v => v.Rating)
                .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5.");

            RuleFor(v => v.Feedback)
                .NotEmpty().WithMessage("Feedback is required.")
                .MaximumLength(2000).WithMessage("Feedback must not exceed 2000 characters.");
        }
    }
}
