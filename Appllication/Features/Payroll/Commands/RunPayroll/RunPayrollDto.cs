namespace Appllication.Features.Payroll.Commands.RunPayroll
{
    /// <summary>
    /// HR triggers payroll run for one employee, a department, or all active employees.
    /// Overtime and all salary components are read from each employee's SalaryStructure.
    /// </summary>
    public record RunPayrollDto(
        int Month,
        int Year,
        int? EmployeeId = null,
        int? DepartmentId = null,
        int WorkingDaysInMonth = 22);
}
