using Appllication.Features.Attendance.Commands.ProcessDevicePunch;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.Extensions.Logging;
using Moq;
using System.Linq.Expressions;
using Xunit;

namespace Appllication.Tests.Attendance
{
    public class ProcessDevicePunchesCommandHandlerTests
    {
        private readonly Mock<IUnitOfWork> _mockUow;
        private readonly Mock<IGenericRepository<Employee>> _mockEmpRepo;
        private readonly Mock<IGenericRepository<AttendanceRecord>> _mockAttRepo;
        private readonly Mock<IGenericRepository<DeviceAttendanceLog>> _mockLogRepo;
        private readonly Mock<ILogger<ProcessDevicePunchesCommandHandler>> _mockLogger;
        private readonly ProcessDevicePunchesCommandHandler _handler;

        public ProcessDevicePunchesCommandHandlerTests()
        {
            _mockUow = new Mock<IUnitOfWork>();
            _mockEmpRepo = new Mock<IGenericRepository<Employee>>();
            _mockAttRepo = new Mock<IGenericRepository<AttendanceRecord>>();
            _mockLogRepo = new Mock<IGenericRepository<DeviceAttendanceLog>>();
            _mockLogger = new Mock<ILogger<ProcessDevicePunchesCommandHandler>>();

            _mockUow.Setup(u => u.GetRepository<Employee>()).Returns(_mockEmpRepo.Object);
            _mockUow.Setup(u => u.GetRepository<AttendanceRecord>()).Returns(_mockAttRepo.Object);
            _mockUow.Setup(u => u.GetRepository<DeviceAttendanceLog>()).Returns(_mockLogRepo.Object);

            _handler = new ProcessDevicePunchesCommandHandler(_mockUow.Object, _mockLogger.Object);
        }

        [Fact]
        public async Task Handle_EmptyPayload_ReturnsOkZeroProcessed()
        {
            var command = new ProcessDevicePunchesCommand("SN123", "ATTLOG", "");
            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.True(result.Success);
            Assert.Equal(0, result.Data);
        }

        [Fact]
        public async Task Handle_ValidCheckIn_CreatesAttendanceRecordAndMarksProcessed()
        {
            // Employee with ID 10 exists and is active
            var employee = new Employee { Id = 10, Name = "Ahmed Ali", IsActive = true };
            _mockEmpRepo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
                        .ReturnsAsync(employee);

            // No existing attendance record for today
            _mockAttRepo.Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<AttendanceRecord, bool>>>(), It.IsAny<CancellationToken>()))
                        .ReturnsAsync((AttendanceRecord?)null);

            // Punch line: PIN=10, Time=2026-09-30 08:30:00, InOut=0 (ClockIn), Verify=15 (Face)
            string payload = "10\t2026-09-30 08:30:00\t0\t15\t0";
            var command = new ProcessDevicePunchesCommand("UF800_001", "ATTLOG", payload);

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.True(result.Success);
            Assert.Equal(1, result.Data);

            // Verifies AttendanceRecord was added with Present status (since 08:30 <= 09:00)
            _mockAttRepo.Verify(r => r.AddAsync(
                It.Is<AttendanceRecord>(ar =>
                    ar.EmployeeId == 10 &&
                    ar.Status == AttendanceStatus.Present &&
                    ar.ClockIn == new DateTime(2026, 9, 30, 8, 30, 0)),
                It.IsAny<CancellationToken>()), Times.Once);

            // Verifies DeviceAttendanceLog was created and marked as processed
            _mockLogRepo.Verify(r => r.AddAsync(
                It.Is<DeviceAttendanceLog>(log =>
                    log.UserPin == "10" &&
                    log.EmployeeId == 10 &&
                    log.IsProcessed &&
                    log.DeviceSerial == "UF800_001"),
                It.IsAny<CancellationToken>()), Times.Once);

            _mockUow.Verify(u => u.CompleteAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Handle_ValidCheckOut_UpdatesExistingRecordClockOut()
        {
            var employee = new Employee { Id = 10, Name = "Ahmed Ali", IsActive = true };
            _mockEmpRepo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
                        .ReturnsAsync(employee);

            // Existing record with ClockIn at 08:30
            var existingRecord = new AttendanceRecord
            {
                Id = 1,
                EmployeeId = 10,
                Date = new DateTime(2026, 9, 30),
                ClockIn = new DateTime(2026, 9, 30, 8, 30, 0),
                Status = AttendanceStatus.Present
            };

            _mockAttRepo.Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<AttendanceRecord, bool>>>(), It.IsAny<CancellationToken>()))
                        .ReturnsAsync(existingRecord);

            // Punch line: PIN=10, Time=2026-09-30 17:05:00, InOut=1 (ClockOut), Verify=15
            string payload = "10\t2026-09-30 17:05:00\t1\t15\t0";
            var command = new ProcessDevicePunchesCommand("UF800_001", "ATTLOG", payload);

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.True(result.Success);
            Assert.Equal(1, result.Data);
            Assert.Equal(new DateTime(2026, 9, 30, 17, 5, 0), existingRecord.ClockOut);

            _mockAttRepo.Verify(r => r.Update(existingRecord), Times.Once);
        }

        [Fact]
        public async Task Handle_UnknownEmployee_StoresLogWithErrorMessage()
        {
            // Employee with ID 999 does not exist
            _mockEmpRepo.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
                        .ReturnsAsync((Employee?)null);

            string payload = "999\t2026-09-30 08:45:00\t0\t1\t0";
            var command = new ProcessDevicePunchesCommand("UF800_001", "ATTLOG", payload);

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.True(result.Success);
            Assert.Equal(0, result.Data);

            _mockLogRepo.Verify(r => r.AddAsync(
                It.Is<DeviceAttendanceLog>(log =>
                    log.UserPin == "999" &&
                    !log.IsProcessed &&
                    log.ErrorMessage != null &&
                    log.ErrorMessage.Contains("not found")),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Handle_MultiplePunches_ProcessesAllSuccessfully()
        {
            var emp1 = new Employee { Id = 1, Name = "User 1", IsActive = true };
            var emp2 = new Employee { Id = 2, Name = "User 2", IsActive = true };

            _mockEmpRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(emp1);
            _mockEmpRepo.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(emp2);

            _mockAttRepo.Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<AttendanceRecord, bool>>>(), It.IsAny<CancellationToken>()))
                        .ReturnsAsync((AttendanceRecord?)null);

            string payload = "1\t2026-09-30 08:30:00\t0\t15\t0\r\n2\t2026-09-30 09:15:00\t0\t1\t0";
            var command = new ProcessDevicePunchesCommand("UF800_001", "ATTLOG", payload);

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.True(result.Success);
            Assert.Equal(2, result.Data);
            _mockAttRepo.Verify(r => r.AddAsync(It.IsAny<AttendanceRecord>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
            _mockLogRepo.Verify(r => r.AddAsync(It.IsAny<DeviceAttendanceLog>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        }
    }
}
