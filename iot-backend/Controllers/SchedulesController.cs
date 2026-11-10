using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IoTBackend.Data;
using IoTBackend.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IoTBackend.Controllers
{
    [ApiController]
    [Route("api/schedules")]
    public class SchedulesController : ControllerBase
    {
        private readonly IoTDbContext _context;

        public SchedulesController(IoTDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSchedules()
        {
            var schedules = await _context.AutomationSchedules.ToListAsync();
            
            // Seed defaults if empty
            if (!schedules.Any())
            {
                var defaults = new List<AutomationSchedule>
                {
                    new AutomationSchedule
                    {
                        Id = "sch-1",
                        Name = "NFT Water Pump Cycle",
                        Description = "Runs peristaltic pump for nutrient recirculation",
                        Type = "watering",
                        TimeStart = "08:00",
                        Duration = 15,
                        Active = true,
                        TargetDevice = "ESP32_001"
                    },
                    new AutomationSchedule
                    {
                        Id = "sch-2",
                        Name = "Daylight LED Cycle",
                        Description = "Maintains 16-hour lighting cycle for photosynthesis",
                        Type = "lighting",
                        TimeStart = "06:00",
                        TimeEnd = "22:00",
                        Active = true,
                        TargetDevice = "ESP32_001"
                    },
                    new AutomationSchedule
                    {
                        Id = "sch-3",
                        Name = "DWC Aeration Timer",
                        Description = "Keeps oxygen levels optimized in reservoir",
                        Type = "watering",
                        TimeStart = "00:00",
                        Duration = 60,
                        Active = true,
                        TargetDevice = "ESP32_002"
                    },
                    new AutomationSchedule
                    {
                        Id = "sch-4",
                        Name = "Nutrient Dosing Program",
                        Description = "Calibrates pH down dosing pumps",
                        Type = "nutrient",
                        TimeStart = "07:00",
                        Duration = 2,
                        Active = false,
                        TargetDevice = "ESP32_003"
                    }
                };

                _context.AutomationSchedules.AddRange(defaults);
                await _context.SaveChangesAsync();
                schedules = defaults;
            }

            return Ok(schedules);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AutomationSchedule schedule)
        {
            if (string.IsNullOrEmpty(schedule.Id))
            {
                schedule.Id = $"sch-{System.Guid.NewGuid().ToString().Substring(0, 8)}";
            }
            
            _context.AutomationSchedules.Add(schedule);
            await _context.SaveChangesAsync();
            return Ok(schedule);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] AutomationSchedule schedule)
        {
            var existing = await _context.AutomationSchedules.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Name = schedule.Name;
            existing.Description = schedule.Description;
            existing.Type = schedule.Type;
            existing.TimeStart = schedule.TimeStart;
            existing.TimeEnd = schedule.TimeEnd;
            existing.Duration = schedule.Duration;
            existing.Active = schedule.Active;
            existing.TargetDevice = schedule.TargetDevice;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }
    }
}
