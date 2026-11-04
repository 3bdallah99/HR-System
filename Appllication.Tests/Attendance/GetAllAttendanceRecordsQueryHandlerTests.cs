using Appllication.Features.Attendance.Queries.GetAllAttendanceRecords;
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
    public class GetAllAttendanceRecordsQueryHandlerTests
    {
        private readonly Mock<IUnitOfWork> _mockUow;
        private readonly Mock<IGenericRepository<AttendanceRecord>> _mockRepo;
        private readonly GetAllAttendanceRecordsQueryHandler _handler;

        public GetAllAttendanceRecordsQueryHandlerTests()
        {
            _mockUow = new Mock<IUnitOfWork>();
            _mockRepo = new Mock<IGenericRepository<AttendanceRecord>>();
            _mockUow.Setup(u => u.GetRepository<AttendanceRecord>()).Returns(_mockRepo.Object);

            _handler = new GetAllAttendanceRecordsQueryHandler(_mockUow.Object);
        }

        [Fact]
        public async Task Handle_CalculatesStatisticsAcrossAllRecords_RegardlessOfPaging()
        {
            // Arrange
            var emp = new Employee { Id = 1, Name = "Ahmed Ali" };
            var baseDate = new DateTime(2026, 9, 1);

            var records = new List<AttendanceRecord>
            {
                // 3 Present
                new AttendanceRecord { Id = 1, EmployeeId = 1, Employee = emp, Date = baseDate.AddDays(0), Status = AttendanceStatus.Present, ClockIn = baseDate.AddHours(9), ClockOut = baseDate.AddHours(17) },
                new AttendanceRecord { Id = 2, EmployeeId = 1, Employee = emp, Date = baseDate.AddDays(1), Status = AttendanceStatus.Present, ClockIn = baseDate.AddHours(9), ClockOut = baseDate.AddHours(17) },
                new AttendanceRecord { Id = 3, EmployeeId = 1, Employee = emp, Date = baseDate.AddDays(2), Status = AttendanceStatus.Present, ClockIn = baseDate.AddHours(9), ClockOut = baseDate.AddHours(17) },

                // 2 Late
                new AttendanceRecord { Id = 4, EmployeeId = 1, Employee = emp, Date = baseDate.AddDays(3), Status = AttendanceStatus.Late, LateMinutes = 45, ClockIn = baseDate.AddHours(9).AddMinutes(45) },
                new AttendanceRecord { Id = 5, EmployeeId = 1, Employee = emp, Date = baseDate.AddDays(4), Status = AttendanceStatus.Late, LateMinutes = 15, ClockIn = baseDate.AddHours(9).AddMinutes(15) },

                // 2 Absent
                new AttendanceRecord { Id = 6, EmployeeId = 1, Employee = emp, Date = baseDate.AddDays(5), Status = AttendanceStatus.Absent, Note = "غياب بدون إذن" },
                new AttendanceRecord { Id = 7, EmployeeId = 1, Employee = emp, Date = baseDate.AddDays(6), Status = AttendanceStatus.Absent },

                // 1 OnLeave
                new AttendanceRecord { Id = 8, EmployeeId = 1, Employee = emp, Date = baseDate.AddDays(7), Status = AttendanceStatus.OnLeave, Note = "إجازة سنوية" },

                // 2 Weekends (Weekly rest days)
                new AttendanceRecord { Id = 9, EmployeeId = 1, Employee = emp, Date = baseDate.AddDays(8), Status = AttendanceStatus.Present, Note = "عطلة أسبوعية (الجمعة)" },
                new AttendanceRecord { Id = 10, EmployeeId = 1, Employee = emp, Date = baseDate.AddDays(9), Status = AttendanceStatus.Present, Note = "عطلة أسبوعية (السبت)" }
            };

            _mockRepo.Setup(r => r.GetQueryable()).Returns(records.AsAsyncQueryable());

            // Query only 2 items per page
            var query = new GetAllAttendanceRecordsQuery(Page: 1, PageSize: 2);

            // Act
            var response = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(response.Success);
            Assert.NotNull(response.Data);

            // Paging assertions: PageSize is 2, TotalCount is 10
            Assert.Equal(2, response.Data.Items.Count);
            Assert.Equal(10, response.Data.TotalCount);
            Assert.Equal(1, response.Data.PageNumber);

            // Summary assertions across all 10 records:
            Assert.Equal(3, response.Data.Summary.Present);
            Assert.Equal(2, response.Data.Summary.Late);
            Assert.Equal(2, response.Data.Summary.Absent);
            Assert.Equal(1, response.Data.Summary.OnLeave);
        }

        [Fact]
        public async Task Handle_AppliesFilters_CalculatesSummaryForFilteredScopeOnly()
        {
            // Arrange
            var emp1 = new Employee { Id = 1, Name = "Emp One" };
            var emp2 = new Employee { Id = 2, Name = "Emp Two" };

            var records = new List<AttendanceRecord>
            {
                new AttendanceRecord { Id = 1, EmployeeId = 1, Employee = emp1, Date = new DateTime(2026, 9, 10), Status = AttendanceStatus.Present, ClockIn = DateTime.Now },
                new AttendanceRecord { Id = 2, EmployeeId = 1, Employee = emp1, Date = new DateTime(2026, 9, 11), Status = AttendanceStatus.Late, LateMinutes = 20 },
                new AttendanceRecord { Id = 3, EmployeeId = 2, Employee = emp2, Date = new DateTime(2026, 9, 10), Status = AttendanceStatus.Absent },
                new AttendanceRecord { Id = 4, EmployeeId = 1, Employee = emp1, Date = new DateTime(2026, 8, 10), Status = AttendanceStatus.Absent } // out of date range
            };

            _mockRepo.Setup(r => r.GetQueryable()).Returns(records.AsAsyncQueryable());

            var query = new GetAllAttendanceRecordsQuery(
                EmployeeId: 1,
                From: new DateOnly(2026, 9, 1),
                To: new DateOnly(2026, 9, 30),
                Page: 1,
                PageSize: 10);

            // Act
            var response = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.Equal(2, response.Data.TotalCount);
            Assert.Equal(1, response.Data.Summary.Present);
            Assert.Equal(1, response.Data.Summary.Late);
            Assert.Equal(0, response.Data.Summary.Absent);
            Assert.Equal(0, response.Data.Summary.OnLeave);
        }
    }
}
