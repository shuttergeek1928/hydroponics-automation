using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IoTBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddExpandedSensors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "AmbientTemp",
                table: "SensorData",
                type: "real",
                nullable: false,
                defaultValue: 0f);

            migrationBuilder.AddColumn<float>(
                name: "DissolvedOxygen",
                table: "SensorData",
                type: "real",
                nullable: false,
                defaultValue: 0f);

            migrationBuilder.AddColumn<float>(
                name: "Humidity",
                table: "SensorData",
                type: "real",
                nullable: false,
                defaultValue: 0f);

            migrationBuilder.AddColumn<float>(
                name: "Ph",
                table: "SensorData",
                type: "real",
                nullable: false,
                defaultValue: 0f);

            migrationBuilder.AddColumn<float>(
                name: "Tds",
                table: "SensorData",
                type: "real",
                nullable: false,
                defaultValue: 0f);

            migrationBuilder.AddColumn<float>(
                name: "WaterLevel",
                table: "SensorData",
                type: "real",
                nullable: false,
                defaultValue: 0f);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AmbientTemp",
                table: "SensorData");

            migrationBuilder.DropColumn(
                name: "DissolvedOxygen",
                table: "SensorData");

            migrationBuilder.DropColumn(
                name: "Humidity",
                table: "SensorData");

            migrationBuilder.DropColumn(
                name: "Ph",
                table: "SensorData");

            migrationBuilder.DropColumn(
                name: "Tds",
                table: "SensorData");

            migrationBuilder.DropColumn(
                name: "WaterLevel",
                table: "SensorData");
        }
    }
}
