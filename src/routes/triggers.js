const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { simulateDbPoolExhaustion } = require('../services/database');
const { triggerUnhandledRejection } = require('../services/payment_gateway');
const { triggerResourceSpike, getSystemMetrics } = require('../services/resource_monitor');

/**
 * Scenario 1 — Database Connection Pool Exhaustion
 * Endpoint: GET /api/trigger/db-timeout
 */
router.get('/trigger/db-timeout', async (req, res) => {
  try {
    await simulateDbPoolExhaustion();
    res.json({ success: true, message: 'DB query executed' });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      scenario: 'Scenario 1 - DB Connection Pool Exhaustion',
      targetFile: 'src/services/database.js:42',
      error: err.message
    });
  }
});

/**
 * Scenario 3 — Unhandled Promise Rejection (API Key Expiry)
 * Endpoint: GET /api/trigger/unhandled-rejection
 */
router.get('/trigger/unhandled-rejection', async (req, res) => {
  try {
    await triggerUnhandledRejection();
    res.json({ success: true, message: 'Payment token verified' });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      scenario: 'Scenario 3 - Unhandled Promise Rejection',
      targetFile: 'src/services/payment_gateway.js:104',
      error: err.message
    });
  }
});

/**
 * Scenario 4 — High CPU / Memory Resource Spike (Vitals Alert)
 * Endpoint: GET /api/trigger/resource-spike
 */
router.get('/trigger/resource-spike', (req, res) => {
  const result = triggerResourceSpike(15000);
  res.json({
    success: true,
    scenario: 'Scenario 4 - CPU / Resource Spike',
    duration: '15 seconds',
    details: result
  });
});

/**
 * Scenario 5 — Simple Mathematical Error
 * Endpoint: GET /api/trigger/math-error
 */
router.get('/trigger/math-error', (req, res) => {
  try {
    const numerator = 42;
    const denominator = 0;
    if (denominator === 0) {
      throw new Error('DivisionByZero: Cannot divide 42 by 0 in discount calculator at src/routes/triggers.js:72');
    }
    res.json({ success: true, result: numerator / denominator });
  } catch (err) {
    logger.error('math_engine', err.message);
    res.status(500).json({
      status: 'error',
      scenario: 'Scenario 5 - Mathematical Division By Zero',
      targetFile: 'src/routes/triggers.js:72',
      error: err.message
    });
  }
});

/**
 * Scenario 6 — Coding / Syntax-style Error
 * Endpoint: GET /api/trigger/syntax-error
 */
router.get('/trigger/syntax-error', (req, res) => {
  try {
    const code = 'function brokenTotal(items) { return items.reduce((sum, item) => sum + item.price, 0; }';
    // Intentionally compile invalid JavaScript so the dashboard can explain a coding mistake.
    // eslint-disable-next-line no-new-func
    new Function(code);
    res.json({ success: true });
  } catch (err) {
    const logMsg = `SyntaxError: missing ) after argument list in brokenTotal reducer at src/routes/triggers.js:96`;
    logger.error('code_compiler', `${logMsg} - ${err.message}`);
    res.status(500).json({
      status: 'error',
      scenario: 'Scenario 6 - Coding Syntax Error',
      targetFile: 'src/routes/triggers.js:96',
      error: logMsg
    });
  }
});

/**
 * System Status & Metrics API
 * Endpoint: GET /api/status
 */
router.get('/status', (req, res) => {
  const metrics = getSystemMetrics();
  res.json({
    appName: 'Fixly Remote Target Demo App',
    status: 'ONLINE',
    port: process.env.PORT || 3000,
    logFile: logger.logFilePath,
    metrics
  });
});

/**
 * Live Log Output Stream API
 * Endpoint: GET /api/logs
 */
router.get('/logs', (req, res) => {
  const limit = parseInt(req.query.limit || '100', 10);
  const logs = logger.getRecentLogs(limit);
  res.json({
    success: true,
    count: logs.length,
    logFile: logger.logFilePath,
    logs
  });
});

module.exports = router;
