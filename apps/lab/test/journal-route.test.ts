import { afterEach, describe, expect, it, vi } from 'vitest';

const { listJournalEntriesWithErrors } = vi.hoisted(() => ({
  listJournalEntriesWithErrors: vi.fn(),
}));

vi.mock('@/lib/journal-server', () => ({
  createJournalEntry: vi.fn(),
  listJournalEntriesWithErrors,
}));

import { GET } from '../app/api/journal/route';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('GET /api/journal', () => {
  it('returns valid entries alongside file-specific read errors', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const entry = {
      id: '2026-10-01-quiet-ink-abc12345',
      date: '2026-10-01T10:00:00.000Z',
      title: 'Quiet ink',
      body: 'Keep the radius.',
      styles: ['quiet-ink'],
      tags: [],
    };
    const errors = [{ file: 'broken.md', message: 'Invalid journal frontmatter.' }];
    listJournalEntriesWithErrors.mockResolvedValue({ entries: [entry], errors });

    const response = await GET(
      new Request('http://localhost:3001/api/journal?style=quiet-ink&tag=type'),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ entries: [entry], errors });
    expect(listJournalEntriesWithErrors).toHaveBeenCalledWith({
      style: 'quiet-ink',
      tag: 'type',
    });
  });
});
