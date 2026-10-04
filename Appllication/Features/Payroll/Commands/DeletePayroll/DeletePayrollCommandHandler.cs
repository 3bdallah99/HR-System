using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Payroll.Commands.DeletePayroll
{
    public class DeletePayrollCommandHandler
        : IRequestHandler<DeletePayrollCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public DeletePayrollCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            DeletePayrollCommand request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.Payroll>();

            var payroll = await repo.GetByIdAsync(request.Id, cancellationToken);
            if (payroll is null)
                throw new NotFoundException("Payroll", request.Id);

            repo.Remove(payroll);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<string>.Ok("Deleted", "Payroll record deleted successfully");
        }
    }
}
