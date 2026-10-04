using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Leave.Commands.SetLeaveBalance
{
    public class SetLeaveBalanceCommandHandler
        : IRequestHandler<SetLeaveBalanceCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public SetLeaveBalanceCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            SetLeaveBalanceCommand request, CancellationToken cancellationToken)
        {
            // Validate employee exists
            var empExists = await _unitOfWork
                .GetRepository<Domain.Entities.Employee>()
                .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

            if (!empExists)
                throw new NotFoundException(nameof(Domain.Entities.Employee), request.EmployeeId);

            var balanceRepo = _unitOfWork.GetRepository<Domain.Entities.LeaveBalance>();

            // Upsert: update existing or create new
            var existing = await balanceRepo.FirstOrDefaultAsync(
                b => b.EmployeeId == request.EmployeeId &&
                     b.Year == request.Year &&
                     b.LeaveType == request.LeaveType,
                cancellationToken);

            if (existing is not null)
            {
                existing.TotalDays = request.TotalDays;
                balanceRepo.Update(existing);
            }
            else
            {
                var balance = new Domain.Entities.LeaveBalance
                {
                    EmployeeId = request.EmployeeId,
                    Year = request.Year,
                    LeaveType = request.LeaveType,
                    TotalDays = request.TotalDays,
                    UsedDays = 0
                };
                await balanceRepo.AddAsync(balance, cancellationToken);
            }

            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<string>.Ok(
                existing is not null ? "Updated" : "Created",
                $"Leave balance for {request.LeaveType} in {request.Year} set to {request.TotalDays} days");
        }
    }
}
