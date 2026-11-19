using Microsoft.AspNetCore.Mvc;
using IoTBackend.DTOs;
using IoTBackend.Services;

namespace IoTBackend.Controllers
{
    [ApiController]
    [Route("api/devices")]
    public class DeviceController : ControllerBase
    {
        private readonly IDeviceService _deviceService;

        public DeviceController(IDeviceService deviceService)
        {
            _deviceService = deviceService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var devices = await _deviceService.GetAllDevicesAsync();
            return Ok(devices);
        }

        [HttpGet("{deviceId}")]
        public async Task<IActionResult> Get(string deviceId)
        {
            var device = await _deviceService.GetDeviceByIdAsync(deviceId);
            if (device == null) return NotFound();
            return Ok(device);
        }

        [HttpPost("{deviceId}/commands")]
        public async Task<IActionResult> QueueCommand(string deviceId, [FromBody] CreateCommandDto dto)
        {
            if (!DeviceService.AllowedCommandTypes.Contains(dto.CommandType))
                return BadRequest(new { message = $"Unsupported command type '{dto.CommandType}'." });
            if (string.IsNullOrWhiteSpace(dto.CommandValue))
                return BadRequest(new { message = "commandValue is required." });

            var command = await _deviceService.QueueCommandAsync(deviceId, dto);
            if (command == null) return NotFound(new { message = $"Device '{deviceId}' is not registered." });
            return Ok(command);
        }

        [HttpGet("{deviceId}/commands")]
        public async Task<IActionResult> GetCommandHistory(string deviceId)
        {
            var device = await _deviceService.GetDeviceByIdAsync(deviceId);
            if (device == null) return NotFound();
            return Ok(device.Commands);
        }
    }
}
