import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  contactSheetHtml,
  listSnapshotsWithErrors,
  readSnapshotAsset,
  validateSnapshotRequest,
  type SnapshotManifest,
} from '../lib/snapshots-server';

describe('snapshot requests', () => {
  it('expands all contexts and removes duplicate selections', () => {
    expect(
      validateSnapshotRequest({
        styles: ['su', 'su'],
        specimens: ['settings', 'table'],
        contexts: 'all',
      }),
    ).toEqual({
      styles: ['su'],
      specimens: ['settings', 'table'],
      contexts: ['su-light', 'su-dark', 'yu-dark'],
    });
  });

  it('accepts a human name for the capture', () => {
    expect(
      validateSnapshotRequest({
        styles: ['su'],
        specimens: ['settings'],
        contexts: ['su-light'],
        slug: 'Warm Su study',
      }).slug,
    ).toBe('Warm Su study');
  });

  it('rejects unsafe ids, unsupported contexts and oversized jobs', () => {
    expect(() =>
      validateSnapshotRequest({ styles: ['../su'], specimens: ['settings'], contexts: 'all' }),
    ).toThrow(/Styles/);
    expect(() =>
      validateSnapshotRequest({ styles: ['su'], specimens: ['settings'], contexts: ['yu-light'] }),
    ).toThrow(/Contexts/);
    expect(() =>
      validateSnapshotRequest({
        styles: ['su', 'yu'],
        specimens: Array.from({ length: 21 }, (_, index) => 'specimen-' + index),
        contexts: 'all',
      }),
    ).toThrow(/at most 120/);
  });

  it('rejects snapshot asset path traversal', async () => {
    expect(await readSnapshotAsset(['..', 'contact-sheet.html'])).toBeNull();
    expect(await readSnapshotAsset(['private', '..', 'contact-sheet.html'])).toBeNull();
  });
});

describe('contact sheet', () => {
  it('uses relative PNG paths and escapes labels', () => {
    const manifest: SnapshotManifest = {
      id: '2026-10-01-sample-abc123',
      private: false,
      createdAt: '2026-10-01T10:00:00.000Z',
      styles: ['su'],
      specimens: ['settings'],
      contexts: ['su-light'],
      images: [
        {
          style: '<su>',
          specimen: 'settings',
          context: 'su-light',
          file: '2026-10-01-sample-abc123/su--settings--su-light.png',
          url: '/api/snapshots/files/2026-10-01-sample-abc123/su--settings--su-light.png',
        },
      ],
      contactSheetUrl: '/api/snapshots/files/2026-10-01-sample-abc123/contact-sheet.html',
    };
    const html = contactSheetHtml(manifest);
    expect(html).toContain('src="./su--settings--su-light.png"');
    expect(html).toContain('&lt;su&gt;');
    expect(html).not.toContain('<su>');
  });
});

describe('snapshot history', () => {
  it('keeps valid captures visible when another manifest is malformed', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'zao-snapshots-'));
    try {
      const good = '2026-10-01-good';
      const bad = '2026-10-01-bad';
      await mkdir(join(directory, good));
      await mkdir(join(directory, bad));
      await writeFile(
        join(directory, good, 'manifest.json'),
        JSON.stringify({
          id: good,
          private: false,
          createdAt: '2026-10-01T10:00:00.000Z',
          styles: ['su'],
          specimens: ['type'],
          contexts: ['su-light'],
          images: [],
          contactSheetUrl: `/api/snapshots/files/${good}/contact-sheet.html`,
        }),
      );
      await writeFile(join(directory, bad, 'manifest.json'), '{broken');
      const result = await listSnapshotsWithErrors(directory);
      expect(result.snapshots.map((snapshot) => snapshot.id)).toEqual([good]);
      expect(result.errors).toEqual([
        { file: `${bad}/manifest.json`, message: expect.any(String) },
      ]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
