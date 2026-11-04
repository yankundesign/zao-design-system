import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { Nav } from './nav';

/**
 * The docs frame below the header: the nav beside the main column, inside `.docs-shell`. Every
 * docs route gets it from `app/(docs)/layout.tsx`; the landing page renders it itself, so its
 * sequence can come before it (landing sequence plan, WP 1.2).
 */
export function DocsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="docs-shell grid w-full gap-8 px-4 py-8 md:grid-cols-[180px_minmax(0,1fr)] md:px-8 md:py-12">
      <aside className="docs-nav-aside min-w-0">
        <Suspense fallback={null}>
          <Nav />
        </Suspense>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
