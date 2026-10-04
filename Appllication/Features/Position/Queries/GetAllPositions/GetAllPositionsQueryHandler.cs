using Appllication.Common;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Position.Queries.GetAllPositions;

public class GetAllPositionsQueryHandler : IRequestHandler<GetAllPositionsQuery, ApiResponse<PaginatedResult<GetAllPositionsDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllPositionsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<PaginatedResult<GetAllPositionsDto>>> Handle(GetAllPositionsQuery request, CancellationToken cancellationToken)
    {
        var query = _unitOfWork.GetRepository<Domain.Entities.Position>().GetQueryable().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Title))
        {
            query = query.Where(p => p.Title.Contains(request.Title));
        }

        if (request.DepartmentId.HasValue)
        {
            query = query.Where(p => p.DepartmentId == request.DepartmentId.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(p => p.Title)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new GetAllPositionsDto(
                p.Id,
                p.Title,
                p.BaseSalary,
                p.Department.Name,
                p.Employees.Count))
            .ToListAsync(cancellationToken);

        var paginatedResult = new PaginatedResult<GetAllPositionsDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.Page,
            PageSize = request.PageSize
        };

        return ApiResponse<PaginatedResult<GetAllPositionsDto>>.Ok(paginatedResult, "Positions retrieved successfully");
    }
}
