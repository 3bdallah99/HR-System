using Appllication.Features.Attendance.Queries.GetTardinessSummary;
using Appllication.Tests.Helpers;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Appllication.Tests.Attendance
{
    public class GetTardinessSummaryQueryHandlerTests
    {
        private readonly Mock<IUnitOfWork> _mockUow;
        private readonly Mock<IGenericRepository<Employee>> _mockEmpRepo;
        private readonly Mock<IGenericRepository<AttendanceRecord>> _mockAttRepo;
        private readonly GetTardinessSummaryQueryHandler _handler;

        public GetTardinessSummaryQueryHandlerTests()
        {
            _mockUow = new Mock<IUnitOfWork>();
            _mockEmpRepo = new Mock<IGenericRepository<Employee>>();
            _mockAttRepo = new Mock<IGenericRepository<AttendanceRecord>>();

            _mockUow.Setup(u => u.GetRepository<Employee>()).Returns(_mockEmpRepo.Object);
            _mockUow.Setup(u => u.GetRepository<AttendanceRecord>()).Returns(_mockAttRepo.Object);

            _handler = new GetTardinessSummaryQueryHandler(_mockUow.Object);
        }

        [Fact]
        public async Task Handle_CycleBoundaries_QueriesFrom26thPreviousMonthTo25thCurrentMonth()
        {
            // Arrange: Month 9 of 2026 runs from 2026-08-26 to 2026-09-25
            var emp = new Employee { Id = 10, Name = "Tardiness Emp", IsActive = true };

            _mockEmpRepo.Setup(r => r.FirstOrDefaultAsync(
                It.IsAny<Expression<Func<Employee, bool>>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(emp);

            var records = new List<AttendanceRecord>
            {
                new AttendanceRecord { EmployeeId = 10, Date = new DateTime(2026, 8, 25), Status = AttendanceStatus.Late, LateMinutes = 30 }, // Out: Before cycle
                new AttendanceRecord { EmployeeId = 10, Date = new DateTime(2026, 8, 26), Status = AttendanceStatus.Late, LateMinutes = 40 }, // In: Cycle Start
                new AttendanceRecord { EmployeeId = 10, Date = new DateTime(2026, 9, 25), Status = AttendanceStatus.Late, LateMinutes = 50 }, // In: Cycle End
                new AttendanceRecord { EmployeeId = 10, Date = new DateTime(2026, 9, 26), Status = AttendanceStatus.Late, LateMinutes = 60 }, // Out: After cycle
            };

            _mockAttRepo.Setup(r => r.GetQueryable())
                .Returns(records.AsAsyncQueryable());

            var query = new GetTardinessSummaryQuery(EmployeeId: 10, Month: 9, Year: 2026);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal(2, result.Data.LateOccurrences); // Only 8/26 and 9/25
            Assert.Equal(90, result.Data.TotalLateMinutes); // 40 + 50
            Assert.Equal(60, result.Data.AllowedMinutes);
            Assert.Equal(30, result.Data.DeductibleMinutes); // 90 - 60
        }
    }
}
