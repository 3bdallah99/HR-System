namespace Appllication.Features.Department.Commands.UpdateDepartment
{
    /// <summary>
    /// Input DTO from the client body.
    /// Id comes from the route, not the body.
    /// </summary>
    public record UpdateDepartmentDto(string Name);
}
