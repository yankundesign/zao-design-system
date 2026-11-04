import type { ReactNode } from 'react';
import { DocsGrid } from '@/components/docs-grid';

/** Every docs route sits in the docs frame. The landing page renders the frame itself. */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsGrid>{children}</DocsGrid>;
}
