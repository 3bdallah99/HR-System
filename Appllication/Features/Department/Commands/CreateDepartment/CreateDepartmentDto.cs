namespace Appllication.Features.Department.Commands.CreateDepartment
{
    /// <summary>
    /// Input DTO received from the API client.
    /// Decoupled from the Command to allow the controller
    /// to enrich with server-side data (e.g. CreatedByUserId from JWT).
    /// </summary>
    public record CreateDepartmentDto(string Name);
}
