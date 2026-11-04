using System;
using System.Collections.Generic;

namespace Appllication.Features.Attendance.Commands.UploadClinicTimesheet
{
    public class UploadClinicTimesheetResultDto
    {
        public int TotalEmployeesFound { get; set; }
        public int EmployeesCreated { get; set; }
        public int EmployeesMatched { get; set; }
        public int UserAccountsCreated { get; set; }
        public int AttendanceRecordsCreated { get; set; }
        public int AttendanceRecordsUpdated { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<string> PositionsCreated { get; set; } = new();
        public List<string> Errors { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }
}
