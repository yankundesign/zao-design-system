'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { ContextId } from '@/lib/tokens';
import { MODE_KEY, THEME_KEY } from '@/lib/finish-script';

export type ModeSetting = 'system' | 'light' | 'dark';

function read() {
  if (typeof document === 'undefined') return 'su|system|light';
  const el = document.documentElement;
  let setting: ModeSetting = 'system';
  try {
    setting = (localStorage.getItem(MODE_KEY) as ModeSetting) || 'system';
  } catch {}
  const attr = el.getAttribute('data-zao-mode');
  const resolved =
    attr === 'light' || attr === 'dark'
      ? attr
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  return `su|${setting}|${resolved}`;
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-zao-theme', 'data-zao-mode'],
  });
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener('change', onChange);
  };
}

function apply(setting: ModeSetting) {
  const el = document.documentElement;
  el.setAttribute('data-zao-theme', 'su');
  if (setting === 'system') el.removeAttribute('data-zao-mode');
  else el.setAttribute('data-zao-mode', setting);
  try {
    localStorage.setItem(THEME_KEY, 'su');
    localStorage.setItem(MODE_KEY, setting);
  } catch {}
}

export function useFinish() {
  const snapshot = useSyncExternalStore(subscribe, read, () => 'su|system|light');
  const [theme, setting, resolved] = snapshot.split('|') as ['su', ModeSetting, 'light' | 'dark'];
  const contextId: ContextId = resolved === 'dark' ? 'su-dark' : 'su-light';

  const setMode = useCallback((next: ModeSetting) => apply(next), []);

  return { theme, setting, resolved, contextId, setMode };
}
