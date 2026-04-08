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
        public Task<List<GetAllEmployeesDto>> Handle(GetAllEmployeesQuery request, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }
    }
}
