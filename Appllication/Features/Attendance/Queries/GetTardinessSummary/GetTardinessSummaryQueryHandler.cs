using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Attendance.Queries.GetTardinessSummary
{
    public class GetTardinessSummaryQueryHandler
        : IRequestHandler<GetTardinessSummaryQuery, ApiResponse<TardinessSummaryDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        // Each employee is allowed 60 minutes of tardiness per month before deductions apply.
        private const int MonthlyAllowanceMinutes = 60;

        public GetTardinessSummaryQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<TardinessSummaryDto>> Handle(
            GetTardinessSummaryQuery request, CancellationToken cancellationToken)
        {
            // Validate employee exists
            var employee = await _unitOfWork
                .GetRepository<Domain.Entities.Employee>()
                .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken);

            if (employee is null)
                throw new NotFoundException(nameof(Domain.Entities.Employee), request.EmployeeId);

            // Define the payroll cycle boundary (26th of previous month to 25th of current month)
            var monthEnd = new DateTime(request.Year, request.Month, 25);
            var monthStart = monthEnd.AddMonths(-1).AddDays(1);

            // Query all Late records in this payroll cycle for this employee
            var lateRecords = await _unitOfWork
                .GetRepository<Domain.Entities.AttendanceRecord>()
                .GetQueryable()
                .AsNoTracking()
                .Where(ar =>
                    ar.EmployeeId == request.EmployeeId &&
                    ar.Status == AttendanceStatus.Late &&
                    ar.Date >= monthStart &&
                    ar.Date <= monthEnd)
                .ToListAsync(cancellationToken);

            int totalLateMinutes = lateRecords.Sum(ar => ar.LateMinutes);
            int deductibleMinutes = Math.Max(0, totalLateMinutes - MonthlyAllowanceMinutes);

            var dto = new TardinessSummaryDto(
                EmployeeId: employee.Id,
                EmployeeName: employee.Name,
                Year: request.Year,
                Month: request.Month,
                LateOccurrences: lateRecords.Count,
                TotalLateMinutes: totalLateMinutes,
                AllowedMinutes: MonthlyAllowanceMinutes,
                DeductibleMinutes: deductibleMinutes
            );

            return ApiResponse<TardinessSummaryDto>.Ok(dto, "Tardiness summary retrieved successfully");
        }
    }
}
