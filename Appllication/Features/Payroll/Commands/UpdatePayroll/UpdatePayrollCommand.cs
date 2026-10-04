using Appllication.Common;
using MediatR;

namespace Appllication.Features.Payroll.Commands.UpdatePayroll
{
    public record UpdatePayrollCommand(int Id, decimal OvertimePay, decimal OtherDeductions)
        : IRequest<ApiResponse<string>>;
}
