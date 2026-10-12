'use client';

import { useCallback, useRef, useState } from 'react';
import { Button, Tabs } from '@zao/react';
import { DepthScaleControl, useDepthScale } from '../depth-scale';
import { ExplodedStage } from '../exploded-stage';
import type { ExplodedLayer, ExplodedPose } from '../exploded-stage';
import { BracketSetInstrument } from './bracket-instrument';
import { ButtonLink } from './button-link';
import { ShowcaseWindow, showcaseParts } from './showcase';

/** The workspace's layers, back to front. Selectors name the published parts on each layer. */
const layers: ExplodedLayer[] = [
  {
    id: 'canvas',
    name: '00 canvas',
    detail: '00 Canvas: the ground every part stands on.',
  },
  {
    id: 'surface',
    name: '01 surface · 三等 · 4px',
    detail: '01 Surface: the window, its bar and the assistant panel, 4px above the canvas.',
    root: true,
  },
  {
    id: 'card',
    name: '02 cards · 三等 · 4px',
    detail:
      '02 Cards: Storage, Seats and Requests, third-grade timber resting 4px above their base.',
    selectors: ['[data-zao-component="card"]', '[data-zao-component="table"]'],
  },
  {
    id: 'control',
    name: '03 controls · 七等 · 3px',
    detail:
      '03 Controls: Tabs, Buttons, the Switch, Progress and the Composer, seventh grade, 3px above their base.',
    selectors: [
      '[data-zao-component="button"]',
      '[data-zao-component="icon-button"]',
      '[data-zao-component="switch"]',
      '[data-zao-component="progress"]',
      '[data-zao-component="composer"]',
      '[data-zao-component="menu"]',
      '.tabs-list',
    ],
  },
  {
    id: 'overlay',
    name: '04 overlay · 五等',
    detail: '04 Overlay: the View menu, a floating plane owned by its trigger.',
  },
  {
    id: 'focus',
    name: '05 focus · ink',
    detail: '05 Focus: ink brackets mark where the keyboard is.',
  },
];

/** Layout position inside the window. Offsets ignore transforms, so the drawing can be tilted. */
function relative(element: Element | null, root: HTMLElement) {
  if (!(element instanceof HTMLElement)) return null;
  let left = 0;
  let top = 0;
  let node: HTMLElement | null = element;
  while (node && node !== root && node !== root.offsetParent) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  if (node === root.offsetParent) {
    left -= root.offsetLeft;
    top -= root.offsetTop;
  }
  return { left, top, width: element.offsetWidth, height: element.offsetHeight };
}

/** Decorative content for the layers that the resting window does not show. */
function extras(root: HTMLElement) {
  const trigger = relative(root.querySelector('[data-zao-component="menu"] button'), root);
  const action = relative(
    root.querySelector('[data-zao-component="button"][data-zao-variant="primary"]'),
    root,
  );
  const gap = 6;
  return {
    canvas: <div className="exploded-plate" />,
    overlay: trigger ? (
      <div
        data-zao-slot="popup"
        className="exploded-overlay construction-shading material-overlay popup-construction construction-planes p-1 text-default"
        style={{ left: trigger.left, top: trigger.top + trigger.height + 4, minWidth: 176 }}
      >
        {['All requests', 'Members', 'Reset example'].map((item, index) => (
          <div
            key={item}
            className={`menu-item-construction flex min-h-control items-center px-3 type-body${index === 1 ? ' bg-hover' : ''}`}
          >
            {item}
          </div>
        ))}
      </div>
    ) : null,
    focus: action ? (
      <div
        className="exploded-focus"
        style={{
          left: action.left - gap,
          top: action.top - gap,
          width: action.width + gap * 2,
          height: action.height + gap * 2,
        }}
      />
    ) : null,
  };
}

/**
 * Section 1 (finish plan WP 3.2): the idea in one sentence, then the workspace taken apart. It
 * rests on Parts (V9); Built puts the working window back together. Nothing moves on its own.
 */
export function LandingHero({ contact, lift }: { contact: number; lift: number }) {
  const [pose, setPose] = useState<ExplodedPose>('parts');
  const [picked, setPicked] = useState<ExplodedLayer | null>(null);
  const { scale, setScale, style } = useDepthScale(contact, lift);
  const reset = useRef<(() => void) | null>(null);
  const onPick = useCallback((layer: ExplodedLayer | null) => setPicked(layer), []);

  const caption =
    pose === 'built'
      ? `Built: a working workspace and its assistant, made from ${showcaseParts.length} ZAO components. Approve the waiting requests.`
      : (picked?.detail ??
        'One workspace, built from shared parts: six layers along the depth axis. Point at a layer, or focus the drawing and use the arrow keys.');

  return (
    <section aria-labelledby="landing-title" className="landing-hero" data-landing-section="hero">
      <div className="landing-hero-copy">
        <div className="landing-hero-head flex flex-col gap-4">
          <p className="type-caption text-muted">v0.1 · Su 素 · In progress</p>
          <h1 id="landing-title" className="landing-hero-title type-display text-balance">
            ZAO is the foundation for how we build.
          </h1>
        </div>
        <div className="landing-hero-lede flex flex-col gap-5">
          <p className="landing-hero-subline type-body text-muted text-pretty">
            An experimental design system at the boundary of 2D clarity and 3D presence, built for
            people and agents.
          </p>
          <div className="landing-hero-actions flex flex-wrap gap-3">
            <ButtonLink href="/components/button">Browse components</ButtonLink>
            <ButtonLink
              href="https://github.com/yankundesign/zao-design-system"
              variant="secondary"
              external
            >
              View on GitHub
            </ButtonLink>
          </div>
        </div>
        {/* Oct 11 (A): the bracket set returns beside the headline. */}
        <div className="landing-hero-mark">
          <BracketSetInstrument />
        </div>
      </div>

      <div className="landing-hero-controls">
        <Tabs.Root
          className="shrink-0 [&>.tabs-viewport]:max-w-none"
          value={pose}
          onValueChange={(value) => {
            if (value === 'parts' || value === 'built') {
              setPicked(null);
              setPose(value);
            }
          }}
        >
          <Tabs.List variant="secondary" role="radiogroup" aria-label="Workspace view">
            <Tabs.Tab
              value="parts"
              role="radio"
              aria-checked={pose === 'parts'}
              aria-selected={undefined}
            >
              Parts
            </Tabs.Tab>
            <Tabs.Tab
              value="built"
              role="radio"
              aria-checked={pose === 'built'}
              aria-selected={undefined}
            >
              Built
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
        <p className="landing-hero-caption type-caption text-muted" aria-live="polite">
          {caption}
        </p>
      </div>

      <ExplodedStage
        layers={layers}
        pose={pose}
        label="North workspace, taken apart into six layers"
        extras={extras}
        onPick={onPick}
      >
        <ShowcaseWindow style={style} scale={scale} resetRef={reset} />
      </ExplodedStage>

      <div className="landing-hero-tools">
        <DepthScaleControl scale={scale} onScaleChange={setScale} />
        <Button
          variant="quiet"
          size="small"
          disabled={pose !== 'built'}
          onClick={() => reset.current?.()}
        >
          Reset example
        </Button>
      </div>
    </section>
  );
}
