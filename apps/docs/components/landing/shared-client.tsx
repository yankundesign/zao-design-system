'use client';

/**
 * The client components the landing shares with the root and docs layouts, under landing names.
 *
 * Next's webpack build merges the root page's client manifest into every route's (the page and the
 * layouts share the `app` group), and where both reference the same client module, the page's chunk
 * list wins. Every docs route then loaded the whole landing: its sequence, room plates and charts.
 * Reaching these components through this module gives the landing its own references, so the
 * layouts' `next/link` and `Nav` keep their own chunks. Landing server components import `next/link`
 * and `../nav` only from here; e2e/performance.spec.ts guards it.
 */
export { default as LandingLink } from 'next/link';
export { Nav as LandingNav } from '../nav';
