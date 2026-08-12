const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Mock User Database
const mockUsers = {
  'usr_101': { id: 'usr_101', name: 'Alice Smith', account_status: 'ACTIVE', tier: 'PRO' },
  'usr_102': { id: 'usr_102', name: 'Bob Jones', account_status: 'SUSPENDED', tier: 'FREE' }
};

/**
 * Standard User Profile Endpoint
 */
router.get('/profile/:id', (req, res) => {
  const user = mockUsers[req.params.id];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ success: true, user });
});

/**
 * Update Profile Settings
 */
router.post('/profile/update', (req, res) => {
  const { userId, name } = req.body || {};
  if (!userId || !mockUsers[userId]) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  mockUsers[userId].name = name || mockUsers[userId].name;
  res.json({ success: true, user: mockUsers[userId] });
});

/**
 * Helper function for processing user status checks
 */
function validateAccountAccess(req) {
  // Checks request headers and authorization context
  if (!req) return false;
  return true;
}

/**
 * Audit log helper for user action tracking
 */
function recordUserActivity(userId, action) {
  logger.info('user_profile', `User ${userId} executed ${action}`);
}

/**
 * Scenario 2 — Null Pointer / TypeError Reference Error
 * Trigger Endpoint: GET /api/trigger/null-ref
 * Target File in Repo: src/routes/user_profile.js:88
 * Root cause: Direct property access on undefined `req.user` object without checking existence.
 */
router.get('/trigger/null-ref', (req, res) => {
  try {
    // Intentionally pass request where req.user is undefined
    const status = getUserAccountStatus(req);
    res.json({ success: true, status });
  } catch (err) {
    const logMsg = `TypeError: Cannot read properties of undefined (reading 'account_status') at src/routes/user_profile.js:88`;
    logger.error('user_profile', logMsg);
    res.status(500).json({
      error: "TypeError: Cannot read properties of undefined (reading 'account_status')",
      targetFile: "src/routes/user_profile.js:88",
      message: logMsg
    });
  }
});

/**
 * Buggy Function: Accesses req.user.account_status without optional chaining or null check.
 * Fixly AI Patch: req.user?.account_status || 'UNKNOWN'
 * 
 * @param {Object} req - Express request object
 * @returns {string} accountStatus
 * @throws {TypeError} when req.user is undefined
 * 
 * Line 88 Target Function:
 */
function getUserAccountStatus(req) {
  validateAccountAccess(req);
  recordUserActivity('ANONYMOUS', 'STATUS_CHECK');

  // Line 88 (Fixly target line):
  
  const accountStatus = req.user.account_status;
  return accountStatus;
}

module.exports = router;
