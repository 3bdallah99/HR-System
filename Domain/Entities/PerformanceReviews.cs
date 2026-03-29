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
        public int Rating { get; set; }
        public string Feedback { get; set; } 
        public bool AcknowledgedByEmployee { get; set; } = false;
        public DateTime? AcknowledgedAt { get; set; }
        public int EmployeeId { get; set; }
        public Employee Employee { get; set; }
        public int ReviewerEmployeeId { get; set; }
        public Employee Reviewer { get; set; }
    }
}
