'use client';

import { finish } from '@zao/react';
import type { ReactNode } from 'react';
import { useFinish } from '../use-finish';

/** Charts preview inside the current Su study, like component previews. */
export function ChartStudy({
  label,
  cssUrl,
  children,
  framed = true,
}: {
  label: string;
  cssUrl: string | null;
  children: ReactNode;
  framed?: boolean;
}) {
  const { theme, resolved } = useFinish();
  const style = cssUrl ? 'quiet-instrument' : 'baseline';

  return (
    <div className="min-w-0" data-preview-style={style}>
      {cssUrl && <link rel="stylesheet" href={cssUrl} />}
      <section
        {...finish(theme, resolved)}
        data-study={style}
        aria-label={label}
        className={
          framed
            ? 'study min-w-0 rounded-surface border border-subtle bg-canvas p-5 text-default'
            : 'study min-w-0 bg-canvas text-default'
        }
      >
        {children}
      </section>
    </div>
  );
}
