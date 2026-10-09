'use client';

import { Select as BaseSelect } from '@base-ui/react/select';
import { useId } from 'react';
import type { ReactNode } from 'react';
import { useFieldPopup } from './use-field-popup.js';

export type SelectSize = 'small' | 'default' | 'large';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** The visible, accessible name of the control. */
  label: string;
  /** The fixed set of choices. Use Combobox when the list needs filtering. */
  options: readonly SelectOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  description?: ReactNode;
  error?: ReactNode;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  /** Uses the shared field heights: 28px, 34px, or 40px. */
  size?: SelectSize;
  /** Layout classes for the outer field, such as `w-full`. */
  className?: string;
}

const heightClasses: Record<SelectSize, string> = {
  small: 'h-7',
  default: 'h-button',
  large: 'h-10',
};

/** A labeled single-choice select with keyboard typeahead. */
export function Select({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Select an option',
  description,
  error,
  name,
  required,
  disabled,
  size = 'default',
  className,
}: SelectProps) {
  const { portalContainer, exitHighlight, onOpenChange, onOpenChangeComplete, trackHighlight } =
    useFieldPopup();
  const descriptionId = useId();
  const errorId = useId();
  const invalid = Boolean(error);
  const describedBy = [error ? errorId : null, description ? descriptionId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={portalContainer}
      data-zao-component="select"
      data-zao-slot="root"
      data-zao-size={size}
      className={['flex w-full flex-col gap-1', className].filter(Boolean).join(' ')}
    >
      <BaseSelect.Root<string>
        items={options}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        name={name}
        required={required}
        disabled={disabled}
        onOpenChange={onOpenChange}
        onOpenChangeComplete={onOpenChangeComplete}
      >
        <BaseSelect.Label
          data-zao-slot="label"
          className={['type-label font-medium', disabled ? 'text-disabled' : 'text-default'].join(
            ' ',
          )}
        >
          {label}
        </BaseSelect.Label>
        <BaseSelect.Trigger
          data-zao-slot="trigger"
          data-zao-field-frame=""
          data-zao-invalid={invalid ? '' : undefined}
          data-zao-disabled={disabled ? '' : undefined}
          aria-describedby={describedBy || undefined}
          aria-invalid={invalid || undefined}
          className={[
            'inline-flex w-full items-center justify-between gap-2 rounded-control border bg-canvas px-2 type-body text-default outline-focus transition-colors duration-fast',
            'data-disabled:cursor-not-allowed data-disabled:bg-field-disabled data-disabled:text-disabled',
            invalid ? 'border-field-invalid' : 'border-field',
            !invalid && !disabled ? 'hover:border-strong' : null,
            heightClasses[size],
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <BaseSelect.Value
            data-zao-slot="value"
            placeholder={placeholder}
            className="min-w-0 truncate data-placeholder:text-muted"
          />
          <BaseSelect.Icon data-zao-slot="icon" className="ml-auto shrink-0 text-muted">
            <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal container={portalContainer} data-zao-slot="portal">
          <BaseSelect.Positioner
            alignItemWithTrigger={false}
            side="bottom"
            align="start"
            sideOffset={4}
            collisionAvoidance={{ side: 'flip', align: 'shift' }}
            style={{ width: 'min(var(--anchor-width), var(--available-width))' }}
            className="z-30"
          >
            <BaseSelect.Popup
              data-zao-slot="popup"
              className="construction-shading relative material-overlay min-w-0 text-default outline-focus"
              style={{ maxWidth: 'var(--available-width)', maxHeight: 'var(--available-height)' }}
            >
              <div
                data-zao-slot="viewport"
                onFocusCapture={trackHighlight}
                onPointerMoveCapture={trackHighlight}
                className="overflow-y-auto p-1"
                style={{ maxHeight: 'calc(var(--available-height) - var(--zao-space-0-5))' }}
              >
                <BaseSelect.List data-zao-slot="list" aria-label={label}>
                  {options.map((option) => (
                    <BaseSelect.Item
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      data-zao-slot="item"
                      data-zao-option-value={option.value}
                      data-zao-exit-highlighted={exitHighlight === option.value ? '' : undefined}
                      className="flex min-h-7 cursor-default items-center gap-2 rounded-control px-2 type-body text-default outline-focus data-highlighted:bg-hover data-disabled:text-disabled"
                    >
                      <BaseSelect.ItemText
                        data-zao-slot="item-text"
                        className="min-w-0 flex-1 truncate"
                      >
                        {option.label}
                      </BaseSelect.ItemText>
                      <span data-zao-slot="indicator-space" className="inline-flex size-4 shrink-0">
                        <BaseSelect.ItemIndicator data-zao-slot="item-indicator">
                          <svg
                            className="size-4"
                            viewBox="0 0 16 16"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </BaseSelect.ItemIndicator>
                      </span>
                    </BaseSelect.Item>
                  ))}
                </BaseSelect.List>
              </div>
              <span data-zao-slot="reveal-edge" aria-hidden="true" />
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
      {error && (
        <div id={errorId} data-zao-slot="error" className="type-caption text-danger">
          {error}
        </div>
      )}
      {description && (
        <div id={descriptionId} data-zao-slot="description" className="type-caption text-muted">
          {description}
        </div>
      )}
    </div>
  );
}
