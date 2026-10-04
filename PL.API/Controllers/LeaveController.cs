using Appllication.Features.Leave.Commands.ApproveLeaveRequest;
using Appllication.Features.Leave.Commands.CancelLeaveRequest;
using Appllication.Features.Leave.Commands.RejectLeaveRequest;
using Appllication.Features.Leave.Commands.SetLeaveBalance;
using Appllication.Features.Leave.Commands.SubmitLeaveRequest;
using Appllication.Features.Leave.Queries.GetAllLeaveRequests;
using Appllication.Features.Leave.Queries.GetLeaveBalances;
using Appllication.Features.Leave.Queries.GetLeaveRequestsByEmployee;
using Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace PL.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class LeaveController : ControllerBase
    {
        private readonly ISender _sender;

        public LeaveController(ISender sender)
        {
            _sender = sender;
        }

        // GET /api/leave/requests/employee/{id}?status=Pending&year=2026
        [HttpGet("requests/employee/{employeeId:int}")]
        public async Task<IActionResult> GetByEmployee(
            int employeeId,
            [FromQuery] LeaveStatus? status = null,
            [FromQuery] int? year = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken ct = default)
        {
            var result = await _sender.Send(
                new GetLeaveRequestsByEmployeeQuery(employeeId, status, year, page, pageSize), ct);
            return Ok(result);
        }

        // GET /api/leave/requests?status=Pending&departmentId=2
        [HttpGet("requests")]
        public async Task<IActionResult> GetAll(
            [FromQuery] LeaveStatus? status = null,
            [FromQuery] int? departmentId = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken ct = default)
        {
            var result = await _sender.Send(
                new GetAllLeaveRequestsQuery(status, departmentId, page, pageSize), ct);
            return Ok(result);
        }

        // GET /api/leave/balances/{employeeId}?year=2026
        [HttpGet("balances/{employeeId:int}")]
        public async Task<IActionResult> GetBalances(
            int employeeId,
            [FromQuery] int? year = null,
            CancellationToken ct = default)
        {
            var result = await _sender.Send(
                new GetLeaveBalancesQuery(employeeId, year), ct);
            return Ok(result);
        }

        // POST /api/leave/requests
        [HttpPost("requests")]
        public async Task<IActionResult> Submit(
            [FromBody] SubmitLeaveRequestDto dto, CancellationToken ct)
        {
            var command = new SubmitLeaveRequestCommand(
                dto.EmployeeId, dto.LeaveType, dto.StartDate, dto.EndDate, dto.Reason);
            var result = await _sender.Send(command, ct);
            return Ok(result);
        }

        // POST /api/leave/requests/{id}/approve
        [HttpPost("requests/{id:int}/approve")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Approve(int id, CancellationToken ct)
        {
            var command = new ApproveLeaveRequestCommand(id);
            var result = await _sender.Send(command, ct);
            return Ok(result);
        }

        // POST /api/leave/requests/{id}/reject
        [HttpPost("requests/{id:int}/reject")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Reject(
            int id, [FromBody] RejectLeaveRequestDto dto, CancellationToken ct)
        {
            var command = new RejectLeaveRequestCommand(id, dto.RejectionNote);
            var result = await _sender.Send(command, ct);
            return Ok(result);
        }

        // DELETE /api/leave/requests/{id}?employeeId=1
        [HttpDelete("requests/{id:int}")]
        public async Task<IActionResult> Cancel(
            int id, [FromQuery] int employeeId, CancellationToken ct)
        {
            var result = await _sender.Send(
                new CancelLeaveRequestCommand(id, employeeId), ct);
            return Ok(result);
        }

        // POST /api/leave/balances
        [HttpPost("balances")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> SetBalance(
            [FromBody] SetLeaveBalanceDto dto, CancellationToken ct)
        {
            var command = new SetLeaveBalanceCommand(
                dto.EmployeeId, dto.Year, dto.LeaveType, dto.TotalDays);
            var result = await _sender.Send(command, ct);
            return Ok(result);
        }
    }
}
