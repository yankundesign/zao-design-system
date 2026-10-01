import { spawn, type ChildProcess } from 'node:child_process';
import { watch, type FSWatcher } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const rootPath = fileURLToPath(root);
const fileWatchers: FSWatcher[] = [];
const childProcesses = new Set<ChildProcess>();
const paletteFiles = [
  new URL('../palette.config.ts', import.meta.url),
  new URL('generate-palettes.ts', import.meta.url),
  new URL('../../engine/src/palette.ts', import.meta.url),
];
let stopping = false;
let running = false;
let pendingBuild = false;
let pendingPalette = false;
let rebuildTimer: NodeJS.Timeout | undefined;
let pollTimer: NodeJS.Timeout | undefined;
let polling = false;
let pollRunning = false;
let lastSnapshot: Map<string, string> | undefined;

async function run(command: string, args: string[], label: string) {
  if (stopping) return false;
  const child = spawn(command, args, { cwd: rootPath, stdio: 'inherit' });
  childProcesses.add(child);
  return new Promise<boolean>((resolve) => {
    let completed = false;
    const finish = (success: boolean) => {
      if (completed) return;
      completed = true;
      childProcesses.delete(child);
      resolve(success);
    };
    child.once('error', (error) => {
      console.error(`${label} could not start:`, error);
      finish(false);
    });
    child.once('close', (code) => {
      if (code !== 0 && !stopping) console.error(`${label} exited with code ${code}.`);
      finish(code === 0);
    });
  });
}

function scheduleRebuild(regeneratePalette = false) {
  if (stopping) return;
  pendingBuild = true;
  if (regeneratePalette) pendingPalette = true;
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => void drainBuildQueue(), 120);
}

async function drainBuildQueue() {
  if (running || stopping) return;
  running = true;
  try {
    while ((pendingBuild || pendingPalette) && !stopping) {
      if (pendingPalette) {
        pendingPalette = false;
        if (!(await run('pnpm', ['run', 'palette'], 'Palette generation'))) {
          pendingBuild = false;
          continue;
        }
        // A config edit during generation must finish before the token build.
        if (pendingPalette) continue;
      }
      // The build now includes every source change seen before it starts,
      // including writes to generated palettes. Later edits queue another pass.
      pendingBuild = false;
      if (!(await run('pnpm', ['exec', 'tz', 'build'], 'Token build'))) continue;
      await run('node', ['scripts/export-json.ts'], 'Token JSON export');
    }
  } finally {
    running = false;
    if ((pendingBuild || pendingPalette) && !stopping) scheduleRebuild();
  }
}

async function snapshotTree(directory: URL, snapshot: Map<string, string>) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const file = new URL(entry.isDirectory() ? `${entry.name}/` : entry.name, directory);
    if (entry.isDirectory()) await snapshotTree(file, snapshot);
    else if (entry.isFile()) await snapshotFile(file, snapshot);
  }
}

async function snapshotFile(file: URL, snapshot: Map<string, string>) {
  try {
    const info = await stat(file, { bigint: true });
    snapshot.set(file.href, `${info.ino}:${info.size}:${info.mtimeNs}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

async function pollChanges() {
  if (pollRunning || stopping) return;
  pollRunning = true;
  try {
    const snapshot = new Map<string, string>();
    await snapshotTree(new URL('src/', root), snapshot);
    for (const file of paletteFiles) await snapshotFile(file, snapshot);
    if (lastSnapshot) {
      const changed = new Set([...snapshot.keys(), ...lastSnapshot.keys()]);
      for (const file of changed) {
        if (snapshot.get(file) === lastSnapshot.get(file)) continue;
        scheduleRebuild(paletteFiles.some((paletteFile) => paletteFile.href === file));
      }
    }
    lastSnapshot = snapshot;
  } catch (error) {
    console.error('Token file polling failed:', error);
  } finally {
    pollRunning = false;
  }
}

function usePolling(error: unknown) {
  if (polling || stopping) return;
  polling = true;
  console.warn('File watching is unavailable; checking token files every 500ms.', error);
  for (const watcher of fileWatchers) watcher.close();
  fileWatchers.length = 0;
  void pollChanges();
  pollTimer = setInterval(() => void pollChanges(), 500);
}

function watchDirectory(directory: URL, onChange: (filename: string | undefined) => void) {
  if (polling) return;
  try {
    const watcher = watch(
      directory,
      { recursive: directory.href === new URL('src/', root).href },
      (_event, filename) => onChange(filename?.toString()),
    );
    watcher.on('error', usePolling);
    fileWatchers.push(watcher);
  } catch (error) {
    usePolling(error);
  }
}

watchDirectory(new URL('src/', root), () => scheduleRebuild());
for (const file of paletteFiles) {
  const name = fileURLToPath(file).split('/').at(-1);
  watchDirectory(new URL('./', file), (filename) => {
    // Watching the directory survives editors that save by atomic rename.
    if (!filename || filename === name) scheduleRebuild(true);
  });
}

scheduleRebuild();

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => shutdown(signal));
}

function shutdown(signal: NodeJS.Signals) {
  if (stopping) return;
  stopping = true;
  clearTimeout(rebuildTimer);
  clearInterval(pollTimer);
  for (const fileWatcher of fileWatchers) fileWatcher.close();
  for (const child of childProcesses) child.kill(signal);
  setTimeout(() => process.exit(0), 100);
}
