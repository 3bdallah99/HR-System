using Appllication.Features.Attendance.Commands.UploadClinicTimesheet;
using ExcelDataReader;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text.Json;
using Xunit;

namespace Appllication.Tests.Attendance
{
    public class ClinicTimesheetParserTests
    {
        private const string RealFilePath = @"c:\Users\عبداللهانورابراهيماب\Desktop\9 sep 2026.xlsb";

        [Fact]
        public void Parse_RealClinicTimesheetXlsb_ParsesAll93EmployeesAndDaysSuccessfully()
        {
            if (!File.Exists(RealFilePath)) return;

            using var stream = new FileStream(RealFilePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            var result = ClinicTimesheetParser.Parse(stream);

            Assert.NotNull(result);
            Assert.Equal("T.CLINIC", result.DepartmentName);
            Assert.Equal(new DateTime(2026, 8, 26), result.StartDate);
            Assert.Equal(new DateTime(2026, 9, 25), result.EndDate);
            Assert.Equal(93, result.Employees.Count);
        }

        [Fact]
        public void Analyze_RealSheet_InDepth()
        {
            if (!File.Exists(RealFilePath)) return;

            System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

            // Check raw excel structure
            using var fileStream = new FileStream(RealFilePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            using var reader = ExcelReaderFactory.CreateReader(fileStream);
            var dataSet = reader.AsDataSet();
            var rawTable = dataSet.Tables[0];
            int totalExcelRows = rawTable.Rows.Count;
            int totalExcelColumns = rawTable.Columns.Count;

            fileStream.Position = 0;
            var parsed = ClinicTimesheetParser.Parse(fileStream);

            // Job categories
            var jobGroups = parsed.Employees
                .GroupBy(e => string.IsNullOrWhiteSpace(e.JobTitle) ? "Unspecified" : e.JobTitle)
                .Select(g => new { Job = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            // Daily records breakdown
            int totalDaysAcrossAll = 0;
            int daysWithWork = 0;
            int daysAbsent = 0;
            int daysLeave = 0;
            int daysFriday = 0;
            int daysCutDeduction = 0;
            double totalOvertimeHours = 0;

            foreach (var emp in parsed.Employees)
            {
                foreach (var d in emp.DailyRecords)
                {
                    totalDaysAcrossAll++;
                    if (d.RegularFraction.HasValue && d.RegularFraction.Value > 0)
                        daysWithWork++;
                    if (d.StatusCode == 1) // Absent
                        daysAbsent++;
                    if (d.StatusCode == 3 || d.StatusCode == 4 || d.StatusCode == 5) // Leave / Sick / Umrah
                        daysLeave++;
                    if (d.StatusCode == 6) // Friday / Off
                        daysFriday++;
                    if (d.CutFraction.HasValue && d.CutFraction.Value > 0)
                        daysCutDeduction++;
                    if (d.OvertimeFraction.HasValue && d.OvertimeFraction.Value > 0)
                        totalOvertimeHours += d.OvertimeFraction.Value * 24.0;
                }
            }

            var report = new
            {
                FileName = Path.GetFileName(RealFilePath),
                FileSizeBytes = new FileInfo(RealFilePath).Length,
                RawExcelDimensions = new
                {
                    TotalRowsInExcel = totalExcelRows,
                    TotalColumnsInExcel = totalExcelColumns,
                    HeaderRowsCount = 8,
                    EmployeeDataRowsCount = totalExcelRows - 8
                },
                ParsedTimesheet = new
                {
                    Title = parsed.Title,
                    Department = parsed.DepartmentName,
                    StartDate = parsed.StartDate.ToString("yyyy-MM-dd"),
                    EndDate = parsed.EndDate.ToString("yyyy-MM-dd"),
                    CycleTotalDays = (parsed.EndDate - parsed.StartDate).Days + 1,
                    TotalEmployees = parsed.Employees.Count
                },
                JobCategories = jobGroups,
                AggregatePunches = new
                {
                    TotalEvaluatedDays = totalDaysAcrossAll,
                    WorkingDaysCount = daysWithWork,
                    AbsentDaysCount = daysAbsent,
                    ApprovedLeaveDaysCount = daysLeave,
                    OffOrFridayDaysCount = daysFriday,
                    LateOrCutDaysCount = daysCutDeduction,
                    TotalOvertimeHours = Math.Round(totalOvertimeHours, 2)
                },
                SampleEmployees = parsed.Employees.Take(5).Select(e => new
                {
                    Badge = e.BadgeNumber,
                    Name = e.Name,
                    Job = e.JobTitle,
                    DaysCount = e.DailyRecords.Count,
                    WorkingDays = e.DailyRecords.Count(d => d.RegularFraction > 0),
                    AbsentDays = e.DailyRecords.Count(d => d.StatusCode == 1)
                })
            };

            var json = JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(@"E:\ITI\APIs\HR\sheet_analysis.json", json);
        }
    }
}
