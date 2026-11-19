using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IoTBackend.Data;
using System.Linq;
using System.Threading.Tasks;

namespace IoTBackend.Controllers
{
    [ApiController]
    [Route("api/stats")]
    public class StatsController : ControllerBase
    {
        private readonly IoTDbContext _context;

        public StatsController(IoTDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetStats()
        {
            var onlineCutoff = DateTime.UtcNow.AddSeconds(-90);
            var devices = await _context.Devices.AsNoTracking().ToListAsync();
            var totalDevices = devices.Count;
            var onlineDevices = devices.Count(d => d.LastSeen >= onlineCutoff);
            var offlineDevices = totalDevices - onlineDevices;

            var latestReadings = new List<IoTBackend.Models.SensorData>();
            foreach (var d in devices)
            {
                var r = await _context.SensorData
                    .Where(s => s.DeviceId == d.DeviceId)
                    .OrderByDescending(s => s.Timestamp)
                    .FirstOrDefaultAsync();
                if (r != null) latestReadings.Add(r);
            }

            double? Avg(Func<IoTBackend.Models.SensorData, double> sel) =>
                latestReadings.Count > 0 ? latestReadings.Average(sel) : null;

            var settings = await _context.SystemSettings.AsNoTracking().FirstOrDefaultAsync();
            var phMin = settings?.PhMin ?? 5.5f;
            var phMax = settings?.PhMax ?? 6.5f;
            var tdsMin = settings?.TdsMin ?? 800f;
            var tdsMax = settings?.TdsMax ?? 1200f;

            var stats = new
            {
                totalSystems = totalDevices,
                activeSystems = onlineDevices,
                alertSystems = latestReadings.Count(r => r.Ph < phMin || r.Ph > phMax || r.Tds < tdsMin || r.Tds > tdsMax),
                onlineDevices,
                offlineDevices,
                averagePh = Avg(r => r.Ph),
                averageTds = Avg(r => r.Tds),
                averageWaterTemp = Avg(r => r.Temperature),
                averageDissolvedOxygen = Avg(r => r.DissolvedOxygen)
            };

            return Ok(stats);
        }
    }
}
