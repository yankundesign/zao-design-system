'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { NavSectionFigure } from './nav-section-figure';

const sections = [
  { id: 'start', title: 'Start', links: [{ href: '/', label: 'Overview' }] },
  {
    id: 'foundations',
    title: 'Foundations',
    links: [
      { href: '/foundations/color', label: 'Color' },
      { href: '/foundations/typography', label: 'Typography' },
      { href: '/foundations/space', label: 'Space' },
      { href: '/foundations/depth', label: 'Depth' },
      { href: '/foundations/design', label: 'Design notes' },
      { href: '/foundations/data-visualization', label: 'Data visualization' },
    ],
  },
  {
    id: 'components',
    title: 'Components',
    links: [
      { href: '/components/button', label: 'Button' },
      { href: '/components/icon-button', label: 'IconButton' },
      { href: '/components/text-field', label: 'TextField' },
      { href: '/components/composer', label: 'Composer' },
      { href: '/components/conversation', label: 'Conversation' },
      { href: '/components/card', label: 'Card' },
      { href: '/components/combobox', label: 'Combobox' },
      { href: '/components/dialog', label: 'Dialog' },
      { href: '/components/menu', label: 'Menu' },
      { href: '/components/progress', label: 'Progress' },
      { href: '/components/select', label: 'Select' },
      { href: '/components/switch', label: 'Switch' },
      { href: '/components/table', label: 'Table' },
      { href: '/components/tabs', label: 'Tabs' },
    ],
  },
] as const;

function NavItemLink({ href, label, current }: { href: string; label: string; current: boolean }) {
  const [pressedPointer, setPressedPointer] = useState<number | null>(null);

  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      data-pressed={pressedPointer !== null ? '' : undefined}
      onPointerDown={(event) => {
        if (event.isPrimary && event.button === 0 && event.pointerType === 'touch') {
          setPressedPointer(event.pointerId);
        }
      }}
      onPointerUp={(event) => {
        setPressedPointer((pointer) => (pointer === event.pointerId ? null : pointer));
      }}
      onPointerCancel={(event) => {
        setPressedPointer((pointer) => (pointer === event.pointerId ? null : pointer));
      }}
      className={[
        'docs-nav-link rounded-none px-2 py-1.5 type-body outline-focus transition-colors duration-fast ease-standard focus-visible:outline-2 focus-visible:outline-offset-2',
        current ? 'text-default font-medium' : 'text-muted',
      ].join(' ')}
    >
      <span aria-hidden="true" className="docs-nav-paper" />
      <span className="docs-nav-label">{label}</span>
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const suffix = searchParams.get('style') === 'quiet-instrument' ? '?style=quiet-instrument' : '';
  const currentSection = sections.find((section) =>
    section.links.some((link) => link.href === pathname),
  );
  const currentPage = currentSection?.links.find((link) => link.href === pathname)?.label;

  const links = sections.map((section) => (
    <div
      key={section.id}
      data-nav-section={section.id}
      className="docs-nav-section flex shrink-0 flex-col gap-2"
    >
      <div className="docs-nav-section-heading flex items-end justify-between gap-3 px-2">
        <p className="type-body font-medium text-default">{section.title}</p>
        <NavSectionFigure kind={section.id} />
      </div>
      <div className="flex flex-col gap-1">
        {section.links.map((link) => {
          const current = pathname === link.href;
          const keepStyle =
            link.href.startsWith('/components') || link.href === '/foundations/design';
          return (
            <NavItemLink
              key={link.href}
              href={`${link.href}${keepStyle ? suffix : ''}`}
              label={link.label}
              current={current}
            />
          );
        })}
      </div>
    </div>
  ));

  return (
    <>
      <details key={pathname} className="md:hidden">
        <summary className="min-h-8 cursor-pointer rounded-control border border-default bg-surface px-3 py-2 type-label text-default outline-focus focus-visible:outline-2 focus-visible:outline-offset-2">
          Browse docs · {currentSection?.title ?? 'Start'} / {currentPage ?? 'Overview'}
        </summary>
        <nav aria-label="Docs" className="mt-3 flex flex-col gap-6 p-1">
          {links}
        </nav>
      </details>
      <nav
        aria-label="Docs"
        className="docs-nav-desktop docs-scroll-region hidden flex-col gap-6 p-1 md:flex"
      >
        {links}
      </nav>
    </>
  );
}
