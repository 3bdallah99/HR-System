using Appllication.Features.Payroll.Commands.DeletePayroll;
using Appllication.Features.Payroll.Commands.RunPayroll;
using Appllication.Features.Payroll.Commands.SetSalaryStructure;
using Appllication.Features.Payroll.Commands.UpdatePayroll;
using Appllication.Features.Payroll.Queries.GetPayrollByEmployee;
using Appllication.Features.Payroll.Queries.GetPayrollByMonth;
using Appllication.Features.Payroll.Queries.GetSalaryStructure;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PL.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PayrollController : ControllerBase
    {
        private readonly ISender _sender;

        public PayrollController(ISender sender)
        {
            _sender = sender;
        }

        // ─── Salary Structure ────────────────────────────────────────────────

        // GET /api/payroll/salary-structure/{employeeId}
        [HttpGet("salary-structure/{employeeId:int}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetSalaryStructure(int employeeId, CancellationToken ct)
        {
            var result = await _sender.Send(new GetSalaryStructureQuery(employeeId), ct);
            return Ok(result);
        }

        // POST /api/payroll/salary-structure/{employeeId}
        [HttpPost("salary-structure/{employeeId:int}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> SetSalaryStructure(
            int employeeId, [FromBody] SetSalaryStructureDto dto, CancellationToken ct)
        {
            var command = new SetSalaryStructureCommand(
                employeeId,
                dto.BasicSalary,
                dto.HousingAllowance,
                dto.TransportationAllowance,
                dto.MealAllowance,
                dto.OtherAllowances,
                dto.OvertimePay,
                dto.SocialInsurance,
                dto.TaxAmount,
                dto.OtherDeductions);
            var result = await _sender.Send(command, ct);
            return Ok(result);
        }

        // ─── Payroll Run & Management ────────────────────────────────────────

        // GET /api/payroll/employee/{employeeId}?year=2026
        [HttpGet("employee/{employeeId:int}")]
        public async Task<IActionResult> GetByEmployee(
            int employeeId,
            [FromQuery] int? year = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12,
            CancellationToken ct = default)
        {
            var result = await _sender.Send(
                new GetPayrollByEmployeeQuery(employeeId, year, page, pageSize), ct);
            return Ok(result);
        }

        // GET /api/payroll/month/{month}/year/{year}?departmentId=2
        [HttpGet("month/{month:int}/year/{year:int}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetByMonth(
            int month, int year,
            [FromQuery] int? departmentId = null,
            CancellationToken ct = default)
        {
            var result = await _sender.Send(
                new GetPayrollByMonthQuery(month, year, departmentId), ct);
            return Ok(result);
        }

        // POST /api/payroll/run
        [HttpPost("run")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Run(
            [FromBody] RunPayrollDto dto, CancellationToken ct)
        {
            var command = new RunPayrollCommand(
                dto.Month, dto.Year,
                dto.EmployeeId, dto.DepartmentId,
                dto.WorkingDaysInMonth);
            var result = await _sender.Send(command, ct);
            return Ok(result);
        }

        // PUT /api/payroll/{id}
        [HttpPut("{id:int}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(
            int id, [FromBody] UpdatePayrollDto dto, CancellationToken ct)
        {
            var command = new UpdatePayrollCommand(id, dto.OvertimePay, dto.OtherDeductions);
            var result = await _sender.Send(command, ct);
            return Ok(result);
        }

        // DELETE /api/payroll/{id}
        [HttpDelete("{id:int}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var result = await _sender.Send(new DeletePayrollCommand(id), ct);
            return Ok(result);
        }
    }
}
