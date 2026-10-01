import { NextResponse } from 'next/server';
import { validateStyle } from '@zao/engine';
import { listStyleFiles } from '@/lib/styles-server';
import { renderAllContexts } from '@/lib/token-data';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'The preview runs only in the local development lab.' },
      { status: 403 },
    );
  }
  try {
    const style: unknown = await request.json();
    validateStyle(style);
    const variables = renderAllContexts(style, await listStyleFiles());
    return NextResponse.json({ variables });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not render the style.' },
      { status: 400 },
    );
  }
}
