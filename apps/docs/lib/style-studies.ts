import { lstat, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface StyleStudy {
  id: string;
  title: string;
  cssUrl: string;
  designMarkdown: string;
}

const studySlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isStudySlug(value: string): boolean {
  return studySlug.test(value);
}

async function studyRoot(): Promise<string | null> {
  const testRoot = process.env.ZAO_STYLE_STUDIES_DIR;
  if (testRoot) {
    try {
      const root = resolve(testRoot);
      return (await lstat(root)).isDirectory() ? root : null;
    } catch {
      return null;
    }
  }

  // Next runs from apps/docs in development, but the repository root can be
  // the working directory in other local commands.
  const candidates = [
    resolve(process.cwd(), '../../explorations/su-studies'),
    resolve(process.cwd(), 'explorations/su-studies'),
  ];

  for (const candidate of candidates) {
    try {
      if ((await lstat(candidate)).isDirectory()) return candidate;
    } catch {
      // Local studies are optional; try the next known workspace location.
    }
  }

  return null;
}

async function readStudy(
  root: string,
  id: string,
): Promise<{ css: string; markdown: string; cssMtimeMs: number } | null> {
  if (!isStudySlug(id)) return null;

  const directory = join(root, id);
  const cssPath = join(directory, 'style.css');
  const markdownPath = join(directory, 'design.md');

  try {
    const [folder, cssFile, markdownFile] = await Promise.all([
      lstat(directory),
      lstat(cssPath),
      lstat(markdownPath),
    ]);

    // Ignore incomplete folders and links that could leave the study root.
    if (!folder.isDirectory() || !cssFile.isFile() || !markdownFile.isFile()) {
      return null;
    }

    const [css, markdown] = await Promise.all([
      readFile(cssPath, 'utf8'),
      readFile(markdownPath, 'utf8'),
    ]);
    return { css, markdown, cssMtimeMs: cssFile.mtimeMs };
  } catch {
    return null;
  }
}

function titleFromMarkdown(markdown: string, id: string): string {
  const heading = markdown.match(/^#\s+(.+?)\s*$/m)?.[1];
  if (heading) return heading;
  return id.replaceAll('-', ' ').replace(/^\w/, (letter) => letter.toUpperCase());
}

export async function getQuietInstrumentStudy(): Promise<StyleStudy | null> {
  const root = await studyRoot();
  if (!root) return null;

  const id = 'quiet-instrument';
  const files = await readStudy(root, id);
  if (!files) return null;

  return {
    id,
    title: titleFromMarkdown(files.markdown, id),
    cssUrl: `/api/style-studies/${id}/css?v=${Math.trunc(files.cssMtimeMs)}`,
    designMarkdown: files.markdown,
  };
}

export async function getStyleStudyCss(id: string): Promise<string | null> {
  const root = await studyRoot();
  if (!root) return null;
  return (await readStudy(root, id))?.css ?? null;
}
