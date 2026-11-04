using Appllication.Common;
using MediatR;

namespace Appllication.Features.Attendance.Queries.GetMonthlyAttendanceMatrix
{
    public record GetMonthlyAttendanceMatrixQuery(
        int Year,
        int Month,
        int? DepartmentId = null,
        bool IsPayrollCycle = false)
        : IRequest<ApiResponse<MonthlyAttendanceMatrixDto>>;
}
