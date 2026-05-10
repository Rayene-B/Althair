import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(name, command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      process.exit(code);
    }
  });

  return child;
}

const server = run('server', npmCommand, ['run', 'server']);
const client = run('client', npmCommand, ['run', 'client']);

function shutdown() {
  server.kill();
  client.kill();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
