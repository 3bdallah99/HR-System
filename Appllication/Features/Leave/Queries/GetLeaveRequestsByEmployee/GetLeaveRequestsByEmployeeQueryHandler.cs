using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Leave.Queries.GetLeaveRequestsByEmployee
{
    public class GetLeaveRequestsByEmployeeQueryHandler
        : IRequestHandler<GetLeaveRequestsByEmployeeQuery,
            ApiResponse<PaginatedResult<GetLeaveRequestsByEmployeeDto>>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetLeaveRequestsByEmployeeQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<PaginatedResult<GetLeaveRequestsByEmployeeDto>>> Handle(
            GetLeaveRequestsByEmployeeQuery request, CancellationToken cancellationToken)
        {
            var empExists = await _unitOfWork
                .GetRepository<Domain.Entities.Employee>()
                .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

            if (!empExists)
                throw new NotFoundException(nameof(Domain.Entities.Employee), request.EmployeeId);

            var query = _unitOfWork
                .GetRepository<Domain.Entities.LeaveRequest>()
                .GetQueryable()
                .AsNoTracking()
                .Where(l => l.EmployeeId == request.EmployeeId);

            if (request.Status.HasValue)
                query = query.Where(l => l.Status == request.Status.Value);

            if (request.Year.HasValue)
                query = query.Where(l => l.StartDate.Year == request.Year.Value);

            var totalCount = await query.CountAsync(cancellationToken);

            var records = await query
                .OrderByDescending(l => l.RequestedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(l => new GetLeaveRequestsByEmployeeDto(
                    l.Id,
                    l.LeaveType.ToString(),
                    l.StartDate,
                    l.EndDate,
                    (l.EndDate - l.StartDate).Days + 1,
                    l.Status.ToString(),
                    l.Reason,
                    l.RejectionNote,
                    l.RequestedAt,
                    l.ReviewedAt,
                    l.ReviewedBy != null ? l.ReviewedBy.Name : null))
                .ToListAsync(cancellationToken);

            var result = new PaginatedResult<GetLeaveRequestsByEmployeeDto>
            {
                Items = records,
                PageNumber = request.Page,
                PageSize = request.PageSize,
                TotalCount = totalCount
            };

            return ApiResponse<PaginatedResult<GetLeaveRequestsByEmployeeDto>>.Ok(
                result, "Leave requests retrieved successfully");
        }
    }
}
