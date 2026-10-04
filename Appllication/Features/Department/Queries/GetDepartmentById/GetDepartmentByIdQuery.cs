using Appllication.Common;
using MediatR;

namespace Appllication.Features.Department.Queries.GetDepartmentById
{
    public record GetDepartmentByIdQuery(int Id)
        : IRequest<ApiResponse<GetDepartmentByIdDto>>;

    public record GetDepartmentByIdDto(
        int Id,
        string Name,
        int EmployeeCount,
        List<PositionSummaryDto> Positions);

    public record PositionSummaryDto(
        int Id,
        string Title,
        decimal BaseSalary);
}
