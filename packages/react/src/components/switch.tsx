'use client';

import { Switch as BaseSwitch } from '@base-ui/react/switch';
import type { SwitchRootProps } from '@base-ui/react/switch';
import { forwardRef, useEffect, useRef, useState } from 'react';
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
    onClick,
    ...props
  },
  ref,
) {
  // Base UI owns activation and checked state; held input only seats the decorative face.
  const [keyboardPressed, setKeyboardPressed] = useState(false);
  const [pressedPointerId, setPressedPointerId] = useState<number | null>(null);

  // A drag carries the face between its ends (Nov 14, CR9). It is paint only: the face follows
  // through a custom property, and on release Base UI's own activation decides the state.
  const drag = useRef<{
    pointer: number;
    startX: number;
    origin: number;
    travel: number;
    sign: number;
    position: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  function releasePointer(event: PointerEvent<HTMLElement>) {
    setPressedPointerId((current) => (current === event.pointerId ? null : current));
  }

  function endDrag(control: HTMLElement) {
    drag.current = null;
    control.removeAttribute('data-zao-dragging');
    control.style.removeProperty('--switch-position');
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
          const control = event.currentTarget;
          const thumb = control.querySelector<HTMLElement>('[data-zao-slot="thumb"]');
          if (thumb) {
            const travel =
              control.getBoundingClientRect().width -
              thumb.getBoundingClientRect().width -
              2 * Number.parseFloat(getComputedStyle(thumb).top);
            const origin = control.hasAttribute('data-checked') ? travel : 0;
            drag.current = {
              pointer: event.pointerId,
              startX: event.clientX,
              origin,
              travel,
              sign: getComputedStyle(control).direction === 'rtl' ? -1 : 1,
              position: origin,
              moved: false,
            };
          }
        }
      }}
      onPointerUp={(event) => {
        const state = drag.current;
        if (state?.pointer === event.pointerId) {
          const control = event.currentTarget;
          if (state.moved) {
            // The face settles on the nearer end. If that is where it started, the click that
            // follows the release must not toggle it.
            const on = state.position > state.travel / 2;
            if (on === control.hasAttribute('data-checked')) {
              suppressClick.current = true;
              window.setTimeout(() => {
                suppressClick.current = false;
              }, 0);
            }
          }
          endDrag(control);
        }
        releasePointer(event);
        onPointerUp?.(event);
      }}
      onPointerCancel={(event) => {
        if (drag.current?.pointer === event.pointerId) endDrag(event.currentTarget);
        releasePointer(event);
        onPointerCancel?.(event);
      }}
      onClick={(event) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          // Base UI's handler would toggle; a wrapping label's own activation would, too.
          event.preventBaseUIHandler();
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        const state = drag.current;
        if (state?.pointer === event.pointerId) {
          const delta = (event.clientX - state.startX) * state.sign;
          // A press without travel stays a press and toggles as before.
          if (state.moved || Math.abs(delta) >= 3) {
            const control = event.currentTarget;
            if (!state.moved) {
              state.moved = true;
              control.setPointerCapture(event.pointerId);
              control.setAttribute('data-zao-dragging', '');
            }
            state.position = Math.min(state.travel, Math.max(0, state.origin + delta));
            control.style.setProperty('--switch-position', `${state.sign * state.position}px`);
            return;
          }
        }
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
        // A dragged face keeps the pointer, wherever it goes, until it is released.
        if (!drag.current?.moved) releasePointer(event);
        onPointerLeave?.(event);
      }}
      onLostPointerCapture={(event) => {
        if (drag.current?.pointer === event.pointerId) endDrag(event.currentTarget);
        releasePointer(event);
        onLostPointerCapture?.(event);
      }}
      className={[
        'switch-construction construction-shading construction-well focus-brackets inline-flex h-6 w-10 shrink-0 rounded-none align-middle outline-focus',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <BaseSwitch.Thumb data-zao-slot="thumb" className="construction-planes" aria-hidden="true">
        <span data-zao-slot="face" />
      </BaseSwitch.Thumb>
    </BaseSwitch.Root>
  );
});
