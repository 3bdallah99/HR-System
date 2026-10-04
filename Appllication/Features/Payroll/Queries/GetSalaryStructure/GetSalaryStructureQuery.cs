using Appllication.Common;
using MediatR;

namespace Appllication.Features.Payroll.Queries.GetSalaryStructure
{
    public record GetSalaryStructureQuery(int EmployeeId)
        : IRequest<ApiResponse<SalaryStructureDto>>;

    public record SalaryStructureDto(
        int EmployeeId,
        string EmployeeName,
        // Earnings
        decimal BasicSalary,
        decimal HousingAllowance,
        decimal TransportationAllowance,
        decimal MealAllowance,
        decimal OtherAllowances,
        decimal OvertimePay,
        decimal TotalEarnings,
        // Deductions
        decimal SocialInsurance,
        decimal TaxAmount,
        decimal OtherDeductions,
        decimal TotalFixedDeductions,
        // Summary
        decimal EstimatedGross,
        DateTime LastUpdatedAt);
}
