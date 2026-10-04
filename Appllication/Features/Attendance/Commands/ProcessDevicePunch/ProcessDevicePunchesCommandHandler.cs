using Appllication.Common;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Globalization;

namespace Appllication.Features.Attendance.Commands.ProcessDevicePunch
{
    public class ProcessDevicePunchesCommandHandler : IRequestHandler<ProcessDevicePunchesCommand, ApiResponse<int>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<ProcessDevicePunchesCommandHandler> _logger;
        private static readonly TimeSpan LateThreshold = new TimeSpan(9, 0, 0); // 09:00 AM

        public ProcessDevicePunchesCommandHandler(
            IUnitOfWork unitOfWork,
            ILogger<ProcessDevicePunchesCommandHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<ApiResponse<int>> Handle(
            ProcessDevicePunchesCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.RawPayload))
            {
                return ApiResponse<int>.Ok(0, "Empty payload received.");
            }

            var lines = request.RawPayload.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);
            int processedCount = 0;

            var deviceLogRepo = _unitOfWork.GetRepository<DeviceAttendanceLog>();
            var empRepo = _unitOfWork.GetRepository<Domain.Entities.Employee>();
            var attRepo = _unitOfWork.GetRepository<AttendanceRecord>();

            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                if (string.IsNullOrWhiteSpace(trimmed)) continue;

                var punch = ParseLogLine(trimmed);
                if (punch == null)
                {
                    _logger.LogWarning("Failed to parse device log line: {Line}", trimmed);
                    continue;
                }

                var deviceLog = new DeviceAttendanceLog
                {
                    DeviceSerial = request.DeviceSerial,
                    UserPin = punch.UserPin,
                    PunchTime = punch.PunchTime,
                    InOutMode = punch.InOutMode,
                    VerifyMode = punch.VerifyMode,
                    WorkCode = punch.WorkCode,
                    RawData = trimmed.Length > 1000 ? trimmed.Substring(0, 1000) : trimmed,
                    ReceivedAt = DateTime.UtcNow,
                    IsProcessed = false
                };

                // Check if employee exists by PIN
                if (int.TryParse(punch.UserPin, out int employeeId))
                {
                    var employee = await empRepo.GetByIdAsync(employeeId, cancellationToken);
                    if (employee == null)
                    {
                        deviceLog.ErrorMessage = $"Employee with ID/PIN '{punch.UserPin}' was not found.";
                        await deviceLogRepo.AddAsync(deviceLog, cancellationToken);
                        continue;
                    }

                    if (!employee.IsActive)
                    {
                        deviceLog.ErrorMessage = $"Employee '{employee.Name}' (ID {employeeId}) is marked inactive.";
                        await deviceLogRepo.AddAsync(deviceLog, cancellationToken);
                        continue;
                    }

                    deviceLog.EmployeeId = employee.Id;

                    // Process attendance record
                    await ProcessAttendanceRecord(attRepo, employee.Id, punch.PunchTime, punch.InOutMode, request.DeviceSerial, cancellationToken);
                    deviceLog.IsProcessed = true;
                    processedCount++;
                }
                else
                {
                    deviceLog.ErrorMessage = $"UserPin '{punch.UserPin}' is not a valid numeric employee ID.";
                }

                await deviceLogRepo.AddAsync(deviceLog, cancellationToken);
            }

            await _unitOfWork.CompleteAsync(cancellationToken);
            return ApiResponse<int>.Ok(processedCount, $"Successfully processed {processedCount} attendance punches.");
        }

        private async Task ProcessAttendanceRecord(
            IGenericRepository<AttendanceRecord> attRepo,
            int employeeId,
            DateTime punchTime,
            int inOutMode,
            string deviceSerial,
            CancellationToken cancellationToken)
        {
            var punchDate = punchTime.Date;
            var record = await attRepo.FirstOrDefaultAsync(
                ar => ar.EmployeeId == employeeId && ar.Date == punchDate,
                cancellationToken);

            if (record == null)
            {
                // InOutMode: 0 = Check-in, 1 = Check-out, etc.
                if (inOutMode == 1)
                {
                    // Clock-out occurred without prior clock-in
                    record = new AttendanceRecord
                    {
                        EmployeeId = employeeId,
                        Date = punchDate,
                        ClockIn = null,
                        ClockOut = punchTime,
                        Status = AttendanceStatus.Present,
                        Note = $"Clocked out via device {deviceSerial} (no prior clock-in recorded)"
                    };
                }
                else
                {
                    // Default to Clock-in
                    int lateMinutes = 0;
                    AttendanceStatus status;

                    if (punchTime.TimeOfDay <= LateThreshold)
                    {
                        status = AttendanceStatus.Present;
                    }
                    else
                    {
                        status = AttendanceStatus.Late;
                        lateMinutes = (int)(punchTime.TimeOfDay - LateThreshold).TotalMinutes;
                    }

                    record = new AttendanceRecord
                    {
                        EmployeeId = employeeId,
                        Date = punchDate,
                        ClockIn = punchTime,
                        ClockOut = null,
                        Status = status,
                        LateMinutes = lateMinutes,
                        Note = $"Clocked in via device {deviceSerial}"
                    };
                }

                await attRepo.AddAsync(record, cancellationToken);
            }
            else
            {
                // Existing record exists for today
                if (inOutMode == 1)
                {
                    // Check-out: update ClockOut if newer
                    if (!record.ClockOut.HasValue || punchTime > record.ClockOut.Value)
                    {
                        record.ClockOut = punchTime;
                        attRepo.Update(record);
                    }
                }
                else if (inOutMode == 0)
                {
                    // Check-in: update ClockIn if earlier
                    if (!record.ClockIn.HasValue || punchTime < record.ClockIn.Value)
                    {
                        record.ClockIn = punchTime;

                        if (punchTime.TimeOfDay <= LateThreshold)
                        {
                            record.Status = AttendanceStatus.Present;
                            record.LateMinutes = 0;
                        }
                        else
                        {
                            record.Status = AttendanceStatus.Late;
                            record.LateMinutes = (int)(punchTime.TimeOfDay - LateThreshold).TotalMinutes;
                        }

                        attRepo.Update(record);
                    }
                }
                else
                {
                    // Mode is ambiguous/other:
                    // If punch is more than 30 minutes after clock-in, assume check-out
                    if (record.ClockIn.HasValue && punchTime > record.ClockIn.Value.AddMinutes(30))
                    {
                        if (!record.ClockOut.HasValue || punchTime > record.ClockOut.Value)
                        {
                            record.ClockOut = punchTime;
                            attRepo.Update(record);
                        }
                    }
                    else if (!record.ClockIn.HasValue)
                    {
                        record.ClockIn = punchTime;
                        attRepo.Update(record);
                    }
                }
            }
        }

        private static ParsedPunch? ParseLogLine(string line)
        {
            // ZKTeco ATTLOG format (tab-separated):
            // UserPIN \t Timestamp \t InOutMode \t VerifyMode \t WorkCode \t ...
            // Example: 1024\t2026-09-30 08:55:12\t0\t15\t0
            var parts = line.Split(new[] { '\t' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 2)
            {
                // Try splitting by multiple spaces
                parts = line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
            }

            if (parts.Length < 2) return null;

            string pin = parts[0].Trim();
            DateTime punchTime = DateTime.MinValue;
            int inOutMode = 0;
            int verifyMode = 0;
            string? workCode = null;

            // Date & Time might be together ("2026-09-30 08:55:12") or split across parts
            if (DateTime.TryParse(parts[1].Trim(), CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt) ||
                DateTime.TryParse(parts[1].Trim(), out dt))
            {
                punchTime = dt;
                if (parts.Length > 2 && int.TryParse(parts[2].Trim(), out int io)) inOutMode = io;
                if (parts.Length > 3 && int.TryParse(parts[3].Trim(), out int vm)) verifyMode = vm;
                if (parts.Length > 4) workCode = parts[4].Trim();
            }
            else if (parts.Length >= 3)
            {
                string combinedDateTime = $"{parts[1].Trim()} {parts[2].Trim()}";
                if (DateTime.TryParse(combinedDateTime, CultureInfo.InvariantCulture, DateTimeStyles.None, out dt) ||
                    DateTime.TryParse(combinedDateTime, out dt))
                {
                    punchTime = dt;
                    if (parts.Length > 3 && int.TryParse(parts[3].Trim(), out int io)) inOutMode = io;
                    if (parts.Length > 4 && int.TryParse(parts[4].Trim(), out int vm)) verifyMode = vm;
                    if (parts.Length > 5) workCode = parts[5].Trim();
                }
                else
                {
                    return null;
                }
            }
            else
            {
                return null;
            }

            return new ParsedPunch(pin, punchTime, inOutMode, verifyMode, workCode);
        }

        private record ParsedPunch(
            string UserPin,
            DateTime PunchTime,
            int InOutMode,
            int VerifyMode,
            string? WorkCode);
    }
}
