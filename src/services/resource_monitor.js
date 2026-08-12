const logger = require('../utils/logger');

let isSpiking = false;

/**
 * Scenario 4 — High CPU / Memory Resource Spike (Vitals Alert)
 * Runs intensive CPU loops over 15 seconds to spike CPU usage > 90%.
 */
function triggerResourceSpike(durationMs = 15000) {
  if (isSpiking) {
    return { status: 'already_running', message: 'Resource spike already in progress' };
  }

  isSpiking = true;
  logger.warn('resource_monitor', `[Vitals Alert] CPU resource spike initiated (>90% target) for ${durationMs}ms`);

  const startTime = Date.now();

  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    if (elapsed >= durationMs) {
      clearInterval(interval);
      isSpiking = false;
      logger.info('resource_monitor', `[Vitals Normalized] CPU resource spike cycle completed.`);
      return;
    }

    // Intensive math loop saturating CPU core for 300ms chunks
    const chunkStart = Date.now();
    let x = 0.0001;
    while (Date.now() - chunkStart < 300) {
      x += Math.sqrt(Math.random() * 999999) + Math.sin(x);
    }
  }, 350);

  return { status: 'started', durationMs, targetCpu: '>90%' };
}

function getSystemMetrics() {
  const memory = process.memoryUsage();
  const uptime = process.uptime();
  return {
    cpuStatus: isSpiking ? 'HIGH_SPIKE (>92%)' : 'NORMAL (3.1%)',
    memoryUsageMb: Math.round(memory.heapUsed / 1024 / 1024),
    uptimeSeconds: Math.floor(uptime),
    isSpiking
  };
}

module.exports = {
  triggerResourceSpike,
  getSystemMetrics
};
