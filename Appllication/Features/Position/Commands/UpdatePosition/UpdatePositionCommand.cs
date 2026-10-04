using Appllication.Common;
using MediatR;

namespace Appllication.Features.Position.Commands.UpdatePosition;

public record UpdatePositionCommand(int Id, string Title, decimal BaseSalary, int DepartmentId) : IRequest<ApiResponse<int>>;
