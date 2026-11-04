using Appllication.Common;

namespace Appllication.Features.Attendance.Queries.GetAllAttendanceRecords
{
    public record AttendanceSummaryDto(
        int Present,
        int Late,
        int Absent,
        int OnLeave);

    public class AttendancePaginatedResult<T> : PaginatedResult<T>
    {
        public AttendanceSummaryDto Summary { get; set; } = new(0, 0, 0, 0);
    }
}
