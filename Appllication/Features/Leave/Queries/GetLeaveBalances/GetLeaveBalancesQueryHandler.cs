using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Leave.Queries.GetLeaveBalances
{
    public class GetLeaveBalancesQueryHandler
        : IRequestHandler<GetLeaveBalancesQuery, ApiResponse<List<GetLeaveBalancesDto>>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetLeaveBalancesQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<List<GetLeaveBalancesDto>>> Handle(
            GetLeaveBalancesQuery request, CancellationToken cancellationToken)
        {
            var empExists = await _unitOfWork
                .GetRepository<Domain.Entities.Employee>()
                .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

            if (!empExists)
                throw new NotFoundException(nameof(Domain.Entities.Employee), request.EmployeeId);

            // Default to current year if not specified
            var year = request.Year ?? DateTime.UtcNow.Year;

            var balances = await _unitOfWork
                .GetRepository<Domain.Entities.LeaveBalance>()
                .GetQueryable()
                .AsNoTracking()
                .Where(b => b.EmployeeId == request.EmployeeId && b.Year == year)
                .Select(b => new GetLeaveBalancesDto(
                    b.Id,
                    b.LeaveType.ToString(),
                    b.Year,
                    b.TotalDays,
                    b.UsedDays,
                    b.TotalDays - b.UsedDays))  // RemainingDays computed — EF ignores the property
                .ToListAsync(cancellationToken);

            return ApiResponse<List<GetLeaveBalancesDto>>.Ok(
                balances, $"Leave balances for year {year} retrieved successfully");
        }
    }
}
