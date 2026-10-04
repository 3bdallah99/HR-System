using Appllication.Common;
using MediatR;

namespace Appllication.Features.Position.Commands.CreatePosition;

public record CreatePositionCommand(string Title, decimal BaseSalary, int DepartmentId) : IRequest<ApiResponse<int>>;
