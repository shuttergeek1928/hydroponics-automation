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
            var alerts = await _context.AlertLogs
                .OrderByDescending(a => a.Timestamp)
                .ToListAsync();

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
