namespace Appllication.Features.Employee.Commands.CreateEmployee
{
    /// <summary>
    /// The input DTO that the API receives from the client.
    /// Separated from the Command so the API contract is decoupled
    /// from the internal CQRS structure.
    /// </summary>
    public record CreateEmployeeDto(
        string Name,
        string Email,
        string Phone,
        string Address,
        DateTime HireDate,
        int PositionId,
        int DepartmentId,
        int? ManagerId);
}
