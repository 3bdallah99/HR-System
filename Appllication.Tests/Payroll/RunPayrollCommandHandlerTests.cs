using Appllication.Common.Exceptions;
using Appllication.Features.Payroll.Commands.RunPayroll;
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

namespace Appllication.Tests.Payroll
{
    public class RunPayrollCommandHandlerTests
    {
        private readonly Mock<IUnitOfWork> _mockUow;
        private readonly Mock<IGenericRepository<Employee>> _mockEmpRepo;
        private readonly Mock<IGenericRepository<Domain.Entities.Payroll>> _mockPayrollRepo;
        private readonly Mock<IGenericRepository<SalaryStructure>> _mockSalaryRepo;
        private readonly Mock<IGenericRepository<AttendanceRecord>> _mockAttRepo;
        private readonly Mock<IGenericRepository<LeaveRequest>> _mockLeaveRepo;
        private readonly RunPayrollCommandHandler _handler;

        public RunPayrollCommandHandlerTests()
        {
            _mockUow = new Mock<IUnitOfWork>();
            _mockEmpRepo = new Mock<IGenericRepository<Employee>>();
            _mockPayrollRepo = new Mock<IGenericRepository<Domain.Entities.Payroll>>();
            _mockSalaryRepo = new Mock<IGenericRepository<SalaryStructure>>();
            _mockAttRepo = new Mock<IGenericRepository<AttendanceRecord>>();
            _mockLeaveRepo = new Mock<IGenericRepository<LeaveRequest>>();

            _mockUow.Setup(u => u.GetRepository<Employee>()).Returns(_mockEmpRepo.Object);
            _mockUow.Setup(u => u.GetRepository<Domain.Entities.Payroll>()).Returns(_mockPayrollRepo.Object);
            _mockUow.Setup(u => u.GetRepository<SalaryStructure>()).Returns(_mockSalaryRepo.Object);
            _mockUow.Setup(u => u.GetRepository<AttendanceRecord>()).Returns(_mockAttRepo.Object);
            _mockUow.Setup(u => u.GetRepository<LeaveRequest>()).Returns(_mockLeaveRepo.Object);

            _handler = new RunPayrollCommandHandler(_mockUow.Object);
        }

        [Fact]
        public async Task Handle_ActiveEmployees_CalculatesAndSavesPayrollWithBulkPreFetch()
        {
            // Arrange
            var position = new Position { Id = 1, Title = "Software Engineer", BaseSalary = 10000m };
            var emp = new Employee { Id = 1, Name = "Ahmed Ali", IsActive = true, PositionId = 1, Position = position };

            _mockEmpRepo.Setup(r => r.GetQueryable())
                .Returns(new List<Employee> { emp }.AsAsyncQueryable());

            _mockPayrollRepo.Setup(r => r.GetQueryable())
                .Returns(new List<Domain.Entities.Payroll>().AsAsyncQueryable());

            var salaryStructure = new SalaryStructure
            {
                EmployeeId = 1,
                BasicSalary = 10000m,
                HousingAllowance = 2000m,
                TransportationAllowance = 1000m,
                MealAllowance = 500m,
                SocialInsurance = 500m,
                TaxAmount = 500m
            };

            _mockSalaryRepo.Setup(r => r.GetQueryable())
                .Returns(new List<SalaryStructure> { salaryStructure }.AsAsyncQueryable());

            // 20 days present, 2 days late (30 mins late each = 60 mins late total, within 60 min allowance)
            var attendance = new List<AttendanceRecord>();
            for (int day = 1; day <= 18; day++)
            {
                attendance.Add(new AttendanceRecord
                {
                    EmployeeId = 1,
                    Date = new DateTime(2026, 10, day),
                    Status = AttendanceStatus.Present
                });
            }
            attendance.Add(new AttendanceRecord
            {
                EmployeeId = 1,
                Date = new DateTime(2026, 10, 19),
                Status = AttendanceStatus.Late,
                LateMinutes = 30
            });
            attendance.Add(new AttendanceRecord
            {
                EmployeeId = 1,
                Date = new DateTime(2026, 10, 20),
                Status = AttendanceStatus.Late,
                LateMinutes = 30
            });

            _mockAttRepo.Setup(r => r.GetQueryable())
                .Returns(attendance.AsAsyncQueryable());

            // 2 days approved leave
            var leaves = new List<LeaveRequest>
            {
                new LeaveRequest
                {
                    EmployeeId = 1,
                    Status = LeaveStatus.Approved,
                    StartDate = new DateTime(2026, 10, 21),
                    EndDate = new DateTime(2026, 10, 22)
                }
            };

            _mockLeaveRepo.Setup(r => r.GetQueryable())
                .Returns(leaves.AsAsyncQueryable());

            var command = new RunPayrollCommand(
                Month: 10,
                Year: 2026,
                EmployeeId: 1,
                DepartmentId: null,
                WorkingDaysInMonth: 22
            );

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal(1, result.Data.ProcessedCount);
            Assert.Equal(0, result.Data.SkippedCount);

            // 20 present + 2 leave = 22 days worked (0 days absent, 0 late deduction)
            // Gross: 10000 + 2000 + 1000 + 500 = 13500
            // Deductions: 500 (Social) + 500 (Tax) = 1000
            // Net: 13500 - 1000 = 12500
            Assert.Equal(12500m, result.Data.TotalNetPay);

            _mockPayrollRepo.Verify(r => r.AddAsync(It.Is<Domain.Entities.Payroll>(p =>
                p.EmployeeId == 1 &&
                p.DaysPresent == 20 &&
                p.ApprovedLeaveDays == 2 &&
                p.DaysAbsent == 0 &&
                p.AbsenceDeduction == 0 &&
                p.TardinessDeduction == 0 &&
                p.NetPay == 12500m
            ), It.IsAny<CancellationToken>()), Times.Once);

            _mockUow.Verify(u => u.CompleteAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Handle_ExistingPayroll_RecalculatesAndUpdatesExistingRecord()
        {
            // Arrange
            var position = new Position { Id = 1, Title = "Doctor", BaseSalary = 20000m };
            var emp = new Employee { Id = 2, Name = "Dr. Eman", IsActive = true, PositionId = 1, Position = position };

            _mockEmpRepo.Setup(r => r.GetQueryable())
                .Returns(new List<Employee> { emp }.AsAsyncQueryable());

            // Existing outdated payroll record (e.g. NetPay was 15000 before attendance sheet update)
            var existingPayroll = new Domain.Entities.Payroll
            {
                Id = 99,
                EmployeeId = 2,
                Month = 10,
                Year = 2026,
                BasicSalary = 20000m,
                NetPay = 15000m,
                DaysPresent = 15
            };

            _mockPayrollRepo.Setup(r => r.GetQueryable())
                .Returns(new List<Domain.Entities.Payroll> { existingPayroll }.AsAsyncQueryable());

            var salaryStructure = new SalaryStructure
            {
                EmployeeId = 2,
                BasicSalary = 20000m,
                HousingAllowance = 0,
                TransportationAllowance = 0
            };

            _mockSalaryRepo.Setup(r => r.GetQueryable())
                .Returns(new List<SalaryStructure> { salaryStructure }.AsAsyncQueryable());

            // Fresh attendance: 22 days present (perfect attendance)
            var attendance = new List<AttendanceRecord>();
            for (int day = 1; day <= 22; day++)
            {
                attendance.Add(new AttendanceRecord
                {
                    EmployeeId = 2,
                    Date = new DateTime(2026, 10, day),
                    Status = AttendanceStatus.Present
                });
            }

            _mockAttRepo.Setup(r => r.GetQueryable())
                .Returns(attendance.AsAsyncQueryable());

            _mockLeaveRepo.Setup(r => r.GetQueryable())
                .Returns(new List<LeaveRequest>().AsAsyncQueryable());

            var command = new RunPayrollCommand(
                Month: 10,
                Year: 2026,
                EmployeeId: 2,
                DepartmentId: null,
                WorkingDaysInMonth: 22
            );

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal(1, result.Data.ProcessedCount);
            Assert.Equal(20000m, result.Data.TotalNetPay);

            // Existing record must be updated in-place, NOT added as duplicate
            Assert.Equal(22, existingPayroll.DaysPresent);
            Assert.Equal(20000m, existingPayroll.NetPay);

            _mockPayrollRepo.Verify(r => r.Update(existingPayroll), Times.Once);
            _mockPayrollRepo.Verify(r => r.AddAsync(It.IsAny<Domain.Entities.Payroll>(), It.IsAny<CancellationToken>()), Times.Never);
            _mockUow.Verify(u => u.CompleteAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Handle_NoActiveEmployees_ThrowsNotFoundException()
        {
            // Arrange
            _mockEmpRepo.Setup(r => r.GetQueryable())
                .Returns(new List<Employee>().AsAsyncQueryable());

            var command = new RunPayrollCommand(10, 2026, 999, null, 22);

            // Act & Assert
            await Assert.ThrowsAsync<NotFoundException>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact]
        public async Task Handle_PayrollCycleBoundaries_CorrectlyFiltersRecordsFrom26thPreviousMonthTo25thCurrentMonth()
        {
            // Arrange: Month 9 of 2026 should run from 2026-08-26 to 2026-09-25
            var position = new Position { Id = 1, Title = "Engineer", BaseSalary = 10000m };
            var emp = new Employee { Id = 3, Name = "Cycle Test Emp", IsActive = true, PositionId = 1, Position = position };

            _mockEmpRepo.Setup(r => r.GetQueryable())
                .Returns(new List<Employee> { emp }.AsAsyncQueryable());

            _mockPayrollRepo.Setup(r => r.GetQueryable())
                .Returns(new List<Domain.Entities.Payroll>().AsAsyncQueryable());

            var salaryStructure = new SalaryStructure
            {
                EmployeeId = 3,
                BasicSalary = 10000m
            };

            _mockSalaryRepo.Setup(r => r.GetQueryable())
                .Returns(new List<SalaryStructure> { salaryStructure }.AsAsyncQueryable());

            var attendance = new List<AttendanceRecord>
            {
                new AttendanceRecord { EmployeeId = 3, Date = new DateTime(2026, 8, 25), Status = AttendanceStatus.Present }, // Out: Before cycle
                new AttendanceRecord { EmployeeId = 3, Date = new DateTime(2026, 8, 26), Status = AttendanceStatus.Present }, // In: Cycle Start
                new AttendanceRecord { EmployeeId = 3, Date = new DateTime(2026, 9, 25), Status = AttendanceStatus.Present }, // In: Cycle End
                new AttendanceRecord { EmployeeId = 3, Date = new DateTime(2026, 9, 26), Status = AttendanceStatus.Present }, // Out: After cycle
            };

            _mockAttRepo.Setup(r => r.GetQueryable())
                .Returns(attendance.AsAsyncQueryable());

            _mockLeaveRepo.Setup(r => r.GetQueryable())
                .Returns(new List<LeaveRequest>().AsAsyncQueryable());

            var command = new RunPayrollCommand(
                Month: 9,
                Year: 2026,
                EmployeeId: 3,
                DepartmentId: null,
                WorkingDaysInMonth: 22
            );

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.Success);
            _mockPayrollRepo.Verify(r => r.AddAsync(It.Is<Domain.Entities.Payroll>(p =>
                p.EmployeeId == 3 &&
                p.DaysPresent == 2 &&
                p.DaysAbsent == 0 &&
                p.AbsenceDeduction == 0m
            ), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Handle_AbsenceCalculation_DeductsOnlyUnexcusedAbsencesExcludingApprovedLeaves()
        {
            // Arrange: BasicSalary = 22,000, WorkingDays = 22 -> DailyRate = 1,000
            var position = new Position { Id = 1, Title = "Specialist", BaseSalary = 22000m };
            var emp = new Employee { Id = 4, Name = "Absence Test Emp", IsActive = true, PositionId = 1, Position = position };

            _mockEmpRepo.Setup(r => r.GetQueryable())
                .Returns(new List<Employee> { emp }.AsAsyncQueryable());

            _mockPayrollRepo.Setup(r => r.GetQueryable())
                .Returns(new List<Domain.Entities.Payroll>().AsAsyncQueryable());

            var salaryStructure = new SalaryStructure
            {
                EmployeeId = 4,
                BasicSalary = 22000m
            };

            _mockSalaryRepo.Setup(r => r.GetQueryable())
                .Returns(new List<SalaryStructure> { salaryStructure }.AsAsyncQueryable());

            var attendance = new List<AttendanceRecord>
            {
                new AttendanceRecord { EmployeeId = 4, Date = new DateTime(2026, 8, 26), Status = AttendanceStatus.Present },
                new AttendanceRecord { EmployeeId = 4, Date = new DateTime(2026, 8, 27), Status = AttendanceStatus.Absent },  // Unexcused: Day 1
                new AttendanceRecord { EmployeeId = 4, Date = new DateTime(2026, 8, 28), Status = AttendanceStatus.Absent },  // Excused: Covered by leave
                new AttendanceRecord { EmployeeId = 4, Date = new DateTime(2026, 8, 29), Status = AttendanceStatus.Absent },  // Unexcused: Day 2
                new AttendanceRecord { EmployeeId = 4, Date = new DateTime(2026, 8, 30), Status = AttendanceStatus.OnLeave }  // Paid leave (e.g. from timesheet): Not counted in DaysAbsent
            };

            _mockAttRepo.Setup(r => r.GetQueryable())
                .Returns(attendance.AsAsyncQueryable());

            var approvedLeaves = new List<LeaveRequest>
            {
                new LeaveRequest
                {
                    EmployeeId = 4,
                    StartDate = new DateTime(2026, 8, 28),
                    EndDate = new DateTime(2026, 8, 28),
                    Status = LeaveStatus.Approved
                }
            };

            _mockLeaveRepo.Setup(r => r.GetQueryable())
                .Returns(approvedLeaves.AsAsyncQueryable());

            var command = new RunPayrollCommand(
                Month: 9,
                Year: 2026,
                EmployeeId: 4,
                DepartmentId: null,
                WorkingDaysInMonth: 22
            );

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);

            // 2 unexcused absences * 1000 dailyRate = 2000 deduction
            // NetPay = 22000 - 2000 = 20000
            Assert.Equal(20000m, result.Data.TotalNetPay);

            _mockPayrollRepo.Verify(r => r.AddAsync(It.Is<Domain.Entities.Payroll>(p =>
                p.EmployeeId == 4 &&
                p.DaysAbsent == 2 &&
                p.ApprovedLeaveDays == 1 &&
                p.AbsenceDeduction == 2000m &&
                p.NetPay == 20000m
            ), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Handle_AbsenceDaysExceedWorkingDays_CappedAtWorkingDaysAndBasicSalaryWithoutNegativeNetPay()
        {
            // Arrange: BasicSalary = 2000, WorkingDays = 22, 31 days absent (full calendar month)
            var position = new Position { Id = 2, Title = "Nurse", BaseSalary = 2000m };
            var emp = new Employee { Id = 33, Name = "abeer", IsActive = true, PositionId = 2, Position = position };

            _mockEmpRepo.Setup(r => r.GetQueryable())
                .Returns(new List<Employee> { emp }.AsAsyncQueryable());

            _mockPayrollRepo.Setup(r => r.GetQueryable())
                .Returns(new List<Domain.Entities.Payroll>().AsAsyncQueryable());

            var salaryStructure = new SalaryStructure
            {
                EmployeeId = 33,
                BasicSalary = 2000m
            };

            _mockSalaryRepo.Setup(r => r.GetQueryable())
                .Returns(new List<SalaryStructure> { salaryStructure }.AsAsyncQueryable());

            // 31 days absent
            var attendance = new List<AttendanceRecord>();
            var startDate = new DateTime(2026, 8, 26);
            for (int i = 0; i < 31; i++)
            {
                attendance.Add(new AttendanceRecord
                {
                    EmployeeId = 33,
                    Date = startDate.AddDays(i),
                    Status = AttendanceStatus.Absent
                });
            }

            _mockAttRepo.Setup(r => r.GetQueryable())
                .Returns(attendance.AsAsyncQueryable());

            _mockLeaveRepo.Setup(r => r.GetQueryable())
                .Returns(new List<LeaveRequest>().AsAsyncQueryable());

            var command = new RunPayrollCommand(
                Month: 9,
                Year: 2026,
                EmployeeId: 33,
                DepartmentId: null,
                WorkingDaysInMonth: 22
            );

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);

            // NetPay must not be negative (-817.77); it must be 0
            Assert.Equal(0m, result.Data.TotalNetPay);

            _mockPayrollRepo.Verify(r => r.AddAsync(It.Is<Domain.Entities.Payroll>(p =>
                p.EmployeeId == 33 &&
                p.DaysAbsent == 22 && // Capped at WorkingDaysInMonth
                p.DaysPresent == 0 &&
                p.AbsenceDeduction == 2000m && // Capped at BasicSalary
                p.NetPay == 0m // Zero, never negative
            ), It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
