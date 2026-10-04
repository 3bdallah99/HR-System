using Appllication.Common;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.PerformanceReview.Queries.GetAllReviews
{
    public class GetAllReviewsQueryHandler
        : IRequestHandler<GetAllReviewsQuery,
            ApiResponse<PaginatedResult<GetAllReviewsDto>>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetAllReviewsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<PaginatedResult<GetAllReviewsDto>>> Handle(
            GetAllReviewsQuery request, CancellationToken cancellationToken)
        {
            var query = _unitOfWork
                .GetRepository<Domain.Entities.PerformanceReviews>()
                .GetQueryable()
                .AsNoTracking();

            if (request.DepartmentId.HasValue)
                query = query.Where(r => r.Employee.DepartmentId == request.DepartmentId.Value);

            var totalCount = await query.CountAsync(cancellationToken);

            var reviews = await query
                .OrderByDescending(r => r.ReviewDate)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(r => new GetAllReviewsDto(
                    r.Id,
                    r.Employee.Name,
                    r.Employee.Department.Name,
                    r.Employee.Position.Title,
                    r.ReviewDate,
                    r.Rating,
                    r.Feedback,
                    r.AcknowledgedByEmployee,
                    r.Reviewer.Name))
                .ToListAsync(cancellationToken);

            var result = new PaginatedResult<GetAllReviewsDto>
            {
                Items = reviews,
                PageNumber = request.Page,
                PageSize = request.PageSize,
                TotalCount = totalCount
            };

            return ApiResponse<PaginatedResult<GetAllReviewsDto>>.Ok(
                result, "Performance reviews retrieved successfully");
        }
    }
}
