using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Employee.Commands.UpdateEmployee
{
    public class UpdateEmployeeCommandHandler
        : IRequestHandler<UpdateEmployeeCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public UpdateEmployeeCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            UpdateEmployeeCommand request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.Employee>();

            var employee = await repo.GetByIdAsync(request.Id, cancellationToken);
            if (employee is null)
                throw new NotFoundException(nameof(Domain.Entities.Employee), request.Id);

            // Check duplicate email (exclude self)
            var emailTaken = await repo.AnyAsync(
                e => e.Email == request.Email && e.Id != request.Id, cancellationToken);

            if (emailTaken)
                throw new ConflictException($"Another employee already uses the email '{request.Email}'.");

            // Validate that Department exists
            var deptRepo = _unitOfWork.GetRepository<Domain.Entities.Department>();
            var deptExists = await deptRepo.AnyAsync(
                d => d.Id == request.DepartmentId, cancellationToken);

            if (!deptExists)
                throw new NotFoundException(nameof(Domain.Entities.Department), request.DepartmentId);

            // Validate that Position exists
            var posRepo = _unitOfWork.GetRepository<Domain.Entities.Position>();
            var posExists = await posRepo.AnyAsync(
                p => p.Id == request.PositionId, cancellationToken);

            if (!posExists)
                throw new NotFoundException(nameof(Domain.Entities.Position), request.PositionId);

            // Prevent self-management
            if (request.ManagerId.HasValue && request.ManagerId.Value == request.Id)
                throw new BadRequestException("An employee cannot be their own manager.");

            employee.Name = request.Name;
            employee.Email = request.Email;
            employee.Phone = request.Phone;
            employee.Address = request.Address;
            employee.HireDate = request.HireDate;
            employee.IsActive = request.IsActive;
            employee.PositionId = request.PositionId;
            employee.DepartmentId = request.DepartmentId;
            employee.ManagerId = request.ManagerId;

            repo.Update(employee);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<string>.Ok("Updated", "Employee updated successfully");
        }
    }
}
