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
          fen is 4px, and every spacing and sizing value is a multiple of it. Tailwind&apos;s
          spacing numbers are fen, so <code className="type-code">p-3</code> is 12px. Stay on these
          steps; anything else fails lint.
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
              <span className="type-code text-accent">p-{String(step)}</span>
              <span className="type-caption text-muted figures-tabular">
                {String(token.value)} · {step} fen
              </span>
              <span
                className="h-3 rounded-control bg-accent"
                style={{ width: `var(${token.cssVar})` }}
              />
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="type-heading">Control heights</h2>
        <p className="max-w-2xl type-body text-muted">
          Identical in every finish, so inputs and tabs never change size between themes. Button
          uses these small and large heights; its default is{' '}
          {String(allTokens['size.button.default']!.value)} to match its approved reference.
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
