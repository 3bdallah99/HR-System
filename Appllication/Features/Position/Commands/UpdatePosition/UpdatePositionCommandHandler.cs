using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Position.Commands.UpdatePosition;

public class UpdatePositionCommandHandler : IRequestHandler<UpdatePositionCommand, ApiResponse<int>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdatePositionCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<int>> Handle(UpdatePositionCommand request, CancellationToken cancellationToken)
    {
        var position = await _unitOfWork.GetRepository<Domain.Entities.Position>().GetByIdAsync(request.Id, cancellationToken);
        if (position == null)
            throw new NotFoundException(nameof(Domain.Entities.Position), request.Id);

        var departmentExists = await _unitOfWork.GetRepository<Domain.Entities.Department>()
            .GetQueryable()
            .AnyAsync(d => d.Id == request.DepartmentId, cancellationToken);
        if (!departmentExists)
            throw new NotFoundException(nameof(Domain.Entities.Department), request.DepartmentId);

        var titleExistsInDept = await _unitOfWork.GetRepository<Domain.Entities.Position>()
            .GetQueryable()
            .AnyAsync(p => p.Title == request.Title && p.DepartmentId == request.DepartmentId && p.Id != request.Id, cancellationToken);
        if (titleExistsInDept)
            throw new ConflictException($"Position with title '{request.Title}' already exists in department {request.DepartmentId}.");

        position.Title = request.Title;
        position.BaseSalary = request.BaseSalary;
        position.DepartmentId = request.DepartmentId;

        _unitOfWork.GetRepository<Domain.Entities.Position>().Update(position);
        await _unitOfWork.CompleteAsync(cancellationToken);

        return ApiResponse<int>.Ok(position.Id, "Position updated successfully");
    }
}
