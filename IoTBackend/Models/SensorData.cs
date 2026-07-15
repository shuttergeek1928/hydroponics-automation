using System;
using System.Text.Json.Serialization;

namespace IoTBackend.Models
{
    public class SensorData
    {
        public int Id { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public float SensorValue { get; set; }
        public float Temperature { get; set; }
        public string LedState { get; set; } = string.Empty;
        public string PumpState { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public DateTime ReceivedAt { get; set; }

        [JsonIgnore]
        public Device? Device { get; set; }
    }
}
