using Appllication.Common;
using MediatR;

namespace Appllication.Features.Department.Queries.GetAllDepartments
{
    public record GetAllDepartmentsQuery(
        int Page = 1,
        int PageSize = 10,
        string? Name = null)
        : IRequest<ApiResponse<PaginatedResult<GetAllDepartmentsDto>>>;

    public record GetAllDepartmentsDto(
        int Id,
        string Name,
        int EmployeeCount,
        int PositionCount);
}
