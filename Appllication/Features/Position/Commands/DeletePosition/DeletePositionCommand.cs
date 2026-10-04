using Appllication.Common;
using MediatR;

namespace Appllication.Features.Position.Commands.DeletePosition;

public record DeletePositionCommand(int Id) : IRequest<ApiResponse<bool>>;
