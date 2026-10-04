using FluentValidation;

namespace Appllication.Features.Payroll.Commands.RunPayroll
{
    public class RunPayrollCommandValidator : AbstractValidator<RunPayrollCommand>
    {
        public RunPayrollCommandValidator()
        {
            RuleFor(x => x.Month)
                .InclusiveBetween(1, 12).WithMessage("Month must be between 1 and 12.");

            RuleFor(x => x.Year)
                .InclusiveBetween(2000, 2100).WithMessage("Year must be between 2000 and 2100.");

            RuleFor(x => x.WorkingDaysInMonth)
                .InclusiveBetween(1, 31).WithMessage("Working days must be between 1 and 31.");

            RuleFor(x => x.EmployeeId)
                .GreaterThan(0).WithMessage("Employee ID must be a positive number.")
                .When(x => x.EmployeeId.HasValue);

            RuleFor(x => x.DepartmentId)
                .GreaterThan(0).WithMessage("Department ID must be a positive number.")
                .When(x => x.DepartmentId.HasValue);
        }
    }
}
