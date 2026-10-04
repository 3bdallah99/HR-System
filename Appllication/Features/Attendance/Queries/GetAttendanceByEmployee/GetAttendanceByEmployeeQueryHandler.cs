using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Attendance.Queries.GetAttendanceByEmployee
{
    public class GetAttendanceByEmployeeQueryHandler
        : IRequestHandler<GetAttendanceByEmployeeQuery, ApiResponse<PaginatedResult<GetAttendanceByEmployeeDto>>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetAttendanceByEmployeeQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<PaginatedResult<GetAttendanceByEmployeeDto>>> Handle(
            GetAttendanceByEmployeeQuery request, CancellationToken cancellationToken)
        {
            // Validate employee exists
            var empExists = await _unitOfWork
                .GetRepository<Domain.Entities.Employee>()
                .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

            if (!empExists)
                throw new NotFoundException(nameof(Domain.Entities.Employee), request.EmployeeId);

            var repo = _unitOfWork.GetRepository<Domain.Entities.AttendanceRecord>();
            var query = repo.GetQueryable()
                .AsNoTracking()
                .Where(ar => ar.EmployeeId == request.EmployeeId);

            // Apply optional date range filters
            if (request.From.HasValue)
                query = query.Where(ar => ar.Date >= request.From.Value.ToDateTime(TimeOnly.MinValue));

            if (request.To.HasValue)
                query = query.Where(ar => ar.Date <= request.To.Value.ToDateTime(TimeOnly.MaxValue));

            var totalCount = await query.CountAsync(cancellationToken);

            var records = await query
                .OrderByDescending(ar => ar.Date)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(ar => new GetAttendanceByEmployeeDto(
                    ar.Id,
                    DateOnly.FromDateTime(ar.Date),
                    ar.Status.ToString(),
                    ar.ClockIn,
                    ar.ClockOut,
                    ar.Note))
                .ToListAsync(cancellationToken);

            var result = new PaginatedResult<GetAttendanceByEmployeeDto>
            {
                Items = records,
                PageNumber = request.Page,
                PageSize = request.PageSize,
                TotalCount = totalCount
            };

            return ApiResponse<PaginatedResult<GetAttendanceByEmployeeDto>>.Ok(
                result, "Attendance records retrieved successfully");
        }
    }
}
