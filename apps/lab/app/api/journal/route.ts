import { NextResponse } from 'next/server';
import { createJournalEntry, listJournalEntriesWithErrors } from '@/lib/journal-server';

export const dynamic = 'force-dynamic';

function unavailable() {
  return NextResponse.json(
    { error: 'The journal runs only in the local development lab.' },
    { status: 403 },
  );
}

function failure(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Could not save the journal entry.' },
    { status: 400 },
  );
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') return unavailable();
  try {
    const url = new URL(request.url);
    const style = url.searchParams.get('style') ?? undefined;
    const tag = url.searchParams.get('tag') ?? undefined;
    return NextResponse.json(await listJournalEntriesWithErrors({ style, tag }));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') return unavailable();
  try {
    const entry = await createJournalEntry(await request.json());
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
