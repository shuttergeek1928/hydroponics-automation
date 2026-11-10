using System;

namespace IoTBackend.Models
{
    public class AlertLog
    {
        public string Id { get; set; } = string.Empty;
        public string DeviceId { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public string Severity { get; set; } = "warning"; // critical, warning, info
        public string Message { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public bool Resolved { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string SensorType { get; set; } = string.Empty;
        public float? Value { get; set; }
    }
}
