using Appllication.Features.Attendance.Queries.GetMonthlyAttendanceMatrix;
using Appllication.Tests.Helpers;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Appllication.Tests.Attendance
{
    public class GetMonthlyAttendanceMatrixQueryHandlerTests
    {
        private readonly Mock<IUnitOfWork> _mockUow;
        private readonly Mock<IGenericRepository<Employee>> _mockEmpRepo;
        private readonly Mock<IGenericRepository<AttendanceRecord>> _mockAttRepo;
        private readonly Mock<IGenericRepository<LeaveRequest>> _mockLeaveRepo;
        private readonly GetMonthlyAttendanceMatrixQueryHandler _handler;

        public GetMonthlyAttendanceMatrixQueryHandlerTests()
        {
            _mockUow = new Mock<IUnitOfWork>();
            _mockEmpRepo = new Mock<IGenericRepository<Employee>>();
            _mockAttRepo = new Mock<IGenericRepository<AttendanceRecord>>();
            _mockLeaveRepo = new Mock<IGenericRepository<LeaveRequest>>();

            _mockUow.Setup(u => u.GetRepository<Employee>()).Returns(_mockEmpRepo.Object);
            _mockUow.Setup(u => u.GetRepository<AttendanceRecord>()).Returns(_mockAttRepo.Object);
            _mockUow.Setup(u => u.GetRepository<LeaveRequest>()).Returns(_mockLeaveRepo.Object);

            _handler = new GetMonthlyAttendanceMatrixQueryHandler(_mockUow.Object);
        }

        [Fact]
        public async Task Handle_CalendarMonth_ReturnsCorrectDaysAndAggregates()
        {
            // Arrange
            var dept = new Department { Id = 1, Name = "Engineering" };
            var emp1 = new Employee { Id = 1, Name = "Ahmed Ali", DepartmentId = 1, Department = dept, IsActive = true };
            var employees = new List<Employee> { emp1 };

            _mockEmpRepo.Setup(r => r.GetQueryable())
                .Returns(employees.AsAsyncQueryable());

            // November 2026 has 30 days
            var records = new List<AttendanceRecord>
            {
                new AttendanceRecord
                {
                    Id = 101,
                    EmployeeId = 1,
                    Date = new DateTime(2026, 11, 1), // Sunday
                    Status = AttendanceStatus.Present,
                    ClockIn = new DateTime(2026, 11, 1, 9, 0, 0),
                    ClockOut = new DateTime(2026, 11, 1, 17, 0, 0)
                },
                new AttendanceRecord
                {
                    Id = 102,
                    EmployeeId = 1,
                    Date = new DateTime(2026, 11, 2), // Monday
                    Status = AttendanceStatus.Late,
                    LateMinutes = 25,
                    ClockIn = new DateTime(2026, 11, 2, 9, 25, 0),
                    ClockOut = new DateTime(2026, 11, 2, 17, 0, 0)
                }
            };

            _mockAttRepo.Setup(r => r.GetQueryable())
                .Returns(records.AsAsyncQueryable());

            var leaves = new List<LeaveRequest>();
            _mockLeaveRepo.Setup(r => r.GetQueryable())
                .Returns(leaves.AsAsyncQueryable());

            var query = new GetMonthlyAttendanceMatrixQuery(Year: 2026, Month: 11, IsPayrollCycle: false);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal(30, result.Data.Days.Count);
            Assert.Single(result.Data.Employees);

            var empRow = result.Data.Employees[0];
            Assert.Equal(1, empRow.EmployeeId);
            Assert.Equal("Ahmed Ali", empRow.EmployeeName);

            // Nov 1 was Present
            Assert.True(empRow.Days.ContainsKey("2026-11-01"));
            Assert.Equal("Present", empRow.Days["2026-11-01"].Status);

            // Nov 2 was Late with 25 mins
            Assert.True(empRow.Days.ContainsKey("2026-11-02"));
            Assert.Equal("Late", empRow.Days["2026-11-02"].Status);
            Assert.Equal(25, empRow.Days["2026-11-02"].LateMinutes);

            // Total Present includes on-time + late days
            Assert.Equal(2, empRow.TotalPresent);
            Assert.Equal(1, empRow.TotalLate);
            Assert.Equal(25, empRow.TotalLateMinutes);
        }

        [Fact]
        public async Task Handle_ApprovedLeave_MarksDayAsOnLeave()
        {
            // Arrange
            var dept = new Department { Id = 1, Name = "Marketing" };
            var emp = new Employee { Id = 2, Name = "Sara Hassan", DepartmentId = 1, Department = dept, IsActive = true };
            var employees = new List<Employee> { emp };

            _mockEmpRepo.Setup(r => r.GetQueryable())
                .Returns(employees.AsAsyncQueryable());

            _mockAttRepo.Setup(r => r.GetQueryable())
                .Returns(new List<AttendanceRecord>().AsAsyncQueryable());

            // Leave from Nov 10 to Nov 12
            var leaves = new List<LeaveRequest>
            {
                new LeaveRequest
                {
                    EmployeeId = 2,
                    StartDate = new DateTime(2026, 11, 10),
                    EndDate = new DateTime(2026, 11, 12),
                    Status = LeaveStatus.Approved
                }
            };

            _mockLeaveRepo.Setup(r => r.GetQueryable())
                .Returns(leaves.AsAsyncQueryable());

            var query = new GetMonthlyAttendanceMatrixQuery(Year: 2026, Month: 11, IsPayrollCycle: false);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.Success);
            var empRow = result.Data!.Employees[0];
            Assert.Equal("OnLeave", empRow.Days["2026-11-10"].Status);
            Assert.Equal("OnLeave", empRow.Days["2026-11-11"].Status);
            Assert.Equal("OnLeave", empRow.Days["2026-11-12"].Status);
            Assert.Equal(3, empRow.TotalLeaves);
        }
    }
}
