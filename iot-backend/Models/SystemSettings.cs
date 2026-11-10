namespace IoTBackend.Models
{
    public class SystemSettings
    {
        public int Id { get; set; }
        public string BackendUrl { get; set; } = "http://localhost:5119";
        public bool UseMock { get; set; } = false;
        public float CalibrationPhOffset { get; set; } = 0.0f;
        public float CalibrationTdsFactor { get; set; } = 1.0f;
        public float PhMin { get; set; } = 5.5f;
        public float PhMax { get; set; } = 6.5f;
        public float TdsMin { get; set; } = 800f;
        public float TdsMax { get; set; } = 1200f;
        public float TempMin { get; set; } = 18.0f;
        public float TempMax { get; set; } = 23.0f;
        public float WaterLevelMin { get; set; } = 70f;
        public float HumidityMin { get; set; } = 50f;
        public float HumidityMax { get; set; } = 70f;
    }
}
