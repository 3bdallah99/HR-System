using Appllication.Common;
using MediatR;

namespace Appllication.Features.Payroll.Commands.DeletePayroll
{
    public record DeletePayrollCommand(int Id) : IRequest<ApiResponse<string>>;
}
