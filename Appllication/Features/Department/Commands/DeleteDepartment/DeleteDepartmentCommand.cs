using Appllication.Common;
using MediatR;

namespace Appllication.Features.Department.Commands.DeleteDepartment
{
    public record DeleteDepartmentCommand(int Id)
        : IRequest<ApiResponse<string>>;
}
