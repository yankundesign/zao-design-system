'use client';

import { Button as BaseButton } from '@base-ui/react/button';
import type { ButtonProps as BaseButtonProps } from '@base-ui/react/button';
import { forwardRef, useEffect, useRef, useState } from 'react';
import type { ComponentType, PointerEvent, ReactNode, SVGProps } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type ButtonSize = 'small' | 'default' | 'large';
export type ButtonIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface ButtonProps extends Omit<
  BaseButtonProps,
  'className' | 'render' | 'nativeButton' | 'focusableWhenDisabled' | 'style'
> {
  /** The button's visual emphasis. */
  variant?: ButtonVariant;
  /** Shared control heights: small 28px, default 34px, and large 40px. */
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
  /**
   * The outcome of the action, such as "Copied", shown on the face once the host knows it. The
   * face stays seated for the Hold beat while it reads the result, then lifts and shows the
   * action again. Use the action's own verb, and keep it no longer than the label. Pass `null`
   * from the first render while there is no result, so the label's structure stays the same.
   */
  result?: ReactNode;
  /** Announced politely with the result; defaults to `result` when that is text. */
  resultAnnouncement?: string;
  /** The beat has ended and the action is showing again. Clear `result` here. */
  onResultEnd?: () => void;
  /** Layout classes for the button, such as `w-full`. */
  className?: string;
}

const sizeClasses: Record<ButtonSize, string> = {
  small: 'h-7 px-2',
  default: 'h-control px-4 py-2',
  large: 'h-10 px-4',
};

/**
 * The pending mark: eight hairline ticks, one per motion grade, that fill in eight steps per
 * loading duration and start again. The ticks are a pixel wide and two apart in a box of any
 * size. Only transforms move, so the mark keeps stepping while the page is busy.
 */
export function LoadingIndicator() {
  return (
    <span data-zao-slot="spinner" className="button-loading-indicator" aria-hidden="true">
      <span className="button-loading-ticks">
        <span className="button-loading-window">
          <span className="button-loading-lit" />
        </span>
      </span>
    </span>
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
    result,
    resultAnnouncement,
    onResultEnd,
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
  // A result arrives once and is shown for one Hold beat (CR1). The host owns the result; the
  // Button owns the beat, and tells the host when it has ended.
  const element = useRef<HTMLElement | null>(null);
  const hasResult = result !== undefined && result !== null && result !== false && !loading;
  const [resultShown, setResultShown] = useState(false);
  const resultEnd = useRef(onResultEnd);
  useEffect(() => {
    resultEnd.current = onResultEnd;
  }, [onResultEnd]);

  useEffect(() => {
    if (!hasResult) {
      setResultShown(false);
      return;
    }
    setResultShown(true);
    const value = getComputedStyle(element.current ?? document.body)
      .getPropertyValue('--zao-motion-duration-hold')
      .trim();
    const amount = Number.parseFloat(value);
    const beat = !Number.isFinite(amount) ? 0 : value.endsWith('ms') ? amount : amount * 1000;
    const timer = window.setTimeout(() => {
      setResultShown(false);
      resultEnd.current?.();
    }, beat);
    return () => window.clearTimeout(timer);
  }, [hasResult]);

  const showingResult = hasResult && resultShown;
  // Plain children stay on the face so disabled ink updates without an extra inherited layer.
  const hasVisualContent = Boolean(
    LeadingIcon || TrailingIcon || TrailingAction || loading !== undefined || result !== undefined,
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
        ref={(node: HTMLElement | null) => {
          element.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        type={type}
        disabled={unavailable}
        focusableWhenDisabled={loading && !disabled}
        aria-busy={loading || props['aria-busy']}
        data-zao-component="button"
        data-zao-variant={variant}
        data-zao-size={size}
        data-zao-loading={loading ? '' : undefined}
        data-zao-result={showingResult ? '' : undefined}
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
          'button-construction construction-shading focus-brackets inline-flex min-w-7 shrink-0 rounded-action type-button outline-focus disabled:cursor-not-allowed',
          block ? 'w-full' : undefined,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span data-zao-slot="side" className="construction-planes" aria-hidden="true" />
        <span
          data-zao-slot="face"
          className={[
            'inline-flex w-full items-center justify-center gap-2 whitespace-nowrap',
            sizeClasses[size],
          ].join(' ')}
        >
          {hasVisualContent ? (
            <>
              <span
                data-zao-slot="button-content"
                className={[
                  'inline-flex items-center gap-2',
                  // The action keeps its place and its name while the result is read over it.
                  showingResult ? 'opacity-0' : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
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
                  className={['button-visual ms-auto', showingResult ? 'opacity-0' : undefined]
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden="true"
                >
                  {loading && spinnerSlot === 'trailing-action' ? (
                    <LoadingIndicator />
                  ) : (
                    <TrailingAction aria-hidden="true" focusable="false" />
                  )}
                </span>
              )}
              {showingResult && (
                <span
                  data-zao-slot="result"
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center gap-2"
                >
                  {result}
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
      {(loading !== undefined || result !== undefined) && (
        <span
          data-zao-slot="loading-announcement"
          className="button-loading-announcement"
          role={loading || showingResult ? 'status' : undefined}
          aria-live="polite"
          aria-atomic="true"
        >
          {loading
            ? loadingAnnouncement
            : showingResult
              ? (resultAnnouncement ?? (typeof result === 'string' ? result : ''))
              : ''}
        </span>
      )}
    </>
  );
});
