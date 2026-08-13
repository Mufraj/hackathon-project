const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { appendLog, readLogs, updateLog, findLog, LOG_FILE } = require('./services/logStore');
const { resolveWithGrok } = require('./services/grokResolver');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function emitUpdate(log) {
  io.emit('log_updated', log);
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    grokConfigured: Boolean(process.env.GROK_API_KEY),
    logFile: LOG_FILE
  });
});

app.post('/api/logs', (req, res) => {
  try {
    if (!req.body.message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const logEntry = appendLog(req.body);
    io.emit('new_log', logEntry);
    res.status(201).json({ success: true, log: logEntry });
  } catch (err) {
    console.error('Failed to store log:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/logs', (req, res) => {
  const limit = Number.parseInt(req.query.limit || '200', 10);
  res.json({ logs: readLogs(limit) });
});

app.post('/api/logs/:id/resolve', async (req, res) => {
  const log = findLog(req.params.id);
  if (!log) return res.status(404).json({ error: 'Log not found' });

  const resolving = updateLog(log.id, { status: 'resolving', resolutionError: null });
  emitUpdate(resolving);

  const aiResolution = await resolveWithGrok(log);
  const updated = updateLog(log.id, {
    status: 'resolved',
    aiResolution,
    resolvedAt: new Date().toISOString(),
    resolutionError: aiResolution.status === 'fallback' ? aiResolution.reason : null
  });

  emitUpdate(updated);
  res.json({ success: true, log: updated });
});

app.post('/api/logs/:id/mark-resolved', (req, res) => {
  const existing = findLog(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Log not found' });

  const updated = updateLog(existing.id, {
    status: 'resolved',
    resolvedAt: new Date().toISOString(),
    aiResolution: existing.aiResolution || {
      provider: 'manual',
      status: 'manually-resolved',
      rootCause: 'Marked resolved by dashboard user.',
      suggestedFix: 'Manual verification complete.',
      confidence: 'medium',
      steps: []
    }
  });
  emitUpdate(updated);
  res.json({ success: true, log: updated });
});

app.post('/api/logs/:id/reopen', (req, res) => {
  const updated = updateLog(req.params.id, { status: 'open', resolvedAt: null });
  if (!updated) return res.status(404).json({ error: 'Log not found' });
  emitUpdate(updated);
  res.json({ success: true, log: updated });
});

app.get('/logs/logs.txt', (req, res) => {
  res.sendFile(LOG_FILE);
});

io.on('connection', (socket) => {
  console.log('Dashboard connected:', socket.id);
  socket.emit('initial_logs', readLogs());

  socket.on('disconnect', () => {
    console.log('Dashboard disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Logging server running on http://localhost:${PORT}`);
  console.log(`Grok resolution: ${process.env.GROK_API_KEY ? 'enabled' : 'fallback demo mode (set GROK_API_KEY to enable AI)'}`);
});
