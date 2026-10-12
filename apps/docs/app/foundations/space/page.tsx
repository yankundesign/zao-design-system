import type { Metadata } from 'next';
import { allTokens, tokensIn } from '@/lib/tokens';

export const metadata: Metadata = { title: 'Space' };

const stepOf = (id: string) => Number(id.replace('space.', '').replace('-', '.'));

export default function SpacePage() {
  const steps = tokensIn('space.').sort((a, b) => stepOf(a) - stepOf(b));
  const controls = tokensIn('size.control.');

  return (
    <div className="flex flex-col gap-10">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="type-title">Space</h1>
        <p className="type-body text-muted">
          ZAO&apos;s base unit is the fen, after the fen of Yingzao Fashi&apos;s cai–fen module: 1
          fen is 4px, and spacing and sizing follow whole or half fen steps. Tailwind&apos;s spacing
          numbers are fen, so <code className="type-code">p-3</code> is 12px. Stay on these steps;
          anything else fails lint.
        </p>
      </header>

      <section className="flex flex-col">
        {steps.map((id) => {
          const step = stepOf(id);
          const token = allTokens[id]!;
          return (
            <div
              key={id}
              className="grid grid-cols-[72px_72px_minmax(0,1fr)] items-center gap-4 border-t border-subtle py-2"
            >
              <span className="type-code text-muted">p-{String(step)}</span>
              <span className="type-caption text-muted figures-tabular">
                {String(token.value)} · {step} fen
              </span>
              <span
                className="h-3 rounded-control bg-active"
                style={{ width: `var(${token.cssVar})` }}
              />
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="type-heading">Control heights</h2>
        <p className="max-w-2xl type-body text-muted">
          Shared by every finish: small controls are {String(allTokens['size.control.sm']!.value)},
          defaults are {String(allTokens['size.control.md']!.value)}, and large controls are{' '}
          {String(allTokens['size.control.lg']!.value)}. Buttons, fields, and tabs share the default
          through <code className="type-code">h-control</code>. Button keeps its approved line box
          and padding. The <code className="type-code">h-8</code> spacing utility stays 8 fen.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          {controls.map((id) => {
            const token = allTokens[id]!;
            return (
              <div key={id} className="flex flex-col items-start gap-2">
                <div
                  className="flex items-center rounded-action bg-accent px-3 type-label trim-label text-on-accent"
                  style={{ height: `var(${token.cssVar})` }}
                >
                  Approve
                </div>
                <span className="type-caption text-muted">
                  {id.replace('size.control.', '')} · {String(token.value)}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
