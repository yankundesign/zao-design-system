import { getStyleStudyCss } from '@/lib/style-studies';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const css = await getStyleStudyCss(id);

  if (css === null) {
    return new Response('Study not found', { status: 404 });
  }

  return new Response(css, {
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
