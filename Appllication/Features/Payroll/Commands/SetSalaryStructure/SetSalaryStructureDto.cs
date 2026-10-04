namespace Appllication.Features.Payroll.Commands.SetSalaryStructure
{
    public record SetSalaryStructureDto(
        decimal BasicSalary,
        decimal HousingAllowance = 0,
        decimal TransportationAllowance = 0,
        decimal MealAllowance = 0,
        decimal OtherAllowances = 0,
        decimal OvertimePay = 0,
        decimal SocialInsurance = 0,
        decimal TaxAmount = 0,
        decimal OtherDeductions = 0);
}
