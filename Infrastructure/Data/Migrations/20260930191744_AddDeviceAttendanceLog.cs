using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDeviceAttendanceLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DeviceAttendanceLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeviceSerial = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UserPin = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PunchTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    VerifyMode = table.Column<int>(type: "int", nullable: false),
                    InOutMode = table.Column<int>(type: "int", nullable: false),
                    WorkCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    RawData = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsProcessed = table.Column<bool>(type: "bit", nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ReceivedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EmployeeId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeviceAttendanceLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeviceAttendanceLogs_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeviceAttendanceLogs_DeviceSerial_UserPin_PunchTime",
                table: "DeviceAttendanceLogs",
                columns: new[] { "DeviceSerial", "UserPin", "PunchTime" });

            migrationBuilder.CreateIndex(
                name: "IX_DeviceAttendanceLogs_EmployeeId",
                table: "DeviceAttendanceLogs",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_DeviceAttendanceLogs_IsProcessed",
                table: "DeviceAttendanceLogs",
                column: "IsProcessed");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeviceAttendanceLogs");
        }
    }
}
