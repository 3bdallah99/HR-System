using Appllication.Common;
using MediatR;

namespace Appllication.Features.Leave.Queries.GetLeaveBalances
{
    public record GetLeaveBalancesQuery(int EmployeeId, int? Year = null)
        : IRequest<ApiResponse<List<GetLeaveBalancesDto>>>;

    public record GetLeaveBalancesDto(
        int Id,
        string LeaveType,
        int Year,
        int TotalDays,
        int UsedDays,
        int RemainingDays);
}
