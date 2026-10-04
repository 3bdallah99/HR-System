using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Leave.Commands.ApproveLeaveRequest
{
    public class ApproveLeaveRequestCommandHandler
        : IRequestHandler<ApproveLeaveRequestCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public ApproveLeaveRequestCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            ApproveLeaveRequestCommand request, CancellationToken cancellationToken)
        {
            var leaveRepo = _unitOfWork.GetRepository<Domain.Entities.LeaveRequest>();

            var leaveRequest = await leaveRepo.GetByIdAsync(request.LeaveRequestId, cancellationToken);
            if (leaveRequest is null)
                throw new NotFoundException("LeaveRequest", request.LeaveRequestId);

            // Enforce status machine — only Pending can be approved
            if (leaveRequest.Status != LeaveStatus.Pending)
                throw new BadRequestException(
                    $"Cannot approve a leave request with status '{leaveRequest.Status}'.");

            // Compute total days
            int totalDays = (leaveRequest.EndDate - leaveRequest.StartDate).Days + 1;
            int year = leaveRequest.StartDate.Year;

            // Check balance for this leave type and year
            var balanceRepo = _unitOfWork.GetRepository<Domain.Entities.LeaveBalance>();
            var balance = await balanceRepo.FirstOrDefaultAsync(
                b => b.EmployeeId == leaveRequest.EmployeeId &&
                     b.LeaveType == leaveRequest.LeaveType &&
                     b.Year == year,
                cancellationToken);

            // Unpaid leave doesn't require a balance check
            if (leaveRequest.LeaveType != LeaveType.Unpaid)
            {
                if (balance is null)
                    throw new BadRequestException(
                        $"No leave balance found for {leaveRequest.LeaveType} in {year}. Set up the balance first.");

                if (balance.TotalDays - balance.UsedDays < totalDays)
                    throw new BadRequestException(
                        $"Insufficient leave balance. Available: {balance.TotalDays - balance.UsedDays} days, Requested: {totalDays} days.");

                // Deduct from balance
                balance.UsedDays += totalDays;
                balanceRepo.Update(balance);
            }

            // Approve the request
            leaveRequest.Status = LeaveStatus.Approved;
            leaveRequest.ReviewedAt = DateTime.UtcNow;

            leaveRepo.Update(leaveRequest);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<string>.Ok("Approved", "Leave request approved successfully");
        }
    }
}
