'use client';

import { Menu as BaseMenu } from '@base-ui/react/menu';
import { useRef, useState } from 'react';
import { Button } from './button.js';
import type { ButtonSize } from './button.js';

export type MenuSize = ButtonSize;

export type MenuAction =
  { label: string; onSelect?: () => void; disabled?: boolean } | { separator: true };

export interface MenuProps {
  /** Visible text that names and opens the actions menu. */
  trigger: string;
  items: readonly MenuAction[];
  disabled?: boolean;
  /** Uses Button's shared 28px, 34px, or 40px trigger height. */
  size?: MenuSize;
  /** Layout classes for the outer wrapper. */
  className?: string;
}

/** A constructed floating action panel anchored to a stationary Button trigger. */
export function Menu({ trigger, items, disabled, size = 'default', className }: MenuProps) {
  const portalContainer = useRef<HTMLDivElement>(null);
  const [exitHighlight, setExitHighlight] = useState<number | null>(null);

  return (
    <div
      ref={portalContainer}
      data-zao-component="menu"
      data-zao-slot="root"
      data-zao-size={size}
      className={['inline-block', className].filter(Boolean).join(' ')}
    >
      <BaseMenu.Root
        disabled={disabled}
        onOpenChange={(open) => {
          if (open) return;
          const highlighted = portalContainer.current?.querySelector<HTMLElement>(
            '[data-zao-slot="item"][data-highlighted]',
          );
          // Preserve the last selection's paint while Base UI completes dismissal.
          setExitHighlight(highlighted ? Number(highlighted.dataset.zaoItemIndex) : null);
        }}
        onOpenChangeComplete={() => setExitHighlight(null)}
      >
        <BaseMenu.Trigger
          disabled={disabled}
          data-zao-slot="trigger"
          render={<Button variant="secondary" size={size} />}
          className="menu-trigger-construction"
        >
          {trigger}
          <svg
            data-zao-slot="menu-indicator"
            className="size-4 shrink-0"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </BaseMenu.Trigger>
        <BaseMenu.Portal container={portalContainer} data-zao-slot="portal">
          <BaseMenu.Positioner
            side="bottom"
            align="start"
            sideOffset={4}
            collisionAvoidance={{ side: 'flip', align: 'shift' }}
            className="z-30"
          >
            <BaseMenu.Popup
              data-zao-slot="popup"
              className="construction-shading material-overlay menu-construction text-default outline-focus"
            >
              <div data-zao-slot="items" className="menu-content-construction overflow-y-auto p-1">
                {items.map((item, index) =>
                  'separator' in item ? (
                    <BaseMenu.Separator
                      key={`separator-${index}`}
                      data-zao-slot="separator"
                      className="my-1 border-t border-subtle"
                    />
                  ) : (
                    <BaseMenu.Item
                      key={`${item.label}-${index}`}
                      onClick={item.onSelect}
                      disabled={item.disabled}
                      data-zao-slot="item"
                      data-zao-item-index={index}
                      data-zao-exit-highlighted={exitHighlight === index ? '' : undefined}
                      className="menu-item-construction flex min-h-8 cursor-default items-center rounded-none px-3 py-1.5 type-body text-default outline-focus data-disabled:text-muted"
                    >
                      {item.label}
                    </BaseMenu.Item>
                  ),
                )}
              </div>
              <span data-zao-slot="reveal-edge" className="menu-reveal-edge" aria-hidden="true" />
            </BaseMenu.Popup>
          </BaseMenu.Positioner>
        </BaseMenu.Portal>
      </BaseMenu.Root>
    </div>
  );
}
