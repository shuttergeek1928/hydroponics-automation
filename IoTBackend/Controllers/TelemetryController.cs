using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IoTBackend.Data;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace IoTBackend.Controllers
{
    [ApiController]
    [Route("api/devices/{deviceId}/telemetry")]
    public class TelemetryController : ControllerBase
    {
        private readonly IoTDbContext _context;

        public TelemetryController(IoTDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetHistory(string deviceId, [FromQuery] int hours = 24)
        {
            var cutoff = DateTime.UtcNow.AddHours(-hours);
            var readings = await _context.SensorData
                .Where(s => s.DeviceId == deviceId && s.Timestamp >= cutoff)
                .OrderByDescending(s => s.Timestamp)
                .ToListAsync();

            return Ok(readings);
        }

        [HttpGet("latest")]
        public async Task<IActionResult> GetLatest(string deviceId)
        {
            var reading = await _context.SensorData
                .Where(s => s.DeviceId == deviceId)
                .OrderByDescending(s => s.Timestamp)
                .FirstOrDefaultAsync();

            if (reading == null) return NotFound("No telemetry recorded yet");
            return Ok(reading);
        }
    }
}
