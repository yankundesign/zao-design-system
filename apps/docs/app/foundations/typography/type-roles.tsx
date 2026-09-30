'use client';

import { useFinish } from '@/components/use-finish';
import { tokenFiles } from '@/lib/tokens';

interface TypeValue {
  fontFamily: string[];
  fontSize: { value: number; unit: string };
  fontWeight: number;
  lineHeight: number;
  letterSpacing: { value: number; unit: string };
}

const roles = [
  { role: 'display', sample: 'Review 3 proposed changes', use: 'Hero and marketing headlines.' },
  {
    role: 'title',
    sample: 'Review 3 proposed changes · 营造法式',
    use: 'Page titles and empty states.',
  },
  { role: 'heading', sample: 'Access requests from last week', use: 'Sections and cards.' },
  {
    role: 'body',
    sample:
      'The assistant drafted these from last week’s access requests. Nothing changes until you approve.',
    use: 'Running text and table cells.',
  },
  { role: 'label', sample: 'Approve 3 changes', use: 'Buttons, tabs, form labels, badges.' },
  {
    role: 'caption',
    sample: 'Drafted 2 minutes ago by the assistant',
    use: 'Helper text and metadata.',
  },
  { role: 'code', sample: 'group:Eng-Legacy · ADMIN-01', use: 'Code, keys, IDs.' },
] as const;

const utility: Record<string, string> = {
  display: 'type-display',
  title: 'type-title',
  heading: 'type-heading',
  body: 'type-body',
  label: 'type-label',
  caption: 'type-caption',
  code: 'type-code',
};

export function TypeRoles() {
  const { contextId } = useFinish();
  const file = tokenFiles[contextId];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col">
        {roles.map(({ role, sample, use }) => {
          const v = file.tokens[`type.${role}`]!.value as TypeValue;
          const px = v.fontSize.value;
          return (
            <div
              key={role}
              className="grid gap-3 border-t border-subtle py-5 md:grid-cols-[200px_minmax(0,1fr)]"
            >
              <div className="flex flex-col gap-1">
                <p className="type-code text-accent">{utility[role]}</p>
                <p className="type-caption text-muted">{use}</p>
                <p className="type-caption text-muted figures-tabular">
                  {v.fontFamily[0]} · {px}/{Math.round(px * v.lineHeight)} · {v.fontWeight} ·{' '}
                  {v.letterSpacing.value === 0 ? '0' : `${v.letterSpacing.value}px`}
                </p>
              </div>
              <p className={`${utility[role]} min-w-0 text-pretty`}>{sample}</p>
            </div>
          );
        })}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="type-heading">Figures</h2>
        <p className="max-w-2xl type-body text-muted">
          Geist&apos;s stylistic sets ss03 and ss05 separate I, l and 1. Use{' '}
          <code className="type-code">figures-id</code> for IDs and anything a reader might copy,
          and <code className="type-code">figures-tabular</code> for numbers that line up or change.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-surface border border-subtle bg-surface p-4">
            <p className="type-caption text-muted">Default</p>
            <p className="type-heading">Il1 O0 · ADMIN-01 · 1,111.11</p>
          </div>
          <div className="flex flex-col gap-1 rounded-surface border border-subtle bg-surface p-4">
            <p className="type-caption text-muted">figures-id</p>
            <p className="type-heading figures-id">Il1 O0 · ADMIN-01 · 1,111.11</p>
          </div>
        </div>
      </section>
    </div>
  );
}
