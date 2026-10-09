import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { DesignNotes } from '@/components/design-notes';

export const metadata: Metadata = { title: 'Data visualization' };

export default async function DataVisualizationPage() {
  if (process.env.ZAO_DOCS_STATIC_EXPORT !== '1') await connection();
  const markdown = await readFile(
    resolve(process.cwd(), '../../docs/data-visualization.md'),
    'utf8',
  );

  return (
    <div className="flex flex-col gap-10">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="type-title">Data visualization</h1>
        <p className="type-body text-muted">
          Quiet instruments for reading, inspecting, and understanding change. See every chart in
          the{' '}
          <Link href="/charts" className="text-accent underline outline-focus">
            Charts section
          </Link>
          .
        </p>
      </header>
      <DesignNotes markdown={markdown} sourceLabel="data-visualization.md" />
    </div>
  );
}
