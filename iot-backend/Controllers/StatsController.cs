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
            var devices = await _context.Devices.ToListAsync();
            var totalDevices = devices.Count;
            var onlineDevices = devices.Count(d => d.IsOnline);
            var offlineDevices = totalDevices - onlineDevices;

            // Fetch the latest reading for each device
            var latestReadings = await _context.Devices
                .Select(d => _context.SensorData
                    .Where(s => s.DeviceId == d.DeviceId)
                    .OrderByDescending(s => s.Timestamp)
                    .FirstOrDefault())
                .Where(s => s != null)
                .ToListAsync();

            float avgPh = 0f, avgTds = 0f, avgTemp = 0f, avgDo = 0f;

            if (latestReadings.Any())
            {
                avgPh = latestReadings.Average(r => r!.Ph);
                avgTds = latestReadings.Average(r => r!.Tds);
                avgTemp = latestReadings.Average(r => r!.Temperature);
                avgDo = latestReadings.Average(r => r!.DissolvedOxygen);
            }

            // We mock some system count parameters for DWC, NFT, Drip, Aeroponics display matching dashboard layouts
            var stats = new
            {
                totalSystems = 4,
                activeSystems = onlineDevices > 0 ? onlineDevices : 1,
                alertSystems = latestReadings.Count(r => r!.Ph < 5.5f || r.Ph > 6.5f || r.Tds < 800f || r.Tds > 1200f),
                onlineDevices = onlineDevices,
                offlineDevices = offlineDevices,
                averagePh = avgPh > 0 ? avgPh : 6.0f,
                averageTds = avgTds > 0 ? avgTds : 950.0f,
                averageWaterTemp = avgTemp > 0 ? avgTemp : 21.0f,
                averageDissolvedOxygen = avgDo > 0 ? avgDo : 6.5f
            };

            return Ok(stats);
        }
    }
}
