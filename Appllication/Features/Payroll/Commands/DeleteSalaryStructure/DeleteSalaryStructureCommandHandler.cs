using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Appllication.Features.Payroll.Commands.DeleteSalaryStructure
{
    public class DeleteSalaryStructureCommandHandler
        : IRequestHandler<DeleteSalaryStructureCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public DeleteSalaryStructureCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            DeleteSalaryStructureCommand request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<SalaryStructure>();
            var existing = await repo.FirstOrDefaultAsync(
                s => s.EmployeeId == request.EmployeeId, cancellationToken);

            if (existing is null)
                throw new NotFoundException("SalaryStructure", $"Salary structure for employee {request.EmployeeId} not found.");

            repo.Remove(existing);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<string>.Ok("Deleted", "Salary structure deleted successfully.");
        }
    }
}
