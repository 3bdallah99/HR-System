using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Position.Queries.GetPositionById;

public class GetPositionByIdQueryHandler : IRequestHandler<GetPositionByIdQuery, ApiResponse<GetPositionByIdDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPositionByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<GetPositionByIdDto>> Handle(GetPositionByIdQuery request, CancellationToken cancellationToken)
    {
        var position = await _unitOfWork.GetRepository<Domain.Entities.Position>()
            .GetQueryable()
            .AsNoTracking()
            .Where(p => p.Id == request.Id)
            .Select(p => new GetPositionByIdDto(
                p.Id,
                p.Title,
                p.BaseSalary,
                p.Department.Name,
                p.Employees.Count))
            .FirstOrDefaultAsync(cancellationToken);

        if (position == null)
            throw new NotFoundException(nameof(Domain.Entities.Position), request.Id);

        return ApiResponse<GetPositionByIdDto>.Ok(position, "Position retrieved successfully");
    }
}
