# 🌱 Hydroponics Automation System

Welcome to the **Hydroponics Automation System** repository. This is an end-to-end, IoT-based automation solution designed to monitor and control hydroponic environments. It integrates physical sensor polling, remote actuator execution, a database-backed REST API, a live control dashboard, and a simulation layer for offline development.

---

## 📐 Architecture Overview

```mermaid
graph TD
    %% Nodes
    ESP32["📟 ESP32 Wrover Kit<br/>(Physical Device / GPIO)"]
    SIM["💻 IoT Console Simulator<br/>(C# Console App)"]
    API["⚙️ .NET 8 Web API<br/>(Backend Host)"]
    DB[("🗄️ SQL Server DB<br/>(LocalDB / RDS)"]
    FE["🖥️ Next.js Dashboard<br/>(React Frontend)"]

    %% Communications
    ESP32 -- "HTTP POST (Sensor Data)" --> API
    ESP32 -- "HTTP GET (Poll Commands)" --> API
    SIM -- "HTTP POST (Simulated Sensors)" --> API
    SIM -- "HTTP GET (Poll Commands)" --> API
    
    FE -- "REST API Requests" --> API
    FE -- "Queue Commands" --> API
    
    API -- "Entity Framework Core" --> DB
```

### Flow of Operations
1. **Telemetry Upload:** The edge device (or simulator) posts sensor readings (moisture, temperature, LED status, pump status) to `/api/sensor-data` every **30 seconds**.
2. **Command Dispatch:** 
   - The device polls `/api/commands?device_id=...` every **5 seconds** for queued commands.
   - The API returns pending commands (e.g., LED toggle, pump actuation, system reboot) and marks them as `Sent`.
3. **Execution & Confirmation:** The device executes the command and posts a verification payload back to `/api/command-confirmation` to close the loop.

---

## 📂 Repository Structure

The project is structured as a multi-stack monorepo, organizing frontend, backend, simulation, and assistant tooling separately:

```
HydroponicsAutomation/
├── .github/                   # GitHub configuration & Actions workflows
│   └── workflows/
│       └── ci.yml             # CI build & test workflow for .NET and Next.js
├── .gitignore                 # Consolidated root gitignore (covers .NET, Next.js, C++)
├── README.md                  # Root documentation (this file)
├── hydroponics-context.md     # Personal developer context & goals
├── hydroponics-project-spec.md# Detailed project technical specifications
│
├── IoTBackend/                # ASP.NET Core 8 Web API Project
│   ├── Controllers/           # REST Endpoints (Device, SensorData, Commands)
│   ├── Data/                  # EF Core Database Context & Configuration
│   ├── DTOs/                  # Data Transfer Objects for API payloads
│   ├── Models/                # Database entities (Device, SensorData, DeviceCommand)
│   ├── Services/              # Business logic interfaces & implementations
│   ├── Program.cs             # Application configuration and middleware
│   └── appsettings.json       # App configurations (Connection Strings, Logging)
│
├── iot-frontend/              # Next.js 15 Web Application
│   ├── src/
│   │   └── app/               # Next.js App Router (Dashboard Pages, Styling)
│   ├── package.json           # Node dependencies and build scripts
│   └── tsconfig.json          # TypeScript compilation settings
│
├── IoTSimulator/              # C# Console Application
│   ├── Program.cs             # Emulates ESP32 HTTP telemetry & polling loop
│   └── IoTSimulator.csproj    # Simulator dependencies
│
└── Antigravity-Ultimate-Starter/
    └── Antigravity-Ultimate-Starter/
        ├── agents/            # Custom AI agent prompts and behaviors
        ├── skills/            # Custom skills and tool packages
        └── templates/         # Code template files for AI generation
```

---

## ⚡ Setup & Local Development

### 1. Database Setup (.NET Backend)
The backend uses **SQL Server LocalDB** by default for local development.

1. Ensure you have the .NET 8 SDK and SQL Server LocalDB installed.
2. Open a terminal in the `IoTBackend` folder:
   ```bash
   cd IoTBackend
   ```
3. Install EF Core tools if you haven't already:
   ```bash
   dotnet tool install --global dotnet-ef
   ```
4. Run migrations to create the database schema:
   ```bash
   dotnet ef database update
   ```

### 2. Running the Backend
To make the backend reachable by the ESP32 (or other devices on the same local network), bind it to all local network interfaces:
```bash
dotnet run --urls="http://0.0.0.0:5119"
```
*Swagger UI will be available locally at:* `http://localhost:5119/swagger`

### 3. Running the IoT Simulator
If you do not have a physical ESP32 connected, you can run the C# console simulator:
1. Navigate to the `IoTSimulator` directory:
   ```bash
   cd IoTSimulator
   ```
2. Start the simulator:
   ```bash
   dotnet run
   ```
The simulator will register a mock device (`ESP32_SIMULATOR_001`), stream random temperatures/moistures, and print updates when you queue commands from the web dashboard.

### 4. Running the Web Frontend
The web dashboard is built using Next.js.
1. Navigate to the `iot-frontend` directory:
   ```bash
   cd iot-frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
*The dashboard will be active at:* `http://localhost:3000`

---

## 📡 Connecting a Physical ESP32

To connect a physical ESP32 (Wrover Kit) to your local backend server, follow these networking configurations:

1. **Find Backend IP:** Run `ipconfig` on your Windows host. Look for the **IPv4 Address** of your active WiFi card (e.g., `192.168.1.26`).
2. **Firmware Config:** Open your Arduino/ESP32 sketch (`HydroponicsAutomationWifi.ino`) and edit:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   const char* serverURL = "http://<YOUR_BACKEND_LAN_IP>:5119/api"; 
   ```
3. **Firewall Rule:** Run this command in an Administrator PowerShell window to permit the ESP32 to send HTTP requests through the Windows Defender Firewall:
   ```powershell
   netsh advfirewall firewall add rule name="ESP32 API Access" dir=in action=allow protocol=TCP localport=5119
   ```

---

## 🐙 GitHub Initialization & Structure

Follow these steps to initialize the root folder as a single git repository and push it to GitHub.

### ⚠️ Important: Resolve Pre-existing Repositories
The `iot-frontend` directory may already have a `.git` folder. To avoid git nested repository conflicts or git submodule warnings:
1. Delete the `.git` folder inside `iot-frontend`:
   ```powershell
   Remove-Item -Path .\iot-frontend\.git -Recurse -Force
   ```

### 1. Initialize Git in the Root Directory
From the root of `HydroponicsAutomation`, run:
```bash
git init
```

### 2. Verify Ignored Files
Run `git status` to ensure build folders (`bin`, `obj`, `.next`, `node_modules`, `.vs`) are correctly ignored by the root-level `.gitignore`:
```bash
git status
```

### 3. Commit the Code base
```bash
git add .
git commit -m "initial commit: project structure setup with .NET Core backend, Next.js frontend, and IoT Simulator"
```

### 4. Link to GitHub and Push
Create a repository on GitHub (e.g., `HydroponicsAutomation`), and then link it:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/HydroponicsAutomation.git
git push -u origin main
```

---

## 🛠️ Hardware Mapping Reference

| Component | ESP32 Wrover Pin | Purpose / Function |
|---|---|---|
| **Built-in LED** | `GPIO 2` | Local execution / status indicator |
| **Relay Signal** | `GPIO 26` | Switches the power circuit for the peristaltic pump |
| **Analog Sensor** | `GPIO 36 (A0 / ADC1_CH0)` | Reads hydroponic nutrient water level or soil moisture |
| **Relay Common (COM)**| — | Connected to pump positive power terminal |
| **Relay NO (Normally Open)**| — | Connected to power supply positive terminal |

---

## 📌 Suggested Future Extensions
- [ ] **Non-blocking Pump Controller:** Upgrade ESP32 firmware to use non-blocking `millis()` logic instead of blocking `delay()` during a pump cycle.
- [ ] **HTTPS / Auth:** Implement authentication headers for API communications and transition to secure TLS endpoints.
- [ ] **Real Sensors:** Connect calibration curves for specific EC (Electrical Conductivity) and pH probes in place of analog simulation.
