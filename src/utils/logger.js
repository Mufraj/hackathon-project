const fs = require('fs');
const path = require('path');

// Determine log file location
const logFilePath = process.env.LOG_FILE || path.join(__dirname, '../../logs/app.log');

// Ensure log directory exists
try {
  const dir = path.dirname(logFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
} catch (err) {
  console.error(`[Logger Init Error] Failed to create directory for ${logFilePath}:`, err.message);
}

/**
 * Append formatted log entry to file and console, and forward to logging server
 */
function logEntry(level, component, message) {
  const timestamp = new Date().toISOString();
  const formattedLine = `[${timestamp}] ${level.toUpperCase()} [${component}]: ${message}\n`;

  // Output to standard console
  if (level.toLowerCase() === 'error') {
    process.stderr.write(formattedLine);
  } else {
    process.stdout.write(formattedLine);
  }

  // Forward to remote logging server
  const logServerUrl = process.env.LOG_SERVER_URL || process.env.VITE_LOG_SERVER_URL;
  if (logServerUrl) {
    const payload = {
      level: level.toLowerCase(),
      type: level.toUpperCase(),
      message,
      source: component,
      timestamp
    };
    
    // Fire and forget fetch (Node 18+)
    if (typeof fetch !== 'undefined') {
      fetch(`${logServerUrl}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => {
        // Silently ignore remote logging failures to not crash the app
      });
    }
  }

  // Append to log file for SSH monitoring / Fixly parser
  try {
    fs.appendFileSync(logFilePath, formattedLine, 'utf8');
  } catch (err) {
    // If primary path fails (e.g. permission error), fallback to local logs dir
    try {
      const fallbackPath = path.join(__dirname, '../../logs/app.log');
      const dir = path.dirname(fallbackPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(fallbackPath, formattedLine, 'utf8');
    } catch (fallbackErr) {
      console.error('[Logger Write Error]:', err.message);
    }
  }
}

/**
 * Read latest log lines from log file
 */
function getRecentLogs(limit = 100) {
  try {
    let targetPath = logFilePath;
    if (!fs.existsSync(targetPath)) {
      targetPath = path.join(__dirname, '../../logs/app.log');
    }
    if (!fs.existsSync(targetPath)) return [];
    
    const content = fs.readFileSync(targetPath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    return lines.slice(-limit);
  } catch (err) {
    return [`[Error reading log file]: ${err.message}`];
  }
}

module.exports = {
  log: logEntry,
  info: (comp, msg) => logEntry('INFO', comp, msg),
  error: (comp, msg) => logEntry('ERROR', comp, msg),
  warn: (comp, msg) => logEntry('WARN', comp, msg),
  getRecentLogs,
  logFilePath
};
