const baseUrl = process.argv[2] || process.env.TARGET_URL || 'http://localhost:3000';

const triggers = [
  ['/api/trigger/db-timeout', 'DB connection pool timeout'],
  ['/api/trigger/null-ref', 'Null reference TypeError'],
  ['/api/trigger/unhandled-rejection', 'Unhandled promise rejection'],
  ['/api/trigger/resource-spike', 'CPU resource spike'],
  ['/api/trigger/math-error', 'Math division by zero'],
  ['/api/trigger/syntax-error', 'Coding syntax error']
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log(`Triggering demo errors against ${baseUrl}`);
  for (const [path, label] of triggers) {
    process.stdout.write(`- ${label} ... `);
    try {
      const response = await fetch(`${baseUrl}${path}`);
      console.log(`${response.status}`);
    } catch (err) {
      console.log(`failed (${err.message})`);
    }
    await sleep(900);
  }
  console.log('Done. Open http://localhost:4000 and click "Resolve with Grok" on captured errors.');
}

main();
