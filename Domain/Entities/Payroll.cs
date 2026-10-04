namespace Domain.Entities
{
    public class Payroll
    {
        public int Id { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public DateTime PaymentDate { get; set; }

        // ─── Earnings snapshot ────────────────────────────────────
        public decimal BasicSalary { get; set; }
        public decimal HousingAllowance { get; set; }
        public decimal TransportationAllowance { get; set; }
        public decimal MealAllowance { get; set; }
        public decimal OtherAllowances { get; set; }
        public decimal OvertimePay { get; set; }
        /// <summary>Sum of all earnings before deductions.</summary>
        public decimal GrossPay { get; set; }

        // ─── Deductions snapshot ──────────────────────────────────
        /// <summary>Deduction for absent days: (BasicSalary / WorkingDays) × DaysAbsent.</summary>
        public decimal AbsenceDeduction { get; set; }
        /// <summary>Number of deductible late minutes (after the 60-minute free allowance).</summary>
        public int TardinessDeductionMinutes { get; set; }
        /// <summary>Monetary value of tardiness deduction.</summary>
        public decimal TardinessDeduction { get; set; }
        public decimal SocialInsurance { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal OtherDeductions { get; set; }
        /// <summary>Sum of all deductions.</summary>
        public decimal TotalDeductions { get; set; }

        /// <summary>NetPay = GrossPay - TotalDeductions.</summary>
        public decimal NetPay { get; set; }

        // ─── Attendance audit ─────────────────────────────────────
        public int WorkingDaysInMonth { get; set; }
        public int DaysPresent { get; set; }
        public int DaysAbsent { get; set; }
        public int ApprovedLeaveDays { get; set; }
        /// <summary>Total late minutes recorded this month (before allowance).</summary>
        public int TotalLateMinutes { get; set; }

        public int EmployeeId { get; set; }
        public Employee Employee { get; set; }
    }
}
