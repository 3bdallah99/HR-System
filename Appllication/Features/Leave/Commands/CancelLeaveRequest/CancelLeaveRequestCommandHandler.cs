using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Leave.Commands.CancelLeaveRequest
{
    public class CancelLeaveRequestCommandHandler
        : IRequestHandler<CancelLeaveRequestCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CancelLeaveRequestCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            CancelLeaveRequestCommand request, CancellationToken cancellationToken)
        {
            var leaveRepo = _unitOfWork.GetRepository<Domain.Entities.LeaveRequest>();

            var leaveRequest = await leaveRepo.GetByIdAsync(request.LeaveRequestId, cancellationToken);
            if (leaveRequest is null)
                throw new NotFoundException("LeaveRequest", request.LeaveRequestId);

            // Verify ownership — employee can only cancel their own requests
            if (leaveRequest.EmployeeId != request.EmployeeId)
                throw new BadRequestException("You can only cancel your own leave requests.");

            // Only Pending requests can be cancelled
            if (leaveRequest.Status != LeaveStatus.Pending)
                throw new BadRequestException(
                    $"Cannot cancel a leave request with status '{leaveRequest.Status}'. Only Pending requests can be cancelled.");

            leaveRepo.Remove(leaveRequest);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<string>.Ok("Cancelled", "Leave request cancelled successfully");
        }
    }
}
