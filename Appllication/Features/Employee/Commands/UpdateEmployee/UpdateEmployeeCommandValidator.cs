using FluentValidation;

namespace Appllication.Features.Employee.Commands.UpdateEmployee
{
    public class UpdateEmployeeCommandValidator : AbstractValidator<UpdateEmployeeCommand>
    {
        public UpdateEmployeeCommandValidator()
        {
            RuleFor(x => x.Id)
                .GreaterThan(0).WithMessage("Employee ID is required.");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Employee name is required.")
                .MaximumLength(100).WithMessage("Name must not exceed 100 characters.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required.")
                .EmailAddress().WithMessage("A valid email address is required.");

            RuleFor(x => x.Phone)
                .NotEmpty().WithMessage("Phone number is required.");

            RuleFor(x => x.Address)
                .NotEmpty().WithMessage("Address is required.");

            RuleFor(x => x.PositionId)
                .GreaterThan(0).WithMessage("A valid position must be selected.");

            RuleFor(x => x.DepartmentId)
                .GreaterThan(0).WithMessage("A valid department must be selected.");
        }
    }
}
