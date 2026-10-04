using Appllication.Features.Position.Commands.CreatePosition;
using Appllication.Features.Position.Commands.DeletePosition;
using Appllication.Features.Position.Commands.UpdatePosition;
using Appllication.Features.Position.Queries.GetAllPositions;
using Appllication.Features.Position.Queries.GetPositionById;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace PL.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PositionController : ControllerBase
{
    private readonly ISender _sender;

    public PositionController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? title = null, [FromQuery] int? departmentId = null)
    {
        var query = new GetAllPositionsQuery(page, pageSize, title, departmentId);
        var result = await _sender.Send(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var query = new GetPositionByIdQuery(id);
        var result = await _sender.Send(query);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create([FromBody] CreatePositionDto dto)
    {
        var command = new CreatePositionCommand(dto.Title, dto.BaseSalary, dto.DepartmentId);
        var result = await _sender.Send(command);
        return Ok(result);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePositionDto dto)
    {
        var command = new UpdatePositionCommand(id, dto.Title, dto.BaseSalary, dto.DepartmentId);
        var result = await _sender.Send(command);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(int id)
    {
        var command = new DeletePositionCommand(id);
        var result = await _sender.Send(command);
        return Ok(result);
    }
}
