using Appllication.Features.Employee.Commands.CreateEmployee;
using Appllication.Features.Employee.Commands.DeleteEmployee;
using Appllication.Features.Employee.Commands.UpdateEmployee;
using Appllication.Features.Employee.Queries.GetAllEmployees;
using Appllication.Features.Employee.Queries.GetEmployeeById;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace PL.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeController : ControllerBase
    {
        private readonly ISender _sender;

        public EmployeeController(ISender sender)
        {
            _sender = sender;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? name = null,
            [FromQuery] string? email = null,
            [FromQuery] int? departmentId = null,
            CancellationToken ct = default)
        {
            var result = await _sender.Send(
                new GetAllEmployeesQuery(page, pageSize, name, email,departmentId), ct);
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id, CancellationToken ct)
        {
            var result = await _sender.Send(new GetEmployeeByIdQuery(id), ct);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateEmployeeDto dto, CancellationToken ct)
        {
            var command = new CreateEmployeeCommand(
                dto.Name, dto.Email, dto.Phone, dto.Address,
                dto.HireDate, dto.PositionId, dto.DepartmentId, dto.ManagerId);

            var result = await _sender.Send(command, ct);
            return CreatedAtAction(nameof(GetById), new { id = result.Data }, result);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id, [FromBody] UpdateEmployeeDto dto, CancellationToken ct)
        {
            var command = new UpdateEmployeeCommand(
                id, dto.Name, dto.Email, dto.Phone, dto.Address,
                dto.HireDate, dto.IsActive, dto.PositionId,
                dto.DepartmentId, dto.ManagerId);

            var result = await _sender.Send(command, ct);
            return Ok(result);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var result = await _sender.Send(new DeleteEmployeeCommand(id), ct);
            return Ok(result);
        }
    }
}
