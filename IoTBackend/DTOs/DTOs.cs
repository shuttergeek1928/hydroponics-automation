using System.Text.Json.Serialization;

namespace IoTBackend.DTOs
{
    public class SensorDataDto
    {
        [JsonPropertyName("device_id")]
        public string DeviceId { get; set; } = string.Empty;
        
        [JsonPropertyName("sensor_value")]
        public float SensorValue { get; set; }
        
        [JsonPropertyName("temperature")]
        public float Temperature { get; set; }
        
        [JsonPropertyName("led_state")]
        public string LedState { get; set; } = string.Empty;
        
        [JsonPropertyName("pump_state")]
        public string PumpState { get; set; } = string.Empty;
    }

    public class CommandConfirmationDto
    {
        [JsonPropertyName("device_id")]
        public string DeviceId { get; set; } = string.Empty;
        
        [JsonPropertyName("command_id")]
        public int CommandId { get; set; }
        
        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
        
        [JsonPropertyName("response")]
        public string Response { get; set; } = string.Empty;
    }

    public class CreateCommandDto
    {
        public string CommandType { get; set; } = string.Empty;
        public string CommandValue { get; set; } = string.Empty;
    }
}
