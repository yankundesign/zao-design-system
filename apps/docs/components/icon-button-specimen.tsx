'use client';

import { useState } from 'react';
import { Copy, Plus, Search, Settings, Trash } from 'iconoir-react';
import { IconButton } from '@zao/react';

/** Iconoir actions share Button's construction and expose their labels in tooltips. */
export function IconButtonSpecimen() {
  const [action, setAction] = useState<string | null>(null);

  return (
    <div data-zao-specimen="icon-button" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="type-label font-medium">Emphasis</p>
        <div className="flex flex-wrap items-center gap-3">
          <IconButton
            icon={Plus}
            aria-label="Add workspace"
            variant="primary"
            onClick={() => setAction('Added workspace.')}
          />
          <IconButton
            icon={Settings}
            aria-label="Open settings"
            onClick={() => setAction('Opened settings.')}
          />
          <IconButton
            icon={Copy}
            aria-label="Copy workspace ID"
            variant="quiet"
            onClick={() => setAction('Copied workspace ID.')}
          />
          <IconButton
            icon={Trash}
            aria-label="Delete workspace"
            disabled
            onClick={() => setAction('Deleted workspace.')}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <p className="type-label font-medium">Size</p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col items-center gap-2">
            <IconButton
              icon={Search}
              aria-label="Search workspaces"
              size="small"
              onClick={() => setAction('Searched workspaces.')}
            />
            <span className="type-caption text-muted">Small</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <IconButton
              icon={Settings}
              aria-label="Open workspace settings"
              onClick={() => setAction('Opened workspace settings.')}
            />
            <span className="type-caption text-muted">Default</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <IconButton
              icon={Plus}
              aria-label="Add member"
              size="large"
              onClick={() => setAction('Added member.')}
            />
            <span className="type-caption text-muted">Large</span>
          </div>
        </div>
      </div>
      <p className="type-caption text-muted" aria-live="polite">
        {action ?? 'Choose an action to see its result.'}
      </p>
    </div>
  );
}
