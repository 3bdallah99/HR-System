using System.Collections.Generic;

namespace Appllication.Features.Attendance.Commands.UploadAttendanceSheet
{
    public class UploadAttendanceSheetResultDto
    {
        public int TotalRows { get; set; }
        public int ProcessedCount { get; set; }
        public int CreatedCount { get; set; }
        public int UpdatedCount { get; set; }
        public int FailedCount { get; set; }
        public List<UploadRowErrorDto> Errors { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }

    public class UploadRowErrorDto
    {
        public int RowIndex { get; set; }
        public string? Identifier { get; set; }
        public string Error { get; set; } = string.Empty;
    }
}
