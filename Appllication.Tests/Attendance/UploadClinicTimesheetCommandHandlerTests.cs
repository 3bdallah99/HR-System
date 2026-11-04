using Appllication.Features.Attendance.Commands.UploadClinicTimesheet;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Appllication.Tests.Attendance
{
    public class UploadClinicTimesheetCommandHandlerTests
    {
        private const string RealFilePath = @"c:\Users\عبداللهانورابراهيماب\Desktop\9 sep 2026.xlsb";

        private readonly Mock<IUnitOfWork> _mockUow;
        private readonly Mock<IGenericRepository<Department>> _mockDeptRepo;
        private readonly Mock<IGenericRepository<Position>> _mockPosRepo;
        private readonly Mock<IGenericRepository<Employee>> _mockEmpRepo;
        private readonly Mock<IGenericRepository<AttendanceRecord>> _mockAttRepo;
        private readonly Mock<ILogger<UploadClinicTimesheetCommandHandler>> _mockLogger;

        private readonly List<Department> _departments = new();
        private readonly List<Position> _positions = new();
        private readonly List<Employee> _employees = new();
        private readonly List<AttendanceRecord> _attendanceRecords = new();

        public UploadClinicTimesheetCommandHandlerTests()
        {
            _mockUow = new Mock<IUnitOfWork>();
            _mockDeptRepo = new Mock<IGenericRepository<Department>>();
            _mockPosRepo = new Mock<IGenericRepository<Position>>();
            _mockEmpRepo = new Mock<IGenericRepository<Employee>>();
            _mockAttRepo = new Mock<IGenericRepository<AttendanceRecord>>();
            _mockLogger = new Mock<ILogger<UploadClinicTimesheetCommandHandler>>();

            _mockUow.Setup(u => u.GetRepository<Department>()).Returns(_mockDeptRepo.Object);
            _mockUow.Setup(u => u.GetRepository<Position>()).Returns(_mockPosRepo.Object);
            _mockUow.Setup(u => u.GetRepository<Employee>()).Returns(_mockEmpRepo.Object);
            _mockUow.Setup(u => u.GetRepository<AttendanceRecord>()).Returns(_mockAttRepo.Object);
            _mockUow.Setup(u => u.ExecuteInTransactionAsync(It.IsAny<Func<Task<Appllication.Common.ApiResponse<UploadClinicTimesheetResultDto>>>>()))
                .Returns<Func<Task<Appllication.Common.ApiResponse<UploadClinicTimesheetResultDto>>>>(func => func());

            int deptIdCounter = 1;
            _mockDeptRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => _departments);
            _mockDeptRepo.Setup(r => r.AddAsync(It.IsAny<Department>(), It.IsAny<CancellationToken>()))
                .Callback<Department, CancellationToken>((d, ct) => { d.Id = deptIdCounter++; _departments.Add(d); })
                .Returns(Task.CompletedTask);

            int posIdCounter = 1;
            _mockPosRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => _positions);
            _mockPosRepo.Setup(r => r.AddAsync(It.IsAny<Position>(), It.IsAny<CancellationToken>()))
                .Callback<Position, CancellationToken>((p, ct) => { p.Id = posIdCounter++; _positions.Add(p); })
                .Returns(Task.CompletedTask);

            int empIdCounter = 1;
            _mockEmpRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => _employees);
            _mockEmpRepo.Setup(r => r.AddAsync(It.IsAny<Employee>(), It.IsAny<CancellationToken>()))
                .Callback<Employee, CancellationToken>((e, ct) => { e.Id = empIdCounter++; _employees.Add(e); })
                .Returns(Task.CompletedTask);

            int attIdCounter = 1;
            _mockAttRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<AttendanceRecord, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => _attendanceRecords);
            _mockAttRepo.Setup(r => r.AddAsync(It.IsAny<AttendanceRecord>(), It.IsAny<CancellationToken>()))
                .Callback<AttendanceRecord, CancellationToken>((a, ct) => { a.Id = attIdCounter++; _attendanceRecords.Add(a); })
                .Returns(Task.CompletedTask);
        }

        [Fact]
        public async Task Handle_RealClinicFile_InitializesDepartmentsPositionsAndAllEmployeesWithAttendance()
        {
            if (!File.Exists(RealFilePath)) return;

            // Use FileShare.ReadWrite so it succeeds even if user has the file open in Excel
            using var stream = new FileStream(RealFilePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            var handler = new UploadClinicTimesheetCommandHandler(_mockUow.Object, _mockLogger.Object);
            var command = new UploadClinicTimesheetCommand(stream, "9 sep 2026.xlsb", AutoProvisionEmployees: true);

            var response = await handler.Handle(command, CancellationToken.None);

            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.Equal(93, response.Data.TotalEmployeesFound);
            Assert.Equal(93, response.Data.EmployeesCreated);
            Assert.True(response.Data.AttendanceRecordsCreated > 2000);

            // Assert Department created
            Assert.Contains(_departments, d => d.Name == "T.CLINIC");

            // Assert Positions created
            Assert.Contains(_positions, p => p.Title == "Doctor");
            Assert.Contains(_positions, p => p.Title == "Nurse");

            // Assert Employees created with BadgeNumber
            var doctorEman = _employees.FirstOrDefault(e => e.BadgeNumber == "1000");
            Assert.NotNull(doctorEman);
            Assert.Equal("Dr. Eman Fathy", doctorEman.Name);
            Assert.True(doctorEman.IsActive);

            // Assert Attendance Records saved
            var emanAttendance = _attendanceRecords.Where(a => a.EmployeeId == doctorEman.Id).ToList();
            Assert.Equal(31, emanAttendance.Count);
        }

        [Theory]
        [InlineData(3, AttendanceStatus.OnLeave, "أجازة اعتيادية")]
        [InlineData(4, AttendanceStatus.OnLeave, "إجازة مرضية")]
        [InlineData(5, AttendanceStatus.OnLeave, "إجازة عمرة")]
        [InlineData(1, AttendanceStatus.Absent, "غياب (Absent)")]
        public void CalculateAttendance_LeaveAndAbsenceCodes_ReturnsCorrectStatusAndNote(
            int statusCode, AttendanceStatus expectedStatus, string expectedNote)
        {
            var daily = new ParsedClinicDailyRecord
            {
                DayNumber = 1,
                Date = new DateTime(2026, 9, 1),
                StatusCode = statusCode
            };

            var method = typeof(UploadClinicTimesheetCommandHandler).GetMethod(
                "CalculateAttendance",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);

            Assert.NotNull(method);
            var result = method.Invoke(null, new object[] { daily, new DateTime(2026, 9, 1) });
            Assert.NotNull(result);

            var tuple = ((AttendanceStatus Status, DateTime? ClockIn, DateTime? ClockOut, int LateMinutes, string? Note))result;
            Assert.Equal(expectedStatus, tuple.Status);
            Assert.Equal(expectedNote, tuple.Note);
        }
    }
}
