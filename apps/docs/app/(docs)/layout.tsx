import type { ReactNode } from 'react';
import { DocsGrid } from '@/components/docs-grid';
import { Nav } from '@/components/nav';

/** Every docs route sits in the docs frame. The landing page renders the frame itself. */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsGrid nav={<Nav />}>{children}</DocsGrid>;
}
