import { NextResponse } from 'next/server';
import { listFontFiles } from '@/lib/fonts-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Local fonts are only available in development.' },
      { status: 403 },
    );
  }
  try {
    return NextResponse.json({ fonts: await listFontFiles() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not list font files.' },
      { status: 400 },
    );
  }
}
