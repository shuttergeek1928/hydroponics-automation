using System;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace IoTSimulator
{
    class Program
    {
        private static readonly HttpClient client = new HttpClient();
        private static readonly string baseUrl = "http://localhost:5119/api";
        private static readonly string deviceId = "ESP32_SIMULATOR_001";
        
        private static bool isPumpOn = false;
        private static bool isLedOn = false;
        private static Random random = new Random();

        static async Task Main(string[] args)
        {
            Console.WriteLine("========================================");
            Console.WriteLine("🌱 Hydroponics ESP32 Simulator Started");
            Console.WriteLine($"📱 Device ID: {deviceId}");
            Console.WriteLine($"🌐 Backend: {baseUrl}");
            Console.WriteLine("========================================");
            Console.WriteLine();

            // Run both tasks concurrently
            var sensorTask = RunSensorLoopAsync();
            var commandTask = RunCommandPollingAsync();

            await Task.WhenAll(sensorTask, commandTask);
        }

        static async Task RunSensorLoopAsync()
        {
            while (true)
            {
                try
                {
                    float temp = 20.0f + (float)(random.NextDouble() * 10.0); // 20-30 C
                    float moisture = 40.0f + (float)(random.NextDouble() * 50.0); // 40-90 %
                    
                    Console.WriteLine($"[SENSOR] Sending data (Temp: {temp:F1}C, Moisture: {moisture:F1}%)");

                    var formContent = new FormUrlEncodedContent(new[]
                    {
                        new KeyValuePair<string, string>("DeviceId", deviceId),
                        new KeyValuePair<string, string>("SensorValue", moisture.ToString()),
                        new KeyValuePair<string, string>("Temperature", temp.ToString()),
                        new KeyValuePair<string, string>("LedState", isLedOn ? "on" : "off"),
                        new KeyValuePair<string, string>("PumpState", isPumpOn ? "on" : "off")
                    });

                    var response = await client.PostAsync($"{baseUrl}/sensor-data", formContent);
                    
                    if (!response.IsSuccessStatusCode)
                    {
                        Console.WriteLine($"[ERROR] Sensor data send failed: {response.StatusCode}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ERROR] Sensor loop error: {ex.Message}");
                }

                await Task.Delay(30000); // 30 seconds
            }
        }

        static async Task RunCommandPollingAsync()
        {
            while (true)
            {
                try
                {
                    var response = await client.GetAsync($"{baseUrl}/commands?device_id={deviceId}");
                    
                    if (response.IsSuccessStatusCode && response.StatusCode != System.Net.HttpStatusCode.NoContent)
                    {
                        var json = await response.Content.ReadAsStringAsync();
                        var commands = JsonSerializer.Deserialize<List<DeviceCommandDto>>(json);

                        if (commands != null)
                        {
                            foreach (var cmd in commands)
                            {
                                Console.WriteLine($"[COMMAND] Received: {cmd.CommandType} -> {cmd.CommandValue}");
                                await ExecuteCommandAsync(cmd);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Silence network polling errors to avoid console spam when backend is off
                    // Console.WriteLine($"[ERROR] Command polling error: {ex.Message}");
                }

                await Task.Delay(5000); // 5 seconds
            }
        }

        static async Task ExecuteCommandAsync(DeviceCommandDto cmd)
        {
            string status = "Executed";
            string resMsg = "Success";

            try
            {
                if (cmd.CommandType == "led")
                {
                    isLedOn = (cmd.CommandValue.ToLower() == "on");
                    Console.WriteLine($"[ACTION] 💡 LED turned {(isLedOn ? "ON" : "OFF")}");
                }
                else if (cmd.CommandType == "pump")
                {
                    isPumpOn = (cmd.CommandValue.ToLower() == "on");
                    Console.WriteLine($"[ACTION] 💧 Pump turned {(isPumpOn ? "ON" : "OFF")}");
                }
                else if (cmd.CommandType == "pump_duration")
                {
                    if (int.TryParse(cmd.CommandValue, out int seconds))
                    {
                        Console.WriteLine($"[ACTION] 💧 Pump ON for {seconds} seconds");
                        isPumpOn = true;
                        
                        _ = Task.Run(async () => {
                            await Task.Delay(seconds * 1000);
                            isPumpOn = false;
                            Console.WriteLine($"[ACTION] 💧 Pump auto OFF after {seconds} seconds");
                        });
                    }
                }
                else
                {
                    Console.WriteLine($"[WARNING] Unknown command type: {cmd.CommandType}");
                    status = "Failed";
                    resMsg = "Unknown command";
                }
            }
            catch (Exception ex)
            {
                status = "Failed";
                resMsg = ex.Message;
            }

            // Send confirmation
            try
            {
                var formContent = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("DeviceId", deviceId),
                    new KeyValuePair<string, string>("CommandId", cmd.Id.ToString()),
                    new KeyValuePair<string, string>("Status", status),
                    new KeyValuePair<string, string>("Response", resMsg)
                });

                await client.PostAsync($"{baseUrl}/command-confirmation", formContent);
                Console.WriteLine($"[CONFIRM] Command {cmd.Id} confirmed as {status}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Failed to confirm command {cmd.Id}: {ex.Message}");
            }
        }
    }

    public class DeviceCommandDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        [JsonPropertyName("commandType")]
        public string CommandType { get; set; } = string.Empty;
        
        [JsonPropertyName("commandValue")]
        public string CommandValue { get; set; } = string.Empty;
    }
}
