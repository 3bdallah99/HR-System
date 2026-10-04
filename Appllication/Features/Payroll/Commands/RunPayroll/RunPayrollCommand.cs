using Appllication.Common;
using MediatR;

namespace Appllication.Features.Payroll.Commands.RunPayroll
{
    public record RunPayrollCommand(
        int Month,
        int Year,
        int? EmployeeId,
        int? DepartmentId,
        int WorkingDaysInMonth)
        : IRequest<ApiResponse<RunPayrollResultDto>>;

    public record RunPayrollResultDto(
        int ProcessedCount,
        int SkippedCount,
        decimal TotalNetPay);
}
