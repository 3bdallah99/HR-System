using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Department.Commands.DeleteDepartment
{
    public class DeleteDepartmentCommandHandler
        : IRequestHandler<DeleteDepartmentCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public DeleteDepartmentCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            DeleteDepartmentCommand request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.Department>();

            var department = await repo.GetByIdAsync(request.Id, cancellationToken);
            if (department is null)
                throw new NotFoundException(nameof(Domain.Entities.Department), request.Id);

            // Block delete if employees are assigned to this department
            var hasEmployees = await _unitOfWork
                .GetRepository<Domain.Entities.Employee>()
                .AnyAsync(e => e.DepartmentId == request.Id, cancellationToken);

            if (hasEmployees)
                throw new ConflictException(
                    "Cannot delete this department because it has employees assigned to it. " +
                    "Reassign or remove the employees first.");

            // Block delete if positions exist under this department
            var hasPositions = await _unitOfWork
                .GetRepository<Domain.Entities.Position>()
                .AnyAsync(p => p.DepartmentId == request.Id, cancellationToken);

            if (hasPositions)
                throw new ConflictException(
                    "Cannot delete this department because it has positions assigned to it. " +
                    "Remove the positions first.");

            repo.Remove(department);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<string>.Ok("Deleted", "Department deleted successfully");
        }
    }
}
