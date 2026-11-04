using System;
using System.Collections.Generic;

namespace Appllication.Features.Attendance.Queries.GetMonthlyAttendanceMatrix
{
    public class MonthlyAttendanceMatrixDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public bool IsPayrollCycle { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public List<MatrixDayDto> Days { get; set; } = new();
        public List<EmployeeMatrixRowDto> Employees { get; set; } = new();
        public MatrixOverallSummaryDto Summary { get; set; } = new();
    }

    public class MatrixDayDto
    {
        public DateOnly Date { get; set; }
        public string DateString => Date.ToString("yyyy-MM-dd");
        public int DayNumber { get; set; }
        public string DayName { get; set; } = string.Empty;
        public bool IsWeekend { get; set; }
    }

    public class EmployeeMatrixRowDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string? BadgeNumber { get; set; }
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public Dictionary<string, DayAttendanceStatusDto> Days { get; set; } = new();

        public int TotalPresent { get; set; }
        public int TotalLate { get; set; }
        public int TotalLateMinutes { get; set; }
        public int TotalAbsent { get; set; }
        public int TotalLeaves { get; set; }
        public int TotalWeekends { get; set; }
    }

    public class DayAttendanceStatusDto
    {
        public int? RecordId { get; set; }
        public DateOnly Date { get; set; }
        public string Status { get; set; } = "None"; // Present, Late, Absent, OnLeave, Weekend, Future, None
        public DateTime? ClockIn { get; set; }
        public DateTime? ClockOut { get; set; }
        public int LateMinutes { get; set; }
        public string? Note { get; set; }
    }

    public class MatrixOverallSummaryDto
    {
        public int TotalEmployees { get; set; }
        public int TotalPresentDays { get; set; }
        public int TotalLateOccurrences { get; set; }
        public int TotalLateMinutes { get; set; }
        public int TotalAbsentDays { get; set; }
        public int TotalLeaveDays { get; set; }
    }
}
