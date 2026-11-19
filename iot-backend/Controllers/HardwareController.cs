using Microsoft.AspNetCore.Mvc;
using IoTBackend.DTOs;
using IoTBackend.Services;

namespace IoTBackend.Controllers
{
    [ApiController]
    [Route("api")]
    public class HardwareController : ControllerBase
    {
        private readonly IDeviceService _deviceService;

        public HardwareController(IDeviceService deviceService)
        {
            _deviceService = deviceService;
        }

        [HttpPost("sensor-data")]
        public async Task<IActionResult> PostSensorData()
        {
            var dto = await ReadAsync<SensorDataDto>(MapSensor);
            if (string.IsNullOrEmpty(dto.DeviceId)) return BadRequest("device_id is required");
            var commands = await _deviceService.RecordSensorDataAsync(dto);
            return Ok(commands);
        }

        [HttpGet("commands")]
        public async Task<IActionResult> GetCommands([FromQuery] string device_id)
        {
            if (string.IsNullOrEmpty(device_id)) return BadRequest("device_id is required");
            var commands = await _deviceService.GetPendingCommandsAsync(device_id);
            if (commands.Count == 0) return NoContent();
            return Ok(commands);
        }

        [HttpPost("command-confirmation")]
        public async Task<IActionResult> ConfirmCommand()
        {
            var dto = await ReadAsync<CommandConfirmationDto>(MapConfirmation);
            if (string.IsNullOrEmpty(dto.DeviceId) || dto.CommandId <= 0) return BadRequest("Invalid confirmation");
            await _deviceService.ConfirmCommandAsync(dto);
            return Ok();
        }

        // Accepts form fields (snake_case or PascalCase, case-insensitive) or a JSON body
        private async Task<T> ReadAsync<T>(Func<Func<string[], string>, T> map) where T : new()
        {
            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                return map(keys =>
                {
                    foreach (var k in keys)
                    {
                        var match = form.Keys.FirstOrDefault(f => Norm(f) == Norm(k));
                        if (match != null) return form[match].ToString();
                    }
                    return string.Empty;
                });
            }
            try
            {
                var doc = await System.Text.Json.JsonDocument.ParseAsync(Request.Body);
                return map(keys =>
                {
                    foreach (var k in keys)
                        foreach (var prop in doc.RootElement.EnumerateObject())
                            if (Norm(prop.Name) == Norm(k))
                                return prop.Value.ValueKind == System.Text.Json.JsonValueKind.String
                                    ? prop.Value.GetString() ?? string.Empty
                                    : prop.Value.ToString();
                    return string.Empty;
                });
            }
            catch (Exception)
            {
                return new T();
            }
        }

        private static string Norm(string s) => s.Replace("_", "").ToLowerInvariant();

        private static float F(string v) =>
            float.TryParse(v, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var r) ? r : 0f;

        private static SensorDataDto MapSensor(Func<string[], string> g) => new()
        {
            DeviceId = g(new[] { "device_id" }),
            SensorValue = F(g(new[] { "sensor_value" })),
            Temperature = F(g(new[] { "temperature" })),
            Ph = F(g(new[] { "ph" })),
            Tds = F(g(new[] { "tds" })),
            WaterLevel = F(g(new[] { "water_level" })),
            DissolvedOxygen = F(g(new[] { "dissolved_oxygen" })),
            AmbientTemp = F(g(new[] { "ambient_temp" })),
            Humidity = F(g(new[] { "humidity" })),
            LedState = g(new[] { "led_state" }),
            PumpState = g(new[] { "pump_state" })
        };

        private static CommandConfirmationDto MapConfirmation(Func<string[], string> g) => new()
        {
            DeviceId = g(new[] { "device_id" }),
            CommandId = int.TryParse(g(new[] { "command_id" }), out var id) ? id : 0,
            Status = g(new[] { "status" }),
            Response = g(new[] { "response" })
        };
    }
}
