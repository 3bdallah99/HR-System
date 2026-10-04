using Appllication.Common;
using MediatR;

namespace Appllication.Features.Auth.Commands.ChangePassword
{
    public record ChangePasswordCommand(
        string UserId,
        string CurrentPassword,
        string NewPassword)
        : IRequest<ApiResponse<string>>;
}
