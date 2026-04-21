using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Employee.Queries.GetEmployeeById
{
    public class GetEmployeeByIdQueryHandler
        : IRequestHandler<GetEmployeeByIdQuery, ApiResponse<GetEmployeeByIdDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetEmployeeByIdQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<GetEmployeeByIdDto>> Handle(
            GetEmployeeByIdQuery request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.Employee>();

            var employee = await repo.GetQueryable()
                .AsNoTracking()
                .Where(e => e.Id == request.Id)
                .Select(e => new GetEmployeeByIdDto(
                    e.Id,
                    e.Name,
                    e.Email,
                    e.Phone,
                    e.Address,
                    e.HireDate,
                    e.IsActive,
                    e.PositionId,
                    e.Position.Title,
                    e.Position.BaseSalary,
                    e.DepartmentId,
                    e.Department.Name,
                    e.ManagerId,
                    e.Manager != null ? e.Manager.Name : null
                ))
                .FirstOrDefaultAsync(cancellationToken);

            if (employee is null)
                throw new NotFoundException(nameof(Domain.Entities.Employee), request.Id);

            return ApiResponse<GetEmployeeByIdDto>.Ok(employee, "Employee retrieved successfully");
        }
    }
}
