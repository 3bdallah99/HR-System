using Appllication.Common;
using Appllication.Features.Payroll.Queries.GetSalaryStructure;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Appllication.Features.Payroll.Queries.GetAllSalaryStructures
{
    public class GetAllSalaryStructuresQueryHandler
        : IRequestHandler<GetAllSalaryStructuresQuery, ApiResponse<List<SalaryStructureDto>>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetAllSalaryStructuresQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<List<SalaryStructureDto>>> Handle(
            GetAllSalaryStructuresQuery request, CancellationToken cancellationToken)
        {
            var structures = await _unitOfWork
                .GetRepository<SalaryStructure>()
                .GetQueryable()
                .AsNoTracking()
                .Include(s => s.Employee)
                .OrderBy(s => s.Employee.Name)
                .Select(s => new SalaryStructureDto(
                    s.EmployeeId,
                    s.Employee.Name,
                    s.BasicSalary,
                    s.HousingAllowance,
                    s.TransportationAllowance,
                    s.MealAllowance,
                    s.OtherAllowances,
                    s.OvertimePay,
                    s.BasicSalary + s.HousingAllowance + s.TransportationAllowance + s.MealAllowance + s.OtherAllowances + s.OvertimePay,
                    s.SocialInsurance,
                    s.TaxAmount,
                    s.OtherDeductions,
                    s.SocialInsurance + s.TaxAmount + s.OtherDeductions,
                    (s.BasicSalary + s.HousingAllowance + s.TransportationAllowance + s.MealAllowance + s.OtherAllowances + s.OvertimePay) - (s.SocialInsurance + s.TaxAmount + s.OtherDeductions),
                    s.LastUpdatedAt))
                .ToListAsync(cancellationToken);

            return ApiResponse<List<SalaryStructureDto>>.Ok(
                structures, $"Retrieved {structures.Count} salary structures.");
        }
    }
}
