using Appllication.Common;
using MediatR;

namespace Appllication.Features.PerformanceReview.Commands.CreateReview
{
    public record CreateReviewCommand(int EmployeeId, int ReviewerEmployeeId, int Rating, string Feedback) : IRequest<ApiResponse<int>>;
}
