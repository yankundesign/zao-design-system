'use client';

import { Switch as BaseSwitch } from '@base-ui/react/switch';
import type { SwitchRootProps } from '@base-ui/react/switch';
import { forwardRef, useEffect, useState } from 'react';
import type { PointerEvent } from 'react';

export interface SwitchProps extends Omit<
  SwitchRootProps,
  'className' | 'render' | 'nativeButton' | 'style'
> {
  /** Layout classes for the control. Provide an accessible name with a label or `aria-label`. */
  className?: string;
}

/** A stationary on/off housing with a sliding face. Wrap it in a label or supply `aria-label`. */
export const Switch = forwardRef<HTMLElement, SwitchProps>(function Switch(
  {
    className,
    disabled,
    readOnly,
    onKeyDown,
    onKeyUp,
    onBlur,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onPointerMove,
    onPointerLeave,
    onLostPointerCapture,
    ...props
  },
  ref,
) {
  // Base UI owns activation and checked state; held input only seats the decorative face.
  const [keyboardPressed, setKeyboardPressed] = useState(false);
  const [pressedPointerId, setPressedPointerId] = useState<number | null>(null);

  function releasePointer(event: PointerEvent<HTMLElement>) {
    setPressedPointerId((current) => (current === event.pointerId ? null : current));
  }

  useEffect(() => {
    if (disabled || readOnly) {
      setKeyboardPressed(false);
      setPressedPointerId(null);
      return;
    }
    if (!keyboardPressed && pressedPointerId === null) return;
    const release = () => {
      setKeyboardPressed(false);
      setPressedPointerId(null);
    };
    window.addEventListener('blur', release);
    return () => window.removeEventListener('blur', release);
  }, [disabled, readOnly, keyboardPressed, pressedPointerId]);

  return (
    <BaseSwitch.Root
      {...props}
      ref={ref}
      disabled={disabled}
      readOnly={readOnly}
      data-zao-component="switch"
      data-zao-slot="root"
      data-zao-pressed={
        !disabled && !readOnly && (keyboardPressed || pressedPointerId !== null) ? '' : undefined
      }
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          !disabled &&
          !readOnly &&
          !event.currentTarget.hasAttribute('data-disabled') &&
          !event.defaultPrevented &&
          event.target === event.currentTarget &&
          (event.key === ' ' || event.key === 'Enter')
        ) {
          setKeyboardPressed(true);
        }
      }}
      onKeyUp={(event) => {
        if (event.key === ' ' || event.key === 'Enter') setKeyboardPressed(false);
        onKeyUp?.(event);
      }}
      onBlur={(event) => {
        setKeyboardPressed(false);
        setPressedPointerId(null);
        onBlur?.(event);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (
          !disabled &&
          !readOnly &&
          !event.currentTarget.hasAttribute('data-disabled') &&
          !event.defaultPrevented &&
          event.isPrimary &&
          event.button === 0
        ) {
          setPressedPointerId(event.pointerId);
        }
      }}
      onPointerUp={(event) => {
        releasePointer(event);
        onPointerUp?.(event);
      }}
      onPointerCancel={(event) => {
        releasePointer(event);
        onPointerCancel?.(event);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (pressedPointerId !== event.pointerId) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          releasePointer(event);
        }
      }}
      onPointerLeave={(event) => {
        releasePointer(event);
        onPointerLeave?.(event);
      }}
      onLostPointerCapture={(event) => {
        releasePointer(event);
        onLostPointerCapture?.(event);
      }}
      className={[
        'switch-construction inline-flex h-6 w-10 shrink-0 rounded-none align-middle outline-focus',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <BaseSwitch.Thumb data-zao-slot="thumb" aria-hidden="true">
        <span data-zao-slot="face" />
      </BaseSwitch.Thumb>
    </BaseSwitch.Root>
  );
});
