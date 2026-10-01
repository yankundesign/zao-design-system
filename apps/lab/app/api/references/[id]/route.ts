import { NextResponse } from 'next/server';
import { ImageAnalysisError } from '@/lib/image-analysis';
import { parseReferenceRequest } from '@/lib/reference-request';
import {
  deleteReference,
  readReference,
  ReferenceStoreError,
  updateReference,
} from '@/lib/references-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

function unavailable() {
  return NextResponse.json(
    { error: 'The reference board runs only in the local development lab.' },
    { status: 403 },
  );
}

function failure(error: unknown) {
  const status =
    error instanceof ReferenceStoreError
      ? error.status
      : error instanceof ImageAnalysisError
        ? 400
        : 500;
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Could not update the reference.' },
    { status },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  if (process.env.NODE_ENV !== 'development') return unavailable();
  try {
    const { id } = await context.params;
    return NextResponse.json({ reference: await readReference(id) });
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (process.env.NODE_ENV !== 'development') return unavailable();
  try {
    const { id } = await context.params;
    const { metadata, image } = await parseReferenceRequest(request);
    return NextResponse.json({ reference: await updateReference(id, metadata, image) });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (process.env.NODE_ENV !== 'development') return unavailable();
  try {
    const { id } = await context.params;
    await deleteReference(id);
    return NextResponse.json({ deleted: id });
  } catch (error) {
    return failure(error);
  }
}
