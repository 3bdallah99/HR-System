using Appllication.Common;
using MediatR;

namespace Appllication.Features.Employee.Commands.DeleteEmployee
{
    public record DeleteEmployeeCommand(int Id) : IRequest<ApiResponse<string>>;
}
