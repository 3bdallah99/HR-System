using Appllication.Features.Employee.Queries.GetAllEmployees;
using MediatR;
using Microsoft.AspNetCore.Http;
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
        public async Task<IActionResult> Get()
        {
            var result = await _sender.Send(new GetAllEmployeesQuery());
            return Ok(result);
        }
    }
}
