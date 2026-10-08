'use client';

import { useCallback, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';

/** Presentation state only; Base UI continues to own selection and dismissal. */
export function useFieldPopup() {
  const portalContainer = useRef<HTMLDivElement>(null);
  const [exitHighlight, setExitHighlight] = useState<string | null>(null);
  const lastHighlight = useRef<string | null>(null);

  const onItemHighlighted = useCallback((value: string | undefined) => {
    if (value !== undefined) lastHighlight.current = value;
  }, []);

  const trackHighlight = useCallback((event: SyntheticEvent<HTMLElement>) => {
    const item = (event.target as Element).closest<HTMLElement>('[data-zao-slot="item"]');
    if (item && !item.hasAttribute('data-disabled')) {
      lastHighlight.current = item.dataset.zaoOptionValue ?? null;
    }
  }, []);

  const onOpenChange = useCallback((open: boolean) => {
    if (open) {
      lastHighlight.current = null;
      setExitHighlight(null);
      return;
    }
    const highlighted = portalContainer.current?.querySelector<HTMLElement>(
      '[data-zao-slot="popup"] [data-zao-slot="item"][data-highlighted]',
    );
    setExitHighlight(highlighted?.dataset.zaoOptionValue ?? lastHighlight.current);
  }, []);

  const onOpenChangeComplete = useCallback((open: boolean) => {
    if (!open) {
      setExitHighlight(null);
      lastHighlight.current = null;
    }
  }, []);

  return {
    portalContainer,
    exitHighlight,
    onOpenChange,
    onOpenChangeComplete,
    onItemHighlighted,
    trackHighlight,
  };
}
