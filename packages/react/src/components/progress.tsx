'use client';

import { Progress as BaseProgress } from '@base-ui/react/progress';
import type { ProgressRootProps as BaseProgressRootProps } from '@base-ui/react/progress';
import { forwardRef } from 'react';

export interface ProgressProps extends Omit<
  BaseProgressRootProps,
  'children' | 'className' | 'render' | 'style'
> {
  /** A visible task name that also labels the progress bar. */
  label: string;
  /** Show a formatted percentage or, for an indeterminate task, its status. */
  showValue?: boolean;
  /** Layout classes for the progress bar. */
  className?: string;
}

/** Progress for a named task; pass `null` while its completion is unknown. */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { label, showValue = true, className, value, min = 0, max = 100, ...rootProps },
  ref,
) {
  // An unusable denominator cannot truthfully encode zero or any other proportion.
  const hasRange = Number.isFinite(min) && Number.isFinite(max) && max > min;

  return (
    <BaseProgress.Root
      {...rootProps}
      value={hasRange ? value : null}
      min={hasRange ? min : 0}
      max={hasRange ? max : 100}
      ref={ref}
      data-zao-component="progress"
      data-zao-slot="root"
      className={['progress-construction flex w-full flex-col gap-2', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-baseline justify-between gap-3" data-zao-slot="header">
        <BaseProgress.Label
          data-zao-slot="label"
          className="min-w-0 type-label font-medium text-default"
        >
          {label}
        </BaseProgress.Label>
        {showValue && (
          <BaseProgress.Value
            data-zao-slot="value"
            className="shrink-0 type-label figures-tabular text-default data-indeterminate:text-muted"
          >
            {(formattedValue) =>
              formattedValue === 'indeterminate' ? 'In progress' : formattedValue
            }
          </BaseProgress.Value>
        )}
      </div>
      <BaseProgress.Track data-zao-slot="track">
        <BaseProgress.Indicator data-zao-slot="indicator" />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
});
