using Appllication.Common;
using MediatR;

namespace Appllication.Features.Payroll.Queries.GetPayrollByEmployee
{
    public record GetPayrollByEmployeeQuery(
        int EmployeeId,
        int? Year = null,
        int Page = 1,
        int PageSize = 12) // default to 1 year
        : IRequest<ApiResponse<PaginatedResult<GetPayrollByEmployeeDto>>>;

    public record GetPayrollByEmployeeDto(
        int Id,
        int Month,
        int Year,
        DateTime PaymentDate,
        decimal BasicSalary,
        decimal HousingAllowance,
        decimal TransportationAllowance,
        decimal MealAllowance,
        decimal OtherAllowances,
        decimal OvertimePay,
        decimal GrossPay,
        decimal AbsenceDeduction,
        int TardinessDeductionMinutes,
        decimal TardinessDeduction,
        decimal SocialInsurance,
        decimal TaxAmount,
        decimal OtherDeductions,
        decimal TotalDeductions,
        decimal NetPay,
        int WorkingDaysInMonth,
        int DaysPresent,
        int DaysAbsent,
        int ApprovedLeaveDays,
        int TotalLateMinutes);
}
