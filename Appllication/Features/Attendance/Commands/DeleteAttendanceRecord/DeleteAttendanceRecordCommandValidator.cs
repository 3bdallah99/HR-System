using FluentValidation;

namespace Appllication.Features.Attendance.Commands.DeleteAttendanceRecord
{
    public class DeleteAttendanceRecordCommandValidator
        : AbstractValidator<DeleteAttendanceRecordCommand>
    {
        public DeleteAttendanceRecordCommandValidator()
        {
            RuleFor(x => x.Id)
                .GreaterThan(0).WithMessage("Attendance record ID must be a positive number.");
        }
    }
}
