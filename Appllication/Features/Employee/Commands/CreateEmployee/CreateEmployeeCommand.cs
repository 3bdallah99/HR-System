using Appllication.Common;
using MediatR;

namespace Appllication.Features.Employee.Commands.CreateEmployee
{
    public record CreateEmployeeCommand(
        string Name,
        string Email,
        string Phone,
        string Address,
        DateTime HireDate,
        int PositionId,
        int DepartmentId,
        int? ManagerId) : IRequest<ApiResponse<int>>;
}
