using Appllication.Common;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Leave.Queries.GetAllLeaveRequests
{
    public class GetAllLeaveRequestsQueryHandler
        : IRequestHandler<GetAllLeaveRequestsQuery,
            ApiResponse<PaginatedResult<GetAllLeaveRequestsDto>>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetAllLeaveRequestsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<PaginatedResult<GetAllLeaveRequestsDto>>> Handle(
            GetAllLeaveRequestsQuery request, CancellationToken cancellationToken)
        {
            var query = _unitOfWork
                .GetRepository<Domain.Entities.LeaveRequest>()
                .GetQueryable()
                .AsNoTracking();

            if (request.Status.HasValue)
                query = query.Where(l => l.Status == request.Status.Value);

            if (request.DepartmentId.HasValue)
                query = query.Where(l => l.Employee.DepartmentId == request.DepartmentId.Value);

            var totalCount = await query.CountAsync(cancellationToken);

            var records = await query
                .OrderByDescending(l => l.RequestedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(l => new GetAllLeaveRequestsDto(
                    l.Id,
                    l.Employee.Name,
                    l.Employee.Department.Name,
                    l.LeaveType.ToString(),
                    l.StartDate,
                    l.EndDate,
                    (l.EndDate - l.StartDate).Days + 1,
                    l.Status.ToString(),
                    l.Reason,
                    l.RequestedAt))
                .ToListAsync(cancellationToken);

            var result = new PaginatedResult<GetAllLeaveRequestsDto>
            {
                Items = records,
                PageNumber = request.Page,
                PageSize = request.PageSize,
                TotalCount = totalCount
            };

            return ApiResponse<PaginatedResult<GetAllLeaveRequestsDto>>.Ok(
                result, "Leave requests retrieved successfully");
        }
    }
}
