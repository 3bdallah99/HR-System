using Appllication.Common;
using Appllication.Common.Interfaces;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Appllication.Features.Auth.Commands.Register
{
    public class RegisterCommandHandler : IRequestHandler<RegisterCommand, ApiResponse<string>>
    {
        private readonly IIdentityService _identityService;

        public RegisterCommandHandler(IIdentityService identityService)
        {
            _identityService = identityService;
        }

        public async Task<ApiResponse<string>> Handle(RegisterCommand request, CancellationToken cancellationToken)
        {
            var result = await _identityService.RegisterAsync(request.Email, request.Password, request.UserName, request.EmployeeId);
            return ApiResponse<string>.Ok(result, "Success");
        }
    }
}
