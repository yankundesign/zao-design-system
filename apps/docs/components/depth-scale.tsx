'use client';

import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import { Button } from '@zao/react';
import { allTokens } from '@/lib/tokens';

const px = (id: string) => Number.parseFloat(String(allTokens[id]?.value ?? '0'));

/** Scales every published depth distance together on one island; layout never changes. */
export function useDepthScale(contact: number, lift: number) {
  const [scale, setScale] = useState(1);
  const style = {
    '--zao-depth-contact': `${contact * scale}px`,
    '--zao-depth-lift': `${lift * scale}px`,
    '--zao-depth-rest-small': `${px('depth.rest.small') * scale}px`,
    '--zao-depth-rest-control': `${px('depth.rest.control') * scale}px`,
    '--zao-depth-rest-surface': `${px('depth.rest.surface') * scale}px`,
  } as CSSProperties;
  return { scale, setScale, style };
}

/** The labelled range, readout and reset shared by every depth demonstration. */
export function DepthScaleControl({
  scale,
  onScaleChange,
  describedBy,
}: {
  scale: number;
  onScaleChange: (scale: number) => void;
  describedBy?: string;
}) {
  const scaleId = useId();
  const readout = `${scale.toFixed(2)}×`;

  return (
    <div className="flex max-w-2xl flex-col gap-3" data-depth-controls="">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={scaleId} className="type-label font-medium">
          Depth scale
        </label>
        <output htmlFor={scaleId} className="type-label figures-tabular" aria-live="off">
          {readout}
        </output>
      </div>
      <input
        id={scaleId}
        type="range"
        min={0}
        max={4}
        step={0.01}
        value={scale}
        onChange={(event) => onScaleChange(Number(event.currentTarget.value))}
        aria-describedby={describedBy}
        aria-valuetext={`${scale.toFixed(2)} times the published depth`}
        className="min-h-6 w-full outline-focus focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ accentColor: 'var(--zao-color-accent-solid)' }}
      />
      <Button variant="secondary" className="self-start" onClick={() => onScaleChange(1)}>
        Reset depth
      </Button>
    </div>
  );
}
