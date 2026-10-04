using FluentValidation;

namespace Appllication.Features.Payroll.Commands.SetSalaryStructure
{
    public class SetSalaryStructureCommandValidator
        : AbstractValidator<SetSalaryStructureCommand>
    {
        public SetSalaryStructureCommandValidator()
        {
            RuleFor(x => x.EmployeeId)
                .GreaterThan(0).WithMessage("Employee ID must be a positive number.");

            RuleFor(x => x.BasicSalary)
                .GreaterThan(0).WithMessage("Basic salary must be greater than zero.");

            RuleFor(x => x.HousingAllowance).GreaterThanOrEqualTo(0);
            RuleFor(x => x.TransportationAllowance).GreaterThanOrEqualTo(0);
            RuleFor(x => x.MealAllowance).GreaterThanOrEqualTo(0);
            RuleFor(x => x.OtherAllowances).GreaterThanOrEqualTo(0);
            RuleFor(x => x.OvertimePay).GreaterThanOrEqualTo(0);
            RuleFor(x => x.SocialInsurance).GreaterThanOrEqualTo(0);
            RuleFor(x => x.TaxAmount).GreaterThanOrEqualTo(0);
            RuleFor(x => x.OtherDeductions).GreaterThanOrEqualTo(0);
        }
    }
}
