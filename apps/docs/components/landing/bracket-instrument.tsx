'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { BracketSetFigure } from '../figures/bracket-set';
import {
  bracketCourses,
  bracketSetBounds,
  bracketSetCourses,
} from '../figures/bracket-set-geometry';

/** L14: the widest gap between two courses, in fen. Every gap opens by the same share. */
const MAX_GAP = 6;
/** The picked course, and everything resting on it, lifts half a step further. */
const RAISE = MAX_GAP / 2;
const MAX_LIFT = (bracketSetCourses - 1) * MAX_GAP + RAISE;
const RULER_GRADUATIONS = 24;
const TOP = bracketSetCourses - 1;

type Pose = { gap: number; picked: number | null };
const REST: Pose = { gap: 0, picked: null };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** Figure units as a share of the ruler, which spans the drawing's full width. */
const share = (length: number) => `${(length / bracketSetBounds.width) * 100}%`;
const readout = (course: number) => {
  const entry = bracketCourses[course]!;
  return `${entry.term} ${entry.name} · ${entry.size}`;
};
const spoken = (course: number) => {
  const entry = bracketCourses[course]!;
  return `${entry.term} ${entry.name}, ${entry.size.replace(' × ', ' by ')}.`;
};

/**
 * The hero's bracket set answers the pointer (Hairline's exploded figure, redrawn for ZAO).
 * At rest it is the assembled picture. Across the drawing the courses open evenly, up to six fen
 * apart; up and down picks a course, which lifts half a step and is measured on the ruler.
 * Leaving settles it back. Keyboard and touch reach the same poses; with reduced motion the parts
 * stay seated while the pick, the measure and the readout still answer.
 */
export function BracketSetInstrument() {
  const drawing = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const frame = useRef(0);
  const next = useRef<Pose>(REST);
  const gap = useRef(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [tracking, setTracking] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const hintId = useId();

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function write(pose: Pose) {
    gap.current = pose.gap;
    drawing.current?.style.setProperty('--bracket-gap', String(pose.gap));
    setPicked(pose.picked);
  }

  /** Pointer input arrives faster than frames; only the latest pose is drawn, once per frame. */
  function schedule(pose: Pose) {
    next.current = pose;
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      write(next.current);
    });
  }

  function rest() {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    setTracking(false);
    write(REST);
  }

  function poseAt(event: PointerEvent<HTMLDivElement>): Pose {
    const box = svg.current!.getBoundingClientRect();
    const across = (event.clientX - box.left) / box.width;
    const opening = clamp((across - 0.1) / 0.8, 0, 1) * MAX_GAP;
    const y =
      bracketSetBounds.y + ((event.clientY - box.top) / box.height) * bracketSetBounds.height;
    // Pick by the opened position without the pick's own lift, so the choice cannot flicker.
    let nearest = 0;
    for (const entry of bracketCourses) {
      const distance = Math.abs(y - (entry.centre - entry.course * opening));
      const best = bracketCourses[nearest]!;
      if (distance < Math.abs(y - (best.centre - best.course * opening))) nearest = entry.course;
    }
    return { gap: opening, picked: nearest };
  }

  function track(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch' && !event.currentTarget.hasPointerCapture(event.pointerId))
      return;
    setTracking(true);
    setKeyboard(false);
    schedule(poseAt(event));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current: Pose = { gap: Math.round(gap.current), picked };
    let pose: Pose;
    let message: string;
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown': {
        const step = event.key === 'ArrowUp' ? 1 : -1;
        const course =
          current.picked === null ? (step > 0 ? 0 : TOP) : clamp(current.picked + step, 0, TOP);
        pose = { ...current, picked: course };
        message = spoken(course);
        break;
      }
      case 'ArrowRight':
      case 'ArrowLeft':
      case 'Home':
      case 'End': {
        const opening =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? MAX_GAP
              : clamp(current.gap + (event.key === 'ArrowRight' ? 1 : -1), 0, MAX_GAP);
        pose = { ...current, gap: opening };
        message = opening === 0 ? 'Assembled.' : `Opened ${opening} of ${MAX_GAP} fen.`;
        break;
      }
      case 'Escape':
        if (current.gap === 0 && current.picked === null) return;
        event.preventDefault();
        rest();
        setAnnouncement('At rest.');
        return;
      default:
        return;
    }
    event.preventDefault();
    setTracking(true);
    setKeyboard(true);
    write(pose);
    setAnnouncement(message);
  }

  const spans = picked === null ? [] : bracketCourses[picked]!.spans;
  const caption = picked ?? (keyboard ? 'hint' : 'rest');

  return (
    <figure
      className="landing-hero-figure flex flex-col gap-3"
      data-landing-hero-figure=""
      style={
        {
          '--bracket-reserve': MAX_LIFT / bracketSetBounds.width,
          '--bracket-raise': RAISE,
        } as CSSProperties
      }
    >
      <div
        ref={drawing}
        role="group"
        aria-label="Bracket set drawing"
        aria-describedby={hintId}
        tabIndex={0}
        data-landing-bracket=""
        data-tracking={tracking ? '' : undefined}
        data-picking={picked !== null ? '' : undefined}
        className="landing-bracket outline-focus focus-visible:outline-2 focus-visible:outline-offset-2"
        onPointerMove={track}
        onPointerDown={(event) => {
          if (event.pointerType !== 'touch') return;
          event.currentTarget.setPointerCapture(event.pointerId);
          track(event);
        }}
        onPointerUp={(event) => {
          if (event.pointerType === 'touch') rest();
        }}
        onPointerCancel={rest}
        onPointerLeave={(event) => {
          if (event.pointerType !== 'touch') rest();
        }}
        onKeyDown={onKeyDown}
        onFocus={(event) => setKeyboard(event.currentTarget.matches(':focus-visible'))}
        onBlur={() => {
          setKeyboard(false);
          rest();
        }}
      >
        <BracketSetFigure ref={svg} picked={picked} className="landing-figure-svg" />
      </div>

      <div
        className="landing-ruler"
        aria-hidden="true"
        data-measuring={picked !== null ? '' : undefined}
      >
        {Array.from({ length: RULER_GRADUATIONS - 1 }, (_, index) => (
          <span
            key={index}
            className="landing-ruler-mark"
            data-major={(index + 1) % 6 === 0 ? '' : undefined}
            style={{ insetInlineStart: `${((index + 1) / RULER_GRADUATIONS) * 100}%` }}
          />
        ))}
        {/* Three dimension lines: a course of blocks measures each block, a single part shares one. */}
        {[0, 1, 2].map((index) => {
          const [from, to] = spans[Math.min(index, spans.length - 1)] ?? [64, 64];
          return (
            <span
              key={index}
              className="landing-ruler-span"
              data-ruler-span=""
              style={{
                insetInlineStart: share(from - bracketSetBounds.x),
                inlineSize: share(to - from),
              }}
            />
          );
        })}
      </div>

      <figcaption className="landing-bracket-caption type-caption text-muted">
        <span className="sr-only">斗拱 Bracket set. Standard parts, assembled by rule.</span>
        <span aria-hidden="true" data-current={caption === 'rest' ? '' : undefined}>
          斗拱 Bracket set. Standard parts, assembled by rule.
        </span>
        <span aria-hidden="true" data-current={caption === 'hint' ? '' : undefined}>
          Arrow keys pick a part and open the set.
        </span>
        {bracketCourses.map((entry) => (
          <span
            key={entry.course}
            aria-hidden="true"
            data-current={caption === entry.course ? '' : undefined}
          >
            {readout(entry.course)}
          </span>
        ))}
      </figcaption>
      <p id={hintId} className="sr-only">
        Up and down arrows pick a part; left and right arrows open and close the set; Escape returns
        it to rest.
      </p>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </figure>
  );
}
