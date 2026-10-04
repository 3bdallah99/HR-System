using Appllication.Common;
using MediatR;

namespace Appllication.Features.PerformanceReview.Commands.DeleteReview
{
    public record DeleteReviewCommand(int Id) : IRequest<ApiResponse<string>>;
}
