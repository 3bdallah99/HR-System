using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Employee.Commands.DeleteEmployee
{
    public class DeleteEmployeeCommandHandler
        : IRequestHandler<DeleteEmployeeCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public DeleteEmployeeCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            DeleteEmployeeCommand request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.Employee>();

            var employee = await repo.GetByIdAsync(request.Id, cancellationToken);
            if (employee is null)
                throw new NotFoundException(nameof(Domain.Entities.Employee), request.Id);

            // Check if this employee is a manager for others
            var hasSubordinates = await repo.AnyAsync(
                e => e.ManagerId == request.Id, cancellationToken);

            if (hasSubordinates)
                throw new ConflictException(
                    "Cannot delete this employee because they manage other employees. " +
                    "Reassign their subordinates first.");

            repo.Remove(employee);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<string>.Ok("Deleted", "Employee deleted successfully");
        }
    }
}
