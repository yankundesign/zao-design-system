'use client';

import { finish } from '@zao/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CardLayoutPreview } from './card-layout-preview';
import { FieldFamilySpecimen, FieldSizeSpecimen } from './field-family-specimen';
import {
  ButtonSpecimen,
  CardSpecimen,
  ComboboxSpecimen,
  DialogSpecimen,
  IconButtonSpecimen,
  MenuSpecimen,
  ProgressSpecimen,
  SelectSpecimen,
  SwitchSpecimen,
  TabsSpecimen,
  TabsNavigationSpecimen,
  TextFieldSpecimen,
} from './component-specimens';
import { useFinish } from './use-finish';
import { TableSpecimen } from './table-specimen';
import { ComposerSpecimen } from './composer-specimen';
import { ConversationSpecimen } from './conversation-specimen';
import type { ComponentId } from './component-detail';

const specimens = {
  button: ButtonSpecimen,
  'icon-button': IconButtonSpecimen,
  'text-field': TextFieldSpecimen,
  composer: ComposerSpecimen,
  conversation: ConversationSpecimen,
  card: CardSpecimen,
  combobox: ComboboxSpecimen,
  dialog: DialogSpecimen,
  menu: MenuSpecimen,
  progress: ProgressSpecimen,
  select: SelectSpecimen,
  switch: SwitchSpecimen,
  table: TableSpecimen,
  tabs: TabsSpecimen,
};

export function ComponentPreview({
  component,
  title,
  selectedStyle,
  quietStudy,
}: {
  component: ComponentId;
  title: string;
  selectedStyle: 'baseline' | 'quiet-instrument';
  quietStudy: { title: string; cssUrl: string } | null;
}) {
  const { theme, resolved } = useFinish();
  const pathname = usePathname();
  const router = useRouter();
  const Specimen = specimens[component];
  const availableQuiet = quietStudy !== null;
  const activeQuiet = availableQuiet;
  const activeStyle = activeQuiet ? 'quiet-instrument' : 'baseline';
  const activeTitle = activeQuiet ? quietStudy.title : 'ZAO baseline';
  const isField = component === 'text-field' || component === 'combobox' || component === 'select';
  const hasPopup = [
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
                : 'study min-w-0 rounded-surface border border-subtle bg-canvas p-5 text-default'
            }
          >
            {component === 'card' ? <CardLayoutPreview /> : <Specimen />}
            {component === 'tabs' && (
              <div className="mt-6 border-t border-subtle pt-6">
                <h4 className="mb-4 type-label text-muted">Vertical tabs · manual activation</h4>
                <TabsNavigationSpecimen />
              </div>
            )}
            {isField && (
              <div className="mt-6 flex min-w-0 flex-col gap-6 border-t border-subtle pt-6">
                <FieldSizeSpecimen component={component} />
                <FieldFamilySpecimen />
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
