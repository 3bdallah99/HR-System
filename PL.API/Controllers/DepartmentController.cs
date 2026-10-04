using Appllication.Features.Department.Commands.CreateDepartment;
using Appllication.Features.Department.Commands.DeleteDepartment;
using Appllication.Features.Department.Commands.UpdateDepartment;
using Appllication.Features.Department.Queries.GetAllDepartments;
using Appllication.Features.Department.Queries.GetDepartmentById;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PL.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentController : ControllerBase
    {
        private readonly ISender _sender;

        public DepartmentController(ISender sender)
        {
            _sender = sender;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? name = null,
            CancellationToken ct = default)
        {
            var result = await _sender.Send(
                new GetAllDepartmentsQuery(page, pageSize, name), ct);
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id, CancellationToken ct)
        {
            var result = await _sender.Send(new GetDepartmentByIdQuery(id), ct);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create(
            [FromBody] CreateDepartmentDto dto, CancellationToken ct)
        {
            var command = new CreateDepartmentCommand(dto.Name);
            var result = await _sender.Send(command, ct);
            return CreatedAtAction(nameof(GetById), new { id = result.Data }, result);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(
            int id, [FromBody] UpdateDepartmentDto dto, CancellationToken ct)
        {
            var command = new UpdateDepartmentCommand(id, dto.Name);
            var result = await _sender.Send(command, ct);
            return Ok(result);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var result = await _sender.Send(new DeleteDepartmentCommand(id), ct);
            return Ok(result);
        }
    }
}
