namespace Appllication.Features.PerformanceReview.Commands.CreateReview
{
    public record CreateReviewDto(int EmployeeId, int ReviewerEmployeeId, int Rating, string Feedback);
}
