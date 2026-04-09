using Domain.Interfaces;

using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Appllication.Features.Employee.Queries.GetAllEmployees
{
    public class GetAllEmployeesQueryHandler : IRequestHandler<GetAllEmployeesQuery, List<GetAllEmployeesDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetAllEmployeesQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }
        public async Task<List<GetAllEmployeesDto>> Handle(GetAllEmployeesQuery request, CancellationToken cancellationToken)
        {
            var employeesRepo = _unitOfWork.GetRepository<Domain.Entities.Employee>();
            var employees = await employeesRepo.GetAllAsync(cancellationToken);
            var employeesDto = employees.Select(e => new GetAllEmployeesDto(
                Id: e.Id,
                Name: e.Name,
                Email: e.Email,
                Phone: e.Phone,
                Address: e.Address,
                HireDate: e.HireDate,
                IsActive: e.IsActive,
                PositionId: e.PositionId,
                DepartmentId: e.DepartmentId,
                ManagerId: e.ManagerId
                )).ToList();
    
           return employeesDto;

        }
    }
}
