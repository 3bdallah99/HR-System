using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;

namespace Appllication.Features.Attendance.Commands.CreateAttendanceRecord
{
    public class CreateAttendanceRecordCommandHandler
        : IRequestHandler<CreateAttendanceRecordCommand, ApiResponse<int>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CreateAttendanceRecordCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<int>> Handle(
            CreateAttendanceRecordCommand request, CancellationToken cancellationToken)
        {
            // Validate employee exists
            var empExists = await _unitOfWork
                .GetRepository<Domain.Entities.Employee>()
                .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

            if (!empExists)
                throw new NotFoundException(nameof(Domain.Entities.Employee), request.EmployeeId);

            var attRepo = _unitOfWork.GetRepository<Domain.Entities.AttendanceRecord>();
            var targetDate = request.Date.ToDateTime(TimeOnly.MinValue);

            // Enforce unique constraint: one record per employee per day
            var exists = await attRepo.AnyAsync(
                ar => ar.EmployeeId == request.EmployeeId && ar.Date == targetDate,
                cancellationToken);

            if (exists)
                throw new ConflictException(
                    $"An attendance record already exists for employee {request.EmployeeId} on {request.Date}.");

            var record = new Domain.Entities.AttendanceRecord
            {
                EmployeeId = request.EmployeeId,
                Date = targetDate,
                Status = request.Status,
                ClockIn = request.ClockIn,
                ClockOut = request.ClockOut,
                LateMinutes = request.LateMinutes,
                Note = request.Note
            };

            await attRepo.AddAsync(record, cancellationToken);
            await _unitOfWork.CompleteAsync(cancellationToken);

            return ApiResponse<int>.Ok(record.Id, "Attendance record created successfully");
        }
    }
}
