using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Appllication.Features.Employee.Queries.GetAllEmployees
{
    public record GetAllEmployeesQuery() : IRequest<List<GetAllEmployeesDto>>;


    public record GetAllEmployeesDto(int Id,
                                     string Name,
                                     string Email,
                                     string Phone,
                                     string Address,
                                     DateTime HireDate,
                                     bool IsActive,
                                     int PositionId,
                                     int DepartmentId,
                                     int? ManagerId);
}
