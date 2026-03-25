using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
	public class Payroll
	{
        public int Id { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public DateTime PaymentDate { get; set; }

        // Snapshot of salary at time of run (position salary may change later)
        public decimal BaseSalary { get; set; }
        public decimal OvertimePay { get; set; }
        public decimal Deductions { get; set; }
        public decimal NetPay { get; set; }

        // Audit fields
        public int WorkingDaysInMonth { get; set; }
        public int DaysPresent { get; set; }
        public int DaysAbsent { get; set; }
        public int ApprovedLeaveDays { get; set; }

        public int EmployeeId { get; set; }
        public Employee Employee { get; set; }
    }
}
