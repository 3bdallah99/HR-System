using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Attendance.Commands.UpdateAttendanceRecord
{
    public class UpdateAttendanceRecordCommandHandler
        : IRequestHandler<UpdateAttendanceRecordCommand, ApiResponse<string>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public UpdateAttendanceRecordCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<string>> Handle(
            UpdateAttendanceRecordCommand request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<Domain.Entities.AttendanceRecord>();

            var record = await repo.GetByIdAsync(request.Id, cancellationToken);
            if (record is null)
                throw new NotFoundException("AttendanceRecord", request.Id);

            // EmployeeId and Date are immutable — only correct the mutable fields
            record.Status = request.Status;
            record.ClockIn = request.ClockIn;
            record.ClockOut = request.ClockOut;
            record.LateMinutes = request.LateMinutes;
            record.Note = request.Note;

            repo.Update(record);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<string>.Ok("Updated", "Attendance record updated successfully");
        }
    }
}
