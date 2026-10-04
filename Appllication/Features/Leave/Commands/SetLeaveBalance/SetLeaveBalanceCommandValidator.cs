using FluentValidation;

namespace Appllication.Features.Leave.Commands.SetLeaveBalance
{
    public class SetLeaveBalanceCommandValidator
        : AbstractValidator<SetLeaveBalanceCommand>
    {
        public SetLeaveBalanceCommandValidator()
        {
            RuleFor(x => x.EmployeeId)
                .GreaterThan(0).WithMessage("Employee ID must be a positive number.");

            RuleFor(x => x.Year)
                .InclusiveBetween(2000, 2100).WithMessage("Year must be between 2000 and 2100.");

            RuleFor(x => x.TotalDays)
                .GreaterThan(0).WithMessage("Total days must be a positive number.")
                .LessThanOrEqualTo(365).WithMessage("Total days cannot exceed 365.");
        }
    }
}
