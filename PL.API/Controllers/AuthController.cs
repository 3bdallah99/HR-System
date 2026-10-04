using Appllication.Features.Auth.Commands.ChangePassword;
using Appllication.Features.Auth.Commands.Login;
using Appllication.Features.Auth.Commands.Register;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PL.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ISender _sender;

        public AuthController(ISender sender)
        {
            _sender = sender;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var command = new LoginCommand(dto.Email, dto.Password);
            var result = await _sender.Send(command);
            return Ok(result);
        }

        [HttpPost("register")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var command = new RegisterCommand(dto.Email, dto.Password, dto.UserName, dto.EmployeeId);
            var result = await _sender.Send(command);
            return Ok(result);
        }

        // POST /api/auth/change-password
        // Any authenticated user (Employee or HR) can change their own password.
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(
            [FromBody] ChangePasswordDto dto, CancellationToken ct)
        {
            // Extract UserId from the JWT token — the client cannot forge this.
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var command = new ChangePasswordCommand(userId, dto.CurrentPassword, dto.NewPassword);
            var result = await _sender.Send(command, ct);
            return Ok(result);
        }
    }
}
