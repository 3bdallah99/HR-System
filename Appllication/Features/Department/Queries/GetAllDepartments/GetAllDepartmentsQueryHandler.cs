using Appllication.Common;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Department.Queries.GetAllDepartments
{
    public class GetAllDepartmentsQueryHandler
        : IRequestHandler<GetAllDepartmentsQuery, ApiResponse<PaginatedResult<GetAllDepartmentsDto>>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetAllDepartmentsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<PaginatedResult<GetAllDepartmentsDto>>> Handle(
            GetAllDepartmentsQuery request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.Department>();
            var query = repo.GetQueryable().AsNoTracking();

            // Apply optional name filter
            if (!string.IsNullOrWhiteSpace(request.Name))
                query = query.Where(d => d.Name.Contains(request.Name));

            var totalCount = await query.CountAsync(cancellationToken);

            // Project to DTO — EF translates .Count() to SQL COUNT subqueries
            var departments = await query
                .OrderBy(d => d.Name)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(d => new GetAllDepartmentsDto(
                    d.Id,
                    d.Name,
                    d.Employees.Count,
                    d.Positions.Count))
                .ToListAsync(cancellationToken);

            var result = new PaginatedResult<GetAllDepartmentsDto>
            {
                Items = departments,
                PageNumber = request.Page,
                PageSize = request.PageSize,
                TotalCount = totalCount
            };

            return ApiResponse<PaginatedResult<GetAllDepartmentsDto>>.Ok(
                result, "Departments retrieved successfully");
        }
    }
}
