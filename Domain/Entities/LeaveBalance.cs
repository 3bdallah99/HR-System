using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
	public class LeaveBalance
	{
		public int Id { get; set; }
		public int Year { get; set; }
		public LeaveType LeaveType { get; set; }
		public int TotalDays { get; set; }
		public int UsedDays { get; set; }
		public int RemainingDays => TotalDays - UsedDays;
		public int EmployeeId { get; set; }
		public Employee Employee { get; set; }
	}
}
