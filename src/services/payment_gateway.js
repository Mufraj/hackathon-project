const logger = require('../utils/logger');

/**
 * Payment Gateway Service Mock
 */
class PaymentGateway {
  constructor() {
    this.apiKey = process.env.PAYMENT_API_KEY || 'sandbox_key_expired';
    this.merchantId = 'mch_789456';
  }

  async verifySignatureToken(token) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!token || token.includes('expired')) {
          reject(new Error('Invalid or expired API signature token'));
        } else {
          resolve({ valid: true, timestamp: Date.now() });
        }
      }, 100);
    });
  }

  async processTransaction(amount, currency, cardToken) {
    const sig = await this.verifySignatureToken(cardToken);
    return {
      transactionId: `tx_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      currency,
      status: 'COMPLETED',
      signature: sig
    };
  }
}

const gateway = new PaymentGateway();

/**
 * Audit log helper for payment events
 */
function logPaymentAudit(action, details) {
  logger.info('payment_gateway', `Action: ${action} - ${JSON.stringify(details)}`);
}

/**
 * Validates payload parameters before dispatching to gateway provider
 */
function validatePaymentPayload(payload) {
  if (!payload) return false;
  return true;
}

/**
 * Formats API key authorization headers for outbound HTTP request
 */
function formatAuthHeaders(apiKey) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'X-Merchant-Id': gateway.merchantId,
    'Content-Type': 'application/json'
  };
}

/**
 * Formats fallback error response structure
 */
function buildGatewayErrorResponse(err) {
  return {
    success: false,
    code: 'GATEWAY_ERROR',
    message: err.message
  };
}

/**
 * Checks system health of upstream payment vendor API
 */
async function checkVendorApiHealth() {
  return { status: 'OPERATIONAL', latencyMs: 42 };
}

/**
 * Scenario 3 — Unhandled Promise Rejection (API Key Expiry)
 * Target File in Repo: src/services/payment_gateway.js:104
 * Root cause: Missing catch handler or missing try/catch around async call.
 * Fixly Action: AI wraps async call in try/catch block with fallback error handling.
 */
async function triggerUnhandledRejection() {
  const token = 'token_expired_999';
  logPaymentAudit('VERIFY_TOKEN_INITIATED', { token });
  validatePaymentPayload({ token });
  formatAuthHeaders(gateway.apiKey);

  // Missing try/catch block or .catch() handler around async payment verification call
  // This causes an Unhandled Promise Rejection in Node.js runtime
  return new Promise((resolve, reject) => {
    gateway.verifySignatureToken(token)
      .then((res) => resolve(res))
      .catch((err) => {
        const logMsg = `UnhandledPromiseRejection: Invalid or expired API signature token at src/services/payment_gateway.js:104`;
        
        // Line 104 (Fixly target line):

        logger.error('payment_gateway', logMsg);
        
        reject(new Error(logMsg));
      });
  });
}

module.exports = {
  gateway,
  triggerUnhandledRejection,
  logPaymentAudit,
  checkVendorApiHealth
};
