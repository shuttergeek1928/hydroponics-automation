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

            return Ok(schedules);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AutomationSchedule schedule)
        {
            var error = Validate(schedule);
            if (error != null) return BadRequest(error);

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

            var error = Validate(schedule);
            if (error != null) return BadRequest(error);

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

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var existing = await _context.AutomationSchedules.FindAsync(id);
            if (existing == null) return NotFound();
            _context.AutomationSchedules.Remove(existing);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private static string? Validate(AutomationSchedule s)
        {
            if (string.IsNullOrWhiteSpace(s.Name)) return "Name is required.";
            if (string.IsNullOrWhiteSpace(s.TargetDevice)) return "Target device is required.";
            if (s.Type != "watering" && s.Type != "lighting" && s.Type != "nutrient") return "Type must be watering, lighting or nutrient.";
            if (!System.TimeSpan.TryParseExact(s.TimeStart, @"hh\:mm", null, out _)) return "TimeStart must be HH:mm.";
            if (s.Type == "lighting")
            {
                if (!System.TimeSpan.TryParseExact(s.TimeEnd ?? "", @"hh\:mm", null, out _)) return "TimeEnd must be HH:mm for lighting.";
            }
            else if (s.Duration is null or < 1 or > 5) return "Duration must be 1-5 minutes.";
            return null;
        }
    }
}
