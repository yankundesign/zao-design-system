import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { PartsInventory } from '@/components/parts-inventory';

export const metadata: Metadata = { title: 'Parts' };

export default async function PartsPage() {
  if (process.env.ZAO_DOCS_STATIC_EXPORT !== '1') await connection();
  const markdown = await readFile(resolve(process.cwd(), '../../docs/parts.md'), 'utf8');
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <h1 className="type-title">Parts</h1>
      <PartsInventory markdown={markdown} />
    </div>
  );
}
