using Appllication.Common;
using MediatR;

namespace Appllication.Features.Payroll.Commands.DeleteSalaryStructure
{
    public record DeleteSalaryStructureCommand(int EmployeeId) : IRequest<ApiResponse<string>>;
}
