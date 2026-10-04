using FluentValidation;

namespace Appllication.Features.Attendance.Commands.CreateAttendanceRecord
{
    public class CreateAttendanceRecordCommandValidator
        : AbstractValidator<CreateAttendanceRecordCommand>
    {
        public CreateAttendanceRecordCommandValidator()
        {
            RuleFor(x => x.EmployeeId)
                .GreaterThan(0).WithMessage("Employee ID must be a positive number.");

            RuleFor(x => x.Date)
                .Must(d => d <= DateOnly.FromDateTime(DateTime.UtcNow))
                .WithMessage("Attendance date cannot be in the future.");

            RuleFor(x => x.ClockOut)
                .Must((cmd, clockOut) => clockOut == null || cmd.ClockIn == null || clockOut > cmd.ClockIn)
                .WithMessage("Clock-out time must be after clock-in time.");

            RuleFor(x => x.Note)
                .MaximumLength(500).WithMessage("Note must not exceed 500 characters.")
                .When(x => x.Note != null);
        }
    }
}
