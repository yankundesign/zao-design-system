import { NextResponse } from 'next/server';
import {
  deleteStyleFile,
  readStyleFile,
  StyleStoreError,
  writeStyleFile,
} from '@/lib/styles-server';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function unavailable() {
  return NextResponse.json(
    { error: 'The style library runs only in the local development lab.' },
    { status: 403 },
  );
}

function failure(error: unknown) {
  const status = error instanceof StyleStoreError ? error.status : 400;
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Could not update the style.' },
    { status },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  if (process.env.NODE_ENV !== 'development') return unavailable();
  try {
    const { id } = await context.params;
    return NextResponse.json({ style: await readStyleFile(id) });
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (process.env.NODE_ENV !== 'development') return unavailable();
  try {
    const { id } = await context.params;
    const value: unknown = await request.json();
    if (!value || typeof value !== 'object' || !('id' in value) || value.id !== id) {
      return NextResponse.json({ error: 'The style id must match the URL.' }, { status: 400 });
    }
    return NextResponse.json({ style: await writeStyleFile(value, false) });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (process.env.NODE_ENV !== 'development') return unavailable();
  try {
    const { id } = await context.params;
    await deleteStyleFile(id);
    return NextResponse.json({ deleted: id });
  } catch (error) {
    return failure(error);
  }
}
