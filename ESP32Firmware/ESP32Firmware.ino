/*
 * 🌱 HydroFlow — ESP32/ESP8266 Microcontroller Firmware
 * 
 * Target Hardware: ESP32 (Wrover Kit / DevKitC) or ESP8266
 * Framework: Arduino C++
 * 
 * Features:
 *  - Non-blocking execution using millis() timers (no blocking delay()).
 *  - Automatic Wi-Fi connection monitoring & background reconnection.
 *  - Form-urlencoded POST to `/api/sensor-data` (sends pH, TDS, water temp, 
 *    water level, dissolved oxygen, ambient temp, humidity, and relay states).
 *  - High-frequency GET polling to `/api/commands?device_id=...` every 5 seconds.
 *  - Non-blocking peristaltic pump execution for `pump_duration` commands
 *    (preventing ESP32 freezes during watering).
 *  - Hardware confirmation POST back to `/api/command-confirmation` on success/failure.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>  // Install via Library Manager (Benoit Blanchon v6+)

// ==========================================
// NETWORK & CONFIGURATION CONSTANTS
// ==========================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverURL = "http://192.168.1.4:5119/api"; // Replace with your backend host LAN IP!
const char* deviceId = "ESP32_001";                   // NFT, DWC, Drip, or Aeroponics System Node

// ==========================================
// GPIO PIN CONFIGURATION
// ==========================================
#define STATUS_LED_PIN   2    // Built-in status LED
#define PUMP_RELAY_PIN  26    // Peristaltic pump control relay

// Analog Sensor Channels
#define PIN_PH_PROBE    36    // GPIO 36 (A0 / ADC1_CH0) - Analog pH Probe
#define PIN_TDS_PROBE   39    // GPIO 39 (A3 / ADC1_CH3) - Analog EC / TDS Probe
#define PIN_WATER_LEVEL 34    // GPIO 34 (A6 / ADC1_CH6) - Water Level Sensor
#define PIN_DO_PROBE    35    // GPIO 35 (A7 / ADC1_CH7) - Dissolved Oxygen Probe

// Placeholder parameters for calibration
const float ADC_VOLTAGE_REF = 3.3;
const int ADC_RESOLUTION = 4095;

// ==========================================
// TIME & SCHEDULING INTERVALS (non-blocking)
// ==========================================
unsigned long lastSensorTime = 0;
unsigned long sensorInterval = 30000;  // Telemetry uploaded every 30 seconds

unsigned long lastCommandTime = 0;
const unsigned long commandInterval = 5000; // Poll commands every 5 seconds

// Pump Duration state variables (non-blocking pump running)
bool isPumpActive = false;
unsigned long pumpStartTime = 0;
unsigned long pumpDurationMs = 0;

// Device state variables
bool currentLedState = false;
bool currentPumpState = false;

// ==========================================
// SETUP FUNCTION
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n========================================");
  Serial.println("🌱 HydroFlow Node Booting up...");
  Serial.printf("Device Node ID: %s\n", deviceId);
  Serial.println("========================================");

  // Initialize digital outputs
  pinMode(STATUS_LED_PIN, OUTPUT);
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);
  digitalWrite(PUMP_RELAY_PIN, LOW); // Assumes active-HIGH relay. Change if active-LOW.

  // Configure Analog inputs
  pinMode(PIN_PH_PROBE, INPUT);
  pinMode(PIN_TDS_PROBE, INPUT);
  pinMode(PIN_WATER_LEVEL, INPUT);
  pinMode(PIN_DO_PROBE, INPUT);

  // Connect to Wi-Fi
  connectWiFi();
}

// ==========================================
// MAIN POLLING LOOP
// ==========================================
void loop() {
  // Ensure network connection remains active
  checkWiFiConnection();

  unsigned long currentMillis = millis();

  // 1. Non-blocking telemetry post loop
  if (currentMillis - lastSensorTime >= sensorInterval) {
    lastSensorTime = currentMillis;
    uploadSensorData();
  }

  // 2. Non-blocking command fetch loop
  if (currentMillis - lastCommandTime >= commandInterval) {
    lastCommandTime = currentMillis;
    fetchPendingCommands();
  }

  // 3. Non-blocking peristaltic pump timer execution
  if (isPumpActive) {
    if (currentMillis - pumpStartTime >= pumpDurationMs) {
      // Duration reached! Shut down the pump relay
      isPumpActive = false;
      currentPumpState = false;
      digitalWrite(PUMP_RELAY_PIN, LOW);
      Serial.println("[PUMP] Non-blocking duration cycle completed. Relay turned OFF.");
    }
  }
}

// ==========================================
// TELEMETRY UPLOAD ROUTINES
// ==========================================
void uploadSensorData() {
  if (WiFi.status() != WL_CONNECTED) return;

  // Gather sensor signals and apply calibration offsets
  float rawPh = readPhSensor();
  float rawTds = readTdsSensor();
  float rawWaterTemp = readWaterTempSensor();
  float rawWaterLevel = readWaterLevelSensor();
  float rawDO = readDissolvedOxygenSensor();
  float rawAmbientTemp = readAmbientTempSensor();
  float rawHumidity = readHumiditySensor();

  Serial.println("\n[TELEMETRY] Gathering local readings:");
  Serial.printf(" - pH Offset: %.2f\n", rawPh);
  Serial.printf(" - Nutrients: %.1f ppm\n", rawTds);
  Serial.printf(" - Water Temperature: %.1f °C\n", rawWaterTemp);
  Serial.printf(" - Reservoir Level: %.1f %%\n", rawWaterLevel);
  Serial.printf(" - Dissolved Oxygen: %.2f mg/L\n", rawDO);
  Serial.printf(" - Greenhouse Ambient: %.1f °C, %.1f %% RH\n", rawAmbientTemp, rawHumidity);

  HTTPClient http;
  String postUrl = String(serverURL) + "/sensor-data";
  http.begin(postUrl);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");

  // Construct URL encoded body matching .NET SensorDataDto binding fields
  String postBody = "device_id=" + String(deviceId) +
                    "&sensor_value=" + String(rawWaterLevel) + // Moisture placeholder
                    "&temperature=" + String(rawWaterTemp) +
                    "&ph=" + String(rawPh) +
                    "&tds=" + String(rawTds) +
                    "&water_level=" + String(rawWaterLevel) +
                    "&dissolved_oxygen=" + String(rawDO) +
                    "&ambient_temp=" + String(rawAmbientTemp) +
                    "&humidity=" + String(rawHumidity) +
                    "&led_state=" + String(currentLedState ? "on" : "off") +
                    "&pump_state=" + String(currentPumpState ? "on" : "off");

  int httpCode = http.POST(postBody);
  
  if (httpCode > 0) {
    Serial.printf("[TELEMETRY] Post successful. Status code: %d\n", httpCode);
    if (httpCode == HTTP_CODE_OK) {
      String response = http.getString();
      // Backend records data and outputs inline list of pending commands immediately
      parseAndExecuteCommands(response);
    }
  } else {
    Serial.printf("[ERROR] Telemetry upload failed: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

// ==========================================
// COMMAND FETCHING & EXECUTION
// ==========================================
void fetchPendingCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String fetchUrl = String(serverURL) + "/commands?device_id=" + String(deviceId);
  http.begin(fetchUrl);

  int httpCode = http.GET();
  
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    parseAndExecuteCommands(payload);
  } else if (httpCode == HTTP_CODE_NO_CONTENT) {
    // No commands pending, do nothing
  } else {
    // Silent errors for network robustness
  }
  http.end();
}

void parseAndExecuteCommands(String jsonPayload) {
  if (jsonPayload.length() == 0 || jsonPayload == "[]") return;

  DynamicJsonDocument doc(2048);
  DeserializationError error = deserializeJson(doc, jsonPayload);

  if (error) {
    Serial.printf("[ERROR] JSON Deserialization failed: %s\n", error.c_str());
    return;
  }

  JsonArray array = doc.as<JsonArray>();
  for (JsonObject cmd : array) {
    int cmdId = cmd["id"];
    String commandType = cmd["commandType"].as<String>();
    String commandValue = cmd["commandValue"].as<String>();

    Serial.printf("[COMMAND] Processing Command ID %d: %s -> %s\n", cmdId, commandType.c_str(), commandValue.c_str());
    executeCommand(cmdId, commandType, commandValue);
  }
}

void executeCommand(int cmdId, String type, String value) {
  String status = "Executed";
  String responseMsg = "OK";

  if (type == "led") {
    currentLedState = (value.equalsIgnoreCase("on") || value == "1");
    digitalWrite(STATUS_LED_PIN, currentLedState ? HIGH : LOW);
    Serial.printf("[RELAY] 💡 Status LED written: %s\n", currentLedState ? "ON" : "OFF");
  } 
  else if (type == "pump") {
    // Direct manual override toggle
    isPumpActive = false; // Disables any active duration timer
    currentPumpState = (value.equalsIgnoreCase("on") || value == "1");
    digitalWrite(PUMP_RELAY_PIN, currentPumpState ? HIGH : LOW);
    Serial.printf("[RELAY] 💧 Peristaltic Pump written: %s\n", currentPumpState ? "ON" : "OFF");
  } 
  else if (type == "pump_duration") {
    // Safe duration-based run
    int durationSec = value.toInt();
    if (durationSec > 0 && durationSec <= 300) { // 5-minute maximum safety cap
      isPumpActive = true;
      currentPumpState = true;
      pumpStartTime = millis();
      pumpDurationMs = (unsigned long)durationSec * 1000;
      
      digitalWrite(PUMP_RELAY_PIN, HIGH);
      Serial.printf("[RELAY] 💧 Pump duration trigger. Running for %d seconds (non-blocking).\n", durationSec);
      responseMsg = "Watering started for " + String(durationSec) + "s";
    } else {
      status = "Failed";
      responseMsg = "Duration out of bounds (1-300 seconds)";
    }
  } 
  else if (type == "restart") {
    Serial.println("[SYSTEM] Reboot command received. Restarting in 3 seconds...");
    confirmCommandToServer(cmdId, "Executed", "Device rebooting");
    delay(3000);
    ESP.restart();
    return; // Will not reach
  } 
  else if (type == "sensor_interval") {
    int newInterval = value.toInt();
    if (newInterval >= 5 && newInterval <= 3600) {
      sensorInterval = (unsigned long)newInterval * 1000;
      Serial.printf("[SYSTEM] Telemetry upload interval updated to %d seconds.\n", newInterval);
      responseMsg = "Telemetry interval updated";
    } else {
      status = "Failed";
      responseMsg = "Interval out of bounds (5-3600 seconds)";
    }
  } 
  else {
    status = "Failed";
    responseMsg = "Unknown command parameters";
    Serial.printf("[WARNING] Unknown command commandType: %s\n", type.c_str());
  }

  // Send execution results back to backend to close control loop
  confirmCommandToServer(cmdId, status, responseMsg);
}

void confirmCommandToServer(int cmdId, String status, String responseMsg) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String confirmUrl = String(serverURL) + "/command-confirmation";
  http.begin(confirmUrl);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");

  String payload = "device_id=" + String(deviceId) +
                   "&command_id=" + String(cmdId) +
                   "&status=" + status +
                   "&response=" + responseMsg;

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.printf("[CONFIRM] Command %d resolved as %s. Server return: %d\n", cmdId, status.c_str(), httpCode);
  } else {
    Serial.printf("[ERROR] Failed to send command confirmation: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

// ==========================================
// CALIBRATION & ANALOG SENSOR READ ROUTINES
// ==========================================
float readPhSensor() {
  int rawAdc = analogRead(PIN_PH_PROBE);
  float voltage = (float)rawAdc * ADC_VOLTAGE_REF / ADC_RESOLUTION;
  // Standard pH calibration curve placeholder: pH = 3.5 * voltage + offset
  float ph = 3.5 * voltage + 0.5; // Calibrated around pH 7 (2.0V)
  if (ph < 0.0) ph = 0.0;
  if (ph > 14.0) ph = 14.0;
  return ph;
}

float readTdsSensor() {
  int rawAdc = analogRead(PIN_TDS_PROBE);
  float voltage = (float)rawAdc * ADC_VOLTAGE_REF / ADC_RESOLUTION;
  // EC-to-TDS mapping placeholder (e.g. TDS = 500 * EC)
  float tds = (133.42 * pow(voltage, 3) - 255.86 * pow(voltage, 2) + 857.39 * voltage) * 0.5;
  if (tds < 0.0) tds = 0.0;
  return tds; // ppm
}

float readWaterTempSensor() {
  // Simulates a DS18B20 digital thermal reading
  // In real hardware, use OneWire & DallasTemperature libraries
  return 21.5 + (random(-5, 5) / 10.0); 
}

float readWaterLevelSensor() {
  int rawAdc = analogRead(PIN_WATER_LEVEL);
  float levelPercent = ((float)rawAdc / ADC_RESOLUTION) * 100.0;
  if (levelPercent > 100.0) levelPercent = 100.0;
  if (levelPercent < 0.0) levelPercent = 0.0;
  return levelPercent; // % full
}

float readDissolvedOxygenSensor() {
  int rawAdc = analogRead(PIN_DO_PROBE);
  float voltage = (float)rawAdc * ADC_VOLTAGE_REF / ADC_RESOLUTION;
  // Dissolved Oxygen mapping placeholder: DO (mg/L) = 16/3 * voltage
  float dissolvedOxygen = (16.0 / 3.0) * voltage;
  if (dissolvedOxygen < 0.0) dissolvedOxygen = 0.0;
  return dissolvedOxygen; // mg/L
}

float readAmbientTempSensor() {
  // Simulates DHT22 temperature reading
  return 24.5 + (random(-10, 10) / 10.0);
}

float readHumiditySensor() {
  // Simulates DHT22 relative humidity reading
  return 60.0 + (random(-20, 20) / 10.0);
}

// ==========================================
// NETWORK ROBUSTNESS & WIFI MANAGEMENT
// ==========================================
void connectWiFi() {
  Serial.print("[WIFI] Connecting to SSID: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int retryCount = 0;
  while (WiFi.status() != WL_CONNECTED && retryCount < 20) {
    delay(500);
    Serial.print(".");
    retryCount++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected successfully!");
    Serial.printf("[WIFI] Assigned Node IP Address: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WIFI] Connection timed out. Running in offline telemetry accumulation mode.");
  }
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    // Non-blocking reconnect trigger: only attempts connection setup if not already active
    static unsigned long lastWiFiCheck = 0;
    if (millis() - lastWiFiCheck >= 15000) {
      lastWiFiCheck = millis();
      Serial.println("[WIFI] Connection lost. Re-attempting handshake...");
      WiFi.disconnect();
      WiFi.begin(ssid, password);
    }
  }
}
