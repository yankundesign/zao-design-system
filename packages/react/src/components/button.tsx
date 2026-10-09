'use client';

import { Button as BaseButton } from '@base-ui/react/button';
import type { ButtonProps as BaseButtonProps } from '@base-ui/react/button';
import { forwardRef, useEffect, useState } from 'react';
import type { ComponentType, PointerEvent, SVGProps } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type ButtonSize = 'small' | 'default' | 'large';
export type ButtonIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface ButtonProps extends Omit<
  BaseButtonProps,
  'className' | 'render' | 'nativeButton' | 'focusableWhenDisabled' | 'style'
> {
  /** The button's visual emphasis. */
  variant?: ButtonVariant;
  /** Small is 28px, default follows the 34px reference, and large is 40px. */
  size?: ButtonSize;
  /** A decorative Iconoir-compatible icon before the visible label. */
  leadingIcon?: ButtonIcon;
  /** A decorative Iconoir-compatible icon after the visible label. */
  trailingIcon?: ButtonIcon;
  /** A decorative indicator pinned to the end, such as a dropdown chevron. */
  trailingAction?: ButtonIcon;
  /** Fill the available width. */
  block?: boolean;
  /** Retain focus while blocking repeat activation during an action. */
  loading?: boolean;
  /** Announced politely while loading; use a task name such as "Saving changes". */
  loadingAnnouncement?: string;
  /** Layout classes for the button, such as `w-full`. */
  className?: string;
}

const sizeClasses: Record<ButtonSize, string> = {
  small: 'h-7 px-2',
  default: 'h-button px-4 py-2',
  large: 'h-10 px-4',
};

function LoadingIndicator() {
  return (
    <svg
      data-zao-slot="spinner"
      className="button-loading-indicator"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3a9 9 0 1 1-9 9" />
    </svg>
  );
}

/** A stationary native action button whose face lifts on hover and seats on press. */
export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'default',
    leadingIcon: LeadingIcon,
    trailingIcon: TrailingIcon,
    trailingAction: TrailingAction,
    block = false,
    loading,
    loadingAnnouncement = 'Loading',
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
  const unavailable = Boolean(disabled || loading);
  // Plain children stay on the face so disabled ink updates without an extra inherited layer.
  const hasVisualContent = Boolean(
    LeadingIcon || TrailingIcon || TrailingAction || loading !== undefined,
  );
  const spinnerSlot = LeadingIcon
    ? 'leading-icon'
    : TrailingIcon
      ? 'trailing-icon'
      : TrailingAction
        ? 'trailing-action'
        : 'label';

  function releasePointer(event: PointerEvent<HTMLElement>) {
    setPressedPointerId((current) => (current === event.pointerId ? null : current));
  }

  useEffect(() => {
    if (unavailable) {
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
  }, [unavailable, keyboardPressed, pressedPointerId]);

  return (
    <>
      <BaseButton
        {...props}
        ref={ref}
        type={type}
        disabled={unavailable}
        focusableWhenDisabled={loading && !disabled}
        aria-busy={loading || props['aria-busy']}
        data-zao-component="button"
        data-zao-variant={variant}
        data-zao-size={size}
        data-zao-loading={loading ? '' : undefined}
        data-zao-pressed={
          !unavailable && (keyboardPressed || pressedPointerId !== null) ? '' : undefined
        }
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            !unavailable &&
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
            !unavailable &&
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
          block ? 'w-full' : undefined,
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
          {hasVisualContent ? (
            <>
              <span data-zao-slot="button-content" className="inline-flex items-center gap-2">
                {LeadingIcon && (
                  <span data-zao-slot="leading-icon" className="button-visual" aria-hidden="true">
                    {loading && spinnerSlot === 'leading-icon' ? (
                      <LoadingIndicator />
                    ) : (
                      <LeadingIcon aria-hidden="true" focusable="false" />
                    )}
                  </span>
                )}
                <span
                  data-zao-slot="button-label"
                  className={[
                    'inline-flex items-center gap-2',
                    loading && spinnerSlot === 'label' ? 'opacity-0' : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {children}
                </span>
                {TrailingIcon && (
                  <span data-zao-slot="trailing-icon" className="button-visual" aria-hidden="true">
                    {loading && spinnerSlot === 'trailing-icon' ? (
                      <LoadingIndicator />
                    ) : (
                      <TrailingIcon aria-hidden="true" focusable="false" />
                    )}
                  </span>
                )}
              </span>
              {TrailingAction && (
                <span
                  data-zao-slot="trailing-action"
                  className="button-visual ms-auto"
                  aria-hidden="true"
                >
                  {loading && spinnerSlot === 'trailing-action' ? (
                    <LoadingIndicator />
                  ) : (
                    <TrailingAction aria-hidden="true" focusable="false" />
                  )}
                </span>
              )}
              {loading && spinnerSlot === 'label' && (
                <span
                  data-zao-slot="loading-overlay"
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="button-visual">
                    <LoadingIndicator />
                  </span>
                </span>
              )}
            </>
          ) : (
            children
          )}
        </span>
      </BaseButton>
      {loading !== undefined && (
        <span
          data-zao-slot="loading-announcement"
          className="button-loading-announcement"
          role={loading ? 'status' : undefined}
          aria-live="polite"
          aria-atomic="true"
        >
          {loading ? loadingAnnouncement : ''}
        </span>
      )}
    </>
  );
});
