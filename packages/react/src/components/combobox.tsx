'use client';

import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { useId, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useFieldPopup } from './use-field-popup.js';

export type ComboboxSize = 'small' | 'default' | 'large';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  /** The visible, accessible name of the input. */
  label: string;
  /** Choices to filter and select. Values must be unique. */
  options: readonly ComboboxOption[];
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
  size?: ComboboxSize;
  /** Layout classes for the outer field, such as `w-full`. */
  className?: string;
}

const heightClasses: Record<ComboboxSize, string> = {
  small: 'h-7',
  default: 'h-button',
  large: 'h-10',
};

/** A labeled, filterable single-choice input; typed text must match an option. */
export function Combobox({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Choose an option',
  description,
  error,
  name,
  required,
  disabled,
  size = 'default',
  className,
}: ComboboxProps) {
  const {
    portalContainer,
    exitHighlight,
    onOpenChange,
    onOpenChangeComplete,
    onItemHighlighted,
    trackHighlight,
  } = useFieldPopup();
  const inputId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const invalid = Boolean(error);
  const describedBy = [error ? errorId : null, description ? descriptionId : null]
    .filter(Boolean)
    .join(' ');
  const items = useMemo(
    () =>
      BaseCombobox.createItems(options, {
        getValue: (option) => option.value,
        getLabel: (option) => option.label,
      }),
    [options],
  );

  return (
    <div
      ref={portalContainer}
      data-zao-component="combobox"
      data-zao-slot="root"
      data-zao-size={size}
      className={['flex w-full flex-col gap-1', className].filter(Boolean).join(' ')}
    >
      <BaseCombobox.Root<string, false, ComboboxOption>
        items={items}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        name={name}
        required={required}
        disabled={disabled}
        onOpenChange={onOpenChange}
        onOpenChangeComplete={onOpenChangeComplete}
        onItemHighlighted={onItemHighlighted}
      >
        <label
          htmlFor={inputId}
          data-zao-slot="label"
          className={['type-label font-medium', disabled ? 'text-disabled' : 'text-default'].join(
            ' ',
          )}
        >
          {label}
        </label>
        <BaseCombobox.InputGroup
          data-zao-slot="input-group"
          data-zao-field-frame=""
          data-zao-invalid={invalid ? '' : undefined}
          data-zao-disabled={disabled ? '' : undefined}
          className={[
            'flex w-full items-center rounded-control border bg-canvas transition-colors duration-fast data-disabled:bg-field-disabled',
            invalid ? 'border-field-invalid' : 'border-field',
            !invalid && !disabled ? 'hover:border-strong' : null,
            heightClasses[size],
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <BaseCombobox.Input
            id={inputId}
            data-zao-slot="input"
            aria-describedby={describedBy || undefined}
            aria-invalid={invalid || undefined}
            placeholder={placeholder}
            className="h-full min-w-0 flex-1 bg-canvas px-2 type-body text-default outline-focus placeholder:text-muted disabled:cursor-not-allowed disabled:bg-field-disabled disabled:text-disabled"
          />
          <span data-zao-slot="clear-space" className="inline-flex h-full w-7 shrink-0">
            <BaseCombobox.Clear
              data-zao-slot="clear"
              aria-label={`Clear ${label}`}
              className="inline-flex h-full min-h-6 min-w-7 items-center justify-center text-muted outline-focus hover:text-default data-disabled:text-disabled"
            >
              <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="m4 4 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </BaseCombobox.Clear>
          </span>
          <BaseCombobox.Trigger
            data-zao-slot="trigger"
            aria-label={`Open ${label} options`}
            className="inline-flex h-full min-h-6 min-w-7 shrink-0 items-center justify-center pl-1 pr-2 text-muted outline-focus hover:text-default data-disabled:text-disabled"
          >
            <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </BaseCombobox.Trigger>
        </BaseCombobox.InputGroup>
        <BaseCombobox.Portal container={portalContainer} data-zao-slot="portal">
          <BaseCombobox.Positioner
            side="bottom"
            align="start"
            sideOffset={4}
            collisionAvoidance={{ side: 'flip', align: 'shift' }}
            style={{ width: 'min(var(--anchor-width), var(--available-width))' }}
            className="z-30"
          >
            <BaseCombobox.Popup
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
                <BaseCombobox.Empty
                  data-zao-slot="empty"
                  className="px-2 py-1 type-caption text-muted"
                >
                  No matches found.
                </BaseCombobox.Empty>
                <BaseCombobox.List data-zao-slot="list" aria-label={label}>
                  {(option: ComboboxOption) => (
                    <BaseCombobox.Item
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      data-zao-slot="item"
                      data-zao-option-value={option.value}
                      data-zao-exit-highlighted={exitHighlight === option.value ? '' : undefined}
                      className="menu-item-construction flex min-h-7 cursor-default items-center gap-2 rounded-none px-2 type-body text-default outline-focus data-disabled:text-disabled"
                    >
                      <span data-zao-slot="item-text" className="min-w-0 flex-1 truncate">
                        {option.label}
                      </span>
                      <span data-zao-slot="indicator-space" className="inline-flex size-4 shrink-0">
                        <BaseCombobox.ItemIndicator data-zao-slot="item-indicator">
                          <svg
                            className="size-4"
                            viewBox="0 0 16 16"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </BaseCombobox.ItemIndicator>
                      </span>
                    </BaseCombobox.Item>
                  )}
                </BaseCombobox.List>
              </div>
              <span data-zao-slot="reveal-edge" aria-hidden="true" />
            </BaseCombobox.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      </BaseCombobox.Root>
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
