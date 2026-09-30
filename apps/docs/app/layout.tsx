import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { FinishSwitcher } from '@/components/finish-switcher';
import { Nav } from '@/components/nav';
import { finishInitScript } from '@/lib/finish-script';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'ZAO', template: '%s · ZAO' },
  description:
    'ZAO is the foundation for how we build. Inspired by the principles of Yingzao Fashi, it defines the shared materials, patterns, and rules that help teams construct consistent digital experiences.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-zao-theme="su" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: finishInitScript }} />
      </head>
      <body className="min-h-dvh bg-canvas text-default">
        <header className="sticky top-0 z-10 border-b border-subtle bg-canvas">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="type-heading">ZAO</span>
              <span className="type-heading font-display text-muted">造</span>
            </Link>
            <FinishSwitcher />
          </div>
        </header>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[180px_minmax(0,1fr)] md:px-8 md:py-12">
          <aside className="md:sticky md:top-24 md:self-start">
            <Nav />
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
