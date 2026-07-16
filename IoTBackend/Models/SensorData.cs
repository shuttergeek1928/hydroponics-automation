using System;
using System.Text.Json.Serialization;

namespace IoTBackend.Models
{
    public class SensorData
    {
        public int Id { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public float SensorValue { get; set; } // Moisture (drip zone)
        public float Temperature { get; set; } // Water Temp
        public float Ph { get; set; }
        public float Tds { get; set; }
        public float WaterLevel { get; set; }
        public float DissolvedOxygen { get; set; }
        public float AmbientTemp { get; set; }
        public float Humidity { get; set; }
        public string LedState { get; set; } = string.Empty;
        public string PumpState { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public DateTime ReceivedAt { get; set; }

        [JsonIgnore]
        public Device? Device { get; set; }
    }
}
