import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  listJournalEntriesWithErrors,
  parseJournal,
  serializeJournal,
  validateJournalInput,
  type JournalEntry,
} from '../lib/journal-server';

const entry: JournalEntry = {
  id: '2026-10-01-quiet-ink-abc12345',
  date: '2026-10-01T10:00:00.000Z',
  title: 'Quiet ink: first pass',
  body: 'The **table** feels clearer.\n\nKeep the radius.',
  styles: ['su', 'quiet-ink'],
  specimen: 'table',
  context: 'su-light',
  snapshot: '2026-10-01-quiet-ink-abc123/su--table--su-light.png',
  tags: ['type', 'density'],
};

describe('journal frontmatter', () => {
  it('round trips a markdown note with attachments', () => {
    const source = serializeJournal(entry);
    expect(source.startsWith('---\n')).toBe(true);
    expect(parseJournal(source)).toEqual(entry);
  });

  it('reads ordinary YAML frontmatter with block lists and plain scalars', () => {
    const source = [
      '---',
      'id: 2026-10-01-quiet-ink-abc12345',
      'date: 2026-10-01T10:00:00.000Z',
      'title: Quiet ink first pass',
      'styles:',
      '  - su',
      '  - quiet-ink',
      'specimen: table',
      'context: su-light',
      'tags:',
      '  - type',
      '  - density',
      '---',
      '',
      'The **table** feels clearer.',
      '',
      'Keep the radius.',
    ].join('\n');
    expect(parseJournal(source)).toEqual({
      ...entry,
      title: 'Quiet ink first pass',
      snapshot: undefined,
    });
  });

  it('rejects duplicate YAML fields', () => {
    const source = serializeJournal(entry).replace(
      'title: "Quiet ink: first pass"',
      'title: First pass\ntitle: Second pass',
    );
    expect(() => parseJournal(source)).toThrow(/unique|duplicate/i);
  });

  it('keeps valid entries and reports malformed files by name', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'zao-journal-'));
    try {
      await writeFile(join(directory, entry.id + '.md'), serializeJournal(entry));
      await writeFile(join(directory, 'broken.md'), '---\ntitle: [unfinished\n---\n\nBody');
      const result = await listJournalEntriesWithErrors({}, directory);
      expect(result.entries).toEqual([entry]);
      expect(result.errors).toEqual([
        { file: 'broken.md', message: expect.stringMatching(/frontmatter/i) },
      ]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('rejects unsafe attachment paths and invalid context', () => {
    expect(() => validateJournalInput({ ...entry, snapshot: '../../reference.png' })).toThrow(
      /Snapshot/,
    );
    expect(() => validateJournalInput({ ...entry, context: 'yu-light' })).toThrow(/Choose/);
  });

  it('requires markdown body and styles', () => {
    expect(() => validateJournalInput({ ...entry, body: '  ' })).toThrow(/Write a note/);
    expect(() => validateJournalInput({ ...entry, styles: ['../su'] })).toThrow(/Styles/);
  });
});
