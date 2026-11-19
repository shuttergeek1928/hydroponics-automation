using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using IoTBackend.Data;
using IoTBackend.Models;
using IoTBackend.DTOs;

namespace IoTBackend.Services
{
    public interface IDeviceService
    {
        Task<Device> EnsureDeviceExistsAsync(string deviceId);
        Task<List<DeviceCommand>> RecordSensorDataAsync(SensorDataDto dto);
        Task<List<DeviceCommand>> GetPendingCommandsAsync(string deviceId);
        Task ConfirmCommandAsync(CommandConfirmationDto dto);
        Task<List<Device>> GetAllDevicesAsync();
        Task<Device?> GetDeviceByIdAsync(string deviceId);
        Task<DeviceCommand?> QueueCommandAsync(string deviceId, CreateCommandDto dto);
    }

    public class DeviceService : IDeviceService
    {
        // Devices upload telemetry every 30s; treat them as offline after missing several cycles.
        public static readonly TimeSpan OnlineWindow = TimeSpan.FromSeconds(90);

        public static readonly HashSet<string> AllowedCommandTypes = new(StringComparer.Ordinal)
        {
            "led", "pump", "pump_duration", "restart", "sensor_interval"
        };

        private readonly IoTDbContext _context;

        public DeviceService(IoTDbContext context)
        {
            _context = context;
        }

        public async Task<Device> EnsureDeviceExistsAsync(string deviceId)
        {
            var device = await _context.Devices.FirstOrDefaultAsync(d => d.DeviceId == deviceId);
            if (device == null)
            {
                device = new Device
                {
                    DeviceId = deviceId,
                    Name = $"Auto-registered {deviceId}",
                    CreatedAt = DateTime.UtcNow,
                    IsOnline = true,
                    LastSeen = DateTime.UtcNow
                };
                _context.Devices.Add(device);
                await _context.SaveChangesAsync();
            }
            else
            {
                device.IsOnline = true;
                device.LastSeen = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            return device;
        }

        public async Task<List<DeviceCommand>> RecordSensorDataAsync(SensorDataDto dto)
        {
            var device = await EnsureDeviceExistsAsync(dto.DeviceId);

            var reading = new SensorData
            {
                DeviceId = device.DeviceId,
                SensorValue = dto.SensorValue,
                Temperature = dto.Temperature,
                Ph = dto.Ph,
                Tds = dto.Tds,
                WaterLevel = dto.WaterLevel,
                DissolvedOxygen = dto.DissolvedOxygen,
                AmbientTemp = dto.AmbientTemp,
                Humidity = dto.Humidity,
                LedState = dto.LedState,
                PumpState = dto.PumpState,
                Timestamp = DateTime.UtcNow,
                ReceivedAt = DateTime.UtcNow
            };
            _context.SensorData.Add(reading);
            await _context.SaveChangesAsync();
            await EvaluateAlertsAsync(device, reading);

            return await GetPendingCommandsAsync(dto.DeviceId);
        }

        private async Task EvaluateAlertsAsync(Device device, SensorData r)
        {
            var settings = await _context.SystemSettings.AsNoTracking().FirstOrDefaultAsync() ?? new SystemSettings();
            var checks = new (string Sensor, string Label, string Unit, float Value, float? Min, float? Max)[]
            {
                ("ph", "pH", "", r.Ph + settings.CalibrationPhOffset, settings.PhMin, settings.PhMax),
                ("tds", "TDS", " ppm", r.Tds * settings.CalibrationTdsFactor, settings.TdsMin, settings.TdsMax),
                ("waterTemp", "Water temperature", " °C", r.Temperature, settings.TempMin, settings.TempMax),
                ("waterLevel", "Water level", " %", r.WaterLevel, settings.WaterLevelMin, null),
            };

            var open = await _context.AlertLogs
                .Where(a => a.DeviceId == device.DeviceId && !a.Resolved)
                .ToListAsync();

            foreach (var c in checks)
            {
                var breached = (c.Min.HasValue && c.Value < c.Min.Value) || (c.Max.HasValue && c.Value > c.Max.Value);
                var existing = open.FirstOrDefault(a => a.SensorType == c.Sensor);

                if (breached && existing == null)
                {
                    var below = c.Min.HasValue && c.Value < c.Min.Value;
                    var limit = below ? c.Min!.Value : c.Max!.Value;
                    var range = below ? $"below minimum {limit}{c.Unit}" : $"above maximum {limit}{c.Unit}";
                    // Breaching a limit by more than 15% is critical, otherwise a warning.
                    var span = limit == 0 ? 1f : Math.Abs(limit - c.Value) / Math.Abs(limit);
                    _context.AlertLogs.Add(new AlertLog
                    {
                        Id = $"alert-{Guid.NewGuid():N}"[..14],
                        DeviceId = device.DeviceId,
                        DeviceName = device.Name,
                        Severity = span > 0.15f ? "critical" : "warning",
                        Message = $"{c.Label} is {c.Value:0.##}{c.Unit}, {range}",
                        Timestamp = DateTime.UtcNow,
                        SensorType = c.Sensor,
                        Value = c.Value
                    });
                }
                else if (!breached && existing != null)
                {
                    existing.Resolved = true;
                    existing.ResolvedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task<List<DeviceCommand>> GetPendingCommandsAsync(string deviceId)
        {
            var commands = await _context.DeviceCommands
                .Where(c => c.DeviceId == deviceId && c.Status == "Pending")
                .ToListAsync();

            foreach (var cmd in commands)
            {
                cmd.Status = "Sent";
            }
            
            if (commands.Any())
            {
                await _context.SaveChangesAsync();
            }

            return commands;
        }

        public async Task ConfirmCommandAsync(CommandConfirmationDto dto)
        {
            var command = await _context.DeviceCommands.FindAsync(dto.CommandId);
            if (command != null && command.DeviceId == dto.DeviceId)
            {
                command.Status = dto.Status;
                command.Response = dto.Response;
                command.ExecutedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        private static void RefreshOnlineStatus(Device d)
        {
            d.IsOnline = DateTime.UtcNow - d.LastSeen <= OnlineWindow;
        }

        public async Task<List<Device>> GetAllDevicesAsync()
        {
            var devices = await _context.Devices
                .AsNoTracking()
                .Include(d => d.SensorReadings.OrderByDescending(s => s.Timestamp).Take(1))
                .AsSplitQuery()
                .ToListAsync();
            devices.ForEach(RefreshOnlineStatus);
            return devices;
        }

        public async Task<Device?> GetDeviceByIdAsync(string deviceId)
        {
            var device = await _context.Devices
                .AsNoTracking()
                .Include(d => d.SensorReadings.OrderByDescending(s => s.Timestamp).Take(50))
                .Include(d => d.Commands.OrderByDescending(c => c.CreatedAt).Take(20))
                .AsSplitQuery()
                .FirstOrDefaultAsync(d => d.DeviceId == deviceId);
            if (device != null) RefreshOnlineStatus(device);
            return device;
        }

        public async Task<DeviceCommand?> QueueCommandAsync(string deviceId, CreateCommandDto dto)
        {
            // Queuing must not mark a device as online; only telemetry from the device does that.
            if (!await _context.Devices.AnyAsync(d => d.DeviceId == deviceId)) return null;

            var command = new DeviceCommand
            {
                DeviceId = deviceId,
                CommandType = dto.CommandType,
                CommandValue = dto.CommandValue,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };
            _context.DeviceCommands.Add(command);
            await _context.SaveChangesAsync();

            return command;
        }
    }
}
