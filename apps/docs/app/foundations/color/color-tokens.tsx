'use client';

import { useFinish } from '@/components/use-finish';
import { tokenFiles, tokensIn } from '@/lib/tokens';
import { utilityFor } from '@/lib/tailwind-map';

const groups = [
  { prefix: 'color.bg.', title: 'Background' },
  { prefix: 'color.fg.', title: 'Text' },
  { prefix: 'color.border.', title: 'Border' },
  { prefix: 'color.accent.', title: 'Accent' },
  { prefix: 'color.focus.', title: 'Focus' },
  { prefix: 'color.success.', title: 'Success' },
  { prefix: 'color.warning.', title: 'Warning' },
  { prefix: 'color.danger.', title: 'Danger' },
];

const ramps = ['neutral', 'accent', 'success', 'warning', 'danger'];
const stepJobs = [
  'bg',
  'bg',
  'fill',
  'fill',
  'fill',
  'border',
  'border',
  'border',
  'solid',
  'solid',
  'text',
  'text',
];

export function ColorTokens() {
  const { contextId, theme } = useFinish();
  const file = tokenFiles[contextId];

  return (
    <div className="flex flex-col gap-10">
      {groups.map((group) => (
        <section key={group.prefix} className="flex flex-col gap-3">
          <h2 className="type-heading">{group.title}</h2>
          <div className="overflow-x-auto rounded-surface border border-subtle bg-surface">
            <table className="w-full min-w-[640px] border-collapse type-body">
              <thead>
                <tr className="bg-sunken text-left type-caption text-muted">
                  <th className="w-12 px-3 py-2 font-medium" aria-label="Swatch" />
                  <th className="px-3 py-2 font-medium">Token</th>
                  <th className="px-3 py-2 font-medium">Tailwind</th>
                  <th className="px-3 py-2 font-medium">Maps to</th>
                  <th className="px-3 py-2 font-medium">Use</th>
                </tr>
              </thead>
              <tbody>
                {tokensIn(group.prefix).map((id) => {
                  const token = file.tokens[id]!;
                  return (
                    <tr key={id} className="border-t border-subtle align-top">
                      <td className="px-3 py-2">
                        <span
                          className="block size-6 rounded-control border border-subtle"
                          style={{ background: `var(${token.cssVar})` }}
                        />
                      </td>
                      <td className="px-3 py-2 type-code whitespace-nowrap">{id}</td>
                      <td className="px-3 py-2 type-code whitespace-nowrap text-accent">
                        {utilityFor(id) ?? '—'}
                      </td>
                      <td className="px-3 py-2 type-code whitespace-nowrap text-muted">
                        {token.aliasOf?.replace('palette.', '') ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-muted">{token.description ?? ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="flex flex-col gap-3">
        <div className="flex max-w-2xl flex-col gap-1">
          <h2 className="type-heading">Palettes · {theme === 'yu' ? 'Yu 玉' : 'Su 素'}</h2>
          <p className="type-body text-muted">
            Generated in OKLCH from palette.config.ts. Every step has one job, so modes can map
            roles to steps. Don&apos;t use these directly in product code.
          </p>
        </div>
        <div className="flex flex-col gap-4 overflow-x-auto">
          {ramps.map((ramp) => (
            <div key={ramp} className="flex min-w-[640px] flex-col gap-1">
              <p className="type-caption text-muted">{ramp}</p>
              {(['light', 'dark'] as const).map((mode) => (
                <div key={mode} className="grid grid-cols-12 gap-0.5">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div
                      key={i}
                      title={`palette.${ramp}.${mode}.${i + 1}`}
                      className="flex h-10 items-end rounded-control p-1"
                      style={{ background: `var(--zao-palette-${ramp}-${mode}-${i + 1})` }}
                    >
                      <span
                        className="type-caption"
                        style={{ color: `var(--zao-palette-neutral-${mode}-${i < 8 ? 12 : 1})` }}
                      >
                        {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
          <div className="grid min-w-[640px] grid-cols-12 gap-0.5 type-caption text-muted">
            {stepJobs.map((job, i) => (
              <span key={i} className="px-1">
                {job}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
