namespace Appllication.Features.Payroll.Commands.UpdatePayroll
{
    /// <summary>
    /// HR manual correction after payroll run.
    /// Adjusts overtime and/or other deductions; NetPay is recalculated automatically.
    /// </summary>
    public record UpdatePayrollDto(
        decimal OvertimePay,
        decimal OtherDeductions);
}
