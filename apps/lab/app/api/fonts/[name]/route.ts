import { NextResponse } from 'next/server';
import { readFontFile } from '@/lib/fonts-server';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Local fonts are only available in development.' },
      { status: 403 },
    );
  }
  try {
    const { name } = await params;
    const font = await readFontFile(name);
    if (!font) return NextResponse.json({ error: 'Font file was not found.' }, { status: 404 });
    return new Response(new Uint8Array(font.bytes), {
      headers: {
        'Content-Type': font.mimeType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not read the font file.' },
      { status: 400 },
    );
  }
}
