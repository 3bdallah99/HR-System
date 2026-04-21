using Appllication.Common;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Employee.Queries.GetAllEmployees
{
    public class GetAllEmployeesQueryHandler
        : IRequestHandler<GetAllEmployeesQuery, ApiResponse<PaginatedResult<GetAllEmployeesDto>>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetAllEmployeesQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<PaginatedResult<GetAllEmployeesDto>>> Handle(
            GetAllEmployeesQuery request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.Employee>();
            var query = repo.GetQueryable().AsNoTracking();

            // Apply optional filters — EF Core builds a single SQL query with WHERE clauses
            if (!string.IsNullOrWhiteSpace(request.Name))
                query = query.Where(e => e.Name.Contains(request.Name));

            if (!string.IsNullOrWhiteSpace(request.Email))
                query = query.Where(e => e.Email == request.Email);
            if (request.DepartmentId.HasValue)
                query = query.Where(e => e.DepartmentId == request.DepartmentId.Value);
            // Get total count for pagination
            var totalCount = await query.CountAsync(cancellationToken);

            // Project directly to DTO — EF generates efficient SQL with JOINs
            var employees = await query
                .OrderBy(e => e.Name)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(e => new GetAllEmployeesDto(
                    e.Id,
                    e.Name,
                    e.Email,
                    e.Phone,
                    e.Address,
                    e.HireDate,
                    e.IsActive,
                    e.Position.Title,
                    e.Position.BaseSalary,
                    e.Department.Name,
                    e.Manager != null ? e.Manager.Name : null
                ))
                .ToListAsync(cancellationToken);

            var result = new PaginatedResult<GetAllEmployeesDto>
            {
                Items = employees,
                PageNumber = request.Page,
                PageSize = request.PageSize,
                TotalCount = totalCount
            };

            return ApiResponse<PaginatedResult<GetAllEmployeesDto>>.Ok(
                result, "Employees retrieved successfully");
        }
    }
}
