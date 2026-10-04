using Appllication.Common;
using MediatR;

namespace Appllication.Features.Position.Queries.GetPositionById;

public record GetPositionByIdDto(int Id, string Title, decimal BaseSalary, string DepartmentName, int EmployeeCount);

public record GetPositionByIdQuery(int Id) : IRequest<ApiResponse<GetPositionByIdDto>>;
