import type { Metadata } from 'next';
import Link from 'next/link';
import { Github } from 'iconoir-react';
import { Suspense } from 'react';
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
      <body className="flex min-h-dvh flex-col bg-canvas text-default">
        <header className="sticky top-0 z-10 border-b border-subtle bg-canvas">
          <div className="docs-shell flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
            <Link href="/" className="flex items-baseline gap-2 md:ml-3">
              <span className="type-heading">ZAO</span>
              <span className="type-heading font-display text-muted">造</span>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <FinishSwitcher />
              <a
                href="https://github.com/yankundesign/zao-design-system"
                aria-label="ZAO on GitHub"
                title="ZAO on GitHub"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted outline-focus hover:text-default focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Github className="h-5 w-5" aria-hidden="true" focusable="false" />
              </a>
            </div>
          </div>
        </header>
        <div className="docs-shell grid w-full gap-8 px-4 py-8 md:grid-cols-[180px_minmax(0,1fr)] md:px-8 md:py-12">
          <aside className="docs-nav-aside min-w-0">
            <Suspense fallback={null}>
              <Nav />
            </Suspense>
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
        <footer className="docs-shell mt-auto w-full px-4 py-4 type-caption text-muted md:px-8">
          Built by{' '}
          <a
            href="https://yankun.design/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-6 items-center text-default underline underline-offset-2 outline-focus focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Yankun Wang
          </a>
        </footer>
      </body>
    </html>
  );
}
