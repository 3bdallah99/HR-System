using Appllication.Common;
using MediatR;

namespace Appllication.Features.Payroll.Queries.GetPayrollByMonth
{
    public record GetPayrollByMonthQuery(
        int Month,
        int Year,
        int? DepartmentId = null)
        : IRequest<ApiResponse<GetPayrollByMonthDto>>;

    public record GetPayrollByMonthDto(
        int Month,
        int Year,
        decimal TotalBasicSalary,
        decimal TotalGrossPay,
        decimal TotalOvertimePay,
        decimal TotalDeductions,
        decimal TotalNetPay,
        int PayslipsCount,
        List<PayrollSummaryDto> Payslips);

    public record PayrollSummaryDto(
        int Id,
        int EmployeeId,
        string EmployeeName,
        string DepartmentName,
        string PositionTitle,
        decimal BasicSalary,
        decimal GrossPay,
        decimal OvertimePay,
        decimal AbsenceDeduction,
        decimal TardinessDeduction,
        decimal TotalDeductions,
        decimal NetPay,
        int DaysPresent,
        int DaysAbsent,
        DateTime PaymentDate);
}
