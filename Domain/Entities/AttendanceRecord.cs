using Domain.Enums;
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
        public DateTime Date { get; set; }
        public AttendanceStatus Status { get; set; }
        public DateTime? ClockIn { get; set; }
        public DateTime? ClockOut { get; set; }
        /// <summary>Minutes late relative to the official start time. 0 when on time.</summary>
        public int LateMinutes { get; set; } = 0;
        public string? Note { get; set; }
        public int EmployeeId { get; set; }
        public Employee Employee { get; set; }
    }
}
