'use client';

import { finish } from '@zao/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useFinish } from './use-finish';
import type { ComponentId } from './component-definitions';

export function ComponentPreview({
  component,
  title,
  selectedStyle,
  quietStudy,
  specimen,
  supplement,
}: {
  component: ComponentId;
  title: string;
  selectedStyle: 'baseline' | 'quiet-instrument';
  quietStudy: { title: string; cssUrl: string } | null;
  /** The page's own specimen; the page imports it, so its bundle holds no other page's. */
  specimen: ReactNode;
  /** Vertical Tabs, or a field's sizes and family, below the specimen. */
  supplement?: ReactNode;
}) {
  const { theme, resolved } = useFinish();
  const pathname = usePathname();
  const router = useRouter();
  const availableQuiet = quietStudy !== null;
  const activeQuiet = availableQuiet;
  const activeStyle = activeQuiet ? 'quiet-instrument' : 'baseline';
  const activeTitle = activeQuiet ? quietStudy.title : 'ZAO baseline';
  const isField = component === 'text-field' || component === 'combobox' || component === 'select';
  const hasPopup = [
    'button',
    'composer',
    'conversation',
    'text-field',
    'icon-button',
    'combobox',
    'dialog',
    'menu',
    'select',
    'table',
  ].includes(component);

  useEffect(() => {
    // Keep component URLs aligned with the current Su study.
    const suffix = availableQuiet ? '?style=quiet-instrument' : '';
    if (window.location.search !== suffix) {
      router.replace(`${pathname}${suffix}`, { scroll: false });
    }
  }, [availableQuiet, pathname, router, selectedStyle]);

  return (
    <section className="flex flex-col gap-4" aria-labelledby="preview-heading">
      <div className="flex flex-col gap-1">
        <h2 id="preview-heading" className="type-heading">
          Preview
        </h2>
        <p className="type-body text-muted">
          Su uses the Quiet instrument direction. Use the mode switcher above to see light and dark.
        </p>
      </div>

      <article className="flex min-w-0 flex-col gap-4" data-preview-style={activeStyle}>
        {activeQuiet && <link rel="stylesheet" href={quietStudy.cssUrl} />}
        <div className={hasPopup ? 'min-w-0 overflow-visible' : 'min-w-0 overflow-x-auto'}>
          <section
            {...finish(theme, resolved)}
            data-study={activeStyle}
            aria-label={`${title} preview, ${activeTitle}`}
            className={
              ['table', 'composer', 'conversation'].includes(component)
                ? 'study min-w-0 bg-canvas text-default'
                : `study min-w-0 rounded-surface border border-subtle bg-canvas p-5 text-default${component === 'menu' ? ' docs-menu-preview' : ''}`
            }
          >
            {specimen}
            {component === 'tabs' && supplement && (
              <div className="mt-6 border-t border-subtle pt-6">
                <h4 className="mb-4 type-label text-muted">Vertical tabs · manual activation</h4>
                {supplement}
              </div>
            )}
            {isField && supplement && (
              <div className="mt-6 flex min-w-0 flex-col gap-6 border-t border-subtle pt-6">
                {supplement}
              </div>
            )}
          </section>
        </div>
        {!activeQuiet && (
          <p className="type-caption text-muted">
            Published component styling from the current ZAO tokens.
          </p>
        )}
        {activeQuiet &&
          ![
            'button',
            'icon-button',
            'text-field',
            'composer',
            'conversation',
            'combobox',
            'select',
            'card',
            'dialog',
            'menu',
            'table',
            'tabs',
            'switch',
            'progress',
          ].includes(component) && (
            <p className="type-caption text-muted">
              This component inherits Quiet instrument’s shared Su values. Its own styling is still
              open for study.
            </p>
          )}
      </article>
    </section>
  );
}
