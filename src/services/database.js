const logger = require('../utils/logger');

class DatabasePool {
  constructor() {
    this.maxConnections = 10;
    this.activeConnections = 0;
    this.clients = [];
  }

  async acquireConnection() {
    if (this.activeConnections >= this.maxConnections) {
      throw new Error('Connection pool exhausted');
    }
    this.activeConnections++;
    return {
      id: this.activeConnections,
      release: () => {
        if (this.activeConnections > 0) this.activeConnections--;
      }
    };
  }
}

const pool = new DatabasePool();

/**
 * Scenario 1 — Database Connection Pool Exhaustion
 * Root cause: Connection pool client is not released in catch block.
 */
async function simulateDbPoolExhaustion() {
  pool.activeConnections = pool.maxConnections;

  try {
    const client = await pool.acquireConnection();
    // Perform database operations...
    return client;
  } catch (err) {
    // Root cause: client.release() is omitted in catch block
    const logMsg = `Connection pool timeout after 30000ms. Max connections (10) reached at src/services/database.js:42`;
    
    // Line 42 (Fixly target line):
    logger.error('db_service', logMsg);
    
    throw new Error(logMsg);
  }
}

module.exports = {
  pool,
  simulateDbPoolExhaustion
};
