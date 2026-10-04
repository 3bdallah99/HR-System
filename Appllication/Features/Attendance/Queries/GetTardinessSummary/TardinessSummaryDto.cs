namespace Appllication.Features.Attendance.Queries.GetTardinessSummary
{
    public record TardinessSummaryDto(
        int EmployeeId,
        string EmployeeName,
        int Year,
        int Month,
        int LateOccurrences,
        int TotalLateMinutes,
        int AllowedMinutes,
        int DeductibleMinutes
    );
}
