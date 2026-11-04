using Appllication.Features.Attendance.Commands.UploadAttendanceSheet;
using Appllication.Features.Attendance.Queries.GetAttendanceTemplate;
using ClosedXML.Excel;
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
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Appllication.Tests.Attendance
{
    public class UploadAttendanceSheetCommandHandlerTests
    {
        private readonly Mock<IUnitOfWork> _mockUow;
        private readonly Mock<IGenericRepository<Employee>> _mockEmpRepo;
        private readonly Mock<IGenericRepository<AttendanceRecord>> _mockAttRepo;
        private readonly Mock<ILogger<UploadAttendanceSheetCommandHandler>> _mockLogger;
        private readonly UploadAttendanceSheetCommandHandler _handler;

        public UploadAttendanceSheetCommandHandlerTests()
        {
            _mockUow = new Mock<IUnitOfWork>();
            _mockEmpRepo = new Mock<IGenericRepository<Employee>>();
            _mockAttRepo = new Mock<IGenericRepository<AttendanceRecord>>();
            _mockLogger = new Mock<ILogger<UploadAttendanceSheetCommandHandler>>();

            _mockUow.Setup(u => u.GetRepository<Employee>()).Returns(_mockEmpRepo.Object);
            _mockUow.Setup(u => u.GetRepository<AttendanceRecord>()).Returns(_mockAttRepo.Object);
            _mockAttRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<AttendanceRecord, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<AttendanceRecord>());

            _handler = new UploadAttendanceSheetCommandHandler(_mockUow.Object, _mockLogger.Object);
        }

        [Fact]
        public async Task Handle_ValidCsvSheet_CreatesAttendanceRecordsSuccessfully()
        {
            // Arrange
            var emp1 = new Employee { Id = 1, Name = "Ahmed Ali", IsActive = true };
            var emp2 = new Employee { Id = 2, Name = "Sara Mohamed", IsActive = true };

            _mockEmpRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<Employee> { emp1, emp2 });

            _mockAttRepo.Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<AttendanceRecord, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((AttendanceRecord?)null);

            var csvContent = new StringBuilder();
            csvContent.AppendLine("EmployeeId,Date,ClockIn,ClockOut,Notes");
            csvContent.AppendLine("1,2026-10-01,08:45,17:05,On time");
            csvContent.AppendLine("2,2026-10-01,09:25,17:00,Late arrival");

            using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csvContent.ToString()));
            var command = new UploadAttendanceSheetCommand(stream, "attendance.csv");

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal(2, result.Data.TotalRows);
            Assert.Equal(2, result.Data.CreatedCount);
            Assert.Equal(0, result.Data.FailedCount);
            _mockAttRepo.Verify(r => r.AddAsync(It.Is<AttendanceRecord>(a => a.EmployeeId == 1 && a.Status == AttendanceStatus.Present && a.LateMinutes == 0), It.IsAny<CancellationToken>()), Times.Once);
            _mockAttRepo.Verify(r => r.AddAsync(It.Is<AttendanceRecord>(a => a.EmployeeId == 2 && a.Status == AttendanceStatus.Late && a.LateMinutes == 25), It.IsAny<CancellationToken>()), Times.Once);
            _mockUow.Verify(u => u.CompleteAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Handle_ValidExcelSheet_ProcessesRecordsCorrectly()
        {
            // Arrange
            var emp1 = new Employee { Id = 1, Name = "Ahmed Ali", IsActive = true };
            _mockEmpRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<Employee> { emp1 });

            _mockAttRepo.Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<AttendanceRecord, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((AttendanceRecord?)null);

            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Sheet1");
            ws.Cell(1, 1).Value = "EmployeeId";
            ws.Cell(1, 2).Value = "Date";
            ws.Cell(1, 3).Value = "ClockIn";
            ws.Cell(1, 4).Value = "ClockOut";

            ws.Cell(2, 1).Value = 1;
            ws.Cell(2, 2).Value = "2026-10-01";
            ws.Cell(2, 3).Value = "08:50";
            ws.Cell(2, 4).Value = "17:00";

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            var command = new UploadAttendanceSheetCommand(stream, "attendance.xlsx");

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal(1, result.Data.CreatedCount);
            Assert.Equal(0, result.Data.FailedCount);
        }

        [Fact]
        public async Task Handle_UnknownEmployee_RecordsErrorAndContinues()
        {
            // Arrange
            _mockEmpRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<Employee>()); // No employees in DB

            var csvContent = "EmployeeId,Date,ClockIn,ClockOut\n999,2026-10-01,08:30,17:00\n";
            using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csvContent));
            var command = new UploadAttendanceSheetCommand(stream, "test.csv");

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal(1, result.Data.FailedCount);
            Assert.Equal(0, result.Data.CreatedCount);
            Assert.Single(result.Data.Errors);
            Assert.Contains("999", result.Data.Errors[0].Error);
        }

        [Fact]
        public async Task TemplateQuery_ReturnsValidExcelAndCsvTemplates()
        {
            var handler = new GetAttendanceTemplateQueryHandler();

            var excelResult = await handler.Handle(new GetAttendanceTemplateQuery("excel"), CancellationToken.None);
            Assert.NotNull(excelResult);
            Assert.NotEmpty(excelResult.FileContent);
            Assert.Equal("Attendance_Import_Template.xlsx", excelResult.FileName);

            var csvResult = await handler.Handle(new GetAttendanceTemplateQuery("csv"), CancellationToken.None);
            Assert.NotNull(csvResult);
            Assert.NotEmpty(csvResult.FileContent);
            Assert.Equal("Attendance_Import_Template.csv", csvResult.FileName);
        }

        [Fact]
        public async Task Handle_ExistingRecord_UpdatesWithoutDuplicateNotes()
        {
            // Arrange
            var emp1 = new Employee { Id = 1, Name = "Ahmed Ali", IsActive = true };
            _mockEmpRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<Employee> { emp1 });

            var existingRecord = new AttendanceRecord
            {
                EmployeeId = 1,
                Date = new DateTime(2026, 10, 1),
                Status = AttendanceStatus.Present,
                Note = "Regular shift"
            };

            _mockAttRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<AttendanceRecord, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<AttendanceRecord> { existingRecord });

            var csvContent = "EmployeeId,Date,ClockIn,ClockOut,Notes\n1,2026-10-01,08:45,17:05,Regular shift\n";
            using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csvContent));
            var command = new UploadAttendanceSheetCommand(stream, "attendance.csv");

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal(1, result.Data.UpdatedCount);
            Assert.Equal(0, result.Data.CreatedCount);
            Assert.Equal("Regular shift", existingRecord.Note); // Not duplicated
            _mockAttRepo.Verify(r => r.Update(existingRecord), Times.Once);
        }
    }
}
