using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
	public class PerformanceReviews
	{
		public int Id { get; set; }
		public DateTime ReviewDate { get; set; }
		public double PerformanceRating { get; set; }
		public int EmployeeId { get; set; }
		public Employee Emolyee { get; set; }
	}
}
