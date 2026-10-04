using FluentValidation;

namespace Appllication.Features.Payroll.Commands.UpdatePayroll
{
    public class UpdatePayrollCommandValidator : AbstractValidator<UpdatePayrollCommand>
    {
        public UpdatePayrollCommandValidator()
        {
            RuleFor(x => x.Id)
                .GreaterThan(0).WithMessage("Payroll ID must be a positive number.");

            RuleFor(x => x.OvertimePay)
                .GreaterThanOrEqualTo(0).WithMessage("Overtime pay cannot be negative.");

            RuleFor(x => x.OtherDeductions)
                .GreaterThanOrEqualTo(0).WithMessage("Other deductions cannot be negative.");
        }
    }
}
