import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

function findRepoRoot() {
  let directory = resolve(process.cwd());
  while (true) {
    if (existsSync(join(directory, 'pnpm-workspace.yaml'))) return directory;
    const parent = dirname(directory);
    if (parent === directory) throw new Error('Could not find the ZAO workspace root.');
    directory = parent;
  }
}

export const repoRoot = findRepoRoot();
export const stylesDirectory = join(repoRoot, 'explorations', 'styles');
export const fontsDirectory = join(repoRoot, 'explorations', 'fonts');
