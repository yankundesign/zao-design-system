'use client';

import { useState } from 'react';
import { Menu } from '@zao/react';

/** A short action set with a separator, disabled item, and visible result. */
export function MenuSpecimen() {
  const [action, setAction] = useState<string | null>(null);

  return (
    <div data-zao-specimen="menu" className="flex flex-col items-start gap-3">
      <Menu
        trigger="Workspace actions"
        items={[
          { label: 'Rename workspace', onSelect: () => setAction('Rename workspace selected.') },
          { label: 'Copy workspace ID', onSelect: () => setAction('Copied workspace ID.') },
          { separator: true },
          { label: 'Archive workspace', disabled: true },
        ]}
      />
      <p className="type-caption text-muted" aria-live="polite">
        {action ?? 'Choose an action to see its result.'}
      </p>
    </div>
  );
}
