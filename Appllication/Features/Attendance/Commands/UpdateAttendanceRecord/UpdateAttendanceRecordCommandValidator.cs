using FluentValidation;

namespace Appllication.Features.Attendance.Commands.UpdateAttendanceRecord
{
    public class UpdateAttendanceRecordCommandValidator
        : AbstractValidator<UpdateAttendanceRecordCommand>
    {
        public UpdateAttendanceRecordCommandValidator()
        {
            RuleFor(x => x.Id)
                .GreaterThan(0).WithMessage("Attendance record ID must be a positive number.");

            RuleFor(x => x.ClockOut)
                .Must((cmd, clockOut) => clockOut == null || cmd.ClockIn == null || clockOut > cmd.ClockIn)
                .WithMessage("Clock-out time must be after clock-in time.");

            RuleFor(x => x.Note)
                .MaximumLength(500).WithMessage("Note must not exceed 500 characters.")
                .When(x => x.Note != null);
        }
    }
}
