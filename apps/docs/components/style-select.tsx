'use client';

import { Select } from '@base-ui/react/select';

export type StyleValue = 'baseline' | 'quiet-instrument';

const styles: { label: string; value: StyleValue }[] = [
  { label: 'ZAO baseline', value: 'baseline' },
  { label: 'Quiet instrument', value: 'quiet-instrument' },
];

export function StyleSelect({
  value,
  showQuiet,
  onValueChange,
}: {
  value: StyleValue;
  showQuiet: boolean;
  onValueChange: (value: StyleValue) => void;
}) {
  const options = showQuiet ? styles : styles.slice(0, 1);

  return (
    <div className="flex w-full max-w-xs flex-col gap-1">
      <Select.Root<StyleValue>
        items={options}
        value={showQuiet ? value : 'baseline'}
        onValueChange={(next) => {
          if (next && (next === 'baseline' || showQuiet)) onValueChange(next);
        }}
      >
        <Select.Label className="type-caption text-muted">Style</Select.Label>
        <Select.Trigger
          data-style-select-trigger
          className="flex h-8 w-full items-center justify-between gap-2 rounded-control border border-default bg-canvas pl-2 pr-3 type-body text-default outline-focus"
        >
          <Select.Value className="min-w-0 truncate" />
          <Select.Icon className="shrink-0 text-muted">
            <svg
              data-style-select-arrow
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m4 6 4 4 4-4" />
            </svg>
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className="z-20"
            style={{ width: 'var(--anchor-width)' }}
            alignItemWithTrigger={false}
            side="bottom"
            align="start"
            sideOffset={4}
            collisionAvoidance={{ side: 'none', align: 'shift' }}
          >
            <Select.Popup
              data-style-select-menu
              className="material-overlay w-full overflow-hidden p-1"
            >
              <Select.List className="flex flex-col">
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    data-style-select-option
                    value={option.value}
                    className="flex min-h-7 w-full cursor-pointer items-center justify-between gap-2 rounded-control px-2 py-1 type-body text-default outline-focus data-[highlighted]:bg-hover"
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                    <Select.ItemIndicator className="text-accent" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m3 8 3 3 7-7" />
                      </svg>
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
