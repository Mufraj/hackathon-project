const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LOGS_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'logs.txt');

function ensureLogFile() {
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '');
}

function makeId(log) {
  const seed = `${log.timestamp || ''}|${log.source || ''}|${log.message || ''}`;
  return crypto.createHash('sha1').update(seed).digest('hex').slice(0, 12);
}

function normalizeLog(log) {
  const timestamp = log.timestamp || new Date().toISOString();
  const level = (log.level || 'error').toLowerCase();
  return {
    id: log.id || makeId({ ...log, timestamp }),
    level,
    type: log.type || level.toUpperCase(),
    message: log.message || '',
    stack: log.stack || '',
    source: log.source || 'unknown',
    timestamp,
    status: log.status || (level === 'error' ? 'open' : 'observed'),
    aiResolution: log.aiResolution || null,
    resolvedAt: log.resolvedAt || null,
    resolutionError: log.resolutionError || null
  };
}

function appendLog(logEntry) {
  ensureLogFile();
  const normalized = normalizeLog(logEntry);
  fs.appendFileSync(LOG_FILE, `${JSON.stringify(normalized)}\n`, 'utf8');
  return normalized;
}

function readLogs(limit = 200) {
  ensureLogFile();
  const data = fs.readFileSync(LOG_FILE, 'utf8');
  const lines = data.trim().split('\n').filter(Boolean);
  const safeLimit = Number.isFinite(limit) ? limit : lines.length;
  return lines.slice(-safeLimit).map((line) => {
    try {
      return normalizeLog(JSON.parse(line));
    } catch (e) {
      return normalizeLog({ message: line, level: 'info' });
    }
  });
}

function writeLogs(logs) {
  ensureLogFile();
  const content = logs.map((log) => JSON.stringify(normalizeLog(log))).join('\n');
  fs.writeFileSync(LOG_FILE, content ? `${content}\n` : '', 'utf8');
}

function updateLog(id, patch) {
  const logs = readLogs(Number.MAX_SAFE_INTEGER);
  const index = logs.findIndex((log) => log.id === id);
  if (index === -1) return null;
  logs[index] = normalizeLog({ ...logs[index], ...patch });
  writeLogs(logs);
  return logs[index];
}

function findLog(id) {
  return readLogs(Number.MAX_SAFE_INTEGER).find((log) => log.id === id) || null;
}

module.exports = { LOG_FILE, appendLog, readLogs, updateLog, findLog, normalizeLog };
