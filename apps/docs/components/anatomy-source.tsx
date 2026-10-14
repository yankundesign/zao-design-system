'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Button, Card, Menu, Progress, Switch, Tabs, TextField, finish } from '@zao/react';
import { anatomyChannel, type AnatomyConfiguration, type AnatomyKind } from '@/lib/anatomy';
import { measureAnatomy } from '@/lib/anatomy-measure';

const menuItems = [
  { label: 'Rename workspace' },
  { label: 'Copy workspace ID' },
  { separator: true as const },
  { label: 'Archive workspace', disabled: true },
];

function ActualSource({ kind }: { kind: AnatomyKind }) {
  switch (kind) {
    case 'button':
      return <Button variant="secondary">Review details</Button>;
    case 'card':
      return (
        <Card className="flex w-full flex-col gap-2">
          <h3 className="type-heading">North workspace</h3>
          <p className="type-caption figures-id text-muted">Workspace / 001</p>
          <p className="type-body text-muted">Review settings before sharing.</p>
        </Card>
      );
    case 'menu':
      return <Menu trigger="Workspace actions" items={menuItems} />;
    case 'switch':
      return (
        <label className="flex items-center gap-3">
          <Switch aria-label="Email updates" name="anatomy-email-updates" />
          <span data-anatomy-source-label="" className="type-body">
            Email updates
          </span>
        </label>
      );
    case 'tabs':
      return (
        <Tabs.Root defaultValue="summary" className="w-full">
          <Tabs.List variant="secondary" aria-label="Workspace views">
            <Tabs.Tab value="summary">Summary</Tabs.Tab>
            <Tabs.Tab value="members">Members</Tabs.Tab>
            <Tabs.Tab value="settings">Settings</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="summary" />
          <Tabs.Panel value="members" />
          <Tabs.Panel value="settings" />
        </Tabs.Root>
      );
    case 'text-field':
      return <TextField label="Workspace name" defaultValue="North workspace" />;
    case 'progress':
      return <Progress label="Upload files" value={68} />;
  }
}

function isConfiguration(value: unknown, kind: AnatomyKind): value is AnatomyConfiguration {
  if (!value || typeof value !== 'object') return false;
  const configuration = value as Partial<AnatomyConfiguration>;
  const parameters = configuration.parameters;
  return (
    configuration.kind === kind &&
    (configuration.mode === 'light' || configuration.mode === 'dark') &&
    (configuration.direction === 'ltr' || configuration.direction === 'rtl') &&
    Boolean(
      parameters &&
      Number.isFinite(parameters.explodeContactMultiplier) &&
      parameters.explodeContactMultiplier >= 0 &&
      Number.isFinite(parameters.projectionAngleDegrees) &&
      Number.isFinite(parameters.strokeHairlineMultiplier) &&
      parameters.strokeHairlineMultiplier >= 0,
    ) &&
    Boolean(
      configuration.variables &&
      typeof configuration.variables === 'object' &&
      Object.entries(configuration.variables).every(
        ([name, value]) =>
          (name.startsWith('--zao-') || name.startsWith('--study-')) && typeof value === 'string',
      ),
    )
  );
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    promise.then(
      (value) => {
        signal.removeEventListener('abort', abort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', abort);
        reject(error);
      },
    );
  });
}

async function stylesReady(document: Document, signal: AbortSignal) {
  const readiness = new AbortController();
  const abort = () => readiness.abort(signal.reason);
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  // Technical readiness bound only; this is not a drawing or motion value.
  const timeout = setTimeout(
    () => readiness.abort(new DOMException('Anatomy styles did not become ready.', 'TimeoutError')),
    15000,
  );
  try {
    await Promise.all(
      Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map(
        (link) => {
          if (link.dataset.anatomyStylesheet === 'failed')
            return Promise.reject(new Error('Anatomy stylesheet failed.'));
          if (link.sheet) return Promise.resolve();
          return new Promise<void>((resolve, reject) => {
            const finish = () => {
              link.removeEventListener('load', loaded);
              link.removeEventListener('error', failed);
              readiness.signal.removeEventListener('abort', aborted);
            };
            const loaded = () => {
              finish();
              resolve();
            };
            const failed = () => {
              finish();
              reject(new Error('Anatomy stylesheet failed.'));
            };
            const aborted = () => {
              finish();
              reject(readiness.signal.reason);
            };
            link.addEventListener('load', loaded, { once: true });
            link.addEventListener('error', failed, { once: true });
            readiness.signal.addEventListener('abort', aborted, { once: true });
            if (readiness.signal.aborted) aborted();
            else if (link.sheet) loaded();
          });
        },
      ),
    );
    await abortable(document.fonts.ready, readiness.signal);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
    readiness.abort();
  }
}

/** Mounted by a same-origin iframe route, never by a parent-document React portal. */
export function AnatomySource({ kind, studyCssUrl }: { kind: AnatomyKind; studyCssUrl?: string }) {
  const island = useRef<HTMLDivElement>(null);
  const [configuration, setConfiguration] = useState<AnatomyConfiguration | null>(null);
  const mode = configuration?.mode ?? 'light';
  const direction = configuration?.direction ?? 'ltr';
  const variables = (configuration?.variables ?? {}) as CSSProperties;

  useEffect(() => {
    // The frame executes its own Base UI module instances. Its own inert body also
    // blocks queued focus calls; inert on the outer iframe alone is insufficient.
    const previouslyInert = document.body.inert;
    document.body.inert = true;
    const ready = () => {
      if (window.parent !== window)
        window.parent.postMessage(
          { channel: anatomyChannel, type: 'ready', kind },
          window.location.origin,
        );
    };
    const receive = (event: MessageEvent) => {
      if (
        event.source !== window.parent ||
        event.origin !== window.location.origin ||
        window.parent === window
      )
        return;
      const message: unknown = event.data;
      if (!message || typeof message !== 'object') return;
      const payload = message as { channel?: unknown; type?: unknown; configuration?: unknown };
      if (
        payload.channel !== anatomyChannel ||
        payload.type !== 'configure' ||
        !isConfiguration(payload.configuration, kind)
      )
        return;
      document.documentElement.setAttribute('data-zao-theme', 'su');
      document.documentElement.setAttribute('data-zao-mode', payload.configuration.mode);
      document.documentElement.dir = payload.configuration.direction;
      setConfiguration(payload.configuration);
    };
    window.addEventListener('message', receive);
    window.addEventListener('load', ready);
    ready();
    return () => {
      window.removeEventListener('message', receive);
      window.removeEventListener('load', ready);
      document.body.inert = previouslyInert;
    };
  }, [kind]);

  useEffect(() => {
    const source = island.current;
    if (!source || !configuration) return;
    let cancelled = false;
    let queued = 0;
    let revision = 0;
    let activeReadiness: AbortController | null = null;

    const measure = async () => {
      queued = 0;
      const currentRevision = ++revision;
      activeReadiness?.abort();
      activeReadiness = new AbortController();
      await stylesReady(source.ownerDocument, activeReadiness.signal);
      if (cancelled || currentRevision !== revision) return;
      // Let real Base UI refs, active-tab sizing and floating placement settle.
      await nextFrame();
      await nextFrame();
      if (cancelled || currentRevision !== revision) return;
      if (kind === 'menu') {
        const trigger = source.querySelector<HTMLButtonElement>('[data-zao-slot="trigger"]');
        if (trigger && trigger.getAttribute('aria-expanded') !== 'true') trigger.click();
      }
      for (let attempt = 0; attempt < 24; attempt++) {
        await nextFrame();
        if (cancelled || currentRevision !== revision) return;
        const popup = source.querySelector<HTMLElement>('[data-zao-slot="popup"]');
        const indicator =
          kind === 'tabs' ? source.querySelector<HTMLElement>('[data-zao-slot="indicator"]') : null;
        if (
          (kind !== 'menu' ||
            (popup && popup.getBoundingClientRect().width > 0 && popup.dataset.side)) &&
          (kind !== 'tabs' || (indicator && indicator.getBoundingClientRect().width > 0))
        )
          break;
      }
      // Await actual transitions, including role aliases and reduced-motion paths.
      for (let pass = 0; pass < 2; pass++) {
        const animations = source
          .getAnimations({ subtree: true })
          .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
        await Promise.allSettled(animations.map((animation) => animation.finished));
        await nextFrame();
        if (cancelled || currentRevision !== revision) return;
      }
      const scene = measureAnatomy(source, configuration);
      window.parent.postMessage(
        { channel: anatomyChannel, type: 'scene', scene },
        window.location.origin,
      );
    };
    const schedule = () => {
      if (!queued && !cancelled)
        queued = requestAnimationFrame(() => {
          void measure().catch((error: unknown) => {
            if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) return;
            window.parent.postMessage(
              { channel: anatomyChannel, type: 'error', kind },
              window.location.origin,
            );
          });
        });
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(source);
    source.ownerDocument.fonts.addEventListener('loadingdone', schedule);
    schedule();
    return () => {
      cancelled = true;
      revision++;
      activeReadiness?.abort();
      cancelAnimationFrame(queued);
      observer.disconnect();
      source.ownerDocument.fonts.removeEventListener('loadingdone', schedule);
    };
  }, [kind, configuration, studyCssUrl]);

  return (
    <>
      {studyCssUrl && (
        <link
          rel="stylesheet"
          href={studyCssUrl}
          onLoad={(event) => {
            event.currentTarget.dataset.anatomyStylesheet = 'loaded';
          }}
          onError={(event) => {
            event.currentTarget.dataset.anatomyStylesheet = 'failed';
          }}
        />
      )}
      <div
        ref={island}
        {...finish('su', mode)}
        dir={direction}
        inert
        aria-hidden="true"
        data-anatomy-source={kind}
        data-study={studyCssUrl ? 'quiet-instrument' : undefined}
        className={studyCssUrl ? 'study bg-canvas text-default' : 'bg-canvas text-default'}
        style={{
          ...variables,
          position: 'fixed',
          inset: 0,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'flex-start',
          padding: 'var(--zao-space-8)',
          paddingBlockStart: 'var(--zao-space-16)',
          isolation: 'isolate',
        }}
      >
        <ActualSource kind={kind} />
      </div>
    </>
  );
}
