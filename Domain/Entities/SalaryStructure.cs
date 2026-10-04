namespace Domain.Entities
{
    /// <summary>
    /// HR-managed salary structure per employee.
    /// Defines all earnings and fixed deduction components.
    /// Updated whenever the employee's compensation changes.
    /// </summary>
    public class SalaryStructure
    {
        public int Id { get; set; }

        // ─── Earnings ────────────────────────────────────────────
        public decimal BasicSalary { get; set; }
        public decimal HousingAllowance { get; set; }
        public decimal TransportationAllowance { get; set; }
        public decimal MealAllowance { get; set; }
        public decimal OtherAllowances { get; set; }
        /// <summary>Monthly overtime amount set by HR for this employee.</summary>
        public decimal OvertimePay { get; set; }

        // ─── Fixed Deductions ─────────────────────────────────────
        public decimal SocialInsurance { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal OtherDeductions { get; set; }

        // ─── Audit ───────────────────────────────────────────────
        public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;

        public int EmployeeId { get; set; }
        public Employee Employee { get; set; }
    }
}
