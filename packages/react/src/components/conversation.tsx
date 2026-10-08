'use client';

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ComponentPropsWithoutRef, ForwardedRef, RefCallback } from 'react';
import { Button } from './button.js';
import type { ButtonProps } from './button.js';

export interface ConversationRootProps extends ComponentPropsWithoutRef<'section'> {
  /** A name for this conversation and its message scroll region. */
  'aria-label': string;
  /** Host-owned lifecycle feedback. Omit to announce Message status transitions automatically. */
  announcement?: string;
}

export type ConversationViewportProps = ComponentPropsWithoutRef<'div'>;
export type ConversationListProps = ComponentPropsWithoutRef<'ol'>;
export type ConversationItemProps = ComponentPropsWithoutRef<'li'>;
export type ConversationLatestProps = Omit<ButtonProps, 'variant'>;

interface ScrollContextValue {
  label: string;
  atLatest: boolean;
  registerViewport: (element: HTMLDivElement | null) => void;
  registerList: (element: HTMLOListElement | null) => void;
  scrollToLatest: () => void;
}

const ScrollContext = createContext<ScrollContextValue | null>(null);
const AnnouncementContext = createContext<((message: string) => void) | null>(null);

function useConversationScroll() {
  const context = useContext(ScrollContext);
  if (!context) throw new Error('Conversation parts must be inside Conversation.Root.');
  return context;
}

/** Internal bridge for Message lifecycle feedback; transcript text never becomes a live region. */
export function useConversationAnnouncement() {
  return useContext(AnnouncementContext);
}

function classes(base: string, extra?: string) {
  return extra ? `${base} ${extra}` : base;
}

function useRegisteredRef<T extends HTMLElement>(
  ref: ForwardedRef<T>,
  register: (element: T | null) => void,
) {
  return useCallback(
    (element: T | null) => {
      register(element);
      if (!element) {
        if (typeof ref === 'function') ref(null);
        else if (ref) ref.current = null;
        return;
      }

      // ForwardedRef retains a void signature, but React 19 RefCallback supports cleanup.
      const cleanup = typeof ref === 'function' ? (ref as RefCallback<T>)(element) : undefined;
      if (ref && typeof ref !== 'function') ref.current = element;

      return () => {
        register(null);
        if (typeof cleanup === 'function') cleanup();
        else if (typeof ref === 'function') ref(null);
        else if (ref) ref.current = null;
      };
    },
    [ref, register],
  );
}

interface Geometry {
  top: number;
  height: number;
  viewport: number;
}

function geometry(element: HTMLDivElement): Geometry {
  return { top: element.scrollTop, height: element.scrollHeight, viewport: element.clientHeight };
}

// The tolerance accounts for scrollTop's fractional pixels versus integer scroll heights.
function isLatest(value: Geometry) {
  return value.height - value.viewport - value.top <= 1;
}

const Root = forwardRef<HTMLElement, ConversationRootProps>(function ConversationRoot(
  { 'aria-label': label, announcement, className, children, ...props },
  ref,
) {
  const [viewport, registerViewport] = useState<HTMLDivElement | null>(null);
  const [list, registerList] = useState<HTMLOListElement | null>(null);
  const [atLatest, setAtLatest] = useState(true);
  const [automaticAnnouncement, setAutomaticAnnouncement] = useState('');
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const following = useRef(true);
  const previousGeometry = useRef<Geometry | null>(null);
  const writtenTop = useRef<number | null>(null);

  const scrollToLatest = useCallback(() => {
    const element = viewportRef.current;
    if (!element) return;
    following.current = true;
    element.scrollTop = element.scrollHeight;
    writtenTop.current = element.scrollTop;
    previousGeometry.current = geometry(element);
    setAtLatest(true);
  }, []);

  const reportAnnouncement = useCallback((message: string) => {
    setAutomaticAnnouncement(message);
  }, []);

  useEffect(() => {
    viewportRef.current = viewport;
    if (!viewport || !list) return;

    let frame: number | null = null;
    let touchY: number | null = null;

    function suspendFollowing() {
      following.current = false;
      writtenTop.current = null;
    }

    function measure() {
      if (!viewport) return;
      if (following.current) {
        scrollToLatest();
      } else {
        const next = geometry(viewport);
        const latest = isLatest(next);
        previousGeometry.current = next;
        following.current = latest;
        setAtLatest(latest);
      }
    }

    function scheduleMeasure() {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        measure();
      });
    }

    function onScroll() {
      if (!viewport) return;
      const next = geometry(viewport);
      const previous = previousGeometry.current;
      const latest = isLatest(next);
      const isWrittenScroll =
        writtenTop.current !== null && Math.abs(next.top - writtenTop.current) <= 1;
      const layoutChanged =
        previous !== null &&
        (next.height !== previous.height || next.viewport !== previous.viewport);
      previousGeometry.current = next;
      if (isWrittenScroll) {
        writtenTop.current = null;
        setAtLatest(latest);
        return;
      }
      // Layout can clamp scrollTop before a queued resize is observed. Reader input suspends
      // following separately, so neither growth nor contraction is mistaken for scroll-back.
      if (following.current && layoutChanged) {
        scheduleMeasure();
        return;
      }
      following.current = latest;
      setAtLatest(latest);
    }

    function onWheel(event: WheelEvent) {
      if (event.deltaY < 0) suspendFollowing();
    }

    function onTouchStart(event: TouchEvent) {
      touchY = event.touches[0]?.clientY ?? null;
    }

    function onTouchMove(event: TouchEvent) {
      const next = event.touches[0]?.clientY;
      if (touchY !== null && next !== undefined && next > touchY) suspendFollowing();
      touchY = next ?? null;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.target !== viewport || event.defaultPrevented) return;
      if (
        event.key === 'ArrowUp' ||
        event.key === 'PageUp' ||
        event.key === 'Home' ||
        (event.key === ' ' && event.shiftKey)
      ) {
        suspendFollowing();
      }
    }

    viewport.addEventListener('scroll', onScroll, { passive: true });
    viewport.addEventListener('wheel', onWheel, { passive: true });
    viewport.addEventListener('touchstart', onTouchStart, { passive: true });
    viewport.addEventListener('touchmove', onTouchMove, { passive: true });
    viewport.addEventListener('keydown', onKeyDown);
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(viewport);
    observer.observe(list);
    scheduleMeasure();

    return () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
      viewport.removeEventListener('scroll', onScroll);
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchmove', onTouchMove);
      viewport.removeEventListener('keydown', onKeyDown);
      if (viewportRef.current === viewport) viewportRef.current = null;
    };
  }, [viewport, list, scrollToLatest]);

  const scrollContext = useMemo(
    () => ({ label, atLatest, registerViewport, registerList, scrollToLatest }),
    [label, atLatest, scrollToLatest],
  );

  return (
    <ScrollContext.Provider value={scrollContext}>
      <AnnouncementContext.Provider value={announcement === undefined ? reportAnnouncement : null}>
        <section
          {...props}
          ref={ref}
          aria-label={label}
          data-zao-component="conversation"
          data-zao-slot="root"
          className={classes('zao-conversation', className)}
        >
          {children}
          <span
            data-zao-slot="announcement"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {announcement ?? automaticAnnouncement}
          </span>
        </section>
      </AnnouncementContext.Provider>
    </ScrollContext.Provider>
  );
});

const Viewport = forwardRef<HTMLDivElement, ConversationViewportProps>(
  function ConversationViewport({ className, 'aria-label': label, tabIndex = 0, ...props }, ref) {
    const context = useConversationScroll();
    const combinedRef = useRegisteredRef(ref, context.registerViewport);
    return (
      <div
        {...props}
        ref={combinedRef}
        role="region"
        aria-label={label ?? `${context.label} messages`}
        tabIndex={tabIndex}
        data-zao-slot="viewport"
        className={classes('zao-conversation-viewport outline-focus', className)}
      />
    );
  },
);

const List = forwardRef<HTMLOListElement, ConversationListProps>(function ConversationList(
  { className, ...props },
  ref,
) {
  const context = useConversationScroll();
  const combinedRef = useRegisteredRef(ref, context.registerList);
  return (
    <ol
      {...props}
      ref={combinedRef}
      role="list"
      data-zao-slot="list"
      className={classes('zao-conversation-list', className)}
    />
  );
});

const Item = forwardRef<HTMLLIElement, ConversationItemProps>(function ConversationItem(
  { className, ...props },
  ref,
) {
  return <li {...props} ref={ref} data-zao-slot="item" className={classes('min-w-0', className)} />;
});

const Latest = forwardRef<HTMLElement, ConversationLatestProps>(function ConversationLatest(
  { className, children = 'Latest response', size = 'small', onClick, onFocus, onBlur, ...props },
  ref,
) {
  const { atLatest, scrollToLatest } = useConversationScroll();
  const [focused, setFocused] = useState(false);
  // Keep the activated control in place until focus leaves it.
  if (atLatest && !focused) return null;
  return (
    <Button
      {...props}
      ref={ref}
      variant="quiet"
      size={size}
      data-zao-slot="latest"
      className={classes('self-start', className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) scrollToLatest();
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
    >
      {children}
    </Button>
  );
});

/** A host-sized transcript that follows new content while the reader remains at its end. */
export const Conversation = { Root, Viewport, List, Item, Latest };
