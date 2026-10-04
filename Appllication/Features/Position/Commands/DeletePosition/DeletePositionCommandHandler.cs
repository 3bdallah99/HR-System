using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Position.Commands.DeletePosition;

public class DeletePositionCommandHandler : IRequestHandler<DeletePositionCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeletePositionCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<bool>> Handle(DeletePositionCommand request, CancellationToken cancellationToken)
    {
        var position = await _unitOfWork.GetRepository<Domain.Entities.Position>()
            .GetQueryable()
            .Include(p => p.Employees)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (position == null)
            throw new NotFoundException(nameof(Domain.Entities.Position), request.Id);

        if (position.Employees != null && position.Employees.Any())
            throw new ConflictException("Cannot delete a position that has employees assigned to it.");

        _unitOfWork.GetRepository<Domain.Entities.Position>().Remove(position);
        await _unitOfWork.CompleteAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Position deleted successfully");
    }
}
