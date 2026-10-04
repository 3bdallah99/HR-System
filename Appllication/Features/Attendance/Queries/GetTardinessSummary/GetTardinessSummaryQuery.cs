using Appllication.Common;
using MediatR;

namespace Appllication.Features.Attendance.Queries.GetTardinessSummary
{
    public record GetTardinessSummaryQuery(int EmployeeId, int Year, int Month)
        : IRequest<ApiResponse<TardinessSummaryDto>>;
}
