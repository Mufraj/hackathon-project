# Fixly Logging Server + AI Dashboard

Express + Socket.IO service that receives logs from the target app, persists them to `logs/logs.txt`, streams updates to the browser, and resolves errors with a server-side Grok API key.

## Run

```bash
npm install
cp .env.example .env
# Optional: set GROK_API_KEY=xai-... in .env
npm start
```

Dashboard: <http://localhost:4000>

## Environment

```env
PORT=4000
GROK_API_KEY=
GROK_MODEL=grok-2-latest
```

`GROK_API_KEY` is only read by `server.js`/backend services and is never embedded in frontend JavaScript. If the key is absent or the AI request fails, the server returns deterministic fallback resolutions for a reliable hackathon demo.

## Endpoints

- `POST /api/logs` — store and broadcast a log.
- `GET /api/logs` — read recent logs.
- `POST /api/logs/:id/resolve` — resolve via Grok or fallback resolver.
- `POST /api/logs/:id/mark-resolved` — manually mark a card resolved.
- `POST /api/logs/:id/reopen` — reopen a resolved card.
- `GET /logs/logs.txt` — raw file-backed log history.
- `GET /health` — server status and Grok configuration flag.

## Socket.IO events

- `initial_logs` — sent on dashboard connection.
- `new_log` — sent when a target app log arrives.
- `log_updated` — sent when status/resolution changes.
