# Fixly Remote Target Demo App (Docker Setup)

This repository contains the complete **Fixly Remote Target Demo Application** with Docker containerization, intentional error triggers, and SSH log streaming integration for Fixly self-healing monitoring.

---

## 🚀 Quickstart: Run with Docker

### Option 1: Using Docker Compose (Recommended)

```bash
# 1. Clone the repository on your VPS / Server
git clone <YOUR_REPO_URL> target_app
cd target_app

# 2. Build and start container in detached mode
docker compose up -d --build

# 3. Check container status & logs
docker compose ps
docker compose logs -f
```

### Option 2: Using Docker CLI Directly

```bash
# Build the Docker image
docker build -t fixly-target-app .

# Run the container with log volume mapping
docker run -d \
  --name fixly-target-app \
  -p 3000:3000 \
  -v $(pwd)/logs:/var/log/target_app \
  --restart unless-stopped \
  fixly-target-app
```

---

## 🌐 Application Dashboard & Health

Once deployed, access the web control panel in your browser:

- **Web Dashboard**: `http://<YOUR_VPS_IP>:3000`
- **Healthcheck**: `http://<YOUR_VPS_IP>:3000/health`
- **System Metrics**: `http://<YOUR_VPS_IP>:3000/api/status`
- **Live Logs API**: `http://<YOUR_VPS_IP>:3000/api/logs`

---

## ⚡ Intentional Error Scenarios & Endpoints

| Scenario | Trigger Endpoint | Target File & Line | Log Output Format |
| :--- | :--- | :--- | :--- |
| **1. DB Pool Exhaustion** | `GET /api/trigger/db-timeout` | [src/services/database.js:42](file:///f:/target/src/services/database.js#L42) | `ERROR [db_service]: Connection pool timeout after 30000ms. Max connections (10) reached at src/services/database.js:42` |
| **2. Null Reference TypeError** | `GET /api/trigger/null-ref` | [src/routes/user_profile.js:88](file:///f:/target/src/routes/user_profile.js#L88) | `ERROR [user_profile]: TypeError: Cannot read properties of undefined (reading 'account_status') at src/routes/user_profile.js:88` |
| **3. Unhandled Promise Rejection** | `GET /api/trigger/unhandled-rejection` | [src/services/payment_gateway.js:104](file:///f:/target/src/services/payment_gateway.js#L104) | `ERROR [payment_gateway]: UnhandledPromiseRejection: Invalid or expired API signature token at src/services/payment_gateway.js:104` |
| **4. CPU / Resource Spike** | `GET /api/trigger/resource-spike` | N/A (System Vitals) | Spikes CPU > 90% for 15 seconds to test SSH Vitals parser |

---

## 🧪 Running Automated Error Triggers

### On Linux / VPS (Bash):
```bash
chmod +x trigger_test_suite.sh
./trigger_test_suite.sh localhost:3000
```

### On Windows (PowerShell):
```powershell
.\trigger_test_suite.ps1 -TargetHost "localhost:3000"
```

### Using cURL Manually:
```bash
curl -X GET http://<SERVER_IP>:3000/api/trigger/db-timeout
curl -X GET http://<SERVER_IP>:3000/api/trigger/null-ref
curl -X GET http://<SERVER_IP>:3000/api/trigger/unhandled-rejection
curl -X GET http://<SERVER_IP>:3000/api/trigger/resource-spike
```

---

## 🔧 Fixly SSH Configuration Guide

Configure your Fixly target host settings with:

- **Target Log Stream Location**: `/var/log/target_app/app.log` (or host mounted `./logs/app.log`)
- **Port**: `3000`
- **SSH Key User**: User with read permissions to `/var/log/target_app/app.log` or `./logs/app.log`
