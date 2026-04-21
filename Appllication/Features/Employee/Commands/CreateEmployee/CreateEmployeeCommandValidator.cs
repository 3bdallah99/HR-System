using FluentValidation;

namespace Appllication.Features.Employee.Commands.CreateEmployee
{
    public class CreateEmployeeCommandValidator : AbstractValidator<CreateEmployeeCommand>
    {
        public CreateEmployeeCommandValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Employee name is required.")
                .MaximumLength(100).WithMessage("Name must not exceed 100 characters.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required.")
                .EmailAddress().WithMessage("A valid email address is required.")
                .MaximumLength(200).WithMessage("Email must not exceed 200 characters.");

            RuleFor(x => x.Phone)
                .NotEmpty().WithMessage("Phone number is required.")
                .MaximumLength(20).WithMessage("Phone must not exceed 20 characters.");

            RuleFor(x => x.Address)
                .NotEmpty().WithMessage("Address is required.")
                .MaximumLength(300).WithMessage("Address must not exceed 300 characters.");

            RuleFor(x => x.HireDate)
                .NotEmpty().WithMessage("Hire date is required.")
                .LessThanOrEqualTo(DateTime.UtcNow.Date.AddDays(1))
                    .WithMessage("Hire date cannot be in the future.");

            RuleFor(x => x.PositionId)
                .GreaterThan(0).WithMessage("A valid position must be selected.");

            RuleFor(x => x.DepartmentId)
                .GreaterThan(0).WithMessage("A valid department must be selected.");

            RuleFor(x => x.ManagerId)
                .GreaterThan(0)
                .When(x => x.ManagerId.HasValue)
                .WithMessage("Manager ID must be a positive number.");
        }
    }
}
