'use client';

import { Button as BaseButton } from '@base-ui/react/button';
import type { ButtonProps as BaseButtonProps } from '@base-ui/react/button';
import { forwardRef, useEffect, useState } from 'react';
import type { PointerEvent } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';
export type ButtonSize = 'small' | 'default' | 'large';

export interface ButtonProps extends Omit<
  BaseButtonProps,
  'className' | 'render' | 'nativeButton' | 'focusableWhenDisabled' | 'style'
> {
  /** The button's visual emphasis. */
  variant?: ButtonVariant;
  /** Small is 28px, default follows the 34px reference, and large is 40px. */
  size?: ButtonSize;
  /** Layout classes for the button, such as `w-full`. */
  className?: string;
}

const sizeClasses: Record<ButtonSize, string> = {
  small: 'h-7 px-2',
  default: 'h-button px-4 py-2',
  large: 'h-10 px-4',
};

/** A stationary native action button whose face lifts on hover and seats on press. */
export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'default',
    className,
    type = 'button',
    children,
    disabled,
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
  // Native buttons handle activation; these flags only supply held-input visual poses.
  const [keyboardPressed, setKeyboardPressed] = useState(false);
  const [pressedPointerId, setPressedPointerId] = useState<number | null>(null);

  function releasePointer(event: PointerEvent<HTMLElement>) {
    setPressedPointerId((current) => (current === event.pointerId ? null : current));
  }

  useEffect(() => {
    if (disabled) {
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
  }, [disabled, keyboardPressed, pressedPointerId]);

  return (
    <BaseButton
      {...props}
      ref={ref}
      type={type}
      disabled={disabled}
      data-zao-component="button"
      data-zao-variant={variant}
      data-zao-size={size}
      data-zao-pressed={
        !disabled && (keyboardPressed || pressedPointerId !== null) ? '' : undefined
      }
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          !disabled &&
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
        // Touch browsers can defer :active until release; keep their held feedback immediate.
        if (
          !disabled &&
          !event.defaultPrevented &&
          event.isPrimary &&
          event.button === 0 &&
          event.pointerType !== 'mouse'
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
        'button-construction construction-shading inline-flex min-w-7 shrink-0 rounded-action type-button outline-focus disabled:cursor-not-allowed',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        data-zao-slot="face"
        className={[
          'inline-flex w-full items-center justify-center gap-2 whitespace-nowrap',
          sizeClasses[size],
        ].join(' ')}
      >
        {children}
      </span>
    </BaseButton>
  );
});
