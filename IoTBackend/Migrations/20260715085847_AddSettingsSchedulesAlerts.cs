using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IoTBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddSettingsSchedulesAlerts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AlertLogs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DeviceId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DeviceName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Severity = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Resolved = table.Column<bool>(type: "bit", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SensorType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Value = table.Column<float>(type: "real", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlertLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AutomationSchedules",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TimeStart = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TimeEnd = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Duration = table.Column<int>(type: "int", nullable: true),
                    Active = table.Column<bool>(type: "bit", nullable: false),
                    TargetDevice = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AutomationSchedules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BackendUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UseMock = table.Column<bool>(type: "bit", nullable: false),
                    CalibrationPhOffset = table.Column<float>(type: "real", nullable: false),
                    CalibrationTdsFactor = table.Column<float>(type: "real", nullable: false),
                    PhMin = table.Column<float>(type: "real", nullable: false),
                    PhMax = table.Column<float>(type: "real", nullable: false),
                    TdsMin = table.Column<float>(type: "real", nullable: false),
                    TdsMax = table.Column<float>(type: "real", nullable: false),
                    TempMin = table.Column<float>(type: "real", nullable: false),
                    TempMax = table.Column<float>(type: "real", nullable: false),
                    WaterLevelMin = table.Column<float>(type: "real", nullable: false),
                    HumidityMin = table.Column<float>(type: "real", nullable: false),
                    HumidityMax = table.Column<float>(type: "real", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlertLogs");

            migrationBuilder.DropTable(
                name: "AutomationSchedules");

            migrationBuilder.DropTable(
                name: "SystemSettings");
        }
    }
}
