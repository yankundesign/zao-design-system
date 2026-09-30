'use client';

import { useFinish, type ModeSetting, type Theme } from './use-finish';

function Segment<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex gap-0.5 rounded-action border border-subtle bg-sunken p-0.5"
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled && !selected}
            onClick={() => onChange(o.value)}
            className={[
              'h-7 rounded-action px-3 type-label trim-label transition-colors duration-fast ease-standard',
              selected ? 'bg-accent text-on-accent' : 'text-muted hover:text-default',
              disabled && !selected
                ? 'cursor-not-allowed text-disabled hover:text-disabled'
                : 'cursor-pointer',
            ].join(' ')}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function FinishSwitcher() {
  const { theme, setting, setTheme, setMode } = useFinish();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segment<Theme>
        label="Finish"
        value={theme}
        onChange={setTheme}
        options={[
          { value: 'su', label: 'Su 素' },
          { value: 'yu', label: 'Yu 玉' },
        ]}
      />
      <Segment<ModeSetting>
        label="Mode"
        value={theme === 'yu' ? 'dark' : setting}
        onChange={setMode}
        disabled={theme === 'yu'}
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />
    </div>
  );
}
