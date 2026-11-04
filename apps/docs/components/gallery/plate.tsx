'use client';

import { useEffect, useRef, useState } from 'react';
import { Refresh } from 'iconoir-react';
import { IconButton } from '@zao/react';
import type { PlateDefinition } from './plates';

declare global {
  interface Window {
    /** Recording hook: remounts the framed plate so its host timeline starts again. */
    __galleryReplay?: () => void;
  }
}

/**
 * One live part on a recessed plate, with its name, its one input and a note. Shared by the
 * gallery walls and the landing page's room (landing sequence, WP 3.1).
 */
export function Plate({
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
