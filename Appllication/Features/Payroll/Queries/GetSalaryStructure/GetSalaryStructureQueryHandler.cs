using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Payroll.Queries.GetSalaryStructure
{
    public class GetSalaryStructureQueryHandler
        : IRequestHandler<GetSalaryStructureQuery, ApiResponse<SalaryStructureDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetSalaryStructureQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<SalaryStructureDto>> Handle(
            GetSalaryStructureQuery request, CancellationToken cancellationToken)
        {
            var employee = await _unitOfWork
                .GetRepository<Domain.Entities.Employee>()
                .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken);

            if (employee is null)
                throw new NotFoundException(nameof(Domain.Entities.Employee), request.EmployeeId);

            var structure = await _unitOfWork
                .GetRepository<SalaryStructure>()
                .FirstOrDefaultAsync(s => s.EmployeeId == request.EmployeeId, cancellationToken);

            if (structure is null)
                throw new NotFoundException("SalaryStructure",
                    $"No salary structure found for employee {request.EmployeeId}. Please set it up first.");

            decimal totalEarnings = structure.BasicSalary + structure.HousingAllowance +
                                    structure.TransportationAllowance + structure.MealAllowance +
                                    structure.OtherAllowances + structure.OvertimePay;

            decimal totalFixedDeductions = structure.SocialInsurance + structure.TaxAmount +
                                           structure.OtherDeductions;

            var dto = new SalaryStructureDto(
                EmployeeId:               employee.Id,
                EmployeeName:             employee.Name,
                BasicSalary:              structure.BasicSalary,
                HousingAllowance:         structure.HousingAllowance,
                TransportationAllowance:  structure.TransportationAllowance,
                MealAllowance:            structure.MealAllowance,
                OtherAllowances:          structure.OtherAllowances,
                OvertimePay:              structure.OvertimePay,
                TotalEarnings:            totalEarnings,
                SocialInsurance:          structure.SocialInsurance,
                TaxAmount:                structure.TaxAmount,
                OtherDeductions:          structure.OtherDeductions,
                TotalFixedDeductions:     totalFixedDeductions,
                EstimatedGross:           totalEarnings - totalFixedDeductions,
                LastUpdatedAt:            structure.LastUpdatedAt);

            return ApiResponse<SalaryStructureDto>.Ok(dto, "Salary structure retrieved successfully");
        }
    }
}
