using Appllication.Common;
using MediatR;

namespace Appllication.Features.Department.Commands.CreateDepartment
{
    public record CreateDepartmentCommand(string Name)
        : IRequest<ApiResponse<int>>;
}
