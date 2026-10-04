using Appllication.Common;
using Appllication.Common.Interfaces;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Appllication.Features.Auth.Commands.Login
{
    public class LoginCommandHandler : IRequestHandler<LoginCommand, ApiResponse<string>>
    {
        private readonly IIdentityService _identityService;

        public LoginCommandHandler(IIdentityService identityService)
        {
            _identityService = identityService;
        }

        public async Task<ApiResponse<string>> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            var token = await _identityService.LoginAsync(request.Email, request.Password);
            return ApiResponse<string>.Ok(token, "Login Successful");
        }
    }
}
