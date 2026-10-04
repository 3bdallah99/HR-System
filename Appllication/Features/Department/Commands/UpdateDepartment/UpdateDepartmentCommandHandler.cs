using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Department.Commands.UpdateDepartment
{
    public class UpdateDepartmentCommandHandler
        : IRequestHandler<UpdateDepartmentCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public UpdateDepartmentCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            UpdateDepartmentCommand request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.Department>();

            var department = await repo.GetByIdAsync(request.Id, cancellationToken);
            if (department is null)
                throw new NotFoundException(nameof(Domain.Entities.Department), request.Id);

            // Check name not taken by another department (exclude self)
            var nameTaken = await repo.AnyAsync(
                d => d.Name == request.Name && d.Id != request.Id, cancellationToken);

            if (nameTaken)
                throw new ConflictException(
                    $"A department named '{request.Name}' already exists.");

            department.Name = request.Name;

            repo.Update(department);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<string>.Ok("Updated", "Department updated successfully");
        }
    }
}
