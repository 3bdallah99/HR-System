using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Payroll.Commands.UpdatePayroll
{
    public class UpdatePayrollCommandHandler
        : IRequestHandler<UpdatePayrollCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public UpdatePayrollCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            UpdatePayrollCommand request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.Payroll>();

            var payroll = await repo.GetByIdAsync(request.Id, cancellationToken);
            if (payroll is null)
                throw new NotFoundException("Payroll", request.Id);

            // Update adjustable fields
            payroll.OvertimePay     = request.OvertimePay;
            payroll.OtherDeductions = request.OtherDeductions;

            // Recalculate GrossPay and TotalDeductions and NetPay
            payroll.GrossPay = payroll.BasicSalary
                             + payroll.HousingAllowance
                             + payroll.TransportationAllowance
                             + payroll.MealAllowance
                             + payroll.OtherAllowances
                             + payroll.OvertimePay;

            payroll.TotalDeductions = payroll.AbsenceDeduction
                                    + payroll.TardinessDeduction
                                    + payroll.SocialInsurance
                                    + payroll.TaxAmount
                                    + payroll.OtherDeductions;

            payroll.NetPay = Math.Round(payroll.GrossPay - payroll.TotalDeductions, 2);

            repo.Update(payroll);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<string>.Ok("Updated", "Payroll record updated successfully");
        }
    }
}
