using Appllication.Common;
using Appllication.Common.Exceptions;
using Appllication.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using EmployeeEntity = Domain.Entities.Employee;
using DepartmentEntity = Domain.Entities.Department;
using PositionEntity = Domain.Entities.Position;

namespace Appllication.Features.Attendance.Commands.UploadClinicTimesheet
{
    public class UploadClinicTimesheetCommandHandler
        : IRequestHandler<UploadClinicTimesheetCommand, ApiResponse<UploadClinicTimesheetResultDto>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<UploadClinicTimesheetCommandHandler> _logger;
        private readonly IIdentityService? _identityService;
        private readonly IConfiguration? _configuration;

        public UploadClinicTimesheetCommandHandler(
            IUnitOfWork unitOfWork,
            ILogger<UploadClinicTimesheetCommandHandler> logger,
            IIdentityService? identityService = null,
            IConfiguration? configuration = null)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _identityService = identityService;
            _configuration = configuration;
        }

        public async Task<ApiResponse<UploadClinicTimesheetResultDto>> Handle(
            UploadClinicTimesheetCommand request, CancellationToken cancellationToken)
        {
            var result = new UploadClinicTimesheetResultDto();

            if (request.FileStream == null || request.FileStream.Length == 0)
            {
                return ApiResponse<UploadClinicTimesheetResultDto>.Fail("ملف التايم شيت فارغ / Uploaded file is empty.");
            }

            ParsedClinicTimesheet parsed;
            try
            {
                parsed = ClinicTimesheetParser.Parse(request.FileStream);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse clinic timesheet: {FileName}", request.FileName);
                return ApiResponse<UploadClinicTimesheetResultDto>.Fail($"فشل في قراءة ملف التايم شيت: {ex.Message}");
            }

            result.TotalEmployeesFound = parsed.Employees.Count;
            result.DepartmentName = parsed.DepartmentName;
            result.StartDate = parsed.StartDate;
            result.EndDate = parsed.EndDate;

            if (parsed.Employees.Count == 0)
            {
                return ApiResponse<UploadClinicTimesheetResultDto>.Fail("لم يتم العثور على أي موظفين في شيت التايم شيت.");
            }

            return await _unitOfWork.ExecuteInTransactionAsync(async () =>
            {
                var deptRepo = _unitOfWork.GetRepository<DepartmentEntity>();
                var posRepo = _unitOfWork.GetRepository<PositionEntity>();
                var empRepo = _unitOfWork.GetRepository<EmployeeEntity>();
                var attRepo = _unitOfWork.GetRepository<AttendanceRecord>();

                // 1. Ensure Department exists
                var departments = await deptRepo.GetAllAsync(cancellationToken);
                var clinicDept = departments.FirstOrDefault(d =>
                    string.Equals(d.Name.Trim(), parsed.DepartmentName.Trim(), StringComparison.OrdinalIgnoreCase));

                if (clinicDept == null)
                {
                    clinicDept = new DepartmentEntity { Name = parsed.DepartmentName.Trim() };
                    await deptRepo.AddAsync(clinicDept, cancellationToken);
                    await _unitOfWork.CompleteAsync(cancellationToken);
                }

                // 2. Ensure Positions exist under this Department
                var allPositions = await posRepo.GetAllAsync(cancellationToken);
                var posMap = new Dictionary<string, PositionEntity>(StringComparer.OrdinalIgnoreCase);

                foreach (var p in allPositions.Where(p => p.DepartmentId == clinicDept.Id))
                {
                    posMap[p.Title.Trim()] = p;
                }

                foreach (var empRow in parsed.Employees)
                {
                    string cleanJob = NormalizeJobTitle(empRow.JobTitle);
                    if (!posMap.ContainsKey(cleanJob))
                    {
                        var newPos = new PositionEntity
                        {
                            Title = cleanJob,
                            DepartmentId = clinicDept.Id,
                            BaseSalary = 0
                        };
                        await posRepo.AddAsync(newPos, cancellationToken);
                        posMap[cleanJob] = newPos;
                        result.PositionsCreated.Add(cleanJob);
                    }
                }

                if (result.PositionsCreated.Count > 0)
                {
                    await _unitOfWork.CompleteAsync(cancellationToken);
                }

                // 3. Match or Provision Employees
                var allEmployees = await empRepo.GetAllAsync(cancellationToken);
                var empByBadge = new Dictionary<string, EmployeeEntity>(StringComparer.OrdinalIgnoreCase);
                var empByName = new Dictionary<string, EmployeeEntity>(StringComparer.OrdinalIgnoreCase);
                var usedEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                foreach (var e in allEmployees)
                {
                    if (!string.IsNullOrWhiteSpace(e.BadgeNumber))
                        empByBadge[e.BadgeNumber.Trim()] = e;

                    if (!string.IsNullOrWhiteSpace(e.Name))
                        empByName[NormalizeName(e.Name)] = e;

                    if (!string.IsNullOrWhiteSpace(e.Email))
                        usedEmails.Add(e.Email.Trim());
                }

                var resolvedEmployees = new List<(ParsedClinicEmployee Row, EmployeeEntity Entity)>();
                bool hasNewEmployees = false;

                foreach (var empRow in parsed.Employees)
                {
                    string bKey = empRow.BadgeNumber.Trim();
                    string nKey = NormalizeName(empRow.Name);
                    EmployeeEntity? employee = null;

                    // Priority 1: Match by BadgeNumber
                    if (empByBadge.TryGetValue(bKey, out var matchedByBadge))
                    {
                        employee = matchedByBadge;
                        result.EmployeesMatched++;
                    }
                    // Priority 2: Fallback match by Name (ONLY if that employee has no BadgeNumber yet)
                    else if (empByName.TryGetValue(nKey, out var matchedByName) && string.IsNullOrWhiteSpace(matchedByName.BadgeNumber))
                    {
                        employee = matchedByName;
                        employee.BadgeNumber = bKey;
                        empRepo.Update(employee);
                        empByBadge[bKey] = employee;
                        result.EmployeesMatched++;
                    }
                    // Priority 3: Auto-provision if allowed
                    else if (request.AutoProvisionEmployees)
                    {
                        string cleanJob = NormalizeJobTitle(empRow.JobTitle);
                        int posId = posMap.TryGetValue(cleanJob, out var pObj) ? pObj.Id : posMap.Values.First().Id;
                        string email = GenerateUniqueEmail(empRow.Name, bKey, usedEmails);

                        employee = new EmployeeEntity
                        {
                            Name = empRow.Name.Trim(),
                            BadgeNumber = bKey,
                            DepartmentId = clinicDept.Id,
                            PositionId = posId,
                            Email = email,
                            Phone = string.Empty,
                            Address = clinicDept.Name,
                            HireDate = parsed.StartDate,
                            IsActive = true
                        };

                        await empRepo.AddAsync(employee, cancellationToken);
                        empByBadge[bKey] = employee;
                        empByName[nKey] = employee;
                        usedEmails.Add(email);
                        result.EmployeesCreated++;
                        hasNewEmployees = true;
                    }
                    else
                    {
                        result.Errors.Add($"الموظف '{empRow.Name}' بكود '{bKey}' غير مسجل بالنظام.");
                        continue;
                    }

                    if (employee != null)
                    {
                        resolvedEmployees.Add((empRow, employee));
                    }
                }

                // Save new employees to ensure they have valid IDs generated
                if (hasNewEmployees)
                {
                    await _unitOfWork.CompleteAsync(cancellationToken);
                }

                // 3.5 Auto-create User Accounts for employees
                if (_identityService != null)
                {
                    string configuredPassword = _configuration?["Identity:DefaultEmployeePassword"]?.Trim() ?? string.Empty;
                    string defaultPassword = !string.IsNullOrWhiteSpace(configuredPassword)
                        ? configuredPassword
                        : GenerateSecurePassword();

                    foreach (var (_, employee) in resolvedEmployees)
                    {
                        try
                        {
                            await _identityService.RegisterAsync(employee.Email, defaultPassword, employee.Email, employee.Id);
                            result.UserAccountsCreated++;
                        }
                        catch (ConflictException)
                        {
                            // User account already exists, safe to continue
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to create user account for employee {EmpName} ({Email}): {Message}", employee.Name, employee.Email, ex.Message);
                            result.Errors.Add($"فشل إنشاء حساب مستخدم للموظف '{employee.Name}' ({employee.Email}): {ex.Message}");
                        }
                    }
                }

                // 4. Ingest Daily Attendance Records (filtered by resolved employee IDs and date range)
                var targetEmpIds = resolvedEmployees.Select(re => re.Entity.Id).Distinct().ToList();
                var allExistingAttendance = targetEmpIds.Count > 0
                    ? await attRepo.FindAsync(
                        ar => targetEmpIds.Contains(ar.EmployeeId) && ar.Date >= parsed.StartDate && ar.Date <= parsed.EndDate,
                        cancellationToken)
                    : Array.Empty<AttendanceRecord>();

                var existingAttMap = new Dictionary<string, AttendanceRecord>();
                foreach (var ar in allExistingAttendance)
                {
                    existingAttMap[$"{ar.EmployeeId}_{ar.Date:yyyyMMdd}"] = ar;
                }

                foreach (var (empRow, employee) in resolvedEmployees)
                {
                    foreach (var daily in empRow.DailyRecords)
                    {
                        DateTime recordDate = daily.Date.Date;
                        string key = $"{employee.Id}_{recordDate:yyyyMMdd}";

                        // Calculate Attendance Details
                        var (status, clockIn, clockOut, lateMinutes, note) = CalculateAttendance(daily, recordDate);

                        if (existingAttMap.TryGetValue(key, out var existingRecord))
                        {
                            existingRecord.Status = status;
                            existingRecord.ClockIn = clockIn;
                            existingRecord.ClockOut = clockOut;
                            existingRecord.LateMinutes = lateMinutes;
                            existingRecord.Note = note;

                            attRepo.Update(existingRecord);
                            result.AttendanceRecordsUpdated++;
                        }
                        else
                        {
                            var newRecord = new AttendanceRecord
                            {
                                EmployeeId = employee.Id,
                                Date = recordDate,
                                Status = status,
                                ClockIn = clockIn,
                                ClockOut = clockOut,
                                LateMinutes = lateMinutes,
                                Note = note
                            };

                            await attRepo.AddAsync(newRecord, cancellationToken);
                            existingAttMap[key] = newRecord;
                            result.AttendanceRecordsCreated++;
                        }
                    }
                }

                await _unitOfWork.CompleteAsync(cancellationToken);

                result.Message = $"تمت معالجة تايم شيت '{parsed.DepartmentName}' بنجاح: تم تأسيس {result.EmployeesCreated} موظف جديد، وإنشاء {result.UserAccountsCreated} حساب مستخدم للدخول، ومطابقة {result.EmployeesMatched} موظف، مع إنشاء {result.AttendanceRecordsCreated} سجل حضور وتحديث {result.AttendanceRecordsUpdated} سجل.";
                return ApiResponse<UploadClinicTimesheetResultDto>.Ok(result, result.Message);
            });
        }

        private static (AttendanceStatus Status, DateTime? ClockIn, DateTime? ClockOut, int LateMinutes, string? Note)
            CalculateAttendance(ParsedClinicDailyRecord daily, DateTime date)
        {
            // Official shift start time: 09:00 AM
            DateTime officialStart = date.Date.AddHours(9);

            // Code 6: Friday (عطلة أسبوعية)
            if (daily.StatusCode == 6)
            {
                return (AttendanceStatus.Present, null, null, 0, "عطلة أسبوعية (الجمعة)");
            }

            // Code 3: Leave (أجازة)
            if (daily.StatusCode == 3)
            {
                return (AttendanceStatus.OnLeave, null, null, 0, "أجازة اعتيادية");
            }

            // Code 4: Sick Leave (مرضى)
            if (daily.StatusCode == 4)
            {
                return (AttendanceStatus.OnLeave, null, null, 0, "إجازة مرضية");
            }

            // Code 5: Umrah (عمرة)
            if (daily.StatusCode == 5)
            {
                return (AttendanceStatus.OnLeave, null, null, 0, "إجازة عمرة");
            }

            // Code 2: Joining (انضمام جديد)
            if (daily.StatusCode == 2)
            {
                return (AttendanceStatus.Present, officialStart, officialStart.AddHours(8), 0, "مباشرة عمل (Joining)");
            }

            // Regular work hours present
            if (daily.RegularFraction.HasValue && daily.RegularFraction.Value > 0)
            {
                double hours = daily.RegularFraction.Value * 24.0;
                int lateMin = 0;
                var status = AttendanceStatus.Present;
                DateTime clockIn = officialStart;

                // Check for cut / tardiness
                if (daily.CutFraction.HasValue && daily.CutFraction.Value > 0 && daily.CutFraction.Value < 0.25)
                {
                    lateMin = (int)Math.Round(daily.CutFraction.Value * 1440.0);
                    if (lateMin > 0)
                    {
                        status = AttendanceStatus.Late;
                        clockIn = officialStart.AddMinutes(lateMin);
                    }
                }

                DateTime clockOut = clockIn.AddHours(hours);

                string? note = null;
                if (daily.OvertimeFraction.HasValue && daily.OvertimeFraction.Value > 0)
                {
                    double otHours = Math.Round(daily.OvertimeFraction.Value * 24.0, 2);
                    note = $"إضافي: {otHours} ساعة";
                }

                return (status, clockIn, clockOut, lateMin, note);
            }

            // Absence (Code 1 or REG == 0 with full cut)
            string noteText = daily.StatusCode == 1
                ? "غياب (Absent)"
                : (string.IsNullOrWhiteSpace(daily.StatusText) ? "غياب بدون عذر" : daily.StatusText);

            return (AttendanceStatus.Absent, null, null, 0, noteText);
        }

        private static string NormalizeJobTitle(string? job)
        {
            if (string.IsNullOrWhiteSpace(job)) return "Staff";
            string clean = job.Trim();

            if (clean.Equals("nurse", StringComparison.OrdinalIgnoreCase)) return "Nurse";
            if (clean.Equals("receiption", StringComparison.OrdinalIgnoreCase)) return "Reception";
            if (clean.Equals("Securty", StringComparison.OrdinalIgnoreCase)) return "Security";
            if (clean.Equals("Formen", StringComparison.OrdinalIgnoreCase)) return "Foreman";
            if (clean.Equals("quality", StringComparison.OrdinalIgnoreCase)) return "Quality";
            if (clean.Equals("OM", StringComparison.OrdinalIgnoreCase)) return "Operations Manager";

            return clean;
        }

        private static string NormalizeName(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "";
            return Regex.Replace(name.Trim().ToLowerInvariant(), @"\s+", " ");
        }

        private static string GenerateUniqueEmail(string name, string badge, HashSet<string> existing)
        {
            string cleanName = Regex.Replace(name.ToLowerInvariant(), @"[^a-z0-9]", ".");
            cleanName = Regex.Replace(cleanName, @"\.+", ".").Trim('.');
            if (string.IsNullOrWhiteSpace(cleanName)) cleanName = "employee";

            string candidate = $"{cleanName}.{badge}@tclinic.local";
            int counter = 1;
            while (existing.Contains(candidate))
            {
                candidate = $"{cleanName}.{badge}.{counter++}@tclinic.local";
            }
            return candidate;
        }

        private static string GenerateSecurePassword()
        {
            const string upper = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
            const string lower = "abcdefghijkmnopqrstuvwxyz";
            const string digits = "0123456789";
            const string specials = "!@$?_-";
            const string allChars = upper + lower + digits + specials;

            var chars = new char[16];
            chars[0] = upper[RandomNumberGenerator.GetInt32(upper.Length)];
            chars[1] = lower[RandomNumberGenerator.GetInt32(lower.Length)];
            chars[2] = digits[RandomNumberGenerator.GetInt32(digits.Length)];
            chars[3] = specials[RandomNumberGenerator.GetInt32(specials.Length)];

            for (int i = 4; i < chars.Length; i++)
            {
                chars[i] = allChars[RandomNumberGenerator.GetInt32(allChars.Length)];
            }

            RandomNumberGenerator.Shuffle(chars.AsSpan());
            return new string(chars);
        }
    }
}
