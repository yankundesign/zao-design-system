import { NextResponse } from 'next/server';
import { readReferenceImage, ReferenceStoreError } from '@/lib/references-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (process.env.NODE_ENV !== 'development')
    return NextResponse.json(
      { error: 'Reference images are available only in the local development lab.' },
      { status: 403 },
    );
  try {
    const { id } = await context.params;
    const { buffer, mimeType } = await readReferenceImage(id);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not read the image.' },
      { status: error instanceof ReferenceStoreError ? error.status : 500 },
    );
  }
}
