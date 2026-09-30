'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sections = [
  { title: 'Start', links: [{ href: '/', label: 'Overview' }] },
  {
    title: 'Foundations',
    links: [
      { href: '/foundations/color', label: 'Color' },
      { href: '/foundations/typography', label: 'Typography' },
      { href: '/foundations/space', label: 'Space' },
    ],
  },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Docs" className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <p className="type-caption text-muted">{section.title}</p>
          {section.links.map((link) => {
            const current = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? 'page' : undefined}
                className={[
                  'rounded-control px-2 py-1.5 type-body transition-colors duration-fast',
                  current
                    ? 'bg-active text-default font-medium'
                    : 'text-muted hover:bg-hover hover:text-default',
                ].join(' ')}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
