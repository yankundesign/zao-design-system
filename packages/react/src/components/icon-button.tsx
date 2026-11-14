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
  | 'result'
  | 'resultAnnouncement'
> {
  /** An Iconoir icon component, such as Settings from iconoir-react. */
  icon: IconButtonIcon;
  /**
   * The outcome of the action, such as "Copied", announced politely. For one Hold beat the
   * face stays seated and shows `resultIcon`. Pass `null` from the first render while there is
   * no result. Clear it in `onResultEnd`.
   */
  result?: string | null;
  /** The icon shown with the result, such as a check. Defaults to the action's own icon. */
  resultIcon?: IconButtonIcon;
  /** A concise action label, used for both the accessible name and visible tooltip. */
  'aria-label': string;
}

/** An icon-only Button with the same construction and a hoverable, dismissible label. */
export const IconButton = forwardRef<HTMLElement, IconButtonProps>(function IconButton(
  {
    icon: Icon,
    'aria-label': label,
    result,
    resultIcon: ResultIcon = Icon,
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
              result={
                result ? (
                  <ResultIcon data-zao-slot="icon" aria-hidden="true" focusable="false" />
                ) : (
                  result
                )
              }
              resultAnnouncement={result ?? undefined}
            >
              <Icon data-zao-slot="icon" aria-hidden="true" focusable="false" />
            </Button>
          }
        />
        <BaseTooltip.Portal container={portalContainer}>
          <BaseTooltip.Positioner side="bottom" sideOffset={4} className="z-30">
            <BaseTooltip.Popup
              data-zao-slot="tooltip"
              className="construction-shading material-overlay tooltip-construction construction-planes max-w-xs px-2 py-1.5 type-caption text-default"
            >
              {label}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </div>
  );
});
