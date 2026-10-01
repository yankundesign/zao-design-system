import { NextResponse } from 'next/server';
import { createSnapshot, listSnapshotsWithErrors, SnapshotError } from '@/lib/snapshots-server';

export const dynamic = 'force-dynamic';

function unavailable() {
  return NextResponse.json(
    { error: 'Snapshots run only in the local development lab.' },
    { status: 403 },
  );
}

function failure(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Could not create the snapshot.' },
    { status: error instanceof SnapshotError ? error.status : 500 },
  );
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') return unavailable();
  try {
    return NextResponse.json(await listSnapshotsWithErrors());
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') return unavailable();
  try {
    const snapshot = await createSnapshot(await request.json());
    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
