using Appllication.Common;
using MediatR;

namespace Appllication.Features.Attendance.Queries.GetDeviceAttendanceLogs
{
    public record GetDeviceAttendanceLogsQuery(
        string? DeviceSerial = null,
        string? UserPin = null,
        int? EmployeeId = null,
        DateTime? From = null,
        DateTime? To = null,
        bool? IsProcessed = null,
        int Page = 1,
        int PageSize = 50
    ) : IRequest<ApiResponse<PaginatedResult<DeviceAttendanceLogDto>>>;

    public record DeviceAttendanceLogDto(
        int Id,
        string DeviceSerial,
        string UserPin,
        int? EmployeeId,
        string? EmployeeName,
        DateTime PunchTime,
        int InOutMode,
        int VerifyMode,
        string? WorkCode,
        bool IsProcessed,
        string? ErrorMessage,
        DateTime ReceivedAt
    );
}
