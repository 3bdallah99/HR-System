using Appllication.Common;
using MediatR;

namespace Appllication.Features.PerformanceReview.Commands.AcknowledgeReview
{
    public record AcknowledgeReviewCommand(int ReviewId, int EmployeeId) : IRequest<ApiResponse<string>>;
}
