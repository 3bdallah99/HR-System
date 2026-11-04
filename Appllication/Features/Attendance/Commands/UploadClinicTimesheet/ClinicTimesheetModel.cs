using System;
using System.Collections.Generic;

namespace Appllication.Features.Attendance.Commands.UploadClinicTimesheet
{
    public class ParsedClinicTimesheet
    {
        public string Title { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = "T.CLINIC";
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<ParsedClinicEmployee> Employees { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
    }

    public class ParsedClinicEmployee
    {
        public double? SerialNumber { get; set; }
        public string Project { get; set; } = string.Empty;
        public string BadgeNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string? Iqama { get; set; }
        public string? Notes { get; set; }
        public string? Nationality { get; set; }
        public double? TotalBasicHours { get; set; }
        public double? TotalOvertimeHours { get; set; }
        public double? NetHours { get; set; }
        public List<ParsedClinicDailyRecord> DailyRecords { get; set; } = new();
    }

    public class ParsedClinicDailyRecord
    {
        public DateTime Date { get; set; }
        public int DayNumber { get; set; }
        /// <summary>Regular hours worked fraction (e.g. 0.4166667 for 10 hours)</summary>
        public double? RegularFraction { get; set; }
        /// <summary>Overtime hours fraction</summary>
        public double? OvertimeFraction { get; set; }
        /// <summary>Deduction / Cut fraction (e.g. 0.0027778 for 4 minutes)</summary>
        public double? CutFraction { get; set; }
        /// <summary>Status code (1=Absent, 2=Joining, 3=Leave, 4=Sick, 5=Umrah, 6=Friday)</summary>
        public int? StatusCode { get; set; }
        public string? StatusText { get; set; }
    }
}
