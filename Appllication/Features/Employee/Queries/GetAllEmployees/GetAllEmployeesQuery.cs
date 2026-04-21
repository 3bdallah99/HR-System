using Appllication.Common;
using MediatR;

namespace Appllication.Features.Employee.Queries.GetAllEmployees
{
    public record GetAllEmployeesQuery(
        int Page = 1,
        int PageSize = 10,
        string? Name = null,
        string? Email = null,
        int? DepartmentId = null)
        : IRequest<ApiResponse<PaginatedResult<GetAllEmployeesDto>>>;

    public record GetAllEmployeesDto(
        int Id,
        string Name,
        string Email,
        string Phone,
        string Address,
        DateTime HireDate,
        bool IsActive,
        string PositionTitle,
        decimal BaseSalary,
        string DepartmentName,
        string? ManagerName);
}
