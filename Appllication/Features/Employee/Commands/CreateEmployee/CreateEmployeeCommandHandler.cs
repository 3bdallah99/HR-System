using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Employee.Commands.CreateEmployee
{
    public class CreateEmployeeCommandHandler
        : IRequestHandler<CreateEmployeeCommand, ApiResponse<int>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CreateEmployeeCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<int>> Handle(
            CreateEmployeeCommand request, CancellationToken cancellationToken)
        {
            var employeeRepo = _unitOfWork.GetRepository<Domain.Entities.Employee>();

            // Check for duplicate email
            var emailExists = await employeeRepo.AnyAsync(
                e => e.Email == request.Email, cancellationToken);

            if (emailExists)
                throw new ConflictException($"An employee with email '{request.Email}' already exists.");

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

            // Validate Manager if provided
            if (request.ManagerId.HasValue)
            {
                var managerExists = await employeeRepo.AnyAsync(
                    e => e.Id == request.ManagerId.Value, cancellationToken);

                if (!managerExists)
                    throw new NotFoundException("Manager", request.ManagerId.Value);
            }

            var employee = new Domain.Entities.Employee
            {
                Name = request.Name,
                Email = request.Email,
                Phone = request.Phone,
                Address = request.Address,
                HireDate = request.HireDate,
                IsActive = true,
                PositionId = request.PositionId,
                DepartmentId = request.DepartmentId,
                ManagerId = request.ManagerId
            };

            await employeeRepo.AddAsync(employee, cancellationToken);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<int>.Ok(employee.Id, "Employee created successfully");
        }
    }
}
