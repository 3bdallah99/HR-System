using Appllication.Common;
using MediatR;

namespace Appllication.Features.PerformanceReview.Queries.GetReviewsByEmployee
{
    public record GetReviewsByEmployeeQuery(int EmployeeId, int Page = 1, int PageSize = 10)
        : IRequest<ApiResponse<PaginatedResult<GetReviewsByEmployeeDto>>>;

    public record GetReviewsByEmployeeDto(
        int Id,
        DateTime ReviewDate,
        int Rating,
        string Feedback,
        bool AcknowledgedByEmployee,
        DateTime? AcknowledgedAt,
        string ReviewerName);
}
