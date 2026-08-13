const { spawn } = require('child_process');
const path = require('path');

function run(name, command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options
  });
  child.on('exit', (code) => {
    if (code && !options.allowExit) console.log(`${name} exited with code ${code}`);
  });
  return child;
}

console.log('Starting Fixly hackathon demo...');
console.log('Dashboard: http://localhost:4000');
console.log('Target app: http://localhost:3000');
console.log('Press Ctrl+C to stop both processes.');

const logging = run('logging-server', 'npm', ['--prefix', 'logging-server', 'start']);
const target = run('target-app', 'node', ['src/index.js'], {
  env: {
    ...process.env,
    PORT: process.env.PORT || '3000',
    LOG_SERVER_URL: process.env.LOG_SERVER_URL || 'http://localhost:4000'
  }
});

setTimeout(() => {
  const triggerPath = path.join(__dirname, 'trigger-demo.js');
  run('trigger-demo', 'node', [triggerPath], { allowExit: true });
}, 2500);

function shutdown() {
  logging.kill();
  target.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
