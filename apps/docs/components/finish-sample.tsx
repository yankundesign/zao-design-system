import type { CSSProperties } from 'react';

/**
 * The same markup in any finish. Used on the overview to show that structure is
 * shared: only color, radius, material and the title face change.
 */
export function FinishSample({
  theme,
  mode,
  label,
}: {
  theme: 'su' | 'yu';
  mode: 'light' | 'dark';
  label: string;
}) {
  // Stepped bands (叠晕) behind the floating toast, so Yu's glass has something to show through.
  const n = (step: number) => `var(--zao-palette-neutral-${mode}-${step})`;
  const a = (step: number) => `var(--zao-palette-accent-${mode}-${step})`;
  const bands: CSSProperties = {
    background: `linear-gradient(172deg, ${n(1)} 0 52%, ${n(2)} 52% 64%, ${a(2)} 64% 74%, ${a(3)} 74% 84%, ${a(4)} 84% 100%)`,
  };

  return (
    <figure className="m-0 flex min-w-0 flex-col gap-2">
      <figcaption className="type-caption text-muted">{label}</figcaption>
      <div
        data-zao-theme={theme}
        data-zao-mode={mode}
        style={bands}
        className="flex flex-col gap-4 overflow-hidden rounded-surface border border-subtle p-5 text-default"
      >
        <p className="type-caption text-muted">Workspace / Agent activity</p>
        <h3 className="type-title">Review 3 proposed changes</h3>
        <p className="type-body text-muted">
          The assistant drafted these from last week&apos;s access requests. Nothing changes until
          you approve.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="h-8 rounded-action bg-accent px-3 type-label trim-label text-on-accent transition-colors duration-fast hover:bg-accent-hover"
          >
            Approve 3 changes
          </button>
          <button
            type="button"
            className="h-8 rounded-action border border-default bg-surface px-3 type-label trim-label text-default transition-colors duration-fast hover:border-strong"
          >
            Review one by one
          </button>
        </div>
        <div
          role="status"
          className="material-overlay mt-2 flex items-center gap-3 px-3 py-2 type-body"
        >
          <span aria-hidden className="text-success">
            ✓
          </span>
          <span className="flex-1">Approved 3 changes</span>
          <kbd className="rounded-control border border-subtle bg-sunken px-1.5 type-code text-muted">
            ⌘Z
          </kbd>
        </div>
      </div>
    </figure>
  );
}
