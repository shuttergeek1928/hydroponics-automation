using IoTBackend.Data;
using IoTBackend.DTOs;
using Microsoft.EntityFrameworkCore;

namespace IoTBackend.Services
{
    // Fires active automation schedules by queuing device commands at their configured local time.
    public class ScheduleRunner : BackgroundService
    {
        private readonly IServiceScopeFactory _scopes;
        private readonly ILogger<ScheduleRunner> _logger;
        private string _lastMinute = string.Empty;

        public ScheduleRunner(IServiceScopeFactory scopes, ILogger<ScheduleRunner> logger)
        {
            _scopes = scopes;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.Now;
                    var key = now.ToString("yyyyMMddHHmm");
                    if (key != _lastMinute)
                    {
                        _lastMinute = key;
                        await RunDueAsync(now.ToString("HH:mm"), stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Schedule runner iteration failed");
                }
                await Task.Delay(TimeSpan.FromSeconds(20), stoppingToken);
            }
        }

        private async Task RunDueAsync(string hhmm, CancellationToken ct)
        {
            using var scope = _scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IoTDbContext>();
            var devices = scope.ServiceProvider.GetRequiredService<IDeviceService>();

            var active = await db.AutomationSchedules.AsNoTracking().Where(s => s.Active).ToListAsync(ct);
            foreach (var s in active)
            {
                CreateCommandDto? cmd = null;
                if (s.Type == "lighting")
                {
                    if (s.TimeStart == hhmm) cmd = new CreateCommandDto { CommandType = "led", CommandValue = "on" };
                    else if (s.TimeEnd == hhmm) cmd = new CreateCommandDto { CommandType = "led", CommandValue = "off" };
                }
                else if (s.TimeStart == hhmm && s.Duration is > 0)
                {
                    var seconds = Math.Min(s.Duration.Value * 60, 300);
                    cmd = new CreateCommandDto { CommandType = "pump_duration", CommandValue = seconds.ToString() };
                }

                if (cmd == null) continue;
                var queued = await devices.QueueCommandAsync(s.TargetDevice, cmd);
                _logger.LogInformation("Schedule {Name} -> {Type}={Value} on {Device} ({Result})",
                    s.Name, cmd.CommandType, cmd.CommandValue, s.TargetDevice, queued == null ? "device unknown" : "queued");
            }
        }
    }
}
