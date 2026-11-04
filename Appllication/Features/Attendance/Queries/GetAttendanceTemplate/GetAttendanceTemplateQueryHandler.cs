using ClosedXML.Excel;
using MediatR;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Appllication.Features.Attendance.Queries.GetAttendanceTemplate
{
    public class GetAttendanceTemplateQueryHandler
        : IRequestHandler<GetAttendanceTemplateQuery, AttendanceTemplateDto>
    {
        public Task<AttendanceTemplateDto> Handle(
            GetAttendanceTemplateQuery request, CancellationToken cancellationToken)
        {
            var isCsv = request.Format?.Trim().ToLowerInvariant() == "csv";

            if (isCsv)
            {
                return Task.FromResult(GenerateCsvTemplate());
            }

            return Task.FromResult(GenerateExcelTemplate());
        }

        private static AttendanceTemplateDto GenerateExcelTemplate()
        {
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Attendance Template");

            // Header Row
            string[] headers =
            {
                "EmployeeId",
                "EmployeeName",
                "Date",
                "ClockIn",
                "ClockOut",
                "Status",
                "Notes"
            };

            for (int i = 0; i < headers.Length; i++)
            {
                var cell = ws.Cell(1, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Font.FontColor = XLColor.White;
                cell.Style.Fill.BackgroundColor = XLColor.FromArgb(30, 58, 138); // Deep Blue
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            }

            // Sample Rows
            object[][] sampleRows =
            {
                new object[] { 1, "Ahmed Ali", "2026-10-01", "08:45", "17:05", "Present", "On time" },
                new object[] { 2, "Sara Mohamed", "2026-10-01", "09:25", "17:00", "Late", "Late by 25 mins" },
                new object[] { 3, "Mohamed Ibrahim", "2026-10-01", "", "", "Absent", "Unexcused absence" },
                new object[] { 4, "Mona Mahmoud", "2026-10-01", "08:50", "13:30", "HalfDay", "Approved half day" }
            };

            for (int r = 0; r < sampleRows.Length; r++)
            {
                for (int c = 0; c < sampleRows[r].Length; c++)
                {
                    var cell = ws.Cell(r + 2, c + 1);
                    cell.Value = sampleRows[r][c]?.ToString() ?? "";
                    cell.Style.Alignment.Horizontal = (c == 0 || c == 2 || c == 3 || c == 4)
                        ? XLAlignmentHorizontalValues.Center
                        : XLAlignmentHorizontalValues.Left;
                }
            }

            // Column width auto-fit
            ws.Columns().AdjustToContents();
            ws.Row(1).Height = 26;

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);

            return new AttendanceTemplateDto
            {
                FileContent = stream.ToArray(),
                ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                FileName = "Attendance_Import_Template.xlsx"
            };
        }

        private static AttendanceTemplateDto GenerateCsvTemplate()
        {
            var sb = new StringBuilder();
            sb.AppendLine("EmployeeId,EmployeeName,Date,ClockIn,ClockOut,Status,Notes");
            sb.AppendLine("1,Ahmed Ali,2026-10-01,08:45,17:05,Present,On time");
            sb.AppendLine("2,Sara Mohamed,2026-10-01,09:25,17:00,Late,Late by 25 mins");
            sb.AppendLine("3,Mohamed Ibrahim,2026-10-01,,,Absent,Unexcused absence");
            sb.AppendLine("4,Mona Mahmoud,2026-10-01,08:50,13:30,HalfDay,Approved half day");

            // UTF8 with BOM so Excel opens Arabic / special chars seamlessly
            var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();

            return new AttendanceTemplateDto
            {
                FileContent = bytes,
                ContentType = "text/csv; charset=utf-8",
                FileName = "Attendance_Import_Template.csv"
            };
        }
    }
}
