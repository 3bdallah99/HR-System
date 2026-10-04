using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.PerformanceReview.Commands.CreateReview
{
    public class CreateReviewCommandHandler : IRequestHandler<CreateReviewCommand, ApiResponse<int>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CreateReviewCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<int>> Handle(CreateReviewCommand request, CancellationToken cancellationToken)
        {
            // Prevent self-review
            if (request.EmployeeId == request.ReviewerEmployeeId)
                throw new BadRequestException("A reviewer cannot review themselves.");

            var empRepo = _unitOfWork.GetRepository<Domain.Entities.Employee>();

            var employeeExists = await empRepo.AnyAsync(
                e => e.Id == request.EmployeeId, cancellationToken);
            if (!employeeExists)
                throw new NotFoundException(nameof(Domain.Entities.Employee), request.EmployeeId);

            var reviewerExists = await empRepo.AnyAsync(
                e => e.Id == request.ReviewerEmployeeId, cancellationToken);
            if (!reviewerExists)
                throw new NotFoundException("Reviewer", request.ReviewerEmployeeId);

            var review = new Domain.Entities.PerformanceReviews
            {
                EmployeeId = request.EmployeeId,
                ReviewerEmployeeId = request.ReviewerEmployeeId,
                Rating = request.Rating,
                Feedback = request.Feedback,
                ReviewDate = DateTime.UtcNow,
                AcknowledgedByEmployee = false
            };

            await _unitOfWork.GetRepository<Domain.Entities.PerformanceReviews>()
                .AddAsync(review, cancellationToken);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<int>.Ok(review.Id, "Performance review created successfully");
        }
    }
}
