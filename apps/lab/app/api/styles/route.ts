import { NextResponse } from 'next/server';
import { listStyleFiles, StyleStoreError, writeStyleFile } from '@/lib/styles-server';

export const dynamic = 'force-dynamic';

function unavailable() {
  return NextResponse.json(
    { error: 'The style library runs only in the local development lab.' },
    { status: 403 },
  );
}

function failure(error: unknown) {
  const status = error instanceof StyleStoreError ? error.status : 400;
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Could not read the style.' },
    { status },
  );
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') return unavailable();
  try {
    return NextResponse.json({ styles: await listStyleFiles() });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') return unavailable();
  try {
    const style = await writeStyleFile(await request.json(), true);
    return NextResponse.json({ style }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
