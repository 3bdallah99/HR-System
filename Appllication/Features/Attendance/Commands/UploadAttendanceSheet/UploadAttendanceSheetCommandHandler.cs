using Appllication.Common;
using Appllication.Features.Attendance.Commands.UploadClinicTimesheet;
using ClosedXML.Excel;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Appllication.Features.Attendance.Commands.UploadAttendanceSheet
{
    public class UploadAttendanceSheetCommandHandler
        : IRequestHandler<UploadAttendanceSheetCommand, ApiResponse<UploadAttendanceSheetResultDto>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<UploadAttendanceSheetCommandHandler> _logger;
        private readonly ISender? _sender;
        private static readonly TimeSpan LateThreshold = new TimeSpan(9, 0, 0); // 09:00 AM

        public UploadAttendanceSheetCommandHandler(
            IUnitOfWork unitOfWork,
            ILogger<UploadAttendanceSheetCommandHandler> logger,
            ISender? sender = null)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _sender = sender;
        }

        public async Task<ApiResponse<UploadAttendanceSheetResultDto>> Handle(
            UploadAttendanceSheetCommand request, CancellationToken cancellationToken)
        {
            var result = new UploadAttendanceSheetResultDto();

            if (request.FileStream == null || request.FileStream.Length == 0)
            {
                return ApiResponse<UploadAttendanceSheetResultDto>.Fail("ملف الحضور المرفوع فارغ / Uploaded file is empty.");
            }

            var extension = Path.GetExtension(request.FileName).ToLowerInvariant();

            // Seamless auto-delegation if uploaded file is a clinic binary timesheet (.xlsb)
            if (extension == ".xlsb" && _sender != null)
            {
                var timesheetResult = await _sender.Send(
                    new UploadClinicTimesheetCommand(request.FileStream, request.FileName), cancellationToken);

                if (!timesheetResult.Success)
                {
                    return ApiResponse<UploadAttendanceSheetResultDto>.Fail(timesheetResult.Message ?? "Failed to process timesheet.");
                }

                var td = timesheetResult.Data;
                return ApiResponse<UploadAttendanceSheetResultDto>.Ok(new UploadAttendanceSheetResultDto
                {
                    TotalRows = td?.TotalEmployeesFound ?? 0,
                    ProcessedCount = td?.TotalEmployeesFound ?? 0,
                    CreatedCount = td?.AttendanceRecordsCreated ?? 0,
                    UpdatedCount = td?.AttendanceRecordsUpdated ?? 0,
                    FailedCount = td?.Errors.Count ?? 0,
                    Errors = td?.Errors.Select((err, idx) => new UploadRowErrorDto { RowIndex = idx + 1, Error = err }).ToList() ?? new(),
                    Message = timesheetResult.Message ?? ""
                }, timesheetResult.Message);
            }

            List<RawAttendanceRow> parsedRows;

            try
            {
                if (extension == ".xlsx" || extension == ".xls")
                {
                    parsedRows = ParseExcelStream(request.FileStream, result.Errors);
                }
                else if (extension == ".csv" || extension == ".txt" || extension == ".dat" || extension == ".tsv")
                {
                    parsedRows = ParseTextOrCsvStream(request.FileStream, result.Errors);
                }
                else
                {
                    return ApiResponse<UploadAttendanceSheetResultDto>.Fail(
                        $"صيغة الملف غير مدعومة ({extension}). يرجى رفع ملف بصيغة Excel (.xlsx) أو CSV (.csv).");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse attendance sheet file: {FileName}", request.FileName);
                return ApiResponse<UploadAttendanceSheetResultDto>.Fail($"فشل في قراءة ومعالجة الملف: {ex.Message}");
            }

            result.TotalRows = parsedRows.Count;
            if (parsedRows.Count == 0 && result.Errors.Count == 0)
            {
                return ApiResponse<UploadAttendanceSheetResultDto>.Fail("لم يتم العثور على أي صفوف صالحة للبيانات في الملف.");
            }

            var empRepo = _unitOfWork.GetRepository<Domain.Entities.Employee>();
            var attRepo = _unitOfWork.GetRepository<AttendanceRecord>();

            // Pre-load all active employees for efficient validation
            var allEmployees = await empRepo.GetAllAsync(cancellationToken);
            var empMap = allEmployees.ToDictionary(e => e.Id);

            // Group rows by EmployeeId and Date to handle multiple punches or distinct dates
            var groupedByEmpAndDate = parsedRows
                .Where(r => r.EmployeeId.HasValue && r.Date.HasValue)
                .GroupBy(r => new { EmpId = r.EmployeeId!.Value, Date = r.Date!.Value.Date })
                .ToList();

            // Batch-fetch all existing AttendanceRecord rows for distinct EmployeeIds and minDate..maxDate
            var existingRecordsMap = new Dictionary<(int EmpId, DateTime Date), AttendanceRecord>();
            if (groupedByEmpAndDate.Any())
            {
                var distinctEmpIds = groupedByEmpAndDate.Select(g => g.Key.EmpId).Distinct().ToList();
                var minDate = groupedByEmpAndDate.Min(g => g.Key.Date);
                var maxDate = groupedByEmpAndDate.Max(g => g.Key.Date);

                var existingRecords = await attRepo.FindAsync(
                    ar => distinctEmpIds.Contains(ar.EmployeeId) && ar.Date >= minDate && ar.Date <= maxDate,
                    cancellationToken);

                if (existingRecords != null)
                {
                    foreach (var rec in existingRecords)
                    {
                        existingRecordsMap[(rec.EmployeeId, rec.Date.Date)] = rec;
                    }
                }
            }

            foreach (var group in groupedByEmpAndDate)
            {
                int empId = group.Key.EmpId;
                DateTime recordDate = group.Key.Date;

                if (!empMap.TryGetValue(empId, out var employee))
                {
                    result.FailedCount += group.Count();
                    result.Errors.Add(new UploadRowErrorDto
                    {
                        RowIndex = group.First().RowIndex,
                        Identifier = empId.ToString(),
                        Error = $"الموظف بكود '{empId}' غير موجود بالنظام."
                    });
                    continue;
                }

                if (!employee.IsActive)
                {
                    result.FailedCount += group.Count();
                    result.Errors.Add(new UploadRowErrorDto
                    {
                        RowIndex = group.First().RowIndex,
                        Identifier = empId.ToString(),
                        Error = $"الموظف '{employee.Name}' (كود {empId}) غير نشط حالياً."
                    });
                    continue;
                }

                // Aggregate check-in and check-out
                DateTime? resolvedClockIn = null;
                DateTime? resolvedClockOut = null;
                string? combinedNote = null;
                AttendanceStatus? explicitStatus = null;

                foreach (var item in group)
                {
                    if (item.ClockIn.HasValue)
                    {
                        if (!resolvedClockIn.HasValue || item.ClockIn.Value < resolvedClockIn.Value)
                            resolvedClockIn = item.ClockIn.Value;
                    }

                    if (item.ClockOut.HasValue)
                    {
                        if (!resolvedClockOut.HasValue || item.ClockOut.Value > resolvedClockOut.Value)
                            resolvedClockOut = item.ClockOut.Value;
                    }

                    if (item.ExplicitStatus.HasValue)
                    {
                        explicitStatus = item.ExplicitStatus.Value;
                    }

                    if (!string.IsNullOrWhiteSpace(item.Note))
                    {
                        combinedNote = string.IsNullOrWhiteSpace(combinedNote)
                            ? item.Note
                            : $"{combinedNote} | {item.Note}";
                    }
                }

                // If only clock in or single punch exists without explicit clockout
                if (resolvedClockIn.HasValue && resolvedClockOut.HasValue && resolvedClockOut.Value < resolvedClockIn.Value)
                {
                    // Swap if times were reversed
                    var temp = resolvedClockIn;
                    resolvedClockIn = resolvedClockOut;
                    resolvedClockOut = temp;
                }

                // Determine Attendance Status and Late Minutes
                int lateMinutes = 0;
                AttendanceStatus status;

                if (explicitStatus.HasValue)
                {
                    status = explicitStatus.Value;
                    if (status == AttendanceStatus.Late && resolvedClockIn.HasValue && resolvedClockIn.Value.TimeOfDay > LateThreshold)
                    {
                        lateMinutes = (int)(resolvedClockIn.Value.TimeOfDay - LateThreshold).TotalMinutes;
                    }
                }
                else if (resolvedClockIn.HasValue)
                {
                    if (resolvedClockIn.Value.TimeOfDay <= LateThreshold)
                    {
                        status = AttendanceStatus.Present;
                        lateMinutes = 0;
                    }
                    else
                    {
                        status = AttendanceStatus.Late;
                        lateMinutes = (int)(resolvedClockIn.Value.TimeOfDay - LateThreshold).TotalMinutes;
                    }
                }
                else if (resolvedClockOut.HasValue)
                {
                    status = AttendanceStatus.Present;
                    lateMinutes = 0;
                }
                else
                {
                    status = AttendanceStatus.Absent;
                }

                // Check existing AttendanceRecord via O(1) in-memory lookup
                existingRecordsMap.TryGetValue((empId, recordDate), out var existingRecord);

                if (existingRecord != null)
                {
                    // Update record
                    if (resolvedClockIn.HasValue) existingRecord.ClockIn = resolvedClockIn;
                    if (resolvedClockOut.HasValue) existingRecord.ClockOut = resolvedClockOut;
                    existingRecord.Status = status;
                    existingRecord.LateMinutes = lateMinutes;
                    if (!string.IsNullOrWhiteSpace(combinedNote))
                    {
                        if (string.IsNullOrWhiteSpace(existingRecord.Note))
                        {
                            existingRecord.Note = combinedNote;
                        }
                        else if (!existingRecord.Note.Contains(combinedNote, StringComparison.OrdinalIgnoreCase))
                        {
                            existingRecord.Note = $"{existingRecord.Note}; {combinedNote}";
                        }
                    }

                    attRepo.Update(existingRecord);
                    result.UpdatedCount++;
                }
                else
                {
                    // Create new record
                    var newRecord = new AttendanceRecord
                    {
                        EmployeeId = empId,
                        Date = recordDate,
                        ClockIn = resolvedClockIn,
                        ClockOut = resolvedClockOut,
                        Status = status,
                        LateMinutes = lateMinutes,
                        Note = combinedNote ?? "Imported from attendance sheet"
                    };

                    await attRepo.AddAsync(newRecord, cancellationToken);
                    existingRecordsMap[(empId, recordDate)] = newRecord;
                    result.CreatedCount++;
                }

                result.ProcessedCount += group.Count();
            }

            // Also account for invalid rows that couldn't be grouped
            var invalidRows = parsedRows.Where(r => !r.EmployeeId.HasValue || !r.Date.HasValue).ToList();
            result.FailedCount += invalidRows.Count;

            await _unitOfWork.CompleteAsync(cancellationToken);

            result.Message = $"تمت معالجة الشيت بنجاح: تم إنشاء {result.CreatedCount} سجل، وتحديث {result.UpdatedCount} سجل، مع {result.FailedCount} خطأ.";
            return ApiResponse<UploadAttendanceSheetResultDto>.Ok(result, result.Message);
        }

        private static List<RawAttendanceRow> ParseExcelStream(Stream stream, List<UploadRowErrorDto> errors)
        {
            var rows = new List<RawAttendanceRow>();
            using var workbook = new XLWorkbook(stream);
            var worksheet = workbook.Worksheets.FirstOrDefault();

            if (worksheet == null) return rows;

            var range = worksheet.RangeUsed();
            if (range == null) return rows;

            var firstRow = worksheet.FirstRowUsed();
            if (firstRow == null) return rows;

            // Map header column indices
            var colMap = new Dictionary<string, int>();
            int colCount = range.ColumnCount();
            for (int col = 1; col <= colCount; col++)
            {
                var headerVal = firstRow.Cell(col).GetString()?.Trim().ToLowerInvariant() ?? "";
                var clean = CleanHeader(headerVal);
                if (!string.IsNullOrEmpty(clean) && !colMap.ContainsKey(clean))
                {
                    colMap[clean] = col;
                }
            }

            int empCol = FindColumn(colMap, "employeeid", "empid", "id", "userpin", "pin", "badgenumber", "كودالموظف", "رقمالموظف", "كود", "الرقمالوظيفي", "المعرف");
            int dateCol = FindColumn(colMap, "date", "attendancedate", "day", "workdate", "تاريخ", "التاريخ", "تاريخاليوم");
            int clockInCol = FindColumn(colMap, "clockin", "timein", "checkin", "intime", "دخول", "حضور", "وقتالحضور", "وقتالدخول");
            int clockOutCol = FindColumn(colMap, "clockout", "timeout", "checkout", "outtime", "خروج", "انصراف", "وقتالانصراف", "وقتالخروج");
            int punchTimeCol = FindColumn(colMap, "punchtime", "punchdatetime", "timestamp", "datetime", "time", "وقتالبصمة", "وقت");
            int inOutCol = FindColumn(colMap, "inoutmode", "inout", "mode", "state", "نوعالحركة", "الحركة");
            int statusCol = FindColumn(colMap, "status", "attendancestatus", "حالة", "الحالة", "حالةالحضور");
            int noteCol = FindColumn(colMap, "note", "notes", "remark", "remarks", "ملاحظات", "ملاحظة");

            int lastRowNumber = range.LastRow().RowNumber();

            for (int r = firstRow.RowNumber() + 1; r <= lastRowNumber; r++)
            {
                var row = worksheet.Row(r);
                if (row.IsEmpty()) continue;

                // Employee ID
                int? employeeId = null;
                string rawId = empCol > 0 ? GetCellValueAsString(row.Cell(empCol)) : "";
                if (int.TryParse(rawId, out int parsedId))
                {
                    employeeId = parsedId;
                }
                else
                {
                    errors.Add(new UploadRowErrorDto
                    {
                        RowIndex = r,
                        Identifier = rawId,
                        Error = $"كود الموظف غير صالح أو فارغ في الصف {r}."
                    });
                    continue;
                }

                // Date
                DateTime? dateVal = null;
                if (dateCol > 0)
                {
                    dateVal = ParseDateOrTime(row.Cell(dateCol));
                }

                // Single Punch mode vs Standard Attendance mode
                DateTime? clockIn = null;
                DateTime? clockOut = null;
                AttendanceStatus? explicitStatus = null;
                string? note = noteCol > 0 ? GetCellValueAsString(row.Cell(noteCol)) : null;

                if (punchTimeCol > 0)
                {
                    var punchDt = ParseDateOrTime(row.Cell(punchTimeCol));
                    if (punchDt.HasValue)
                    {
                        if (!dateVal.HasValue) dateVal = punchDt.Value.Date;
                        int ioMode = 0;
                        if (inOutCol > 0)
                        {
                            var ioStr = GetCellValueAsString(row.Cell(inOutCol)).ToLowerInvariant();
                            if (ioStr.Contains("out") || ioStr.Contains("خروج") || ioStr.Contains("انصراف") || ioStr == "1")
                                ioMode = 1;
                        }

                        if (ioMode == 1) clockOut = punchDt;
                        else clockIn = punchDt;
                    }
                }
                else
                {
                    if (clockInCol > 0)
                    {
                        var cell = row.Cell(clockInCol);
                        clockIn = ParseDateOrTime(cell);
                    }

                    if (clockOutCol > 0)
                    {
                        var cell = row.Cell(clockOutCol);
                        clockOut = ParseDateOrTime(cell);
                    }

                    if (statusCol > 0)
                    {
                        explicitStatus = ParseStatusString(GetCellValueAsString(row.Cell(statusCol)));
                    }
                }

                // If Date was not explicitly provided but ClockIn has full DateTime
                if (!dateVal.HasValue && clockIn.HasValue && clockIn.Value.Year > 2000)
                {
                    dateVal = clockIn.Value.Date;
                }
                else if (!dateVal.HasValue && clockOut.HasValue && clockOut.Value.Year > 2000)
                {
                    dateVal = clockOut.Value.Date;
                }

                if (!dateVal.HasValue)
                {
                    errors.Add(new UploadRowErrorDto
                    {
                        RowIndex = r,
                        Identifier = rawId,
                        Error = $"لم يتم تحديد تاريخ صالح في الصف {r}."
                    });
                    continue;
                }

                // Normalize ClockIn and ClockOut to match target date
                clockIn = CombineDateAndTime(dateVal.Value, clockIn);
                clockOut = CombineDateAndTime(dateVal.Value, clockOut);

                rows.Add(new RawAttendanceRow
                {
                    RowIndex = r,
                    EmployeeId = employeeId,
                    Date = dateVal.Value.Date,
                    ClockIn = clockIn,
                    ClockOut = clockOut,
                    ExplicitStatus = explicitStatus,
                    Note = note
                });
            }

            return rows;
        }

        private static List<RawAttendanceRow> ParseTextOrCsvStream(Stream stream, List<UploadRowErrorDto> errors)
        {
            var rows = new List<RawAttendanceRow>();
            using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
            string? headerLine = reader.ReadLine();
            if (string.IsNullOrWhiteSpace(headerLine)) return rows;

            // Detect delimiter: comma, semicolon, or tab
            char delimiter = ',';
            if (headerLine.Contains('\t')) delimiter = '\t';
            else if (headerLine.Contains(';') && !headerLine.Contains(',')) delimiter = ';';

            var headers = SplitCsvLine(headerLine, delimiter);
            var colMap = new Dictionary<string, int>();
            for (int i = 0; i < headers.Length; i++)
            {
                var clean = CleanHeader(headers[i]);
                if (!string.IsNullOrEmpty(clean) && !colMap.ContainsKey(clean))
                {
                    colMap[clean] = i;
                }
            }

            // Check if file is raw ZKTeco ATTLOG without column names (e.g. 101 \t 2026-10-01 08:30:00 ...)
            bool isHeaderlessAttlog = false;
            if (headers.Length >= 2 && int.TryParse(headers[0].Trim(), out _) &&
                (DateTime.TryParse(headers[1].Trim(), out _) || (headers.Length >= 3 && DateTime.TryParse($"{headers[1]} {headers[2]}", out _))))
            {
                isHeaderlessAttlog = true;
            }

            int empCol = FindColumn(colMap, "employeeid", "empid", "id", "userpin", "pin", "badgenumber", "كودالموظف", "رقمالموظف", "كود", "الرقمالوظيفي", "المعرف");
            int dateCol = FindColumn(colMap, "date", "attendancedate", "day", "workdate", "تاريخ", "التاريخ", "تاريخاليوم");
            int clockInCol = FindColumn(colMap, "clockin", "timein", "checkin", "intime", "دخول", "حضور", "وقتالحضور", "وقتالدخول");
            int clockOutCol = FindColumn(colMap, "clockout", "timeout", "checkout", "outtime", "خروج", "انصراف", "وقتالانصراف", "وقتالخروج");
            int punchTimeCol = FindColumn(colMap, "punchtime", "punchdatetime", "timestamp", "datetime", "time", "وقتالبصمة", "وقت");
            int inOutCol = FindColumn(colMap, "inoutmode", "inout", "mode", "state", "نوعالحركة", "الحركة");
            int statusCol = FindColumn(colMap, "status", "attendancestatus", "حالة", "الحالة", "حالةالحضور");
            int noteCol = FindColumn(colMap, "note", "notes", "remark", "remarks", "ملاحظات", "ملاحظة");

            int lineNumber = 1;

            if (isHeaderlessAttlog)
            {
                // Parse first line as data
                ParseAttlogLine(headerLine, lineNumber, delimiter, rows, errors);
            }

            string? line;
            while ((line = reader.ReadLine()) != null)
            {
                lineNumber++;
                if (string.IsNullOrWhiteSpace(line)) continue;

                if (isHeaderlessAttlog)
                {
                    ParseAttlogLine(line, lineNumber, delimiter, rows, errors);
                    continue;
                }

                var parts = SplitCsvLine(line, delimiter);
                if (parts.Length == 0) continue;

                // Employee ID
                string rawId = empCol >= 0 && empCol < parts.Length ? parts[empCol].Trim() : "";
                if (!int.TryParse(rawId, out int employeeId))
                {
                    errors.Add(new UploadRowErrorDto
                    {
                        RowIndex = lineNumber,
                        Identifier = rawId,
                        Error = $"كود الموظف غير صالح في السطر {lineNumber}."
                    });
                    continue;
                }

                DateTime? dateVal = null;
                if (dateCol >= 0 && dateCol < parts.Length)
                {
                    dateVal = ParseDateOrTimeString(parts[dateCol]);
                }

                DateTime? clockIn = null;
                DateTime? clockOut = null;
                AttendanceStatus? explicitStatus = null;
                string? note = noteCol >= 0 && noteCol < parts.Length ? parts[noteCol].Trim() : null;

                if (punchTimeCol >= 0 && punchTimeCol < parts.Length)
                {
                    var punchDt = ParseDateOrTimeString(parts[punchTimeCol]);
                    if (punchDt.HasValue)
                    {
                        if (!dateVal.HasValue) dateVal = punchDt.Value.Date;
                        int ioMode = 0;
                        if (inOutCol >= 0 && inOutCol < parts.Length)
                        {
                            var ioStr = parts[inOutCol].Trim().ToLowerInvariant();
                            if (ioStr.Contains("out") || ioStr.Contains("خروج") || ioStr.Contains("انصراف") || ioStr == "1")
                                ioMode = 1;
                        }
                        if (ioMode == 1) clockOut = punchDt;
                        else clockIn = punchDt;
                    }
                }
                else
                {
                    if (clockInCol >= 0 && clockInCol < parts.Length)
                    {
                        clockIn = ParseDateOrTimeString(parts[clockInCol]);
                    }
                    if (clockOutCol >= 0 && clockOutCol < parts.Length)
                    {
                        clockOut = ParseDateOrTimeString(parts[clockOutCol]);
                    }
                    if (statusCol >= 0 && statusCol < parts.Length)
                    {
                        explicitStatus = ParseStatusString(parts[statusCol]);
                    }
                }

                if (!dateVal.HasValue && clockIn.HasValue && clockIn.Value.Year > 2000)
                {
                    dateVal = clockIn.Value.Date;
                }
                else if (!dateVal.HasValue && clockOut.HasValue && clockOut.Value.Year > 2000)
                {
                    dateVal = clockOut.Value.Date;
                }

                if (!dateVal.HasValue)
                {
                    errors.Add(new UploadRowErrorDto
                    {
                        RowIndex = lineNumber,
                        Identifier = rawId,
                        Error = $"لم يتم تحديد تاريخ صالح في السطر {lineNumber}."
                    });
                    continue;
                }

                clockIn = CombineDateAndTime(dateVal.Value, clockIn);
                clockOut = CombineDateAndTime(dateVal.Value, clockOut);

                rows.Add(new RawAttendanceRow
                {
                    RowIndex = lineNumber,
                    EmployeeId = employeeId,
                    Date = dateVal.Value.Date,
                    ClockIn = clockIn,
                    ClockOut = clockOut,
                    ExplicitStatus = explicitStatus,
                    Note = note
                });
            }

            return rows;
        }

        private static void ParseAttlogLine(
            string line, int lineNumber, char delimiter, List<RawAttendanceRow> rows, List<UploadRowErrorDto> errors)
        {
            var parts = line.Split(new[] { '\t', ' ', ',' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 2) return;

            if (!int.TryParse(parts[0].Trim(), out int empId))
            {
                errors.Add(new UploadRowErrorDto
                {
                    RowIndex = lineNumber,
                    Identifier = parts[0],
                    Error = $"كود الموظف غير صالح في السطر {lineNumber}."
                });
                return;
            }

            DateTime punchTime = DateTime.MinValue;
            int inOutMode = 0;

            if (DateTime.TryParse(parts[1].Trim(), CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt) ||
                DateTime.TryParse(parts[1].Trim(), out dt))
            {
                punchTime = dt;
                if (parts.Length > 2 && int.TryParse(parts[2].Trim(), out int io)) inOutMode = io;
            }
            else if (parts.Length >= 3)
            {
                string combined = $"{parts[1].Trim()} {parts[2].Trim()}";
                if (DateTime.TryParse(combined, CultureInfo.InvariantCulture, DateTimeStyles.None, out dt) ||
                    DateTime.TryParse(combined, out dt))
                {
                    punchTime = dt;
                    if (parts.Length > 3 && int.TryParse(parts[3].Trim(), out int io)) inOutMode = io;
                }
            }

            if (punchTime == DateTime.MinValue)
            {
                errors.Add(new UploadRowErrorDto
                {
                    RowIndex = lineNumber,
                    Identifier = empId.ToString(),
                    Error = $"صيغة التاريخ والوقت غير صالحة في السطر {lineNumber}."
                });
                return;
            }

            rows.Add(new RawAttendanceRow
            {
                RowIndex = lineNumber,
                EmployeeId = empId,
                Date = punchTime.Date,
                ClockIn = inOutMode == 0 ? punchTime : null,
                ClockOut = inOutMode == 1 ? punchTime : null,
                Note = "Imported from raw biometric log"
            });
        }

        private static string CleanHeader(string h)
        {
            if (string.IsNullOrWhiteSpace(h)) return "";
            return h.Trim().ToLowerInvariant()
                .Replace(" ", "")
                .Replace("_", "")
                .Replace("-", "")
                .Replace(".", "")
                .Replace("/", "");
        }

        private static int FindColumn(Dictionary<string, int> colMap, params string[] candidates)
        {
            foreach (var c in candidates)
            {
                var clean = CleanHeader(c);
                if (colMap.TryGetValue(clean, out int idx))
                    return idx;
            }
            return -1;
        }

        private static string GetCellValueAsString(IXLCell cell)
        {
            if (cell.IsEmpty()) return "";
            return cell.GetString()?.Trim() ?? "";
        }

        private static DateTime? ParseDateOrTime(IXLCell cell)
        {
            if (cell.IsEmpty()) return null;

            try
            {
                if (cell.DataType == XLDataType.DateTime)
                {
                    return cell.GetDateTime();
                }

                if (cell.DataType == XLDataType.TimeSpan)
                {
                    var ts = cell.GetTimeSpan();
                    return DateTime.Today.Add(ts);
                }

                if (cell.DataType == XLDataType.Number)
                {
                    // Could be an Excel date serial number or time fraction
                    double val = cell.GetDouble();
                    if (val > 1000)
                    {
                        return DateTime.FromOADate(val);
                    }
                    else if (val >= 0 && val < 1)
                    {
                        // Time fraction of day
                        var ts = TimeSpan.FromDays(val);
                        return DateTime.Today.Add(ts);
                    }
                }
            }
            catch
            {
                // Fallback to string parsing below
            }

            return ParseDateOrTimeString(cell.GetString()?.Trim());
        }

        private static DateTime? ParseDateOrTimeString(string? str)
        {
            if (string.IsNullOrWhiteSpace(str)) return null;
            str = str.Trim();

            // Try standard Date / DateTime formats
            string[] formats =
            {
                "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm", "yyyy-MM-dd",
                "dd/MM/yyyy HH:mm:ss", "dd/MM/yyyy HH:mm", "dd/MM/yyyy",
                "MM/dd/yyyy HH:mm:ss", "MM/dd/yyyy HH:mm", "MM/dd/yyyy",
                "yyyy/MM/dd HH:mm:ss", "yyyy/MM/dd HH:mm", "yyyy/MM/dd",
                "HH:mm:ss", "HH:mm", "h:mm tt", "hh:mm tt"
            };

            if (DateTime.TryParseExact(str, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt) ||
                DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.None, out dt) ||
                DateTime.TryParse(str, out dt))
            {
                return dt;
            }

            if (TimeSpan.TryParse(str, CultureInfo.InvariantCulture, out var ts) ||
                TimeSpan.TryParse(str, out ts))
            {
                return DateTime.Today.Add(ts);
            }

            return null;
        }

        private static DateTime? CombineDateAndTime(DateTime date, DateTime? timeOrDt)
        {
            if (!timeOrDt.HasValue) return null;
            var timeOfDay = timeOrDt.Value.TimeOfDay;
            return date.Date.Add(timeOfDay);
        }

        private static AttendanceStatus? ParseStatusString(string? str)
        {
            if (string.IsNullOrWhiteSpace(str)) return null;
            var s = str.Trim().ToLowerInvariant();

            if (s.Contains("absent") || s.Contains("غائب") || s.Contains("غياب"))
                return AttendanceStatus.Absent;
            if (s.Contains("late") || s.Contains("متأخر") || s.Contains("تأخير"))
                return AttendanceStatus.Late;
            if (s.Contains("half") || s.Contains("نصف"))
                return AttendanceStatus.HalfDay;
            if (s.Contains("present") || s.Contains("حاضر") || s.Contains("حضور"))
                return AttendanceStatus.Present;

            return null;
        }

        private static string[] SplitCsvLine(string line, char delimiter)
        {
            var result = new List<string>();
            bool inQuotes = false;
            var current = new StringBuilder();

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];
                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == delimiter && !inQuotes)
                {
                    result.Add(current.ToString());
                    current.Clear();
                }
                else
                {
                    current.Append(c);
                }
            }

            result.Add(current.ToString());
            return result.ToArray();
        }

        private class RawAttendanceRow
        {
            public int RowIndex { get; set; }
            public int? EmployeeId { get; set; }
            public DateTime? Date { get; set; }
            public DateTime? ClockIn { get; set; }
            public DateTime? ClockOut { get; set; }
            public AttendanceStatus? ExplicitStatus { get; set; }
            public string? Note { get; set; }
        }
    }
}
