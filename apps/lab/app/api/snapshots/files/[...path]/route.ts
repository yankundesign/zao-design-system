import { NextResponse } from 'next/server';
import { readSnapshotAsset } from '@/lib/snapshots-server';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, context: Context) {
  if (process.env.NODE_ENV !== 'development')
    return NextResponse.json(
      { error: 'Snapshot files are available only in the local development lab.' },
      { status: 403 },
    );
  const { path } = await context.params;
  const asset = await readSnapshotAsset(path);
  if (!asset) return NextResponse.json({ error: 'Snapshot file was not found.' }, { status: 404 });
  return new NextResponse(new Uint8Array(asset.bytes), {
    headers: {
      'Content-Type': asset.contentType,
      'Cache-Control': 'no-store',
      'Content-Security-Policy':
        "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
