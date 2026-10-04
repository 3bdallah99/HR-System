using FluentValidation;

namespace Appllication.Features.Payroll.Commands.DeletePayroll
{
    public class DeletePayrollCommandValidator : AbstractValidator<DeletePayrollCommand>
    {
        public DeletePayrollCommandValidator()
        {
            RuleFor(x => x.Id)
                .GreaterThan(0).WithMessage("Payroll ID must be a positive number.");
        }
    }
}
