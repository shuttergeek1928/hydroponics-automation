using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;

namespace IoTBackend.Controllers
{
    public class CircuitLayoutDto
    {
        public string DeviceId { get; set; } = string.Empty;
        public string ComponentsJson { get; set; } = string.Empty;
        public string WiresJson { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class CircuitController : ControllerBase
    {
        private static readonly ConcurrentDictionary<string, CircuitLayoutDto> _circuitStore = new();

        [HttpGet("{deviceId}")]
        public IActionResult GetCircuitLayout(string deviceId)
        {
            if (_circuitStore.TryGetValue(deviceId, out var layout))
            {
                return Ok(layout);
            }
            return NotFound(new { message = $"No circuit layout saved for device '{deviceId}'." });
        }

        [HttpPost("{deviceId}")]
        public IActionResult SaveCircuitLayout(string deviceId, [FromBody] CircuitLayoutDto dto)
        {
            dto.DeviceId = deviceId;
            dto.UpdatedAt = DateTime.UtcNow;
            _circuitStore[deviceId] = dto;
            return Ok(dto);
        }
    }
}
