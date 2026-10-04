using Appllication.Common;
using MediatR;

namespace Appllication.Features.Auth.Commands.Register
{
    public record RegisterDto(string Email, string Password, string UserName, int? EmployeeId);

    public record RegisterCommand(string Email, string Password, string UserName, int? EmployeeId) : IRequest<ApiResponse<string>>;
}
