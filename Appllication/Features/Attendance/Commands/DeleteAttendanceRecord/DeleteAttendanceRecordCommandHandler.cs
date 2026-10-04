using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Attendance.Commands.DeleteAttendanceRecord
{
    public class DeleteAttendanceRecordCommandHandler
        : IRequestHandler<DeleteAttendanceRecordCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public DeleteAttendanceRecordCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            DeleteAttendanceRecordCommand request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.AttendanceRecord>();

            var record = await repo.GetByIdAsync(request.Id, cancellationToken);
            if (record is null)
                throw new NotFoundException("AttendanceRecord", request.Id);

            repo.Remove(record);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<string>.Ok("Deleted", "Attendance record deleted successfully");
        }
    }
}
