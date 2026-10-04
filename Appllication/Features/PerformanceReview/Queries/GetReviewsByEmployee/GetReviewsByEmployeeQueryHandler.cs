using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.PerformanceReview.Queries.GetReviewsByEmployee
{
    public class GetReviewsByEmployeeQueryHandler
        : IRequestHandler<GetReviewsByEmployeeQuery,
            ApiResponse<PaginatedResult<GetReviewsByEmployeeDto>>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetReviewsByEmployeeQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<PaginatedResult<GetReviewsByEmployeeDto>>> Handle(
            GetReviewsByEmployeeQuery request, CancellationToken cancellationToken)
        {
            var empExists = await _unitOfWork
                .GetRepository<Domain.Entities.Employee>()
                .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

            if (!empExists)
                throw new NotFoundException(nameof(Domain.Entities.Employee), request.EmployeeId);

            var query = _unitOfWork
                .GetRepository<Domain.Entities.PerformanceReviews>()
                .GetQueryable()
                .AsNoTracking()
                .Where(r => r.EmployeeId == request.EmployeeId);

            var totalCount = await query.CountAsync(cancellationToken);

            var reviews = await query
                .OrderByDescending(r => r.ReviewDate)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(r => new GetReviewsByEmployeeDto(
                    r.Id,
                    r.ReviewDate,
                    r.Rating,
                    r.Feedback,
                    r.AcknowledgedByEmployee,
                    r.AcknowledgedAt,
                    r.Reviewer.Name))
                .ToListAsync(cancellationToken);

            var result = new PaginatedResult<GetReviewsByEmployeeDto>
            {
                Items = reviews,
                PageNumber = request.Page,
                PageSize = request.PageSize,
                TotalCount = totalCount
            };

            return ApiResponse<PaginatedResult<GetReviewsByEmployeeDto>>.Ok(
                result, "Performance reviews retrieved successfully");
        }
    }
}
