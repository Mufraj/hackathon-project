#!/bin/bash
# Fixly Target Demo App — Error Trigger Automation Suite

TARGET_HOST=${1:-"localhost:3000"}

echo "=== Triggering Target App Error Harness on $TARGET_HOST ==="

echo "[1/4] Triggering DB Connection Pool Timeout (src/services/database.js:42)..."
curl -s "http://$TARGET_HOST/api/trigger/db-timeout" > /dev/null || true
sleep 2

echo "[2/4] Triggering Null Reference TypeError (src/routes/user_profile.js:88)..."
curl -s "http://$TARGET_HOST/api/trigger/null-ref" > /dev/null || true
sleep 2

echo "[3/4] Triggering Unhandled Promise Rejection (src/services/payment_gateway.js:104)..."
curl -s "http://$TARGET_HOST/api/trigger/unhandled-rejection" > /dev/null || true
sleep 2

echo "[4/6] Triggering CPU Resource Spike (>90% for 15s)..."
curl -s "http://$TARGET_HOST/api/trigger/resource-spike" > /dev/null || true
sleep 1

echo "[5/6] Triggering Math Division By Zero..."
curl -s "http://$TARGET_HOST/api/trigger/math-error" > /dev/null || true
sleep 1

echo "[6/6] Triggering Coding Syntax Error..."
curl -s "http://$TARGET_HOST/api/trigger/syntax-error" > /dev/null || true

echo "=== Trigger sequence complete. Open http://localhost:4000 and click Resolve with Grok ==="
