using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Position.Commands.CreatePosition;

public class CreatePositionCommandHandler : IRequestHandler<CreatePositionCommand, ApiResponse<int>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreatePositionCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<int>> Handle(CreatePositionCommand request, CancellationToken cancellationToken)
    {
        var departmentExists = await _unitOfWork.GetRepository<Domain.Entities.Department>()
            .GetQueryable()
            .AnyAsync(d => d.Id == request.DepartmentId, cancellationToken);
        if (!departmentExists)
            throw new NotFoundException(nameof(Domain.Entities.Department), request.DepartmentId);

        var titleExistsInDept = await _unitOfWork.GetRepository<Domain.Entities.Position>()
            .GetQueryable()
            .AnyAsync(p => p.Title == request.Title && p.DepartmentId == request.DepartmentId, cancellationToken);
        if (titleExistsInDept)
            throw new ConflictException($"Position with title '{request.Title}' already exists in department {request.DepartmentId}.");

        var position = new Domain.Entities.Position
        {
            Title = request.Title,
            BaseSalary = request.BaseSalary,
            DepartmentId = request.DepartmentId
        };

        await _unitOfWork.GetRepository<Domain.Entities.Position>().AddAsync(position, cancellationToken);
        await _unitOfWork.CompleteAsync(cancellationToken);

        return ApiResponse<int>.Ok(position.Id, "Position created successfully");
    }
}
