using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Attendance.Queries.GetDepartmentAttendanceByDate
{
    public class GetDepartmentAttendanceByDateQueryHandler
        : IRequestHandler<GetDepartmentAttendanceByDateQuery, ApiResponse<GetDepartmentAttendanceByDateDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetDepartmentAttendanceByDateQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<GetDepartmentAttendanceByDateDto>> Handle(
            GetDepartmentAttendanceByDateQuery request, CancellationToken cancellationToken)
        {
            // Validate department exists
            var department = await _unitOfWork
                .GetRepository<Domain.Entities.Department>()
                .GetQueryable()
                .AsNoTracking()
                .Where(d => d.Id == request.DepartmentId)
                .Select(d => new { d.Id, d.Name })
                .FirstOrDefaultAsync(cancellationToken);

            if (department is null)
                throw new NotFoundException(nameof(Domain.Entities.Department), request.DepartmentId);

            // Convert DateOnly to DateTime range for the target date
            var dateStart = request.Date.ToDateTime(TimeOnly.MinValue);
            var dateEnd = request.Date.ToDateTime(TimeOnly.MaxValue);

            // LEFT JOIN: query employees in department, join attendance for that date
            // EF Core translates this to a LEFT OUTER JOIN in SQL
            var employees = await _unitOfWork
                .GetRepository<Domain.Entities.Employee>()
                .GetQueryable()
                .AsNoTracking()
                .Where(e => e.DepartmentId == request.DepartmentId && e.IsActive)
                .Select(e => new EmployeeAttendanceDto(
                    e.Id,
                    e.Name,
                    e.AttendanceRecords
                        .Where(ar => ar.Date >= dateStart && ar.Date <= dateEnd)
                        .Select(ar => (int?)ar.Id)
                        .FirstOrDefault(),
                    e.AttendanceRecords
                        .Where(ar => ar.Date >= dateStart && ar.Date <= dateEnd)
                        .Select(ar => ar.Status.ToString())
                        .FirstOrDefault(),
                    e.AttendanceRecords
                        .Where(ar => ar.Date >= dateStart && ar.Date <= dateEnd)
                        .Select(ar => ar.ClockIn)
                        .FirstOrDefault(),
                    e.AttendanceRecords
                        .Where(ar => ar.Date >= dateStart && ar.Date <= dateEnd)
                        .Select(ar => ar.ClockOut)
                        .FirstOrDefault(),
                    e.AttendanceRecords
                        .Where(ar => ar.Date >= dateStart && ar.Date <= dateEnd)
                        .Select(ar => ar.Note)
                        .FirstOrDefault()))
                .OrderBy(e => e.EmployeeName)
                .ToListAsync(cancellationToken);

            var result = new GetDepartmentAttendanceByDateDto(
                department.Id,
                department.Name,
                request.Date,
                employees);

            return ApiResponse<GetDepartmentAttendanceByDateDto>.Ok(
                result, "Department attendance retrieved successfully");
        }
    }
}
