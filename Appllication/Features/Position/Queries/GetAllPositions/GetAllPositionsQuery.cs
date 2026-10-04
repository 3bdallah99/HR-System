using Appllication.Common;
using MediatR;

namespace Appllication.Features.Position.Queries.GetAllPositions;

public record GetAllPositionsDto(int Id, string Title, decimal BaseSalary, string DepartmentName, int EmployeeCount);

public record GetAllPositionsQuery(int Page = 1, int PageSize = 20, string? Title = null, int? DepartmentId = null) : IRequest<ApiResponse<PaginatedResult<GetAllPositionsDto>>>;
