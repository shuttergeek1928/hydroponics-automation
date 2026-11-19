using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;
using System.Text.Json;

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
        // Layouts are persisted to a JSON file so they survive restarts (no schema migration needed)
        private static readonly object _fileLock = new();
        private static readonly string _storePath = Path.Combine(AppContext.BaseDirectory, "App_Data", "circuit-layouts.json");
        private static readonly ConcurrentDictionary<string, CircuitLayoutDto> _circuitStore = Load();

        private static ConcurrentDictionary<string, CircuitLayoutDto> Load()
        {
            try
            {
                if (System.IO.File.Exists(_storePath))
                {
                    var data = JsonSerializer.Deserialize<Dictionary<string, CircuitLayoutDto>>(System.IO.File.ReadAllText(_storePath));
                    if (data != null) return new ConcurrentDictionary<string, CircuitLayoutDto>(data);
                }
            }
            catch (Exception) { }
            return new ConcurrentDictionary<string, CircuitLayoutDto>();
        }

        private static void Persist()
        {
            lock (_fileLock)
            {
                Directory.CreateDirectory(Path.GetDirectoryName(_storePath)!);
                System.IO.File.WriteAllText(_storePath, JsonSerializer.Serialize(_circuitStore));
            }
        }

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
            Persist();
            return Ok(dto);
        }
    }
}
