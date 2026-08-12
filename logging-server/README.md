# Fixly Target App & Logging Server MVP

This repository contains the existing Fixly target application (`target-app`) and a separate `logging-server` that captures and streams live errors from the target app.

## Architecture

```text
Existing Vercel App
http://localhost:3000

        |
        | HTTPS POST error event
        v

Logging Server (http://localhost:4000)

        |
        +--> persist logs (logs/logs.txt)
        |
        +--> WebSocket live stream
        |
        v

Live Log Dashboard (http://localhost:4000)
```

## How the Error Forwarding Works

When a custom test error is triggered in the target app, the error is caught by its express routes and passed to `src/utils/logger.js`. The logger writes the error to `logs/app.log` locally and immediately forwards it via an HTTP POST request to the remote Logging Server (`LOG_SERVER_URL/api/logs`).

## Environment Variables

### Target App (Root)
Create a `.env` in the root (optional):
```env
LOG_SERVER_URL=http://localhost:4000
```
*(If deployed on Vercel, set `LOG_SERVER_URL` in the Vercel project settings).*

### Logging Server (`logging-server/`)
Create a `.env` in the `logging-server` directory (see `logging-server/.env.example`):
```env
PORT=4000
```

## Setup & Local Development

### 1. Run the Logging Server
```bash
cd logging-server
npm install
npm run dev
```
- API is available at `http://localhost:4000/api/logs`
- Dashboard is available at `http://localhost:4000`

### 2. Run the Target App
In a new terminal window:
```bash
# In the root directory
npm install
LOG_SERVER_URL=http://localhost:4000 npm run dev
```
- Target App is available at `http://localhost:3000`

## API Endpoints (Logging Server)

- **`POST /api/logs`**: Accepts JSON logs (level, type, message, stack, source, timestamp). Validates and broadcasts.
- **`GET /api/logs`**: Returns the recent 100 log entries as JSON.
- **`GET /logs/logs.txt`**: Returns the raw plain-text log file.
- **`GET /health`**: Returns `{ "status": "ok" }`.

## WebSocket Endpoint

Connect to the Socket.IO server at the logging server root (e.g. `http://localhost:4000`).
- Event **`initial_logs`**: Emitted on connection, provides recent logs array.
- Event **`new_log`**: Emitted immediately when a new POST log is received.

## Deployment & Limitations

The Logging Server is built with Node.js and can be deployed on platforms like **Render, Heroku, or AWS**.

### ⚠️ Persistence Limitations

**IMPORTANT:** The MVP currently persists logs to `logs/logs.txt` using the local filesystem. If you deploy the logging server to an ephemeral filesystem (like Vercel, Heroku, or Render's free tier), the `logs.txt` file will be **lost and reset every time the server restarts or sleeps**. 

**Future Production Improvement:** For true persistence in production, the file-based persistence must be replaced with a real database (e.g., PostgreSQL, MongoDB, or Redis).
