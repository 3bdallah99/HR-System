using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Leave.Commands.RejectLeaveRequest
{
    public class RejectLeaveRequestCommandHandler
        : IRequestHandler<RejectLeaveRequestCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public RejectLeaveRequestCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            RejectLeaveRequestCommand request, CancellationToken cancellationToken)
        {
            var leaveRepo = _unitOfWork.GetRepository<Domain.Entities.LeaveRequest>();

            var leaveRequest = await leaveRepo.GetByIdAsync(request.LeaveRequestId, cancellationToken);
            if (leaveRequest is null)
                throw new NotFoundException("LeaveRequest", request.LeaveRequestId);

            if (leaveRequest.Status != LeaveStatus.Pending)
                throw new BadRequestException(
                    $"Cannot reject a leave request with status '{leaveRequest.Status}'.");

            leaveRequest.Status = LeaveStatus.Rejected;
            leaveRequest.RejectionNote = request.RejectionNote;
            leaveRequest.ReviewedAt = DateTime.UtcNow;

            leaveRepo.Update(leaveRequest);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<string>.Ok("Rejected", "Leave request rejected successfully");
        }
    }
}
