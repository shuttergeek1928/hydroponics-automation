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
        Task<DeviceCommand> QueueCommandAsync(string deviceId, CreateCommandDto dto);
    }

    public class DeviceService : IDeviceService
    {
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
                LedState = dto.LedState,
                PumpState = dto.PumpState,
                Timestamp = DateTime.UtcNow,
                ReceivedAt = DateTime.UtcNow
            };
            _context.SensorData.Add(reading);
            await _context.SaveChangesAsync();

            return await GetPendingCommandsAsync(dto.DeviceId);
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

        public async Task<List<Device>> GetAllDevicesAsync()
        {
            return await _context.Devices
                .Include(d => d.SensorReadings.OrderByDescending(s => s.Timestamp).Take(1))
                .AsSplitQuery()
                .ToListAsync();
        }

        public async Task<Device?> GetDeviceByIdAsync(string deviceId)
        {
            return await _context.Devices
                .Include(d => d.SensorReadings.OrderByDescending(s => s.Timestamp).Take(50))
                .Include(d => d.Commands.OrderByDescending(c => c.CreatedAt).Take(20))
                .AsSplitQuery()
                .FirstOrDefaultAsync(d => d.DeviceId == deviceId);
        }

        public async Task<DeviceCommand> QueueCommandAsync(string deviceId, CreateCommandDto dto)
        {
            await EnsureDeviceExistsAsync(deviceId);

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
