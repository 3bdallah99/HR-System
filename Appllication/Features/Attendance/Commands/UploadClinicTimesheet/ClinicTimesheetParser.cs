using ExcelDataReader;
using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

namespace Appllication.Features.Attendance.Commands.UploadClinicTimesheet
{
    public static class ClinicTimesheetParser
    {
        static ClinicTimesheetParser()
        {
            // Ensure legacy encodings (e.g. Windows-1256, 1252) are registered for ExcelDataReader
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        }

        public static ParsedClinicTimesheet Parse(Stream stream)
        {
            var timesheet = new ParsedClinicTimesheet();

            using var reader = ExcelReaderFactory.CreateReader(stream);
            var dataSet = reader.AsDataSet();

            if (dataSet.Tables.Count == 0)
            {
                throw new InvalidOperationException("الملف المرفوع لا يحتوي على أي صفحات بيانات (Sheets).");
            }

            // Find sheet '0000' or fallback to the sheet with maximum columns/rows
            DataTable? table = null;
            foreach (DataTable t in dataSet.Tables)
            {
                if (t.TableName.Trim() == "0000")
                {
                    table = t;
                    break;
                }
            }

            if (table == null)
            {
                // Fallback to table with highest column count
                DataTable? best = null;
                foreach (DataTable t in dataSet.Tables)
                {
                    if (best == null || t.Columns.Count > best.Columns.Count)
                    {
                        best = t;
                    }
                }
                table = best ?? dataSet.Tables[0];
            }

            if (table.Rows.Count < 9)
            {
                throw new InvalidOperationException("صفحة التايم شيت لا تحتوي على صفوف كافية للبيانات.");
            }

            // 1. Parse Title and Date Range (typically row 5, or search rows 0-7)
            DateTime startDate = DateTime.MinValue;
            DateTime endDate = DateTime.MinValue;
            string titleText = string.Empty;

            for (int r = 0; r < Math.Min(8, table.Rows.Count); r++)
            {
                var row = table.Rows[r];
                for (int c = 0; c < table.Columns.Count; c++)
                {
                    var cellStr = row[c]?.ToString();
                    if (!string.IsNullOrWhiteSpace(cellStr) && (cellStr.Contains("تايم شيت") || cellStr.Contains("/") || cellStr.Contains("حتي")))
                    {
                        var dates = ExtractDates(cellStr);
                        if (dates.Count >= 2)
                        {
                            startDate = dates[0];
                            endDate = dates[1];
                            titleText = cellStr.Trim();
                            break;
                        }
                    }
                }
                if (startDate != DateTime.MinValue) break;
            }

            // Validate extracted dates - fail fast if header date range could not be parsed
            if (startDate == DateTime.MinValue || endDate == DateTime.MinValue)
            {
                throw new InvalidOperationException("تعذر استخراج نطاق التواريخ من ترويسة ملف التايم شيت (مثال: 'من 26/08/2026 حتي 25/09/2026'). يرجى التأكد من احتواء الملف على ترويسة صالحة تتضمن تاريخ البداية والنهاية.");
            }

            if (startDate > endDate)
            {
                var temp = startDate;
                startDate = endDate;
                endDate = temp;
            }

            timesheet.Title = string.IsNullOrWhiteSpace(titleText)
                ? $"تايم شيت من {startDate:dd/MM/yyyy} حتي {endDate:dd/MM/yyyy}"
                : titleText;
            timesheet.StartDate = startDate;
            timesheet.EndDate = endDate;

            // 2. Identify Day Column Groups from Row 6 (Days) and Row 7 (Subheaders)
            // If row 6 has days and row 7 has subheaders:
            int dayRowIndex = 6;
            int subheaderRowIndex = 7;

            // Verify if row 6 has day numbers
            var r6 = table.Rows[dayRowIndex];
            var r7 = table.Rows[subheaderRowIndex];

            // Build map of ColumnIndex -> (DayNumber, Subheader)
            var dayColumns = new List<DayColumnDef>();
            int currentYear = startDate.Year;
            int currentMonth = startDate.Month;
            int previousDay = -1;

            for (int c = 8; c < table.Columns.Count; c++)
            {
                var dayVal = r6[c];
                var subVal = r7[c]?.ToString()?.Trim()?.ToLowerInvariant() ?? "";

                if (dayVal != null && int.TryParse(dayVal.ToString()?.Trim(), out int dayNum) && dayNum >= 1 && dayNum <= 31)
                {
                    // Detect month increment when day resets (e.g. 31 -> 1)
                    if (previousDay != -1 && dayNum < previousDay)
                    {
                        currentMonth++;
                        if (currentMonth > 12)
                        {
                            currentMonth = 1;
                            currentYear++;
                        }
                    }
                    previousDay = dayNum;

                    int daysInCurrentMonth = DateTime.DaysInMonth(currentYear, currentMonth);
                    int resolvedDay = Math.Min(dayNum, daysInCurrentMonth);
                    var cellDate = new DateTime(currentYear, currentMonth, resolvedDay);

                    dayColumns.Add(new DayColumnDef
                    {
                        ColumnIndex = c,
                        DayNumber = dayNum,
                        Date = cellDate,
                        Subheader = subVal
                    });
                }
            }

            // 3. Parse Employees (Row 8 onwards)
            string detectedDepartment = "T.CLINIC";

            for (int r = 8; r < table.Rows.Count; r++)
            {
                var row = table.Rows[r];

                var badgeRaw = row[2]?.ToString()?.Trim();
                var nameRaw = row[3]?.ToString()?.Trim();

                if (string.IsNullOrWhiteSpace(badgeRaw) && string.IsNullOrWhiteSpace(nameRaw))
                    continue;

                // Normalize BadgeNumber (strip decimals if stored as 1000.0)
                string badge = badgeRaw ?? "";
                if (double.TryParse(badge, NumberStyles.Any, CultureInfo.InvariantCulture, out double bNum))
                {
                    badge = ((long)bNum).ToString();
                }

                if (string.IsNullOrWhiteSpace(badge) || string.IsNullOrWhiteSpace(nameRaw))
                    continue;

                var project = row[1]?.ToString()?.Trim() ?? "";
                if (!string.IsNullOrWhiteSpace(project))
                {
                    detectedDepartment = project;
                }

                var job = row[4]?.ToString()?.Trim() ?? "";
                var iqama = row[5]?.ToString()?.Trim();
                var notes = row[6]?.ToString()?.Trim();
                var nationality = row[7]?.ToString()?.Trim();

                var emp = new ParsedClinicEmployee
                {
                    SerialNumber = double.TryParse(row[0]?.ToString(), out double sn) ? sn : null,
                    Project = project,
                    BadgeNumber = badge,
                    Name = nameRaw,
                    JobTitle = string.IsNullOrWhiteSpace(job) ? "Staff" : job,
                    Iqama = iqama,
                    Notes = notes,
                    Nationality = nationality
                };

                // Group daily columns by Date
                var dailyGroup = new Dictionary<DateTime, ParsedClinicDailyRecord>();

                foreach (var colDef in dayColumns)
                {
                    if (!dailyGroup.TryGetValue(colDef.Date, out var dailyRec))
                    {
                        dailyRec = new ParsedClinicDailyRecord
                        {
                            Date = colDef.Date,
                            DayNumber = colDef.DayNumber
                        };
                        dailyGroup[colDef.Date] = dailyRec;
                    }

                    var cellVal = row[colDef.ColumnIndex];
                    if (cellVal == null || cellVal == DBNull.Value) continue;

                    string sub = colDef.Subheader;
                    if (sub.Contains("reg"))
                    {
                        var regFraction = ParseTimeFraction(cellVal);
                        if (regFraction.HasValue)
                            dailyRec.RegularFraction = regFraction.Value;
                    }
                    else if (sub.Contains("ot"))
                    {
                        var otFraction = ParseTimeFraction(cellVal);
                        if (otFraction.HasValue)
                            dailyRec.OvertimeFraction = otFraction.Value;
                    }
                    else if (sub.Contains("cut"))
                    {
                        var cutFraction = ParseTimeFraction(cellVal);
                        if (cutFraction.HasValue)
                            dailyRec.CutFraction = cutFraction.Value;
                    }
                    else if (sub.Contains("وصف") || sub.Contains("code") || sub.Contains("note") || sub.Contains("حالة"))
                    {
                        if (int.TryParse(cellVal.ToString(), out int codeVal))
                        {
                            dailyRec.StatusCode = codeVal;
                        }
                        else if (double.TryParse(cellVal.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out double dCode))
                        {
                            dailyRec.StatusCode = (int)dCode;
                        }
                        else
                        {
                            dailyRec.StatusText = cellVal.ToString()?.Trim();
                        }
                    }
                }

                emp.DailyRecords.AddRange(dailyGroup.Values);

                // Check for totals columns at end if available
                if (table.Columns.Count > 132)
                {
                    var basicFrac = ParseTimeFraction(row[132]);
                    if (basicFrac.HasValue) emp.TotalBasicHours = basicFrac.Value * 24;
                }
                if (table.Columns.Count > 133)
                {
                    var otFrac = ParseTimeFraction(row[133]);
                    if (otFrac.HasValue) emp.TotalOvertimeHours = otFrac.Value * 24;
                }
                if (table.Columns.Count > 134)
                {
                    var netFrac = ParseTimeFraction(row[134]);
                    if (netFrac.HasValue) emp.NetHours = netFrac.Value * 24;
                }

                timesheet.Employees.Add(emp);
            }

            timesheet.DepartmentName = detectedDepartment;
            return timesheet;
        }

        private static double? ParseTimeFraction(object? cellVal)
        {
            if (cellVal == null || cellVal == DBNull.Value) return null;
            if (cellVal is TimeSpan ts) return ts.TotalDays;
            if (cellVal is DateTime dt) return dt.TimeOfDay.TotalDays;
            var str = cellVal.ToString()?.Trim();
            if (string.IsNullOrEmpty(str)) return null;
            if (TimeSpan.TryParse(str, out var parsedTs)) return parsedTs.TotalDays;
            if (double.TryParse(str, NumberStyles.Any, CultureInfo.InvariantCulture, out double dVal)) return dVal;
            return null;
        }

        private static List<DateTime> ExtractDates(string text)
        {
            var dates = new List<DateTime>();
            var regex = new Regex(@"\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b");
            var matches = regex.Matches(text);

            foreach (Match m in matches)
            {
                if (DateTime.TryParseExact(m.Value, new[] { "dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "yyyy/MM/dd" },
                    CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
                {
                    dates.Add(dt);
                }
            }

            return dates;
        }

        private class DayColumnDef
        {
            public int ColumnIndex { get; set; }
            public int DayNumber { get; set; }
            public DateTime Date { get; set; }
            public string Subheader { get; set; } = string.Empty;
        }
    }
}
