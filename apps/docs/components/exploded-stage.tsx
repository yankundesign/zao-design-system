'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
  TransitionEvent,
} from 'react';
import './exploded-stage.css';

export interface ExplodedLayer {
  id: string;
  /** Short name for the tag beside the layer, such as "02 cards". */
  name: string;
  /** What the live caption says when the layer is picked. */
  detail: string;
  /**
   * Selectors that put an element on this layer. An element takes the layer of its own match;
   * unmatched content inherits the nearest matched ancestor.
   */
  selectors?: string[];
  /** The layer that owns the composition's root element and its unmatched content. */
  root?: boolean;
}

export type ExplodedPose = 'parts' | 'built';

/** The fixed tilt of the drawing: how far the depth axis leans toward the reader. */
const tilt = (54 * Math.PI) / 180;

interface Fit {
  /** Translation that centers the drawing in the stage, in px. */
  x: number;
  y: number;
  /** Uniform scale, depth included, that keeps every layer inside the stage. */
  scale: number;
  /** Turn about the depth axis, in degrees: a full turn for wide work, a smaller one for tall. */
  turn: number;
  /** Narrow stages draw the parts smaller than the working window, so the stage shortens. */
  compact: boolean;
  height: number;
  /** The drawing's top and bottom inside the stage, for picking. */
  top: number;
  bottom: number;
}

const px = (value: string) => Number.parseFloat(value) || 0;

/**
 * Where every layer lands in the Parts pose (orthographic: rotate, then drop depth), and the
 * scale and offset that fit them in the stage. Only layout sizes are read, so transforms do not
 * disturb the measurement.
 */
function fitDrawing(stage: HTMLElement, live: HTMLElement, count: number): Fit {
  const width = live.offsetWidth;
  const height = live.offsetHeight;
  const style = getComputedStyle(stage);
  const gap = px(style.getPropertyValue('--exploded-gap'));
  const pick = px(style.getPropertyValue('--exploded-pick'));
  const tag = px(style.getPropertyValue('--exploded-tag-room'));
  const pad = {
    top: px(style.paddingTop),
    right: px(style.paddingRight),
    bottom: px(style.paddingBottom),
    left: px(style.paddingLeft),
  };
  const turn = width >= height * 1.1 ? -36 : -16;
  const theta = (turn * Math.PI) / 180;
  const corners: [number, number][] = [
    [0, 0],
    [width, 0],
    [0, height],
    [width, height],
    [0, -tag],
    [Math.min(width, tag * 10), -tag],
  ];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let index = 0; index < count; index++) {
    for (const depth of [index * gap, index * gap + pick]) {
      for (const [cx, cy] of corners) {
        const dx = cx - width / 2;
        const dy = cy - height / 2;
        const x = dx * Math.cos(theta) - dy * Math.sin(theta);
        const y =
          (dx * Math.sin(theta) + dy * Math.cos(theta)) * Math.cos(tilt) - depth * Math.sin(tilt);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const room = { width: width + pad.left + pad.right, height: height + pad.top + pad.bottom };
  const byWidth = (room.width - pad.left - pad.right) / (maxX - minX);
  const byHeight = (room.height - pad.top - pad.bottom) / (maxY - minY);
  const scale = Math.min(1, byWidth, byHeight);
  const drawn = scale * (maxY - minY);
  // Shorten the stage only when the drawing would leave most of it empty.
  const compact = drawn < (height * 2) / 3;
  const stageHeight = compact ? drawn + pad.top + pad.bottom : room.height;
  // Centers, in the live window's coordinates (its top-left sits at the stage padding).
  const centerX = (width + pad.right - pad.left) / 2;
  const centerY = stageHeight / 2 - pad.top;
  const x = centerX - width / 2 - (scale * (minX + maxX)) / 2;
  const y = centerY - height / 2 - (scale * (minY + maxY)) / 2;
  return {
    x,
    y,
    scale,
    turn,
    compact,
    height: stageHeight,
    top: stageHeight / 2 - drawn / 2,
    bottom: stageHeight / 2 + drawn / 2,
  };
}

/** Elements that would duplicate identity or focus in a static copy. */
const scrubbed = ['id', 'name', 'for', 'aria-labelledby', 'aria-describedby', 'aria-controls'];

function snapshot(source: HTMLElement, layer: ExplodedLayer, layers: ExplodedLayer[]) {
  const copy = source.cloneNode(true) as HTMLElement;
  copy.setAttribute('aria-hidden', 'true');
  copy.inert = true;
  copy.removeAttribute('role');
  copy.removeAttribute('aria-label');
  for (const element of [copy, ...copy.querySelectorAll<HTMLElement>('*')]) {
    for (const attribute of scrubbed) element.removeAttribute(attribute);
    if (element.tabIndex >= 0) element.setAttribute('tabindex', '-1');
  }
  // One visibility per layer: matched elements show only on their own layer, and their unmatched
  // content inherits that. The copy's root belongs to the root layer.
  copy.style.visibility = layer.root ? 'visible' : 'hidden';
  for (const other of layers) {
    for (const selector of other.selectors ?? []) {
      copy.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        element.style.visibility = other.id === layer.id ? 'visible' : 'hidden';
      });
    }
  }
  // Copies are paint only: no transitions replay as they appear.
  copy.setAttribute('data-exploded-copy', '');
  return copy;
}

/**
 * The exploded view (finish plan WP 3.1): a real composition taken apart along the depth axis.
 * In the Built pose the live composition is shown and works normally. In the Parts pose it is
 * hidden and static copies of it, one per layer, separate along the axis; each copy shows only
 * its layer's parts, so the geometry is identical. Pointer height or the arrow keys pick a layer
 * and name it. Nothing moves until a person changes the pose; reduced motion switches instantly.
 */
export function ExplodedStage({
  layers,
  pose,
  label,
  extras,
  onPick,
  children,
}: {
  layers: ExplodedLayer[];
  pose: ExplodedPose;
  label: string;
  /** Decorative layer content keyed by layer id, positioned over the live composition. */
  extras?: (live: HTMLElement) => Partial<Record<string, ReactNode>>;
  onPick?: (layer: ExplodedLayer | null) => void;
  children: ReactNode;
}) {
  const live = useRef<HTMLDivElement>(null);
  const hosts = useRef<(HTMLDivElement | null)[]>([]);
  const [shown, setShown] = useState<ExplodedPose>('built');
  const [apart, setApart] = useState(false);
  const [picked, setPicked] = useState(-1);
  const [extraNodes, setExtraNodes] = useState<Partial<Record<string, ReactNode>>>({});
  const [ready, setReady] = useState(false);
  const [fit, setFit] = useState<Fit | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const descriptionId = useId();
  const pointer = useRef<string>('mouse');

  const pick = useCallback(
    (index: number) => {
      setPicked(index);
      onPick?.(index >= 0 ? layers[index]! : null);
    },
    [layers, onPick],
  );

  const measure = useCallback(() => {
    if (!stage.current || !live.current) return null;
    const next = fitDrawing(stage.current, live.current, layers.length);
    setFit(next);
    return next;
  }, [layers.length]);

  const build = useCallback(() => {
    const source = live.current?.firstElementChild as HTMLElement | null;
    if (!source) return false;
    measure();
    layers.forEach((layer, index) => {
      const host = hosts.current[index];
      if (!host) return;
      host.replaceChildren(snapshot(source, layer, layers));
    });
    if (extras) setExtraNodes(extras(source));
    return true;
  }, [layers, extras, measure]);

  const reduced = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const duration = () => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(
      '--zao-motion-duration-grade-1',
    );
    return Number.parseFloat(value) || 270;
  };

  // The first pose is applied without motion: nothing plays on its own.
  useLayoutEffect(() => {
    if (pose === 'parts' && build()) {
      setShown('parts');
      setApart(true);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    if (pose === 'parts' && shown !== 'parts') {
      if (!build()) return;
      setShown('parts');
      // Show the copies assembled for one frame, then take them apart.
      requestAnimationFrame(() => requestAnimationFrame(() => setApart(true)));
    } else if (pose === 'built' && shown === 'parts') {
      setApart(false);
      pick(-1);
      timer.current = window.setTimeout(
        () => {
          timer.current = null;
          setShown('built');
        },
        // A fallback: transitionend normally arrives first.
        reduced() || fit?.compact ? 0 : duration() + 400,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose, ready]);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  // The window reflows with the page; the drawing and the positioned extras follow it.
  useEffect(() => {
    const element = live.current;
    if (!element) return;
    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      measure();
      const source = element.firstElementChild as HTMLElement | null;
      if (source && extras) setExtraNodes(extras(source));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure, extras]);

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (shown !== 'parts' || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    const top = fit?.top ?? 0;
    const bottom = fit?.bottom ?? box.height;
    const share = (event.clientY - box.top - top) / (bottom - top);
    // Higher layers rise up the screen, so the top band picks the highest layer.
    const band = Math.min(layers.length - 1, Math.max(0, Math.floor(share * layers.length)));
    const index = layers.length - 1 - band;
    if (index !== picked) pick(index);
  }

  function onClick(event: MouseEvent<HTMLDivElement>) {
    if (shown !== 'parts' || pointer.current === 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    const top = fit?.top ?? 0;
    const bottom = fit?.bottom ?? box.height;
    const share = (event.clientY - box.top - top) / (bottom - top);
    if (share < 0 || share > 1) return pick(-1);
    const band = Math.min(layers.length - 1, Math.floor(share * layers.length));
    const index = layers.length - 1 - band;
    pick(index === picked ? -1 : index);
  }

  // The working window returns once the assembly has actually closed, not on a guessed timer.
  function onTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.propertyName !== '--exploded-x') return;
    if (pose !== 'built' || apart || shown !== 'parts') return;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setShown('built');
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (shown !== 'parts') return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      pick(picked < 0 ? 0 : Math.min(layers.length - 1, picked + 1));
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      pick(picked < 0 ? layers.length - 1 : Math.max(0, picked - 1));
    } else if (event.key === 'Escape' && picked >= 0) {
      event.preventDefault();
      pick(-1);
    }
  }

  return (
    <div
      ref={stage}
      className="exploded-stage"
      style={
        fit
          ? ({
              '--exploded-fit-x': `${fit.x}px`,
              '--exploded-fit-y': `${fit.y}px`,
              '--exploded-fit-scale': fit.scale,
              '--exploded-turn': `${fit.turn}deg`,
              '--exploded-fit-height': `${fit.height}px`,
            } as CSSProperties)
          : undefined
      }
      data-compact={fit?.compact ? 'true' : 'false'}
      data-pose={shown}
      data-apart={apart ? 'true' : 'false'}
      data-picking={picked >= 0 ? 'true' : 'false'}
      data-ready={ready ? 'true' : 'false'}
      tabIndex={shown === 'parts' ? 0 : -1}
      role={shown === 'parts' ? 'group' : undefined}
      aria-label={shown === 'parts' ? label : undefined}
      aria-describedby={shown === 'parts' ? descriptionId : undefined}
      onPointerDown={(event) => {
        pointer.current = event.pointerType;
      }}
      onPointerMove={onPointerMove}
      onClick={onClick}
      onTransitionEnd={onTransitionEnd}
      onPointerLeave={() => shown === 'parts' && picked >= 0 && pick(-1)}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null) && picked >= 0)
          pick(-1);
      }}
    >
      <p id={descriptionId} className="sr-only">
        Up and Down pick a layer; Escape clears the pick.
      </p>
      <div className="exploded-assembly">
        <div className="exploded-live" ref={live} inert={shown === 'parts'}>
          {children}
        </div>
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className="exploded-layer"
            data-layer={layer.id}
            data-picked={picked === index ? 'true' : 'false'}
            style={{ '--exploded-index': index } as CSSProperties}
            aria-hidden="true"
          >
            <div
              className="exploded-copy"
              ref={(node) => {
                hosts.current[index] = node;
              }}
            />
            {extraNodes[layer.id] ? (
              <div className="exploded-extra">{extraNodes[layer.id]}</div>
            ) : null}
            <span className="exploded-tag type-caption figures-id">
              <span className="exploded-tag-name">{layer.name}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
