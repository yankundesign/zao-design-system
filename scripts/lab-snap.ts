/** Capture saved styles without opening the lab UI. */
import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { createSnapshot, snapshotsDirectory } from '../apps/lab/lib/snapshots-server.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const baseUrl = 'http://127.0.0.1:3001';

function help() {
  console.log(
    'Usage: pnpm lab:snap --styles a,b --specimens settings,table --contexts all [--slug name]\n' +
      'Contexts may also be a comma list of su-light,su-dark,yu-dark.\n' +
      'The command starts the local lab if it is not already running.',
  );
}

function options() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) return null;
  const parsed: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!flag?.startsWith('--') || !value || value.startsWith('--'))
      throw new Error('Each option needs a value. Run pnpm lab:snap --help.');
    const key = flag.slice(2);
    if (!['styles', 'specimens', 'contexts', 'slug'].includes(key) || parsed[key])
      throw new Error('Unknown or repeated option "' + flag + '".');
    parsed[key] = value;
  }
  if (!parsed.styles || !parsed.specimens)
    throw new Error('Provide --styles and --specimens. Run pnpm lab:snap --help.');
  return {
    styles: parsed.styles.split(',').filter(Boolean),
    specimens: parsed.specimens.split(',').filter(Boolean),
    contexts: parsed.contexts === 'all' || !parsed.contexts ? 'all' : parsed.contexts.split(','),
    ...(parsed.slug ? { slug: parsed.slug } : {}),
  };
}

async function labReady() {
  try {
    const response = await fetch(baseUrl + '/api/styles', { signal: AbortSignal.timeout(2000) });
    if (!response.ok) return false;
    const body: unknown = await response.json();
    return Boolean(
      body && typeof body === 'object' && 'styles' in body && Array.isArray(body.styles),
    );
  } catch {
    return false;
  }
}

async function startLabIfNeeded() {
  if (await labReady()) return undefined;
  const child = spawn('pnpm', ['lab'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
    env: process.env,
  });
  let recentOutput = '';
  for (const stream of [child.stdout, child.stderr]) {
    stream?.on('data', (chunk: Buffer) => {
      recentOutput = (recentOutput + chunk.toString()).slice(-3000);
    });
  }
  console.log('Starting the local lab...');
  for (let attempt = 0; attempt < 120; attempt++) {
    if (await labReady()) return child;
    if (child.exitCode !== null) {
      throw new Error('The lab stopped before it was ready.\n' + recentOutput);
    }
    await delay(1000);
  }
  stopLab(child);
  throw new Error('The lab did not become ready on 127.0.0.1:3001.\n' + recentOutput);
}

function stopLab(child: ChildProcess) {
  if (!child.pid) return;
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
  }
}

async function main() {
  const request = options();
  if (!request) return help();
  let lab: ChildProcess | undefined;
  try {
    lab = await startLabIfNeeded();
    const snapshot = await createSnapshot(request, baseUrl);
    const folder = join(snapshotsDirectory, ...(snapshot.private ? ['private'] : []), snapshot.id);
    console.log('Saved ' + snapshot.images.length + ' PNGs to ' + folder + '.');
    console.log('Contact sheet: ' + join(folder, 'contact-sheet.html'));
    console.log('Open in lab: ' + baseUrl + snapshot.contactSheetUrl);
  } finally {
    if (lab) stopLab(lab);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
