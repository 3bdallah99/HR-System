using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
	public class AttendanceRecord
	{
		public int Id { get; set; }
		public string Status { get; set; }
		public string Note { get; set; }
		public DateTime ClockIn { get; set; }
		public DateTime ClockOut { get; set; }
		public int EmployeeId { get; set; }
		public Emolyee Emolyee { get; set; }
	}
}
