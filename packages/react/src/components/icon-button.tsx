'use client';

import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { forwardRef, useRef } from 'react';
import { Button } from './button.js';
import type { ButtonIcon, ButtonProps } from './button.js';

export type IconButtonIcon = ButtonIcon;

export interface IconButtonProps extends Omit<
  ButtonProps,
  | 'children'
  | 'aria-label'
  | 'aria-labelledby'
  | 'leadingIcon'
  | 'trailingIcon'
  | 'trailingAction'
  | 'block'
  | 'loading'
  | 'loadingAnnouncement'
> {
  /** An Iconoir icon component, such as Settings from iconoir-react. */
  icon: IconButtonIcon;
  /** A concise action label, used for both the accessible name and visible tooltip. */
  'aria-label': string;
}

/** An icon-only Button with the same construction and a hoverable, dismissible label. */
export const IconButton = forwardRef<HTMLElement, IconButtonProps>(function IconButton(
  {
    icon: Icon,
    'aria-label': label,
    className,
    disabled,
    variant = 'secondary',
    size = 'default',
    ...props
  },
  ref,
) {
  const portalContainer = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={portalContainer}
      data-zao-component="icon-button"
      data-zao-size={size}
      className={['inline-flex shrink-0', className].filter(Boolean).join(' ')}
    >
      <BaseTooltip.Root disabled={disabled}>
        <BaseTooltip.Trigger
          disabled={disabled}
          render={
            <Button
              {...props}
              ref={ref}
              aria-label={label}
              disabled={disabled}
              variant={variant}
              size={size}
              className="icon-button-sizing"
            >
              <Icon data-zao-slot="icon" aria-hidden="true" focusable="false" />
            </Button>
          }
        />
        <BaseTooltip.Portal container={portalContainer}>
          <BaseTooltip.Positioner side="bottom" sideOffset={4} className="z-30">
            <BaseTooltip.Popup
              data-zao-slot="tooltip"
              className="material-overlay max-w-xs px-2 py-1.5 type-caption text-default"
            >
              {label}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </div>
  );
});
