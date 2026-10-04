using Appllication.Common;
using Domain.Enums;
using MediatR;

namespace Appllication.Features.Leave.Queries.GetLeaveRequestsByEmployee
{
    public record GetLeaveRequestsByEmployeeQuery(
        int EmployeeId,
        LeaveStatus? Status = null,
        int? Year = null,
        int Page = 1,
        int PageSize = 20)
        : IRequest<ApiResponse<PaginatedResult<GetLeaveRequestsByEmployeeDto>>>;

    public record GetLeaveRequestsByEmployeeDto(
        int Id,
        string LeaveType,
        DateTime StartDate,
        DateTime EndDate,
        int TotalDays,
        string Status,
        string? Reason,
        string? RejectionNote,
        DateTime RequestedAt,
        DateTime? ReviewedAt,
        string? ReviewedByName);
}
