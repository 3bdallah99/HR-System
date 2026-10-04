using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.PerformanceReview.Commands.AcknowledgeReview
{
    public class AcknowledgeReviewCommandHandler
        : IRequestHandler<AcknowledgeReviewCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public AcknowledgeReviewCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            AcknowledgeReviewCommand request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.PerformanceReviews>();

            var review = await repo.GetByIdAsync(request.ReviewId, cancellationToken);
            if (review is null)
                throw new NotFoundException("PerformanceReview", request.ReviewId);

            // Only the reviewed employee can acknowledge — not the reviewer
            if (review.EmployeeId != request.EmployeeId)
                throw new BadRequestException(
                    "Only the reviewed employee can acknowledge the review.");

            if (review.AcknowledgedByEmployee)
                throw new ConflictException("This review has already been acknowledged.");

            review.AcknowledgedByEmployee = true;
            review.AcknowledgedAt = DateTime.UtcNow;

            repo.Update(review);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<string>.Ok("Acknowledged", "Performance review acknowledged successfully");
        }
    }
}
