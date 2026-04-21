namespace Appllication.Features.Employee.Commands.UpdateEmployee
{
    /// <summary>
    /// The input DTO that the API receives from the client.
    /// The Id comes from the route, the rest from the body.
    /// </summary>
    public record UpdateEmployeeDto(
        string Name,
        string Email,
        string Phone,
        string Address,
        DateTime HireDate,
        bool IsActive,
        int PositionId,
        int DepartmentId,
        int? ManagerId);
}
