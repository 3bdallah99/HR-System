using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Department.Queries.GetDepartmentById
{
    public class GetDepartmentByIdQueryHandler
        : IRequestHandler<GetDepartmentByIdQuery, ApiResponse<GetDepartmentByIdDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetDepartmentByIdQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<GetDepartmentByIdDto>> Handle(
            GetDepartmentByIdQuery request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.Department>();

            var department = await repo.GetQueryable()
                .AsNoTracking()
                .Where(d => d.Id == request.Id)
                .Select(d => new GetDepartmentByIdDto(
                    d.Id,
                    d.Name,
                    d.Employees.Count,
                    d.Positions
                        .Select(p => new PositionSummaryDto(p.Id, p.Title, p.BaseSalary))
                        .ToList()))
                .FirstOrDefaultAsync(cancellationToken);

            if (department is null)
                throw new NotFoundException(nameof(Domain.Entities.Department), request.Id);

            return ApiResponse<GetDepartmentByIdDto>.Ok(
                department, "Department retrieved successfully");
        }
    }
}
