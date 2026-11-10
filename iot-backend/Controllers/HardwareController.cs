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
        public async Task<IActionResult> PostSensorData([FromForm] SensorDataDto dto)
        {
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
        public async Task<IActionResult> ConfirmCommand([FromForm] CommandConfirmationDto dto)
        {
            if (string.IsNullOrEmpty(dto.DeviceId) || dto.CommandId <= 0) return BadRequest("Invalid confirmation");
            await _deviceService.ConfirmCommandAsync(dto);
            return Ok();
        }
    }
}
