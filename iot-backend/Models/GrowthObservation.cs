using System;

namespace IoTBackend.Models
{
    public class GrowthObservation
    {
        public string Id { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty; // YYYY-MM-DD
        public string PlantName { get; set; } = string.Empty;
        public string Stage { get; set; } = string.Empty; // Seedling, Vegetative, Flowering, Fruiting, Harvest
        public double? HeightCm { get; set; }
        public string Health { get; set; } = string.Empty; // Excellent, Good, Fair, Poor
        public string Notes { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

