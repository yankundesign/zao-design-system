import { spawn } from 'node:child_process';

const app = process.argv[2] === 'lab' ? '@zao/lab' : '@zao/docs';
const children = [
  spawn('pnpm', ['--filter', '@zao/tokens', 'run', 'dev:watch'], { stdio: 'inherit' }),
  spawn('pnpm', ['--filter', app, 'dev'], { stdio: 'inherit' }),
];

let stopping = false;
const stop = (code = 0) => {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
};

for (const child of children) {
  child.on('error', (error) => {
    console.error(error);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) stop(code ?? 1);
  });
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
