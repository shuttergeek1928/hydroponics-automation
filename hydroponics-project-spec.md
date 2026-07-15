# Hydroponics Automation System — Project Specification

## 1. Project Overview

An IoT-based hydroponics automation system using an **ESP32 Wrover Kit** as the edge device and a **.NET Core** backend API for device management, data storage, and remote command/control. The ESP32 collects sensor data, reports it to the backend, and executes remote commands (LED control, peristaltic pump control via relay, restart, configuration updates).

**Current device:** ESP32_001 (ESP32 Wrover Kit)
**Project path (local dev):** `HydrophonincsAutomation/HydrophonincsAutomationWifi/HydrophonincsAutomationWifi.ino`

---

## 2. Architecture

```
┌─────────────┐      HTTP (WiFi)      ┌──────────────────────┐
│   ESP32     │ ───────────────────▶  │  .NET Core Web API   │
│ Wrover Kit  │ ◀───────────────────  │  (Backend Server)    │
└─────────────┘                       └──────────┬───────────┘
      │                                          │
      │ Relay control                            │ Entity Framework
      ▼                                          ▼
┌─────────────┐                       ┌──────────────────────┐
│ Peristaltic │                       │   SQL Server DB      │
│    Pump     │                       │ (Devices, Sensor     │
└─────────────┘                       │  Data, Commands)     │
                                       └──────────────────────┘
```

- **ESP32** polls the backend for commands every 5 seconds and sends sensor data every 30 seconds.
- **Backend** stores device state, sensor history, and a command queue per device.
- Communication is **HTTP (not HTTPS)** on the local network, using form-urlencoded POST for data and JSON for command payloads.

---

## 3. Hardware Setup

| Component | ESP32 Pin | Notes |
|---|---|---|
| Built-in LED | GPIO 2 | Status/test indicator |
| Sensor (analog) | A0 | Example analog sensor (e.g., moisture/temperature) |
| Relay (peristaltic pump control) | **GPIO 26** | Drives relay IN pin |

**Relay wiring:**
```
ESP32 Pin 26 → Relay IN (control signal)
ESP32 GND    → Relay GND
ESP32 3.3V   → Relay VCC (or 5V, depending on relay module)

Relay:
- COM (Common)         → Power supply wire to pump
- NO (Normally Open)    → Other wire to pump
- NC (Normally Closed)  → Unused
```

⚠️ Pump is active when relay pin is driven **HIGH** in current code — verify against your relay module's logic (some relay boards are active-LOW).

---

## 4. Network Configuration

- ESP32 and the backend server **must be on the same local WiFi network**.
- Find backend host IP via `ipconfig` (Windows) → look for **IPv4 Address** under the active **Wireless LAN adapter Wi-Fi** (not the IPv6 address).
- Run backend bound to all interfaces so the ESP32 (a separate device) can reach it:
  ```bash
  dotnet run --urls="http://0.0.0.0:5119"
  ```
- ESP32 `serverURL` must match **both** the correct LAN IP and the port the backend is actually listening on.
- Windows Firewall must allow inbound traffic on the chosen port:
  ```bash
  netsh advfirewall firewall add rule name="ESP32 API" dir=in action=allow protocol=TCP localport=5119
  ```

**Known-good example values from testing:**
- Backend host IP: `192.168.1.26`
- Port: `5119`
- ESP32 assigned IP: `192.168.1.6`
- Full base URL: `http://192.168.1.26:5119/api`

---

## 5. ESP32 Firmware

### 5.1 Libraries Required
- `WiFi.h` (built-in ESP32 core)
- `HTTPClient.h` (built-in ESP32 core)
- `ArduinoJson.h` — **optional**. Install via Arduino IDE → Sketch → Include Library → Manage Libraries → search "ArduinoJson" (by Benoit Blanchon, v6.x). If you don't want the dependency, a manual string-parsing version (no ArduinoJson) is used instead — see `parseServerResponse()` below.

### 5.2 Configuration Constants
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverURL = "http://192.168.1.26:5119/api";  // match backend IP:port
const char* deviceID = "ESP32_001";

const int LED_PIN = 2;
const int SENSOR_PIN = A0;
const int PUMP_RELAY_PIN = 26;

const unsigned long SENSOR_INTERVAL = 30000;       // send sensor data every 30s
const unsigned long SERVER_CHECK_INTERVAL = 5000;  // poll for commands every 5s
const int HTTP_TIMEOUT = 10000;                    // 10s HTTP timeout
```

### 5.3 Core Functions

| Function | Purpose |
|---|---|
| `setup()` | Initializes pins, connects to WiFi |
| `loop()` | Timing loop — calls `sendSensorData()` every 30s, `checkForCommands()` every 5s |
| `sendSensorData()` | POSTs sensor readings (including pump/LED state) to `/sensor-data`; parses any commands in the response |
| `checkForCommands()` | GETs `/commands?device_id=...`; handles HTTP 204 (no commands) vs 200 (commands present) |
| `parseServerResponse(String response)` | Manual string-based JSON parsing (no library) — checks for `led_command`, `pump_command`, `pump_duration`, `restart`, `sensor_interval` keys |
| `confirmCommand(String command)` | POSTs execution confirmation back to `/command-confirmation` |
| `checkWiFiConnection()` | Reconnects WiFi if connection drops |

### 5.4 Supported Remote Commands (via response JSON)
- `led_command`: `"on"` / `"off"` → drives `LED_PIN`
- `pump_command`: `"on"` / `"off"` → drives `PUMP_RELAY_PIN` directly
- `pump_duration`: integer seconds (max 300 as a safety cap) → turns pump on, blocking `delay()` for that duration, then auto-off
- `restart`: `true` → confirms, waits 3s, then `ESP.restart()`
- `sensor_interval`: integer → intended to reconfigure `SENSOR_INTERVAL` (not yet wired to actually change the loop timing — placeholder confirmation only)

⚠️ **Design note:** `pump_duration` uses a blocking `delay()`, which pauses all other ESP32 activity (including command polling and sensor sends) for the duration. For longer or safety-critical runs, consider a non-blocking `millis()`-based state machine instead.

---

## 6. Backend (.NET Core Web API)

### 6.1 Stack
- ASP.NET Core Web API
- Entity Framework Core + SQL Server (LocalDB for dev)
- Swagger/OpenAPI enabled in development
- CORS fully open (`AllowAnyOrigin/Method/Header`) to permit ESP32 and browser access

### 6.2 Project Structure
```
IoTBackend/
├── Program.cs
├── Models/
│   ├── Device.cs
│   ├── SensorData.cs
│   └── DeviceCommand.cs
├── DTOs/
│   └── DeviceDto.cs   (SensorDataDto, CommandResponseDto, CommandConfirmationDto, CreateCommandDto)
├── Data/
│   └── IoTDbContext.cs
├── Services/
│   ├── IDeviceService.cs / DeviceService.cs
│   └── ICommandService.cs / CommandService.cs
└── Controllers/
    └── DeviceController.cs
```

### 6.3 Data Models
- **Device**: `Id, DeviceId, Name, IsOnline, LastSeen, CreatedAt, SensorReadings[], Commands[]`
- **SensorData**: `Id, DeviceId, Device, SensorValue, Temperature, LedState, PumpState, Timestamp, ReceivedAt`
- **DeviceCommand**: `Id, DeviceId, Device, CommandType, CommandValue, Status (Pending/Sent/Executed/Failed), CreatedAt, ExecutedAt, Response`

⚠️ **Known issue & fix (circular JSON reference):** Serializing `Device ↔ SensorReadings/Commands` navigation properties caused `JsonException: possible object cycle`. Fixed by:
1. Adding `[JsonIgnore]` to the back-reference `Device` property on `SensorData` and `DeviceCommand`, **and/or**
2. Configuring `ReferenceHandler.IgnoreCycles` + `DefaultIgnoreCondition = WhenWritingNull` in `Program.cs`'s `AddJsonOptions`, **and/or**
3. Avoiding deep `.Include()` chains in `GetAllDevicesAsync()` (project into a flattened shape instead), using `.AsSplitQuery()` where includes are needed.

### 6.4 API Endpoints

| Method | Route | Called By | Purpose |
|---|---|---|---|
| `POST` | `/api/sensor-data` | ESP32 (every 30s) | Upload sensor/LED/pump state; response carries any pending commands |
| `GET` | `/api/commands?device_id=X` | ESP32 (every 5s) | Poll for pending commands (204 = none, 200 = commands as JSON) |
| `POST` | `/api/command-confirmation` | ESP32 | Confirm a command was executed |
| `GET` | `/api/devices` | Dashboard/admin | List all registered devices |
| `GET` | `/api/devices/{deviceId}` | Dashboard/admin | Device detail + recent readings/commands |
| `POST` | `/api/devices/{deviceId}/commands` | Dashboard/admin/automation | Queue a new command for a device |
| `GET` | `/api/devices/{deviceId}/sensor-data?count=100` | Dashboard/analytics | Historical sensor readings |
| `GET` | `/api/devices/{deviceId}/commands` | Dashboard/audit | Command history + statuses |

### 6.5 Command Payload Examples
```json
{"CommandType": "led", "CommandValue": "on"}
{"CommandType": "pump", "CommandValue": "on"}
{"CommandType": "pump", "CommandValue": "off"}
{"CommandType": "pump_duration", "CommandValue": "30"}
{"CommandType": "restart", "CommandValue": "true"}
{"CommandType": "sensor_interval", "CommandValue": "60"}
```

### 6.6 Communication Flow

**Sensor data + inline command delivery:**
1. ESP32 reads sensors → POST `/api/sensor-data` (form-urlencoded)
2. Backend persists reading, updates device `LastSeen`/`IsOnline`
3. Backend looks up pending commands for that device, returns them in the JSON response body
4. ESP32 parses response, executes any commands immediately, then confirms via `/api/command-confirmation`

**Dedicated polling:**
1. ESP32 → GET `/api/commands?device_id=ESP32_001` every 5s
2. Backend returns 204 (nothing pending) or 200 + JSON commands
3. Commands are marked `Sent` once retrieved
4. ESP32 executes → POSTs confirmation → backend marks `Executed`/`Failed`

**Auto-registration:**
- First sensor-data POST from an unknown `device_id` auto-creates a `Device` row — no manual provisioning needed.

---

## 7. Setup Instructions (Recap)

### Backend
```bash
dotnet new webapi -n IoTBackend
cd IoTBackend
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools

# appsettings.json → ConnectionStrings:DefaultConnection
dotnet ef migrations add InitialCreate
dotnet ef database update

dotnet run --urls="http://0.0.0.0:5119"
```

### ESP32
1. Install ESP32 board support in Arduino IDE.
2. (Optional) Install `ArduinoJson` library, or use the no-library string-parsing variant.
3. Set `ssid`, `password`, `serverURL` (must match backend LAN IP + port), `deviceID`.
4. Wire relay to GPIO 26 as described in §3.
5. Upload and open Serial Monitor at 115200 baud to verify WiFi connect, IP assigned, and successful POST/GET cycles.

---

## 8. Known Issues / Troubleshooting Log

| Symptom | Cause | Fix |
|---|---|---|
| `fatal error: ArduinoJson.h: No such file or directory` | Library not installed | Install via Library Manager, or use manual string-parsing version |
| `Connection failed: -1` repeatedly | ESP32 `serverURL` IP/port didn't match backend's actual LAN IP/port, or server not bound to `0.0.0.0` | Match ipconfig IPv4 address + actual listening port; run with `--urls="http://0.0.0.0:PORT"`; allow port through firewall |
| `JsonException: possible object cycle detected` on `/api/devices` or `/api/devices/{id}` | EF navigation properties (`Device ↔ SensorReadings/Commands`) causing circular serialization | `[JsonIgnore]` on back-references + `ReferenceHandler.IgnoreCycles` in JSON options + avoid deep `.Include()` in list queries |

---

## 9. Open Items / Suggested Next Steps

- [ ] Wire up `sensor_interval` command to actually change `SENSOR_INTERVAL` at runtime (currently only confirmed, not applied)
- [ ] Replace blocking `delay()` in `pump_duration` handling with a non-blocking `millis()`-based timer so command polling/sensor sends aren't paused mid-pump-cycle
- [ ] Verify relay active-HIGH vs active-LOW logic against the actual relay module in use
- [ ] Add authentication/API key for device and management endpoints (currently open, CORS wide open, HTTP not HTTPS)
- [ ] Add a simple web dashboard for device monitoring and manual pump/LED control
- [ ] Add real sensor reading logic (currently temperature is simulated with `random()`)
- [ ] Consider moving pump safety limits (max duration, cooldown between runs) into backend validation, not just ESP32-side
- [ ] Add persistent storage/retry queue on ESP32 side for failed uploads (currently just logs the failure)
