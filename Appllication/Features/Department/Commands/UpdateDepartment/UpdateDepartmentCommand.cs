using Appllication.Common;
using MediatR;

namespace Appllication.Features.Department.Commands.UpdateDepartment
{
    public record UpdateDepartmentCommand(int Id, string Name)
        : IRequest<ApiResponse<string>>;
}
