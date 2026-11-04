'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ReactNode, RefObject } from 'react';
import { flushSync } from 'react-dom';
import type { ExplodedPose, ExplodedScrub } from '../exploded-stage';
import { clamp, foldEnter, holdToEnd, lerp, tiltAt } from './sequence-timing';

/*
 * The landing sequence (docs/plans/2026-11-landing-sequence): Parts across the whole screen,
 * built by scrolling, then set into the docs page. Native scrolling drives it through one
 * `ScrollTimeline`; script only measures, keyframes and switches discrete state. It never
 * intercepts or sets scrolling, except to keep the reader's place when the layout changes.
 *
 * One-time (Yankun, Nov 3): until the window docks, every scene reverses. Once it docks, the
 * sequence is done for the tab's session: the spacer goes and the scroll moves by the same
 * distance in one frame, so nothing visibly moves and the docs' top is the page's real top.
 */

/** LS10, LS12: motion allowed, and a window at least 64rem wide and 40rem tall. */
export const sequenceQuery =
  '(prefers-reduced-motion: no-preference) and (min-width: 64rem) and (min-height: 40rem)';

/** Set when a media change, not hydration, switches the mode. */
let switchedByMedia = false;

function subscribe(callback: () => void) {
  const media = window.matchMedia(sequenceQuery);
  const onChange = () => {
    switchedByMedia = true;
    callback();
  };
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

const clientSnapshot = () =>
  window.matchMedia(sequenceQuery).matches && typeof window.ScrollTimeline === 'function';
const serverSnapshot = () => false;

/** Remembers, for the tab's session, that the reader has been through the sequence. */
const playedKey = 'zao-landing-sequence';

function readPlayed() {
  try {
    return window.sessionStorage.getItem(playedKey) === 'played';
  } catch {
    return false;
  }
}

/**
 * `sequence` runs it; `done` is the docked page after it, with no spacer; `fallback` is the
 * Oct 11 hero with its Parts/Built switch, for reduced motion, small windows and browsers
 * without scroll timelines (LS10, LS12).
 */
export type SequencePhase = 'sequence' | 'done' | 'fallback';

interface SequenceContextValue {
  phase: SequencePhase;
  /** Whether the sequence runs now. */
  active: boolean;
  spacer: RefObject<HTMLDivElement | null>;
  setReady: (ready: boolean) => void;
  /** Ends the sequence for this session; the caller moves the scroll in the same frame. */
  finish: () => void;
  /** A fallback scroll position to carry into the sequence after a mode switch. */
  restore: RefObject<number | null>;
}

const SequenceContext = createContext<SequenceContextValue>({
  phase: 'fallback',
  active: false,
  spacer: { current: null },
  setReady: () => {},
  finish: () => {},
  restore: { current: null },
});

export const useSequence = () => useContext(SequenceContext);

/**
 * Wraps the docs frame on `/`. The spacer comes before the frame, so scrolling through it
 * builds the workspace while the frame is held still beneath (WP 1.2, WP 2.2).
 */
export function LandingSequence({ children }: { children: ReactNode }) {
  const eligible = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const spacer = useRef<HTMLDivElement>(null);
  const restore = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [played, setPlayed] = useState(false);
  const [sequenceReady, setReady] = useState(false);
  const last = useRef({ scroll: 0, spacer: 0 });
  const phase: SequencePhase = !eligible ? 'fallback' : played ? 'done' : 'sequence';
  const active = phase === 'sequence';

  useEffect(() => {
    setPlayed(readPlayed());
    setMounted(true);
  }, []);

  // Remember where the reader is, so a mode switch can keep their place.
  useEffect(() => {
    const record = () => {
      last.current.scroll = window.scrollY;
      last.current.spacer = spacer.current?.offsetHeight ?? 0;
    };
    record();
    window.addEventListener('scroll', record, { passive: true });
    return () => window.removeEventListener('scroll', record);
  }, [active]);

  useLayoutEffect(() => {
    if (!switchedByMedia) return;
    switchedByMedia = false;
    const { scroll, spacer: height } = last.current;
    if (active) {
      restore.current = scroll;
    } else if (height) {
      setReady(false);
      window.scrollTo(0, Math.max(0, scroll - height));
    }
  }, [active]);

  const finish = useCallback(() => {
    try {
      window.sessionStorage.setItem(playedKey, 'played');
    } catch {
      // Without storage it is still done for this page.
    }
    flushSync(() => setPlayed(true));
  }, []);

  // Hidden on desktop until the first scene is in place, so it never flashes the docs first.
  const ready = mounted && (!active || sequenceReady);
  return (
    <div
      data-landing-sequence=""
      data-active={active ? '' : undefined}
      data-phase={mounted ? phase : undefined}
      data-ready={ready ? '' : undefined}
      style={{ display: 'contents' }}
    >
      {active ? <div ref={spacer} className="landing-sequence-spacer" aria-hidden="true" /> : null}
      <SequenceContext.Provider value={{ phase, active, spacer, setReady, finish, restore }}>
        {children}
      </SequenceContext.Provider>
    </div>
  );
}

interface Geometry {
  /** Scroll lengths: the assembly, Built's hold and the step back (LS3). */
  A: number;
  H: number;
  B: number;
  total: number;
  /** The slot's viewport rect while held and once docked. */
  slotLeft: number;
  dockTop: number;
  /** Built fills the width (LS4, revised); Parts is the whole stage, contained. */
  k: number;
  kp: number;
  partsLeft: number;
  partsTop: number;
  /** The stage's size at rest, and the held rects of what it can cover, in viewport px. */
  Ws: number;
  Hs: number;
  covers: { header: Box; aside: Box | null; copy: Box | null };
}

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/** Where the stage is painted at scroll `s`, in viewport px, and at what scale. */
function paintedBox(s: number, g: Geometry, ease: (t: number) => number) {
  let left: number;
  let top: number;
  let scale: number;
  if (s <= g.A) {
    // Parts grows to Built as the drawing turns flat.
    const q = 1 - tiltAt(clamp(s / g.A), ease);
    left = lerp(g.partsLeft, 0, q);
    top = lerp(g.partsTop, 0, q);
    scale = lerp(g.kp, g.k, q);
  } else if (s <= g.A + g.H) {
    left = 0;
    top = 0;
    scale = g.k;
  } else {
    const q = ease(clamp((s - g.A - g.H) / g.B));
    left = lerp(0, g.slotLeft, q);
    top = lerp(0, g.dockTop, q);
    scale = lerp(g.k, 1, q);
  }
  return { left, top, scale };
}

/** The stage's transform at scroll `s`: its painted box, as an offset from its slot. */
function painted(s: number, g: Geometry, ease: (t: number) => number) {
  const { left, top, scale } = paintedBox(s, g, ease);
  return `translate(${left - g.slotLeft}px, ${top - g.dockTop}px) scale(${scale})`;
}

/**
 * The hero's half of the sequence: measures, keyframes the frame, the stage and the hint on the
 * scroll timeline, and switches the pose, picking and cover as the reader crosses each scene.
 */
export function useSequenceStage() {
  const { phase, active, spacer, setReady, finish, restore } = useSequence();
  const section = useRef<HTMLElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [pose, setPose] = useState<ExplodedPose>('parts');
  const [pickable, setPickable] = useState(true);
  const [scrub, setScrub] = useState<ExplodedScrub | null>(null);

  useEffect(() => {
    if (!active) return;
    let live = true;
    let frame = 0;
    let running: Animation[] = [];
    let geometry: Geometry | null = null;
    const header = document.querySelector<HTMLElement>('body > header');
    const grid = () => spacer.current?.nextElementSibling as HTMLElement | null;

    let ease: (t: number) => number = (t) => t;

    /**
     * A part is inert exactly while the window or the first screen's ground covers it, so focus
     * never lands under the window (rule 7), and a small scroll back from the dock, such as the
     * browser bringing a focused part out from under the sticky header, leaves it usable.
     */
    const cover = (covered: { header: boolean; aside: boolean; copy: boolean }) => {
      const frameElement = grid();
      if (frameElement) {
        frameElement.style.position = covered.header ? 'relative' : '';
        frameElement.style.zIndex = covered.header ? '20' : '';
      }
      if (header) header.inert = covered.header;
      const aside = frameElement?.querySelector<HTMLElement>('.docs-nav-aside');
      const copy = section.current?.querySelector<HTMLElement>('.landing-hero-copy');
      if (aside) aside.inert = covered.aside;
      if (copy) copy.inert = covered.copy;
    };

    let finished = false;

    /**
     * The window has docked: the sequence is done for this session. Stop every scroll-linked
     * animation, drop the spacer and move the scroll back by its height, all before the next
     * paint, so the page looks exactly as it did and its top is now the docs' top.
     */
    const collapse = (s: number, total: number) => {
      if (finished) return;
      finished = true;
      for (const animation of document.getAnimations()) {
        if (animation.timeline instanceof ScrollTimeline) animation.cancel();
      }
      running = [];
      cover({ header: false, aside: false, copy: false });
      finish();
      window.scrollTo(0, Math.max(0, s - total));
    };

    const apply = (s: number) => {
      const g = geometry;
      if (!g) return;
      if (s >= g.total) return collapse(s, g.total);
      setPose(s >= g.A ? 'built' : 'parts');
      setPickable(s < 1);
      if (s < g.A) return cover({ header: true, aside: true, copy: true });
      const { left, top, scale } = paintedBox(s, g, ease);
      const box = { left, top, right: left + g.Ws * scale, bottom: top + g.Hs * scale };
      cover({
        header: overlaps(box, g.covers.header),
        aside: g.covers.aside ? overlaps(box, g.covers.aside) : false,
        copy: g.covers.copy ? overlaps(box, g.covers.copy) : false,
      });
    };

    const setup = () => {
      const spacerElement = spacer.current;
      const frameElement = grid();
      const sectionElement = section.current;
      const slotElement = slot.current;
      const stageElement = stage.current;
      // A hidden pane reports a 0 × 0 window; wait for the resize that gives it a real size.
      if (!live || window.innerHeight === 0) return;
      if (!spacerElement || !frameElement || !sectionElement || !slotElement || !stageElement)
        return;
      for (const animation of running) animation.cancel();
      running = [];
      const before = window.scrollY;
      const previous = geometry?.total ?? 0;

      ease = foldEnter();
      const headerHeight = header?.offsetHeight ?? 0;
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const V = vh - headerHeight;
      const A = 1.5 * V;
      const H = 0.5 * V;
      const B = V;
      const total = A + H + B;
      spacerElement.style.blockSize = `${total}px`;

      // Measured at rest: the frame sits after the spacer, and nothing is transformed.
      const Ws = stageElement.offsetWidth;
      const Hs = stageElement.offsetHeight;
      const slotBox = slotElement.getBoundingClientRect();
      const sectionBox = sectionElement.getBoundingClientRect();
      const dockTop = slotBox.top + window.scrollY - total;
      const sectionTop = sectionBox.top + window.scrollY - total;
      sectionElement.style.setProperty('--landing-screen-top', `${-sectionTop}px`);
      sectionElement.style.setProperty('--landing-screen-left', `${-sectionBox.left}px`);
      sectionElement.style.setProperty('--landing-screen-width', `${vw}px`);
      sectionElement.style.setProperty('--landing-screen-height', `${vh}px`);
      const kp = Math.min(vw / Ws, vh / Hs);
      // Held, the frame shows its docked layout, so each rect is its layout rect less the spacer.
      const held = (element: Element | null | undefined): Box | null => {
        if (!element) return null;
        const box = element.getBoundingClientRect();
        const shift = window.scrollY - total;
        return {
          left: box.left,
          right: box.right,
          top: box.top + shift,
          bottom: box.bottom + shift,
        };
      };
      geometry = {
        Ws,
        Hs,
        covers: {
          header: { left: 0, right: vw, top: 0, bottom: headerHeight },
          aside: held(frameElement.querySelector('.docs-nav-aside')),
          copy: held(sectionElement.querySelector('.landing-hero-copy')),
        },
        A,
        H,
        B,
        total,
        slotLeft: slotBox.left,
        dockTop,
        k: vw / Ws,
        kp,
        partsLeft: (vw - kp * Ws) / 2,
        partsTop: (vh - kp * Hs) / 2,
      };

      const max = document.documentElement.scrollHeight - vh;
      const offset = (s: number) => Math.min(1, s / max);
      const timeline = new ScrollTimeline({ source: document.documentElement, axis: 'block' });
      const options = { timeline, fill: 'both' as const };
      const run = (element: Element, frames: Keyframe[]) =>
        running.push(element.animate(holdToEnd(frames), options));

      // The frame is held still under the window until it docks (spike finding 2).
      run(frameElement, [
        { offset: 0, transform: `translateY(${-total}px)` },
        { offset: offset(total), transform: 'translateY(0px)' },
      ]);

      // The stage stays in its slot and is painted over the screen until it docks.
      const outer: Keyframe[] = [];
      const at = (s: number) =>
        outer.push({ offset: offset(s), transform: painted(s, geometry!, ease) });
      const steps = 32;
      for (let i = 0; i <= steps; i++) at((i / steps) * A);
      const back = 48;
      for (let i = 0; i <= back; i++) at(A + H + (i / back) * B);
      run(stageElement, outer);

      // The hint has done its job once the reader scrolls.
      const foot = sectionElement.querySelector('.landing-sequence-foot');
      if (foot)
        run(foot, [
          { offset: 0, visibility: 'visible' },
          { offset: offset(8), visibility: 'visible' },
          { offset: offset(8), visibility: 'hidden' },
        ]);

      setScrub({ timeline, start: 0, end: offset(A), ease });
      if (restore.current !== null) {
        // Coming from the fallback: the same place in the docs, past the sequence.
        window.scrollTo(0, restore.current + total);
        restore.current = null;
      } else if (previous && before > 0 && previous !== total) {
        // A resize changed the scenes' lengths: keep the reader in the same scene.
        window.scrollTo(
          0,
          before >= previous ? before - previous + total : (before / previous) * total,
        );
      }
      apply(window.scrollY);
      setReady(true);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        apply(window.scrollY);
      });
    };

    void document.fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(setup)));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', setup);
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', setup);
      for (const animation of running) animation.cancel();
      cover({ header: false, aside: false, copy: false });
      setScrub(null);
      setPose('parts');
      setPickable(true);
    };
  }, [active, spacer, setReady, finish, restore]);

  return { phase, active, section, slot, stage, pose, pickable, scrub };
}
