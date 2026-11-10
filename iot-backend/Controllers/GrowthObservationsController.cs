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
    [Route("api/growth")]
    public class GrowthObservationsController : ControllerBase
    {
        private readonly IoTDbContext _context;

        public GrowthObservationsController(IoTDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetObservations()
        {
            var observations = await _context.GrowthObservations
                .OrderByDescending(o => o.Date)
                .ThenByDescending(o => o.CreatedAt)
                .ToListAsync();

            return Ok(observations);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] GrowthObservation observation)
        {
            if (string.IsNullOrEmpty(observation.Id))
            {
                observation.Id = $"obs-{Guid.NewGuid().ToString("N").Substring(0, 8)}";
            }

            observation.CreatedAt = DateTime.UtcNow;

            _context.GrowthObservations.Add(observation);
            await _context.SaveChangesAsync();
            return Ok(observation);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var existing = await _context.GrowthObservations.FindAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            _context.GrowthObservations.Remove(existing);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

