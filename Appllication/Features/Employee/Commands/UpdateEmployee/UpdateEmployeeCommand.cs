using Appllication.Common;
using MediatR;

namespace Appllication.Features.Employee.Commands.UpdateEmployee
{
    public record UpdateEmployeeCommand(
        int Id,
        string Name,
        string Email,
        string Phone,
        string Address,
        DateTime HireDate,
        bool IsActive,
        int PositionId,
        int DepartmentId,
        int? ManagerId) : IRequest<ApiResponse<string>>;
}
