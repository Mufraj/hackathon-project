# Fixly AI Error Logging Demo

A hackathon-ready Node.js demo with two cooperating apps:

- **Target app** (`http://localhost:3000`) intentionally generates math, coding, database, promise, and resource errors.
- **Logging server + dashboard** (`http://localhost:4000`) captures forwarded logs live, stores them on disk, and lets you resolve each error with a server-side Grok API key.

The dashboard never exposes `GROK_API_KEY` to browser JavaScript. If Grok is not configured or fails, the backend returns a polished local fallback so the live demo still shows root cause, suggested fix, confidence, and resolution status.

## One-command local demo

```bash
npm install
npm --prefix logging-server install

# Optional: enable real Grok/xAI resolution
# macOS/Linux: export GROK_API_KEY=xai-...
# Windows PowerShell: $env:GROK_API_KEY="xai-..."

npm run demo
```

Then open:

- Target app control panel: <http://localhost:3000>
- AI error dashboard: <http://localhost:4000>

`npm run demo` starts both servers and automatically triggers sample errors. On the dashboard, click **Resolve with Grok** on any error card.

## Manual local run

Terminal 1:

```bash
cd logging-server
cp .env.example .env
# edit .env and set GROK_API_KEY if available
npm install
npm start
```

Terminal 2:

```bash
npm install
LOG_SERVER_URL=http://localhost:4000 npm start
```

Terminal 3:

```bash
npm run demo:trigger
# or: ./trigger_test_suite.sh localhost:3000
```

## Docker Compose

```bash
# Optional real AI resolution
export GROK_API_KEY=xai-your-key

docker compose up --build
```

Services:

- `target-app`: <http://localhost:3000>
- `logging-server`: <http://localhost:4000>

## Error scenarios

| Scenario | Endpoint | Dashboard source | Demo fix |
| --- | --- | --- | --- |
| DB pool exhaustion | `GET /api/trigger/db-timeout` | `db_service` | Release DB clients in `finally`, review pool limits. |
| Null reference TypeError | `GET /api/trigger/null-ref` | `user_profile` | Guard `req.user` / use optional chaining. |
| Promise rejection | `GET /api/trigger/unhandled-rejection` | `payment_gateway` | Wrap async calls in `try/catch`, handle expired tokens. |
| CPU/resource spike | `GET /api/trigger/resource-spike` | target metrics/logs | Offload heavy work and limit concurrency. |
| Math division by zero | `GET /api/trigger/math-error` | `math_engine` | Validate denominator before division. |
| Coding syntax error | `GET /api/trigger/syntax-error` | `code_compiler` | Fix missing parenthesis in reducer expression. |

## Dashboard capabilities

- Live Socket.IO updates for new and updated logs.
- Severity, timestamp, source, status, and raw message display.
- Filter by level and resolution status.
- Resolve with Grok via `POST /api/logs/:id/resolve`.
- Manual **Mark resolved** and **Reopen** actions.
- File-backed log history in `logging-server/logs/logs.txt`.

## API quick reference

Target app:

- `GET /health`
- `GET /api/status`
- `GET /api/logs?limit=40`
- `GET /api/trigger/db-timeout`
- `GET /api/trigger/null-ref`
- `GET /api/trigger/unhandled-rejection`
- `GET /api/trigger/resource-spike`
- `GET /api/trigger/math-error`
- `GET /api/trigger/syntax-error`

Logging server:

- `POST /api/logs` — target app forwards logs here.
- `GET /api/logs` — dashboard history.
- `POST /api/logs/:id/resolve` — server-side Grok/fallback resolution.
- `POST /api/logs/:id/mark-resolved`
- `POST /api/logs/:id/reopen`

## Environment variables

Root target app:

- `PORT` — default `3000`.
- `LOG_SERVER_URL` — set to `http://localhost:4000` locally or `http://logging-server:4000` in Docker.
- `LOG_FILE` — optional local target log file path.

Logging server:

- `PORT` — default `4000`.
- `GROK_API_KEY` — optional xAI/Grok API key, server-side only.
- `GROK_MODEL` — optional, default `grok-2-latest`.
