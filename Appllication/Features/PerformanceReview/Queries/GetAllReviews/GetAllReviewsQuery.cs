using Appllication.Common;
using MediatR;

namespace Appllication.Features.PerformanceReview.Queries.GetAllReviews
{
    public record GetAllReviewsQuery(int? DepartmentId = null, int Page = 1, int PageSize = 20)
        : IRequest<ApiResponse<PaginatedResult<GetAllReviewsDto>>>;

    public record GetAllReviewsDto(
        int Id,
        string EmployeeName,
        string DepartmentName,
        string PositionTitle,
        DateTime ReviewDate,
        int Rating,
        string Feedback,
        bool AcknowledgedByEmployee,
        string ReviewerName);
}
