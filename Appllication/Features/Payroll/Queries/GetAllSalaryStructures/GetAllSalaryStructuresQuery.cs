using Appllication.Common;
using Appllication.Features.Payroll.Queries.GetSalaryStructure;
using MediatR;
using System.Collections.Generic;

namespace Appllication.Features.Payroll.Queries.GetAllSalaryStructures
{
    public record GetAllSalaryStructuresQuery() : IRequest<ApiResponse<List<SalaryStructureDto>>>;
}
