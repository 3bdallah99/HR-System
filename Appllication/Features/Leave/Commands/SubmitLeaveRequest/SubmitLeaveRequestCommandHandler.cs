using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Leave.Commands.SubmitLeaveRequest
{
    public class SubmitLeaveRequestCommandHandler
        : IRequestHandler<SubmitLeaveRequestCommand, ApiResponse<int>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public SubmitLeaveRequestCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<int>> Handle(
            SubmitLeaveRequestCommand request, CancellationToken cancellationToken)
        {
            // Validate employee exists
            var empExists = await _unitOfWork
                .GetRepository<Domain.Entities.Employee>()
                .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

            if (!empExists)
                throw new NotFoundException(nameof(Domain.Entities.Employee), request.EmployeeId);

            var leaveRepo = _unitOfWork.GetRepository<Domain.Entities.LeaveRequest>();

            // Check for overlapping Pending or Approved requests
            var hasOverlap = await leaveRepo.AnyAsync(l =>
                l.EmployeeId == request.EmployeeId &&
                l.Status != LeaveStatus.Rejected &&
                l.StartDate <= request.EndDate &&
                l.EndDate >= request.StartDate,
                cancellationToken);

            if (hasOverlap)
                throw new ConflictException(
                    "Employee already has a pending or approved leave request overlapping this period.");

            var leaveRequest = new Domain.Entities.LeaveRequest
            {
                EmployeeId = request.EmployeeId,
                LeaveType = request.LeaveType,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Reason = request.Reason,
                Status = LeaveStatus.Pending,
                RequestedAt = DateTime.UtcNow
            };

            await leaveRepo.AddAsync(leaveRequest, cancellationToken);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<int>.Ok(leaveRequest.Id, "Leave request submitted successfully");
        }
    }
}
