using FluentValidation;

namespace Appllication.Features.Position.Commands.UpdatePosition;

public class UpdatePositionCommandValidator : AbstractValidator<UpdatePositionCommand>
{
    public UpdatePositionCommandValidator()
    {
        RuleFor(v => v.Id)
            .GreaterThan(0).WithMessage("Id is required.");

        RuleFor(v => v.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(100).WithMessage("Title must not exceed 100 characters.");

        RuleFor(v => v.BaseSalary)
            .GreaterThan(0).WithMessage("Base Salary must be greater than 0.");

        RuleFor(v => v.DepartmentId)
            .GreaterThan(0).WithMessage("DepartmentId is required.");
    }
}
