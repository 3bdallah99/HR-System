using Appllication.Common;
using Appllication.Common.Interfaces;
using MediatR;

namespace Appllication.Features.Auth.Commands.ChangePassword
{
    public class ChangePasswordCommandHandler
        : IRequestHandler<ChangePasswordCommand, ApiResponse<string>>
    {
        private readonly IIdentityService _identityService;

        public ChangePasswordCommandHandler(IIdentityService identityService)
        {
            _identityService = identityService;
        }

        public async Task<ApiResponse<string>> Handle(
            ChangePasswordCommand request, CancellationToken cancellationToken)
        {
            await _identityService.ChangePasswordAsync(
                request.UserId,
                request.CurrentPassword,
                request.NewPassword);

            return ApiResponse<string>.Ok("Password changed", "Password changed successfully");
        }
    }
}
