using System;

namespace Domain.Entities
{
    public class DeviceAttendanceLog
    {
        public int Id { get; set; }
        public string DeviceSerial { get; set; } = string.Empty;
        public string UserPin { get; set; } = string.Empty;
        public DateTime PunchTime { get; set; }
        public int VerifyMode { get; set; }
        public int InOutMode { get; set; }
        public string? WorkCode { get; set; }
        public string? RawData { get; set; }
        public bool IsProcessed { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;

        public int? EmployeeId { get; set; }
        public Employee? Employee { get; set; }
    }
}
