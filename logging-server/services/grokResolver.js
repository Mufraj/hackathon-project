const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

function heuristicResolution(log, reason = 'GROK_API_KEY not configured or AI request failed') {
  const text = `${log.source || ''} ${log.message || ''} ${log.stack || ''}`.toLowerCase();

  if (text.includes('divisionbyzero') || text.includes('divide') || text.includes('denominator')) {
    return {
      provider: 'local-demo-fallback',
      status: 'fallback',
      reason,
      rootCause: 'A calculation attempted to divide by zero. In JavaScript this can produce Infinity, but business logic like discounts/totals should reject it explicitly.',
      suggestedFix: 'Validate the denominator before division: if (denominator === 0) return a 400 response or use a safe fallback value. Add tests for zero and missing numeric inputs.',
      confidence: 'high',
      steps: ['Check denominator before calculating.', 'Return a clear validation error.', 'Add unit tests for zero, null, and non-number values.']
    };
  }

  if (text.includes('syntaxerror') || text.includes('missing )') || text.includes('brokentotal')) {
    return {
      provider: 'local-demo-fallback',
      status: 'fallback',
      reason,
      rootCause: 'The JavaScript reducer expression has mismatched parentheses, so the function cannot compile.',
      suggestedFix: 'Close the reduce call correctly: return items.reduce((sum, item) => sum + item.price, 0); then close the function block.',
      confidence: 'high',
      steps: ['Fix the missing parenthesis before the semicolon.', 'Run linting/formatting.', 'Add a syntax check in CI.']
    };
  }

  if (text.includes('cannot read properties of undefined') || text.includes('null')) {
    return {
      provider: 'local-demo-fallback',
      status: 'fallback',
      reason,
      rootCause: 'Code is reading a property from an undefined/null object. In this demo, req.user is missing before account_status is accessed.',
      suggestedFix: 'Validate the object before reading it, e.g. const accountStatus = req.user?.account_status || "UNKNOWN"; return a 401/400 response when auth context is absent.',
      confidence: 'high',
      steps: ['Add optional chaining or an explicit guard.', 'Return a safe fallback or client error.', 'Add a regression test for missing user context.']
    };
  }

  if (text.includes('connection pool') || text.includes('max connections')) {
    return {
      provider: 'local-demo-fallback',
      status: 'fallback',
      reason,
      rootCause: 'Database clients are not being released, so the connection pool reaches its maximum and later requests time out.',
      suggestedFix: 'Always release DB clients in a finally block and review pool sizing/timeouts. Example: const client = await pool.connect(); try { ... } finally { client.release(); }',
      confidence: 'high',
      steps: ['Move release logic to finally.', 'Add pool metrics/alerts.', 'Load test the endpoint after the fix.']
    };
  }

  if (text.includes('unhandledpromiserejection') || text.includes('expired api signature')) {
    return {
      provider: 'local-demo-fallback',
      status: 'fallback',
      reason,
      rootCause: 'An async payment verification failed because an expired token was used and the failure path was not handled cleanly.',
      suggestedFix: 'Wrap await verifySignatureToken(token) in try/catch, refresh or reject expired credentials, and return a controlled gateway error response.',
      confidence: 'high',
      steps: ['Use try/catch around async gateway calls.', 'Rotate or refresh expired API tokens.', 'Log sanitized gateway failures only.']
    };
  }

  if (text.includes('cpu') || text.includes('resource')) {
    return {
      provider: 'local-demo-fallback',
      status: 'fallback',
      reason,
      rootCause: 'A CPU-intensive task is blocking the Node.js event loop.',
      suggestedFix: 'Move heavy computation to a worker queue/thread, limit concurrency, and add request timeouts/backpressure.',
      confidence: 'medium',
      steps: ['Profile the hot path.', 'Offload CPU work.', 'Add resource alerts and rate limits.']
    };
  }

  return {
    provider: 'local-demo-fallback',
    status: 'fallback',
    reason,
    rootCause: 'The log indicates an application error, but more stack/context is needed for a precise diagnosis.',
    suggestedFix: 'Inspect the stack trace, reproduce the failing request, add input validation, and cover the case with a focused test.',
    confidence: 'medium',
    steps: ['Capture stack trace and request metadata.', 'Reproduce locally.', 'Patch and verify with the trigger suite.']
  };
}

function buildPrompt(log) {
  return `You are an expert JavaScript/Node.js debugger for a hackathon self-healing demo. Return ONLY valid JSON with this shape: {"rootCause":"...","suggestedFix":"...","confidence":"high|medium|low","steps":["..."]}.

Explain the practical fix for this captured application log. Focus on simple math/coding mistakes, Node/Express errors, async failures, and resource issues.

LOG:
${JSON.stringify(log, null, 2)}`;
}

function parseJson(text) {
  const cleaned = (text || '').replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const candidate = start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(candidate);
}

async function resolveWithGrok(log) {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return heuristicResolution(log, 'GROK_API_KEY is not set');

  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.GROK_MODEL || 'grok-2-latest',
        messages: [
          { role: 'system', content: 'You diagnose software errors and respond with strict JSON only.' },
          { role: 'user', content: buildPrompt(log) }
        ],
        temperature: 0.2,
        max_tokens: 700
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return heuristicResolution(log, `Grok request failed with ${response.status}: ${body.slice(0, 180)}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';
    const parsed = parseJson(raw);
    return {
      provider: 'grok',
      status: 'ai-resolved',
      rootCause: parsed.rootCause || parsed.explanation || 'Grok returned an incomplete diagnosis.',
      suggestedFix: parsed.suggestedFix || parsed.fix || '',
      confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
      steps: Array.isArray(parsed.steps) ? parsed.steps.slice(0, 5) : []
    };
  } catch (err) {
    return heuristicResolution(log, err.message);
  }
}

module.exports = { resolveWithGrok, heuristicResolution };
