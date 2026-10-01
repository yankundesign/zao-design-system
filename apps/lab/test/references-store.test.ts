import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const emptyTeardown = {
  neutralTemperature: '',
  contrast: '',
  accentUse: '',
  density: '',
  radiusFamily: '',
  typeContrast: '',
  depth: '',
  motion: '',
};

describe('private reference store', () => {
  let fixtureRoot: string;
  let store: typeof import('../lib/references-server');
  const previousRoot = process.env.ZAO_REFERENCE_TEST_ROOT;

  beforeAll(async () => {
    fixtureRoot = await mkdtemp(join(tmpdir(), 'zao-references-test-'));
    process.env.ZAO_REFERENCE_TEST_ROOT = fixtureRoot;
    vi.resetModules();
    store = await import('../lib/references-server');
  });

  afterAll(async () => {
    if (previousRoot === undefined) delete process.env.ZAO_REFERENCE_TEST_ROOT;
    else process.env.ZAO_REFERENCE_TEST_ROOT = previousRoot;
    await rm(fixtureRoot, { recursive: true, force: true });
  });

  it('adds, edits, serves and deletes a reference without touching the repo index', async () => {
    const input = {
      title: 'Source sample',
      sourceUrl: 'https://example.org/source',
      tags: ['quiet'],
      boards: ['Su candidates'],
      notes: '',
      likes: '',
      dislikes: '',
      teardown: emptyTeardown,
    };
    const urlOnly = await store.createReference(input);
    expect(urlOnly.imageFile).toBeUndefined();
    expect((await store.listReferences()).map((reference) => reference.id)).toEqual([urlOnly.id]);

    const png = await sharp({
      create: { width: 24, height: 24, channels: 3, background: '#b48966' },
    })
      .png()
      .toBuffer();
    const updated = await store.updateReference(
      urlOnly.id,
      { ...input, notes: 'Keep the tone.' },
      png,
    );
    expect(updated.analysis?.swatches.length).toBeGreaterThan(0);
    expect(updated.imageFile).toMatch(/\.png$/);
    expect((await store.readReferenceImage(urlOnly.id)).buffer.equals(png)).toBe(true);
    expect(await readFile(join(fixtureRoot, 'references', 'index.json'), 'utf8')).toContain(
      'Keep the tone.',
    );

    await store.deleteReference(urlOnly.id);
    expect(await store.listReferences()).toEqual([]);
    expect(await readdir(join(fixtureRoot, 'references', 'files'))).toEqual([]);
  });
});
