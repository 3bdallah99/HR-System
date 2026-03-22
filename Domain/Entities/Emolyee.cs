using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
	public class Emolyee
	{
		public int Id { get; set; }
		public string Name { get; set; }
		public string Address { get; set; }
		public string Email { get; set; }
		// Foreign keys
		public int PositionId { get; set; }
		public int DepartmentId { get; set; }
		// Navigation properties
		public ICollection<PerformanceReviews> PerformanceReviews { get; set; }
		public ICollection<Payroll> Payrolls { get; set; }
		public ICollection<AttendanceRecord> AttendanceRecords { get; set; }
		public Position Position { get; set; }
		public Depatment Department { get; set; }

	}
}
