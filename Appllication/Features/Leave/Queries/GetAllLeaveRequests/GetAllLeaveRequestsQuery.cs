using Appllication.Common;
using Domain.Enums;
using MediatR;

namespace Appllication.Features.Leave.Queries.GetAllLeaveRequests
{
    public record GetAllLeaveRequestsQuery(
        LeaveStatus? Status = null,
        int? DepartmentId = null,
        int Page = 1,
        int PageSize = 20)
        : IRequest<ApiResponse<PaginatedResult<GetAllLeaveRequestsDto>>>;

    public record GetAllLeaveRequestsDto(
        int Id,
        string EmployeeName,
        string DepartmentName,
        string LeaveType,
        DateTime StartDate,
        DateTime EndDate,
        int TotalDays,
        string Status,
        string? Reason,
        DateTime RequestedAt);
}
