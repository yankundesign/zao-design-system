'use client';

import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import type {
  TabsListProps as BaseTabsListProps,
  TabsPanelProps as BaseTabsPanelProps,
  TabsRootProps as BaseTabsRootProps,
  TabsTabProps as BaseTabsTabProps,
} from '@base-ui/react/tabs';
import { forwardRef, useEffect, useState } from 'react';
import type { PointerEvent } from 'react';

type StyledPartProps<T> = Omit<T, 'className' | 'render' | 'style'> & {
  /** Layout classes for this part. */
  className?: string;
};

export type TabsRootProps = StyledPartProps<BaseTabsRootProps>;
export type TabsVariant = 'primary' | 'secondary';
export type TabsListProps = StyledPartProps<BaseTabsListProps> & {
  /** A ruler rail for primary views, or a recessed selector for secondary views. */
  variant?: TabsVariant;
};
export type TabsTabProps = StyledPartProps<Omit<BaseTabsTabProps, 'nativeButton'>>;
export type TabsPanelProps = StyledPartProps<BaseTabsPanelProps>;

const Root = forwardRef<HTMLDivElement, TabsRootProps>(function TabsRoot(
  { className, ...props },
  ref,
) {
  return (
    <BaseTabs.Root
      {...props}
      ref={ref}
      data-zao-component="tabs"
      data-zao-slot="root"
      className={[
        'min-w-0 data-[orientation=vertical]:flex data-[orientation=vertical]:gap-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
});

const List = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { className, children, variant = 'primary', activateOnFocus = true, ...props },
  ref,
) {
  return (
    <div data-zao-slot="viewport" className="tabs-viewport">
      <BaseTabs.List
        {...props}
        ref={ref}
        activateOnFocus={activateOnFocus}
        data-zao-slot="list"
        data-zao-variant={variant}
        className={['tabs-list', className].filter(Boolean).join(' ')}
      >
        {variant === 'primary' && <span aria-hidden="true" data-zao-slot="rail" />}
        {children}
        <BaseTabs.Indicator data-zao-slot="indicator" className="tabs-indicator">
          {variant === 'primary' && <span data-zao-slot="selection-line" />}
        </BaseTabs.Indicator>
      </BaseTabs.List>
    </div>
  );
});

const Tab = forwardRef<HTMLElement, TabsTabProps>(function TabsTab(
  {
    className,
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
  // Base UI owns selection. Held-input state changes only the decorative marker or face.
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
    <BaseTabs.Tab
      {...props}
      ref={ref}
      disabled={disabled}
      data-zao-slot="tab"
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
        'tabs-tab inline-flex h-8 min-w-7 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-none px-3 type-label trim-label font-medium',
        'text-muted outline-focus transition-colors duration-fast hover:text-default data-active:text-default',
        'data-disabled:cursor-not-allowed data-disabled:text-disabled',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span aria-hidden="true" data-zao-slot="tick" />
      {children}
    </BaseTabs.Tab>
  );
});

const Panel = forwardRef<HTMLDivElement, TabsPanelProps>(function TabsPanel(
  { className, ...props },
  ref,
) {
  return (
    <BaseTabs.Panel
      {...props}
      ref={ref}
      data-zao-slot="panel"
      className={[
        'min-w-0 pt-4 type-body text-default outline-focus data-[orientation=vertical]:pt-0',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
});

/** Keyboard-accessible tab navigation with one shared structure in every finish. */
export const Tabs = { Root, List, Tab, Panel };
