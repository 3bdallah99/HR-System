using Appllication.Features.Attendance.Commands.ProcessDevicePunch;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Text;

namespace PL.API.Controllers
{
    [ApiController]
    [AllowAnonymous] // Devices use their hardware Serial Number (SN), not Bearer JWT tokens
    [Route("iclock")]
    public class IClockController : ControllerBase
    {
        private readonly ISender _sender;
        private readonly ILogger<IClockController> _logger;

        public IClockController(ISender sender, ILogger<IClockController> logger)
        {
            _sender = sender;
            _logger = logger;
        }

        /// <summary>
        /// Handshake / Connection initialization from ZKTeco uFace800
        /// </summary>
        [HttpGet("cdata")]
        public IActionResult Handshake([FromQuery] string? SN)
        {
            _logger.LogInformation("ZKTeco device handshake received from SN: {SN}", SN ?? "Unknown");
            // Returning "OK" or basic config settings tells the device the server is ready
            return Content("OK", "text/plain");
        }

        /// <summary>
        /// Receives attendance log data (ATTLOG) pushed from ZKTeco device
        /// </summary>
        [HttpPost("cdata")]
        public async Task<IActionResult> PushAttendanceData(
            [FromQuery] string? SN,
            [FromQuery] string? table,
            CancellationToken ct)
        {
            string rawBody;
            using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
            {
                rawBody = await reader.ReadToEndAsync(ct);
            }

            _logger.LogInformation(
                "Received device push. SN: {SN}, Table: {Table}, Length: {Length} bytes",
                SN, table, rawBody.Length);

            if (!string.IsNullOrWhiteSpace(rawBody))
            {
                var command = new ProcessDevicePunchesCommand(SN ?? "Unknown", table, rawBody);
                var result = await _sender.Send(command, ct);
                _logger.LogInformation("Processed device push result: {Message}", result.Message);
            }

            // ZKTeco protocol strictly requires "OK" response to confirm successful receipt
            return Content("OK", "text/plain");
        }

        /// <summary>
        /// Device periodically polls for server-side pending commands
        /// </summary>
        [HttpGet("getrequest")]
        public IActionResult GetRequest([FromQuery] string? SN)
        {
            // "OK" indicates no pending commands
            return Content("OK", "text/plain");
        }

        /// <summary>
        /// Device acknowledges execution of commands
        /// </summary>
        [HttpPost("devicecmd")]
        public IActionResult DeviceCommandResponse([FromQuery] string? SN)
        {
            return Content("OK", "text/plain");
        }
    }
}
