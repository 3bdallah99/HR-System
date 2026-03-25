using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
	public class Employee
	{
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public DateTime HireDate { get; set; }
        public bool IsActive { get; set; } = true;

        // Identity link — set when HR Admin creates the account
        public string? UserId { get; set; }

        public int PositionId { get; set; }
        public int DepartmentId { get; set; }
        public int? ManagerId { get; set; }
        public Employee? Manager { get; set; }
        public Position Position { get; set; }
        public Department Department { get; set; }
        public ICollection<AttendanceRecord> AttendanceRecords { get; set; }
        public ICollection<LeaveRequest> LeaveRequests { get; set; }
        public ICollection<LeaveBalance> LeaveBalances { get; set; }
        public ICollection<Payroll> Payrolls { get; set; }
        public ICollection<PerformanceReviews> PerformanceReviews { get; set; }
    }
}
