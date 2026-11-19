using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IoTBackend.Data;
using IoTBackend.Models;
using System.Linq;
using System.Threading.Tasks;

namespace IoTBackend.Controllers
{
    [ApiController]
    [Route("api/settings")]
    public class SettingsController : ControllerBase
    {
        private readonly IoTDbContext _context;

        public SettingsController(IoTDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _context.SystemSettings.FirstOrDefaultAsync();

            if (settings == null)
            {
                settings = new SystemSettings
                {
                    BackendUrl = "http://localhost:5119",
                    UseMock = false,
                    CalibrationPhOffset = 0.0f,
                    CalibrationTdsFactor = 1.0f,
                    PhMin = 5.5f,
                    PhMax = 6.5f,
                    TdsMin = 800f,
                    TdsMax = 1200f,
                    TempMin = 18.0f,
                    TempMax = 23.0f,
                    WaterLevelMin = 70f,
                    HumidityMin = 50f,
                    HumidityMax = 70f
                };

                _context.SystemSettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            return Ok(settings);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateSettings([FromBody] SystemSettings newSettings)
        {
            var error = Validate(newSettings);
            if (error != null) return BadRequest(error);

            var settings = await _context.SystemSettings.FirstOrDefaultAsync();

            if (settings == null)
            {
                newSettings.Id = 0; // Ensure it writes correctly
                _context.SystemSettings.Add(newSettings);
                await _context.SaveChangesAsync();
                return Ok(newSettings);
            }

            settings.BackendUrl = newSettings.BackendUrl;
            settings.UseMock = newSettings.UseMock;
            settings.CalibrationPhOffset = newSettings.CalibrationPhOffset;
            settings.CalibrationTdsFactor = newSettings.CalibrationTdsFactor;
            settings.PhMin = newSettings.PhMin;
            settings.PhMax = newSettings.PhMax;
            settings.TdsMin = newSettings.TdsMin;
            settings.TdsMax = newSettings.TdsMax;
            settings.TempMin = newSettings.TempMin;
            settings.TempMax = newSettings.TempMax;
            settings.WaterLevelMin = newSettings.WaterLevelMin;
            settings.HumidityMin = newSettings.HumidityMin;
            settings.HumidityMax = newSettings.HumidityMax;

            await _context.SaveChangesAsync();
            return Ok(settings);
        }

        private static string? Validate(SystemSettings s)
        {
            if (s.PhMin >= s.PhMax) return "pH minimum must be lower than maximum.";
            if (s.TdsMin >= s.TdsMax) return "TDS minimum must be lower than maximum.";
            if (s.TempMin >= s.TempMax) return "Temperature minimum must be lower than maximum.";
            if (s.HumidityMin > s.HumidityMax) return "Humidity minimum must not exceed maximum.";
            if (s.PhMin < 0 || s.PhMax > 14) return "pH thresholds must be within 0-14.";
            if (s.CalibrationTdsFactor <= 0) return "TDS calibration factor must be greater than 0.";
            return null;
        }
    }
}
