using Appllication.Common;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Attendance.Queries.GetDeviceAttendanceLogs
{
    public class GetDeviceAttendanceLogsQueryHandler
        : IRequestHandler<GetDeviceAttendanceLogsQuery, ApiResponse<PaginatedResult<DeviceAttendanceLogDto>>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetDeviceAttendanceLogsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<PaginatedResult<DeviceAttendanceLogDto>>> Handle(
            GetDeviceAttendanceLogsQuery request, CancellationToken cancellationToken)
        {
            var repo = _unitOfWork.GetRepository<DeviceAttendanceLog>();
            var query = repo.GetQueryable()
                .AsNoTracking()
                .Include(x => x.Employee)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.DeviceSerial))
                query = query.Where(x => x.DeviceSerial == request.DeviceSerial);

            if (!string.IsNullOrWhiteSpace(request.UserPin))
                query = query.Where(x => x.UserPin == request.UserPin);

            if (request.EmployeeId.HasValue)
                query = query.Where(x => x.EmployeeId == request.EmployeeId.Value);

            if (request.From.HasValue)
                query = query.Where(x => x.PunchTime >= request.From.Value);

            if (request.To.HasValue)
                query = query.Where(x => x.PunchTime <= request.To.Value);

            if (request.IsProcessed.HasValue)
                query = query.Where(x => x.IsProcessed == request.IsProcessed.Value);

            var totalCount = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderByDescending(x => x.PunchTime)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(x => new DeviceAttendanceLogDto(
                    x.Id,
                    x.DeviceSerial,
                    x.UserPin,
                    x.EmployeeId,
                    x.Employee != null ? x.Employee.Name : null,
                    x.PunchTime,
                    x.InOutMode,
                    x.VerifyMode,
                    x.WorkCode,
                    x.IsProcessed,
                    x.ErrorMessage,
                    x.ReceivedAt))
                .ToListAsync(cancellationToken);

            var result = new PaginatedResult<DeviceAttendanceLogDto>
            {
                Items = items,
                PageNumber = request.Page,
                PageSize = request.PageSize,
                TotalCount = totalCount
            };

            return ApiResponse<PaginatedResult<DeviceAttendanceLogDto>>.Ok(
                result, "Device attendance logs retrieved successfully.");
        }
    }
}
