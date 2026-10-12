'use client';

import { finish } from '@zao/react';
import { useEffect, useId, useRef, useState } from 'react';
import {
  anatomyChannel,
  anatomyDefaults,
  type AnatomyConfiguration,
  type AnatomyKind,
  type AnatomyParameters,
  type AnatomyPoint,
  type AnatomyScene,
  type AnatomyShape,
} from '@/lib/anatomy';
import { useFinish } from './use-finish';

function shapePoints(shape: AnatomyShape): AnatomyPoint[] {
  if (shape.type === 'polygon') return shape.points;
  if (shape.type === 'line') return [shape.from, shape.to];
  if (shape.type === 'path')
    return [
      { x: shape.bounds.x, y: shape.bounds.y },
      { x: shape.bounds.x + shape.bounds.width, y: shape.bounds.y + shape.bounds.height },
    ];
  return [
    { x: shape.x, y: shape.y },
    { x: shape.x + shape.width, y: shape.y + shape.height },
  ];
}

function Drawing({
  scene,
  parameters,
  nameId,
  descriptionId,
}: {
  scene: AnatomyScene;
  parameters: AnatomyParameters;
  nameId: string;
  descriptionId: string;
}) {
  const { native, tokens, parts } = scene;
  const points = [
    ...scene.shapes.flatMap(shapePoints),
    { x: native.x, y: native.y },
    { x: native.x + native.width, y: native.y + native.height },
    ...scene.readings.flatMap((reading) => [
      { x: reading.x, y: reading.y - reading.height },
      { x: reading.x + reading.width, y: reading.y },
    ]),
  ];
  const left = Math.min(...points.map((point) => point.x));
  const top = Math.min(...points.map((point) => point.y));
  const right = Math.max(...points.map((point) => point.x));
  const bottom = Math.max(...points.map((point) => point.y));
  const center = { x: (left + right) / 2, y: (top + bottom) / 2 };
  const radians = (parameters.projectionAngleDegrees * Math.PI) / 180;
  const rotate = (point: AnatomyPoint) => ({
    x:
      center.x +
      (point.x - center.x) * Math.cos(radians) -
      (point.y - center.y) * Math.sin(radians),
    y:
      center.y +
      (point.x - center.x) * Math.sin(radians) +
      (point.y - center.y) * Math.cos(radians),
  });
  const corners = [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ].map(rotate);
  const drawingLeft = Math.min(...corners.map((point) => point.x));
  const drawingTop = Math.min(...corners.map((point) => point.y));
  const drawingRight = Math.max(...corners.map((point) => point.x));
  const drawingBottom = Math.max(...corners.map((point) => point.y));
  const margin = tokens.fen * 4;
  const labelStep = Math.max(tokens.annotationLineHeight, tokens.fen * 5);
  const labelX = drawingRight + tokens.fen * 10;
  const labelTop = Math.min(drawingTop, center.y - (parts.length * labelStep) / 2);
  const viewTop = Math.min(drawingTop, labelTop) - margin;
  const viewBottom = Math.max(drawingBottom, labelTop + parts.length * labelStep) + margin;
  const viewBox = `${drawingLeft - margin} ${viewTop} ${labelX - drawingLeft + margin * 2} ${viewBottom - viewTop}`;
  const hairline = tokens.hairline * parameters.strokeHairlineMultiplier;
  const referenceDash = `${tokens.fen} ${tokens.fen}`;
  const front = scene.shapes.find(
    (shape) =>
      shape.type === 'rect' &&
      [
        'face',
        'trigger-face',
        'content-plane',
        'switch-face',
        'selection-face',
        'field-control',
        'quantitative-face',
      ].includes(shape.id),
  );
  const referenceClipId = `${nameId}-reference-clip`;
  const leaderClipId = `${nameId}-leader-clip`;
  const selectionClipId = `${nameId}-selection-clip`;
  const readingBoxes = scene.readings.map((reading) => [
    { x: reading.x - tokens.fen, y: reading.y - reading.height - tokens.fen },
    { x: reading.x + reading.width + tokens.fen, y: reading.y - reading.height - tokens.fen },
    { x: reading.x + reading.width + tokens.fen, y: reading.y + tokens.fen },
    { x: reading.x - tokens.fen, y: reading.y + tokens.fen },
  ]);
  const readingCuts = readingBoxes.map((box) => box.map(rotate));
  return (
    <svg
      role="img"
      aria-labelledby={`${nameId} ${descriptionId}`}
      className="docs-anatomy-drawing type-caption"
      viewBox={viewBox}
      data-anatomy-drawing=""
    >
      <title id={nameId}>{scene.title} anatomy</title>
      <desc id={descriptionId}>
        {scene.description} The dashed outline marks the stationary native reference. Numbered
        labels correspond to the parts listed below.
      </desc>
      {front?.type === 'rect' && (
        <defs>
          <clipPath id={referenceClipId}>
            <path
              clipRule="evenodd"
              d={[
                `M ${native.x - margin} ${native.y - margin} h ${native.width + margin * 2} v ${native.height + margin * 2} h ${-native.width - margin * 2} Z`,
                `M ${front.x} ${front.y} h ${front.width} v ${front.height} h ${-front.width} Z`,
              ].join(' ')}
            />
          </clipPath>
        </defs>
      )}
      <defs>
        <clipPath id={selectionClipId}>
          <path
            clipRule="evenodd"
            d={[
              `M ${left - margin} ${top - margin} H ${right + margin} V ${bottom + margin} H ${left - margin} Z`,
              ...readingBoxes.map(
                (cut) => `M ${cut.map((point) => `${point.x},${point.y}`).join(' L ')} Z`,
              ),
            ].join(' ')}
          />
        </clipPath>
        <clipPath id={leaderClipId}>
          <path
            clipRule="evenodd"
            d={[
              `M ${drawingLeft - margin} ${viewTop} H ${labelX + margin} V ${viewBottom} H ${drawingLeft - margin} Z`,
              ...readingCuts.map(
                (cut) => `M ${cut.map((point) => `${point.x},${point.y}`).join(' L ')} Z`,
              ),
            ].join(' ')}
          />
        </clipPath>
      </defs>
      <g transform={`rotate(${parameters.projectionAngleDegrees} ${center.x} ${center.y})`}>
        {scene.shapes.map((shape) => {
          const paint = {
            'data-anatomy-shape': shape.id,
            'data-anatomy-part': shape.part,
            fill: shape.fill,
            stroke: shape.stroke,
            strokeWidth:
              shape.strokeWidth === undefined
                ? undefined
                : shape.strokeWidth * parameters.strokeHairlineMultiplier,
            strokeDasharray: shape.dashed ? referenceDash : undefined,
            vectorEffect: 'non-scaling-stroke' as const,
          };
          if (shape.type === 'rect') {
            // Tab readings stay on their native plane. Clear the separated
            // indicator's stroke beneath them while retaining its measured fill.
            const clearReading = scene.kind === 'tabs' && shape.id === 'selection-face';
            return (
              <g key={shape.id}>
                {clearReading && (
                  <rect
                    data-anatomy-fill={shape.id}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    rx={shape.radius ?? 0}
                    fill={shape.fill}
                  />
                )}
                <rect
                  {...paint}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  rx={shape.radius ?? 0}
                  clipPath={clearReading ? `url(#${selectionClipId})` : undefined}
                />
              </g>
            );
          }
          if (shape.type === 'polygon')
            return (
              <polygon
                key={shape.id}
                {...paint}
                points={shape.points.map((point) => `${point.x},${point.y}`).join(' ')}
              />
            );
          if (shape.type === 'path')
            return <path key={shape.id} {...paint} d={shape.d} transform={shape.transform} />;
          return (
            <line
              key={shape.id}
              {...paint}
              x1={shape.from.x}
              y1={shape.from.y}
              x2={shape.to.x}
              y2={shape.to.y}
            />
          );
        })}
        <rect
          data-anatomy-shape="native-reference"
          {...native}
          fill="none"
          stroke="currentColor"
          strokeWidth={hairline}
          strokeDasharray={referenceDash}
          vectorEffect="non-scaling-stroke"
          clipPath={front ? `url(#${referenceClipId})` : undefined}
        />
        {scene.readings.map((reading) => (
          <text
            key={reading.id}
            data-anatomy-reading={reading.id}
            data-anatomy-part={reading.part}
            x={reading.x}
            y={reading.y}
            fill={reading.fill}
            fontFamily={reading.fontFamily}
            fontSize={reading.fontSize}
            fontWeight={reading.fontWeight}
            direction={reading.direction}
            textAnchor={reading.direction === 'rtl' ? 'end' : 'start'}
          >
            {reading.text}
          </text>
        ))}
      </g>
      {parts.map((part, index) => {
        const anchor = rotate(part.anchor);
        const y = labelTop + (index + 0.5) * labelStep;
        return (
          <g key={part.id} data-anatomy-label={part.id} fill="currentColor">
            <path
              d={`M ${anchor.x} ${anchor.y} H ${drawingRight + tokens.fen * 4} L ${labelX - tokens.fen * 3} ${y}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={hairline}
              vectorEffect="non-scaling-stroke"
              clipPath={`url(#${leaderClipId})`}
            />
            <text x={labelX} y={y} dominantBaseline="middle" textAnchor="middle">
              {index + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Docs-only: an isolated real specimen supplies the geometry and semantic paint. */
export function Anatomy({
  kind,
  quietStudy,
  explodeContactMultiplier = anatomyDefaults.explodeContactMultiplier,
  projectionAngleDegrees = anatomyDefaults.projectionAngleDegrees,
  strokeHairlineMultiplier = anatomyDefaults.strokeHairlineMultiplier,
}: { kind: AnatomyKind; quietStudy: { cssUrl: string } | null } & Partial<AnatomyParameters>) {
  const { resolved } = useFinish();
  const island = useRef<HTMLElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [scene, setScene] = useState<AnatomyScene | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const id = useId();
  const parameters = { explodeContactMultiplier, projectionAngleDegrees, strokeHairlineMultiplier };

  useEffect(() => {
    const root = island.current;
    const iframe = frame.current;
    if (!root || !iframe) return;
    let queued = 0;
    const configure = () => {
      queued = 0;
      const style = getComputedStyle(root);
      const variables: Record<string, string> = {};
      for (const property of style) {
        if (property.startsWith('--zao-'))
          variables[property] = style.getPropertyValue(property).trim();
      }
      const configuration: AnatomyConfiguration = {
        kind,
        mode: resolved,
        direction: style.direction === 'rtl' ? 'rtl' : 'ltr',
        parameters: { explodeContactMultiplier, projectionAngleDegrees, strokeHairlineMultiplier },
        variables,
      };
      iframe.contentWindow?.postMessage(
        { channel: anatomyChannel, type: 'configure', configuration },
        window.location.origin,
      );
    };
    const schedule = () => {
      if (!queued) queued = requestAnimationFrame(configure);
    };
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== iframe.contentWindow ||
        event.data?.channel !== anatomyChannel
      )
        return;
      if (event.data.type === 'ready' && event.data.kind === kind) schedule();
      if (event.data.type === 'error' && event.data.kind === kind) {
        setUnavailable(true);
        setScene(null);
      }
      if (event.data.type === 'scene' && event.data.scene?.kind === kind) {
        setUnavailable(false);
        setScene(event.data.scene as AnatomyScene);
      }
    };
    const observer = new MutationObserver(schedule);
    for (let ancestor: HTMLElement | null = root; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, {
        attributes: true,
        attributeFilter: ['style', 'class', 'dir', 'data-zao-mode', 'data-zao-theme'],
      });
    }
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    window.addEventListener('message', receive);
    iframe.addEventListener('load', schedule);
    root.querySelector('link')?.addEventListener('load', schedule);
    schedule();
    return () => {
      observer.disconnect();
      resize.disconnect();
      cancelAnimationFrame(queued);
      window.removeEventListener('message', receive);
      iframe.removeEventListener('load', schedule);
      root.querySelector('link')?.removeEventListener('load', schedule);
    };
  }, [
    kind,
    resolved,
    explodeContactMultiplier,
    projectionAngleDegrees,
    strokeHairlineMultiplier,
    quietStudy?.cssUrl,
  ]);

  return (
    <section
      ref={island}
      {...finish('su', resolved)}
      data-study={quietStudy ? 'quiet-instrument' : undefined}
      data-anatomy-kind={kind}
      data-anatomy-ready={scene ? 'true' : 'false'}
      className="docs-anatomy flex min-w-0 flex-col gap-4"
      aria-labelledby={`${id}-heading`}
    >
      {quietStudy && <link rel="stylesheet" href={quietStudy.cssUrl} />}
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-heading`} className="type-heading">
          Anatomy
        </h2>
        <p className="type-body text-muted">
          Measured parts, with contact expanded {explodeContactMultiplier}×. The native reference
          stays in place.
        </p>
      </div>
      <iframe
        ref={frame}
        src={`/anatomy-source/${kind}`}
        title={`${kind} measurement source`}
        data-anatomy-source={kind}
        aria-hidden="true"
        inert
        tabIndex={-1}
        className="docs-anatomy-source"
      />
      {scene ? (
        <figure className="flex min-w-0 flex-col gap-4">
          <Drawing
            scene={scene}
            parameters={parameters}
            nameId={`${id}-name`}
            descriptionId={`${id}-description`}
          />
          <figcaption className="flex flex-col gap-3">
            <p className="type-caption text-muted">{scene.description}</p>
            <ol className="grid list-decimal gap-2 pl-5 type-caption" data-anatomy-parts="">
              {scene.parts.map((part) => (
                <li key={part.id}>
                  <span className="font-medium">{part.name}.</span>{' '}
                  <span className="text-muted">{part.description}</span>
                </li>
              ))}
            </ol>
            <p className="type-caption text-muted">
              Dashed reference: the native target or frame before separation.
            </p>
          </figcaption>
          <script type="application/json" data-anatomy-scene="">
            {JSON.stringify(scene)}
          </script>
        </figure>
      ) : (
        <div className="docs-anatomy-pending type-caption text-muted" role="status">
          {unavailable
            ? 'Anatomy is unavailable. Reload this page to retry.'
            : 'Measuring component parts…'}
        </div>
      )}
    </section>
  );
}
