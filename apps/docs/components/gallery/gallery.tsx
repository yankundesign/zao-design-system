'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Refresh } from 'iconoir-react';
import { IconButton, finish } from '@zao/react';
import { islandModeScript } from '../landing/landing-root';
import { useFinish } from '../use-finish';
import { plates } from './plates';
import type { PlateDefinition } from './plates';

declare global {
  interface Window {
    /** Recording hook: remounts the framed plate so its host timeline starts again. */
    __galleryReplay?: () => void;
  }
}

const noop = () => () => {};

/** `?plate=<id>&record` frames one plate for the recorder; `&bare` leaves out its caption. */
function useRecording(list: readonly PlateDefinition[]) {
  const search = useSyncExternalStore(
    noop,
    () => window.location.search,
    () => '',
  );
  return useMemo(() => {
    const params = new URLSearchParams(search);
    const plate = list.find((candidate) => candidate.id === params.get('plate'));
    if (!plate || !params.has('record')) return null;
    return { plate, bare: params.has('bare') };
  }, [list, search]);
}

/**
 * The gallery is one Quiet instrument island, like the landing page. The components wall is the
 * default; `/gallery/charts` passes its own plates.
 */
export function Gallery({
  plates: list = plates,
  kind = 'components',
  title = 'Gallery',
  description = 'Eight parts, live. Point, press, type and tab through them: each plate runs the real component, and every reply comes from a local host.',
  label = 'Components',
}: {
  plates?: readonly PlateDefinition[];
  kind?: string;
  title?: string;
  description?: string;
  label?: string;
} = {}) {
  const { theme, resolved } = useFinish();
  const recording = useRecording(list);
  const number = (plate: PlateDefinition) => String(list.indexOf(plate) + 1).padStart(2, '0');
  const [ready, setReady] = useState(false);
  const serverRender = useSyncExternalStore(
    noop,
    () => false,
    () => true,
  );

  useEffect(() => {
    let live = true;
    void document.fonts.ready.then(() => {
      if (live) setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div
      {...finish(theme, resolved)}
      data-study="quiet-instrument"
      data-gallery={kind}
      data-gallery-ready={ready ? '' : undefined}
      suppressHydrationWarning
      className={`study gallery text-default${recording ? ' gallery-record' : ''}`}
    >
      {serverRender ? <script dangerouslySetInnerHTML={{ __html: islandModeScript }} /> : null}
      {recording ? (
        <>
          <Plate
            plate={recording.plate}
            number={number(recording.plate)}
            recording
            bare={recording.bare}
          />
          <RecordingPointer />
        </>
      ) : (
        <>
          <header className="gallery-head">
            <h1 className="type-title">{title}</h1>
            <p className="type-body text-muted">{description}</p>
          </header>
          <ol className="gallery-wall" aria-label={label}>
            {list.map((plate) => (
              <li key={plate.id} className="min-w-0">
                <Plate plate={plate} number={number(plate)} />
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function Plate({
  plate,
  number,
  recording = false,
  bare = false,
}: {
  plate: PlateDefinition;
  number: string;
  recording?: boolean;
  bare?: boolean;
}) {
  const [run, setRun] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const Demo = plate.Demo;

  useEffect(() => {
    if (!recording) return;
    window.__galleryReplay = () => setRun((value) => value + 1);
    return () => {
      delete window.__galleryReplay;
    };
  }, [recording]);

  // An arrival seen off screen is no arrival: play it again when the plate first comes into view.
  useEffect(() => {
    const element = stage.current;
    if (recording || !plate.replayOnView || !element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        setRun((value) => value + 1);
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [plate.replayOnView, recording]);

  return (
    <figure className="gallery-plate" data-plate={plate.id}>
      <div ref={stage} className="gallery-stage">
        {bare ? null : (
          <div className="gallery-plate-head font-mono type-caption" aria-hidden={!recording}>
            <span>
              <span className="text-muted">{number}</span> {plate.name}
            </span>
            <span className="text-muted">{plate.verb}</span>
          </div>
        )}
        <div className="gallery-plate-body" data-align={plate.align ?? 'center'}>
          <Demo key={run} />
        </div>
        {recording ? null : (
          <IconButton
            className="gallery-replay"
            size="small"
            variant="quiet"
            icon={Refresh}
            aria-label={`Replay ${plate.name}`}
            onClick={() => setRun((value) => value + 1)}
          />
        )}
      </div>
      {recording ? null : (
        <figcaption className="gallery-note">
          <span className="type-label font-medium">
            <span className="font-mono text-muted">{number}</span> {plate.name}
          </span>
          <span className="type-caption text-muted">{plate.note}</span>
        </figcaption>
      )}
    </figure>
  );
}

const keyNames: Record<string, string> = {
  Tab: 'Tab',
  Enter: 'Return',
  Escape: 'Esc',
  ' ': 'Space',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
};

/**
 * A headless recording has no system pointer, so the recorder's real input draws one: an arrow
 * that follows pointer events, a ring at each press, and a keycap for named keys. Typing hides
 * the arrow, as the system pointer does.
 */
function RecordingPointer() {
  const arrow = useRef<HTMLDivElement>(null);
  const [presses, setPresses] = useState<{ id: number; x: number; y: number }[]>([]);
  const [key, setKey] = useState<{ id: number; label: string } | null>(null);
  const nextPress = useRef(0);

  useEffect(() => {
    const element = arrow.current;
    if (!element) return;
    let keyTimer: number | undefined;
    const move = (event: PointerEvent) => {
      element.style.translate = `${event.clientX}px ${event.clientY}px`;
      element.dataset.visible = '';
    };
    const down = (event: PointerEvent) => {
      move(event);
      element.dataset.pressed = '';
      const id = nextPress.current++;
      setPresses((current) => [...current, { id, x: event.clientX, y: event.clientY }]);
    };
    const up = () => {
      delete element.dataset.pressed;
    };
    const keydown = (event: KeyboardEvent) => {
      // In a text field, Space and the arrows are writing, not commands.
      const writing =
        event.target instanceof HTMLElement &&
        event.target.matches('textarea, input, [contenteditable]') &&
        (event.key === ' ' || event.key.startsWith('Arrow'));
      const label = writing ? undefined : keyNames[event.key];
      if (!label) {
        delete element.dataset.visible;
        return;
      }
      window.clearTimeout(keyTimer);
      setKey({ id: Date.now(), label: event.shiftKey ? `⇧ ${label}` : label });
      keyTimer = window.setTimeout(() => setKey(null), 900);
    };
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('pointerup', up, true);
    window.addEventListener('keydown', keydown, true);
    return () => {
      window.clearTimeout(keyTimer);
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('keydown', keydown, true);
    };
  }, []);

  return (
    <div aria-hidden="true" className="gallery-pointer-layer">
      {presses.map((press) => (
        <span
          key={press.id}
          className="gallery-press"
          style={{ translate: `${press.x}px ${press.y}px` }}
          onAnimationEnd={() =>
            setPresses((current) => current.filter((candidate) => candidate.id !== press.id))
          }
        />
      ))}
      <div ref={arrow} className="gallery-arrow">
        <svg viewBox="0 0 16 22" width="16" height="22">
          <path d="M1 1v17.5l4.6-4.4 3 6.9 3-1.3-3-6.8H15L1 1Z" />
        </svg>
      </div>
      {key ? (
        <span key={key.id} className="gallery-key font-mono type-caption">
          {key.label}
        </span>
      ) : null}
    </div>
  );
}
