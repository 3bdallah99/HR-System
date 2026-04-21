using Appllication.Common;
using MediatR;

namespace Appllication.Features.Employee.Queries.GetEmployeeById
{
    public record GetEmployeeByIdQuery(int Id)
        : IRequest<ApiResponse<GetEmployeeByIdDto>>;

    public record GetEmployeeByIdDto(
        int Id,
        string Name,
        string Email,
        string Phone,
        string Address,
        DateTime HireDate,
        bool IsActive,
        int PositionId,
        string PositionTitle,
        decimal BaseSalary,
        int DepartmentId,
        string DepartmentName,
        int? ManagerId,
        string? ManagerName);
}
