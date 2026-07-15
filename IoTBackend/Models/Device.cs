using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace IoTBackend.Models
{
    public class Device
    {
        public int Id { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsOnline { get; set; }
        public DateTime LastSeen { get; set; }
        public DateTime CreatedAt { get; set; }

        public ICollection<SensorData> SensorReadings { get; set; } = new List<SensorData>();
        public ICollection<DeviceCommand> Commands { get; set; } = new List<DeviceCommand>();
    }
}
