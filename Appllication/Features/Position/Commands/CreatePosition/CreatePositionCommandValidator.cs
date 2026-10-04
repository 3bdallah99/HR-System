using FluentValidation;

namespace Appllication.Features.Position.Commands.CreatePosition;

public class CreatePositionCommandValidator : AbstractValidator<CreatePositionCommand>
{
    public CreatePositionCommandValidator()
    {
        RuleFor(v => v.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(100).WithMessage("Title must not exceed 100 characters.");

        RuleFor(v => v.BaseSalary)
            .GreaterThan(0).WithMessage("Base Salary must be greater than 0.");

        RuleFor(v => v.DepartmentId)
            .GreaterThan(0).WithMessage("DepartmentId is required.");
    }
}
