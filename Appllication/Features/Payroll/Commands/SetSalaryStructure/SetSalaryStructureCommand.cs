using Appllication.Common;
using MediatR;

namespace Appllication.Features.Payroll.Commands.SetSalaryStructure
{
    public record SetSalaryStructureCommand(
        int EmployeeId,
        decimal BasicSalary,
        decimal HousingAllowance,
        decimal TransportationAllowance,
        decimal MealAllowance,
        decimal OtherAllowances,
        decimal OvertimePay,
        decimal SocialInsurance,
        decimal TaxAmount,
        decimal OtherDeductions)
        : IRequest<ApiResponse<string>>;
}
