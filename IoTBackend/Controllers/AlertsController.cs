using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IoTBackend.Data;
using IoTBackend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IoTBackend.Controllers
{
    [ApiController]
    [Route("api/alerts")]
    public class AlertsController : ControllerBase
    {
        private readonly IoTDbContext _context;

        public AlertsController(IoTDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAlerts()
        {
            var alerts = await _context.AlertLogs.ToListAsync();

            if (!alerts.Any())
            {
                var defaults = new List<AlertLog>
                {
                    new AlertLog
                    {
                        Id = "alert-1",
                        DeviceId = "ESP32_001",
                        DeviceName = "NFT Tomato System",
                        Severity = "warning",
                        Message = "Reservoir pH levels drifting higher than target (6.8 pH)",
                        Timestamp = DateTime.UtcNow.AddMinutes(-45),
                        Resolved = false,
                        SensorType = "ph",
                        Value = 6.8f
                    },
                    new AlertLog
                    {
                        Id = "alert-2",
                        DeviceId = "ESP32_002",
                        DeviceName = "DWC Lettuce Tank",
                        Severity = "critical",
                        Message = "Dissolved Oxygen levels critical (3.8 mg/L)",
                        Timestamp = DateTime.UtcNow.AddHours(-2),
                        Resolved = false,
                        SensorType = "dissolvedOxygen",
                        Value = 3.8f
                    },
                    new AlertLog
                    {
                        Id = "alert-3",
                        DeviceId = "ESP32_004",
                        DeviceName = "Aeroponics Tower Node",
                        Severity = "info",
                        Message = "Water level refilled to nominal capacity",
                        Timestamp = DateTime.UtcNow.AddHours(-5),
                        Resolved = true,
                        ResolvedAt = DateTime.UtcNow.AddHours(-4),
                        SensorType = "waterLevel",
                        Value = 95.0f
                    }
                };

                _context.AlertLogs.AddRange(defaults);
                await _context.SaveChangesAsync();
                alerts = defaults;
            }

            return Ok(alerts);
        }

        [HttpPost("{id}/resolve")]
        public async Task<IActionResult> Resolve(string id)
        {
            var alert = await _context.AlertLogs.FindAsync(id);
            if (alert == null) return NotFound();

            alert.Resolved = true;
            alert.ResolvedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(alert);
        }

        [HttpDelete("resolved")]
        public async Task<IActionResult> ClearResolved()
        {
            var resolved = await _context.AlertLogs.Where(a => a.Resolved).ToListAsync();
            _context.AlertLogs.RemoveRange(resolved);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
