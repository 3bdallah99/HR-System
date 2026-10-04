using System.Threading.Tasks;
using Appllication.Features.PerformanceReview.Commands.AcknowledgeReview;
using Appllication.Features.PerformanceReview.Commands.CreateReview;
using Appllication.Features.PerformanceReview.Commands.DeleteReview;
using Appllication.Features.PerformanceReview.Queries.GetAllReviews;
using Appllication.Features.PerformanceReview.Queries.GetReviewsByEmployee;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace PL.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PerformanceReviewController : ControllerBase
    {
        private readonly ISender _sender;

        public PerformanceReviewController(ISender sender)
        {
            _sender = sender;
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetReviewsByEmployee(int employeeId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = new GetReviewsByEmployeeQuery(employeeId, page, pageSize);
            var result = await _sender.Send(query);
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllReviews([FromQuery] int? departmentId = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = new GetAllReviewsQuery(departmentId, page, pageSize);
            var result = await _sender.Send(query);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto)
        {
            var command = new CreateReviewCommand(dto.EmployeeId, dto.ReviewerEmployeeId, dto.Rating, dto.Feedback);
            var result = await _sender.Send(command);
            return Ok(result);
        }

        [HttpPost("{id}/acknowledge")]
        public async Task<IActionResult> AcknowledgeReview(int id, [FromQuery] int employeeId)
        {
            var command = new AcknowledgeReviewCommand(id, employeeId);
            var result = await _sender.Send(command);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var command = new DeleteReviewCommand(id);
            var result = await _sender.Send(command);
            return Ok(result);
        }
    }
}
