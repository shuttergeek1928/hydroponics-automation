using System;
using System.Text.Json.Serialization;

namespace IoTBackend.Models
{
    public class DeviceCommand
    {
        public int Id { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public string CommandType { get; set; } = string.Empty;
        public string CommandValue { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Sent, Executed, Failed
        public DateTime CreatedAt { get; set; }
        public DateTime? ExecutedAt { get; set; }
        public string Response { get; set; } = string.Empty;

        [JsonIgnore]
        public Device? Device { get; set; }
    }
}
