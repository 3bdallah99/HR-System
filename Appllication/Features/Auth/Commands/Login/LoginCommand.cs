using Appllication.Common;
using MediatR;

namespace Appllication.Features.Auth.Commands.Login
{
    public record LoginDto(string Email, string Password);

    public record LoginCommand(string Email, string Password) : IRequest<ApiResponse<string>>;
}
