using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Department.Commands.CreateDepartment
{
    public class CreateDepartmentCommandHandler
        : IRequestHandler<CreateDepartmentCommand, ApiResponse<int>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CreateDepartmentCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<int>> Handle(
            CreateDepartmentCommand request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.Department>();

            // Enforce unique name
            var nameExists = await repo.AnyAsync(
                d => d.Name == request.Name, cancellationToken);

            if (nameExists)
                throw new ConflictException(
                    $"A department named '{request.Name}' already exists.");

            var department = new Domain.Entities.Department
            {
                Name = request.Name
            };

            await repo.AddAsync(department, cancellationToken);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<int>.Ok(department.Id, "Department created successfully");
        }
    }
}
