import { NextResponse } from 'next/server';
import { ImageAnalysisError } from '@/lib/image-analysis';
import { parseReferenceRequest } from '@/lib/reference-request';
import { createReference, listReferences, ReferenceStoreError } from '@/lib/references-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    { error: error instanceof Error ? error.message : 'Could not read references.' },
    { status },
  );
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') return unavailable();
  try {
    return NextResponse.json({ references: await listReferences() });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') return unavailable();
  try {
    const { metadata, image } = await parseReferenceRequest(request);
    const reference = await createReference(metadata, image);
    return NextResponse.json({ reference }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
