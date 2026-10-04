using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.PerformanceReview.Commands.DeleteReview
{
    public class DeleteReviewCommandHandler
        : IRequestHandler<DeleteReviewCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public DeleteReviewCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            DeleteReviewCommand request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.PerformanceReviews>();

            var review = await repo.GetByIdAsync(request.Id, cancellationToken);
            if (review is null)
                throw new NotFoundException("PerformanceReview", request.Id);

            repo.Remove(review);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<string>.Ok("Deleted", "Performance review deleted successfully");
        }
    }
}
