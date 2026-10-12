'use client';

import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { finish } from '@zao/react';
import { useFinish } from '../use-finish';

/**
 * The landing page is one Quiet instrument island. Before hydration React only knows the server's
 * light snapshot, so this runs while the HTML is parsed and gives the island the page's resolved
 * mode before first paint. Client navigation renders the correct mode directly and skips it.
 */
const islandModeScript = `(function(){var s=document.currentScript,e=s&&s.parentElement;if(!e)return;var m=document.documentElement.getAttribute('data-zao-mode');if(m!=='light'&&m!=='dark'){m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}e.setAttribute('data-zao-mode',m)})();`;

const noop = () => () => {};

/** The landing page's one study island. Every section inherits its finish and mode. */
export function LandingRoot({ children }: { children: ReactNode }) {
  const { theme, resolved } = useFinish();
  const serverRender = useSyncExternalStore(
    noop,
    () => false,
    () => true,
  );
  return (
    <div
      {...finish(theme, resolved)}
      data-study="quiet-instrument"
      suppressHydrationWarning
      data-landing=""
      className="landing study flex min-w-0 flex-col text-default"
    >
      {serverRender ? <script dangerouslySetInnerHTML={{ __html: islandModeScript }} /> : null}
      {children}
    </div>
  );
}
