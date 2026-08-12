const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;
const LOGS_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'logs.txt');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Helpers
const appendLogToFile = (logEntry) => {
  const line = `${JSON.stringify(logEntry)}\n`;
  fs.appendFile(LOG_FILE, line, 'utf8', (err) => {
    if (err) console.error('Failed to write log:', err);
  });
};

const readLogsFromFile = (limit = 100) => {
  try {
    const data = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = data.trim().split('\n').filter(Boolean);
    return lines.slice(-limit).map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return { message: line };
      }
    });
  } catch (err) {
    return [];
  }
};

// Routes

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/logs', (req, res) => {
  try {
    const { level, type, message, stack, source, timestamp } = req.body;
    
    // Basic validation
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const logEntry = {
      level: level || 'error',
      type: type || 'Error',
      message,
      stack: stack || '',
      source: source || 'unknown',
      timestamp: timestamp || new Date().toISOString()
    };

    // 1. Persist
    appendLogToFile(logEntry);

    // 2. Broadcast immediately
    io.emit('new_log', logEntry);

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/logs', (req, res) => {
  const logs = readLogsFromFile();
  res.json({ logs });
});

app.get('/logs/logs.txt', (req, res) => {
  res.sendFile(LOG_FILE);
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('Dashboard connected:', socket.id);
  // Send existing logs on connect
  socket.emit('initial_logs', readLogsFromFile());

  socket.on('disconnect', () => {
    console.log('Dashboard disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Logging server running on http://localhost:${PORT}`);
});
