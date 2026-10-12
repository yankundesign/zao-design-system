import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * L12 option A: a docs-local link drawn with Button's published construction. `@zao/react` Button
 * renders a native button only, so navigation uses a real link with the same face, planes and seat.
 * landing.css supplies the link's hover and press poses, which Button keys to `:enabled`.
 */
export function ButtonLink({
  href,
  variant = 'primary',
  external = false,
  children,
}: {
  href: string;
  variant?: 'primary' | 'secondary';
  external?: boolean;
  children: ReactNode;
}) {
  const className =
    'landing-button-link button-construction construction-shading focus-brackets inline-flex min-w-7 shrink-0 rounded-action type-button outline-focus';
  const face = (
    <>
      <span data-zao-slot="side" className="construction-planes" aria-hidden="true" />
      <span
        data-zao-slot="face"
        className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap h-control px-4 py-2"
      >
        {children}
      </span>
    </>
  );
  const data = { 'data-zao-variant': variant, 'data-zao-size': 'default' } as const;

  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={className} {...data}>
      {face}
    </a>
  ) : (
    <Link href={href} className={className} {...data}>
      {face}
    </Link>
  );
}
