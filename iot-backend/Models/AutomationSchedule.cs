namespace IoTBackend.Models
{
    public class AutomationSchedule
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // watering, lighting, nutrient
        public string TimeStart { get; set; } = string.Empty;
        public string? TimeEnd { get; set; }
        public int? Duration { get; set; } // minutes
        public bool Active { get; set; }
        public string TargetDevice { get; set; } = string.Empty;
    }
}
