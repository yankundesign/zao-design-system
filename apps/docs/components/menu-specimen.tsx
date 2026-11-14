'use client';

import { useState } from 'react';
import { Menu } from '@zao/react';

/** A short action set with a separator, disabled item, and visible result. */
export function MenuSpecimen() {
  const [action, setAction] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-6">
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
      <div data-zao-specimen="menu-shortcuts" className="flex flex-col items-start gap-3">
        <h3 className="type-label font-medium">Shortcuts</h3>
        <Menu
          trigger="Edit"
          items={[
            {
              label: 'Undo',
              shortcut: '⌘Z',
              keyShortcuts: 'Meta+Z',
              onSelect: () => setAction('Undo selected.'),
            },
            {
              label: 'Redo',
              shortcut: '⇧⌘Z',
              keyShortcuts: 'Shift+Meta+Z',
              onSelect: () => setAction('Redo selected.'),
            },
            { separator: true },
            {
              label: 'Find in workspace',
              shortcut: '⌘K',
              keyShortcuts: 'Meta+K',
              onSelect: () => setAction('Find in workspace selected.'),
            },
            { label: 'Replace', shortcut: '⌥⌘F', keyShortcuts: 'Alt+Meta+F', disabled: true },
          ]}
        />
        <p className="type-caption text-muted">
          A shortcut is a label. The host binds the key and runs the same action.
        </p>
      </div>
    </div>
  );
}
