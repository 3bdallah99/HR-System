using Appllication.Features.Attendance.Commands.CreateAttendanceRecord;
using Appllication.Features.Attendance.Commands.DeleteAttendanceRecord;
using Appllication.Features.Attendance.Commands.UpdateAttendanceRecord;
using Appllication.Features.Attendance.Commands.UploadAttendanceSheet;
using Appllication.Features.Attendance.Commands.UploadClinicTimesheet;
using Appllication.Features.Attendance.Queries.GetAllAttendanceRecords;
using Appllication.Features.Attendance.Queries.GetAttendanceByEmployee;
using Appllication.Features.Attendance.Queries.GetAttendanceTemplate;
using Appllication.Features.Attendance.Queries.GetDepartmentAttendanceByDate;
using Appllication.Features.Attendance.Queries.GetMonthlyAttendanceMatrix;
using Appllication.Features.Attendance.Queries.GetTardinessSummary;
using Appllication.Common;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PL.API.Extensions;

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

        // GET /api/attendance?page=1&pageSize=10&employeeId=1&from=2026-08-26&to=2026-09-25&status=Present
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] int? employeeId = null,
            [FromQuery] DateOnly? from = null,
            [FromQuery] DateOnly? to = null,
            [FromQuery] string? status = null,
            CancellationToken ct = default)
        {
            if (!User.TryGetAuthorizedEmployeeId(employeeId, out var effectiveEmployeeId))
                return Forbid();

            var result = await _sender.Send(
                new GetAllAttendanceRecordsQuery(effectiveEmployeeId, from, to, status, page, pageSize), ct);
            return Ok(result);
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
            if (!User.TryGetAuthorizedEmployeeId(employeeId, out _))
                return Forbid();

            var result = await _sender.Send(
                new GetAttendanceByEmployeeQuery(employeeId, from, to, page, pageSize), ct);
            return Ok(result);
        }

        // GET /api/attendance/department/{departmentId}/date/{date}
        [HttpGet("department/{departmentId:int}/date/{date}")]
        [Authorize(Policy = "AdminOnly")]
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
        public async Task<IActionResult> GetTardinessSummary(
            int employeeId,
            [FromQuery] int year,
            [FromQuery] int month,
            CancellationToken ct)
        {
            if (!User.TryGetAuthorizedEmployeeId(employeeId, out _))
                return Forbid();

            var result = await _sender.Send(
                new GetTardinessSummaryQuery(employeeId, year, month), ct);
            return Ok(result);
        }

        // GET /api/attendance/monthly-matrix?year=2026&month=11&departmentId=2&isPayrollCycle=false
        [HttpGet("monthly-matrix")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetMonthlyMatrix(
            [FromQuery] int year,
            [FromQuery] int month,
            [FromQuery] int? departmentId = null,
            [FromQuery] bool isPayrollCycle = false,
            CancellationToken ct = default)
        {
            var query = new GetMonthlyAttendanceMatrixQuery(year, month, departmentId, isPayrollCycle);
            var result = await _sender.Send(query, ct);
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

        // POST /api/attendance/upload  (Upload Excel or CSV Sheet)
        [HttpPost("upload")]
        [Authorize(Policy = "AdminOnly")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadSheet(IFormFile file, CancellationToken ct)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(ApiResponse<UploadAttendanceSheetResultDto>.Fail("No file was uploaded or file is empty."));
            }

            using var stream = file.OpenReadStream();
            var command = new UploadAttendanceSheetCommand(stream, file.FileName);
            var result = await _sender.Send(command, ct);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // POST /api/attendance/upload-clinic-timesheet (Upload Clinic Timesheet XLSB/XLSX)
        [HttpPost("upload-clinic-timesheet")]
        [Authorize(Policy = "AdminOnly")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadClinicTimesheet(
            IFormFile file,
            [FromQuery] bool autoProvision = true,
            CancellationToken ct = default)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(ApiResponse<UploadClinicTimesheetResultDto>.Fail("No file was uploaded or file is empty."));
            }

            using var stream = file.OpenReadStream();
            var command = new UploadClinicTimesheetCommand(stream, file.FileName, autoProvision);
            var result = await _sender.Send(command, ct);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // GET /api/attendance/template  (Download Sample Template: excel or csv)
        [HttpGet("template")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DownloadTemplate(
            [FromQuery] string format = "excel",
            CancellationToken ct = default)
        {
            var result = await _sender.Send(new GetAttendanceTemplateQuery(format), ct);
            return File(result.FileContent, result.ContentType, result.FileName);
        }
    }
}
