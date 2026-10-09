'use client';

import { Field } from '@base-ui/react/field';
import { forwardRef } from 'react';
import type { ComponentProps, ReactNode, Ref } from 'react';

export type TextFieldSize = 'small' | 'default' | 'large';

export type TextFieldProps = Omit<ComponentProps<'input'>, 'children' | 'ref' | 'size'> & {
  /** The visible, accessible name of the input. */
  label: string;
  /** Additional guidance, associated with the input. */
  description?: ReactNode;
  /** An externally validated error, associated with the input when present. */
  error?: ReactNode;
  /** Uses the shared field heights: 28px, 34px, or 40px. */
  size?: TextFieldSize;
};

const heightClasses: Record<TextFieldSize, string> = {
  small: 'h-7',
  default: 'h-button',
  large: 'h-10',
};

/** A labeled text input with optional guidance and externally controlled error text. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, description, error, size = 'default', className, disabled, ...inputProps },
  ref,
) {
  const invalid = Boolean(error);

  return (
    <Field.Root
      disabled={disabled}
      invalid={invalid}
      data-zao-component="text-field"
      data-zao-slot="root"
      data-zao-size={size}
      className="flex w-full flex-col gap-1"
    >
      <Field.Label
        data-zao-slot="label"
        className="type-label font-medium text-default data-disabled:text-disabled"
      >
        {label}
      </Field.Label>
      <Field.Control
        {...inputProps}
        disabled={disabled}
        ref={ref as Ref<HTMLElement>}
        data-zao-slot="control"
        data-zao-field-frame=""
        data-zao-invalid={invalid ? '' : undefined}
        data-zao-disabled={disabled ? '' : undefined}
        className={[
          'w-full rounded-control border bg-canvas px-2 type-body text-default outline-focus placeholder:text-muted',
          'transition-colors duration-fast disabled:cursor-not-allowed disabled:bg-field-disabled disabled:text-disabled',
          'disabled:placeholder:text-disabled data-invalid:border-field-invalid',
          invalid ? 'border-field-invalid' : 'border-field',
          !invalid && !disabled ? 'hover:border-strong' : null,
          heightClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      />
      {error && (
        <Field.Error match data-zao-slot="error" className="type-caption text-danger">
          {error}
        </Field.Error>
      )}
      {description && (
        <Field.Description data-zao-slot="description" className="type-caption text-muted">
          {description}
        </Field.Description>
      )}
    </Field.Root>
  );
});
