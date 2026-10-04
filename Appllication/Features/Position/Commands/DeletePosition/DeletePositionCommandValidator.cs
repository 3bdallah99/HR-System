using FluentValidation;

namespace Appllication.Features.Position.Commands.DeletePosition;

public class DeletePositionCommandValidator : AbstractValidator<DeletePositionCommand>
{
    public DeletePositionCommandValidator()
    {
        RuleFor(v => v.Id)
            .GreaterThan(0).WithMessage("Id is required.");
    }
}
