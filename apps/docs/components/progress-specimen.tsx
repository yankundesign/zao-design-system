'use client';

import { Progress } from '@zao/react';

const uploadProgress = 68;
const transferProgress = { value: 34.2, total: 50 };

/** Illustrative task readings share a stable quantitative scale. */
export function ProgressSpecimen() {
  return (
    <div data-zao-specimen="progress" className="flex max-w-xl flex-col gap-6">
      <p className="type-caption text-muted">Illustrative task readings</p>
      <div className="flex flex-col gap-2">
        <Progress label="Upload files" value={uploadProgress} />
        <p className="type-caption figures-tabular text-muted">{100 - uploadProgress}% remaining</p>
      </div>
      <div className="flex flex-col gap-2">
        <Progress label="Prepare workspace" value={100} />
        <p className="type-caption text-muted">Complete</p>
      </div>
      <div className="flex flex-col gap-6 border-t border-subtle pt-6">
        <Progress label="Start backup" value={0} />
        <div className="flex flex-col gap-2">
          <Progress
            label="Transfer archive"
            value={transferProgress.value}
            max={transferProgress.total}
            locale="en-US"
            format={{ style: 'unit', unit: 'megabyte', maximumFractionDigits: 1 }}
            getAriaValueText={() =>
              `${transferProgress.value} of ${transferProgress.total} megabytes transferred`
            }
          />
          <p className="type-caption figures-tabular text-muted">
            Of {transferProgress.total} MB total ·{' '}
            {(transferProgress.total - transferProgress.value).toFixed(1)} MB remaining
          </p>
        </div>
      </div>
    </div>
  );
}
