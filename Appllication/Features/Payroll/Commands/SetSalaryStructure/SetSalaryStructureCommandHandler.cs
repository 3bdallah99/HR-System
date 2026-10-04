using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Payroll.Commands.SetSalaryStructure
{
    public class SetSalaryStructureCommandHandler
        : IRequestHandler<SetSalaryStructureCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public SetSalaryStructureCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            SetSalaryStructureCommand request, CancellationToken cancellationToken)
        {
            // Validate employee exists
            var empExists = await _unitOfWork
                .GetRepository<Domain.Entities.Employee>()
                .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

            if (!empExists)
                throw new NotFoundException(nameof(Domain.Entities.Employee), request.EmployeeId);

            var repo = _unitOfWork.GetRepository<SalaryStructure>();

            var existing = await repo.FirstOrDefaultAsync(
                s => s.EmployeeId == request.EmployeeId, cancellationToken);

            if (existing is null)
            {
                // Create new
                var structure = new SalaryStructure
                {
                    EmployeeId          = request.EmployeeId,
                    BasicSalary         = request.BasicSalary,
                    HousingAllowance    = request.HousingAllowance,
                    TransportationAllowance = request.TransportationAllowance,
                    MealAllowance       = request.MealAllowance,
                    OtherAllowances     = request.OtherAllowances,
                    OvertimePay         = request.OvertimePay,
                    SocialInsurance     = request.SocialInsurance,
                    TaxAmount           = request.TaxAmount,
                    OtherDeductions     = request.OtherDeductions,
                    LastUpdatedAt       = DateTime.UtcNow
                };
                await repo.AddAsync(structure, cancellationToken);
                await _unitOfWork.CompleteAsync(cancellationToken);
                return ApiResponse<string>.Ok("Created", "Salary structure created successfully");
            }
            else
            {
                // Update existing
                existing.BasicSalary            = request.BasicSalary;
                existing.HousingAllowance        = request.HousingAllowance;
                existing.TransportationAllowance = request.TransportationAllowance;
                existing.MealAllowance           = request.MealAllowance;
                existing.OtherAllowances         = request.OtherAllowances;
                existing.OvertimePay             = request.OvertimePay;
                existing.SocialInsurance         = request.SocialInsurance;
                existing.TaxAmount               = request.TaxAmount;
                existing.OtherDeductions         = request.OtherDeductions;
                existing.LastUpdatedAt           = DateTime.UtcNow;
                repo.Update(existing);
                await _unitOfWork.CompleteAsync(cancellationToken);
                return ApiResponse<string>.Ok("Updated", "Salary structure updated successfully");
            }
        }
    }
}
