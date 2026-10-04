using Appllication.Features.Attendance.Commands.CreateAttendanceRecord;
using Appllication.Features.Attendance.Commands.DeleteAttendanceRecord;
using Appllication.Features.Attendance.Commands.UpdateAttendanceRecord;
using Appllication.Features.Attendance.Commands.ProcessDevicePunch;
using Appllication.Features.Attendance.Queries.GetAttendanceByEmployee;
using Appllication.Features.Attendance.Queries.GetDepartmentAttendanceByDate;
using Appllication.Features.Attendance.Queries.GetDeviceAttendanceLogs;
using Appllication.Features.Attendance.Queries.GetTardinessSummary;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace PL.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AttendanceController : ControllerBase
    {
        private readonly ISender _sender;

        public AttendanceController(ISender sender)
        {
            _sender = sender;
        }

        // GET /api/attendance/employee/{employeeId}?from=2026-01-01&to=2026-01-31&page=1&pageSize=31
        [HttpGet("employee/{employeeId:int}")]
        public async Task<IActionResult> GetByEmployee(
            int employeeId,
            [FromQuery] DateOnly? from = null,
            [FromQuery] DateOnly? to = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 31,
            CancellationToken ct = default)
        {
            var result = await _sender.Send(
                new GetAttendanceByEmployeeQuery(employeeId, from, to, page, pageSize), ct);
            return Ok(result);
        }

        // GET /api/attendance/department/{departmentId}/date/{date}
        [HttpGet("department/{departmentId:int}/date/{date}")]
        public async Task<IActionResult> GetDepartmentAttendanceByDate(
            int departmentId,
            DateOnly date,
            CancellationToken ct)
        {
            var result = await _sender.Send(
                new GetDepartmentAttendanceByDateQuery(departmentId, date), ct);
            return Ok(result);
        }

        // GET /api/attendance/tardiness/{employeeId}?year=2026&month=10
        [HttpGet("tardiness/{employeeId:int}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetTardinessSummary(
            int employeeId,
            [FromQuery] int year,
            [FromQuery] int month,
            CancellationToken ct)
        {
            var result = await _sender.Send(
                new GetTardinessSummaryQuery(employeeId, year, month), ct);
            return Ok(result);
        }

        // POST /api/attendance  (HR manual entry)
        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create(
            [FromBody] CreateAttendanceRecordDto dto, CancellationToken ct)
        {
            var command = new CreateAttendanceRecordCommand(
                dto.EmployeeId, dto.Date, dto.Status,
                dto.ClockIn, dto.ClockOut, dto.LateMinutes, dto.Note);
            var result = await _sender.Send(command, ct);
            return CreatedAtAction(nameof(GetByEmployee),
                new { employeeId = dto.EmployeeId }, result);
        }

        // PUT /api/attendance/{id}  (HR correction)
        [HttpPut("{id:int}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(
            int id, [FromBody] UpdateAttendanceRecordDto dto, CancellationToken ct)
        {
            var command = new UpdateAttendanceRecordCommand(
                id, dto.Status, dto.ClockIn, dto.ClockOut, dto.LateMinutes, dto.Note);
            var result = await _sender.Send(command, ct);
            return Ok(result);
        }

        // DELETE /api/attendance/{id}
        [HttpDelete("{id:int}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var result = await _sender.Send(new DeleteAttendanceRecordCommand(id), ct);
            return Ok(result);
        }

        // GET /api/attendance/device-logs
        [HttpGet("device-logs")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetDeviceLogs(
            [FromQuery] string? deviceSerial = null,
            [FromQuery] string? userPin = null,
            [FromQuery] int? employeeId = null,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null,
            [FromQuery] bool? isProcessed = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            CancellationToken ct = default)
        {
            var query = new GetDeviceAttendanceLogsQuery(
                deviceSerial, userPin, employeeId, from, to, isProcessed, page, pageSize);
            var result = await _sender.Send(query, ct);
            return Ok(result);
        }
    }
}
