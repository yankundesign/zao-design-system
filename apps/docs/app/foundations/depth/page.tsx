import type { Metadata } from 'next';
import { DepthDemo } from '@/components/depth-demo';
import { getQuietInstrumentStudy } from '@/lib/style-studies';
import { allTokens, tokensIn } from '@/lib/tokens';

export const metadata: Metadata = { title: 'Depth' };

const order = ['depth.contact', 'depth.lift', 'depth.axis.x', 'depth.axis.y'];

export default async function DepthPage() {
  const tokens = tokensIn('depth.').sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const study = await getQuietInstrumentStudy();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="type-title">Depth</h1>
        <p className="type-body text-muted">
          Contact grounds a part on its base. Lift moves its face toward the viewer, along the
          shared screen axis. These finish tokens control painted offsets; native targets, focus
          outlines, content spacing, and neighboring layout stay fixed.
        </p>
      </header>

      <DepthDemo
        contact={Number.parseFloat(String(allTokens['depth.contact']!.value))}
        lift={Number.parseFloat(String(allTokens['depth.lift']!.value))}
        studyCssUrl={study?.cssUrl}
      />

      <section aria-labelledby="depth-tokens" className="flex flex-col gap-3">
        <h2 id="depth-tokens" className="type-heading">
          Su depth tokens
        </h2>
        <p className="max-w-2xl type-body text-muted">
          The values below come from the published token JSON. Su uses the same construction
          distances and axis in light and dark. Axis values are unitless: positive x points right,
          and negative y points up.
        </p>
        <dl className="flex flex-col">
          {tokens.map((id) => {
            const token = allTokens[id]!;
            return (
              <div key={id} className="flex flex-col gap-2 border-t border-subtle py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <dt className="type-code text-accent">{id}</dt>
                  <dd className="type-label figures-tabular">{String(token.value)}</dd>
                </div>
                <dd className="type-caption text-muted">{token.description}</dd>
                <dd className="type-code text-muted">{token.cssVar}</dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section aria-labelledby="depth-side-tone" className="flex max-w-2xl flex-col gap-3">
        <h2 id="depth-side-tone" className="type-heading">
          Side tone
        </h2>
        <p className="type-body text-muted">
          Filled sides share one shade of their current semantic face through the
          construction-shading utility. Dark secondary and filled quiet Buttons use the subtle
          semantic border color for their joined side and base so they stay visible against the
          backing. Card keeps the shared contact shade beneath its square, stationary content plane.
        </p>
      </section>
    </div>
  );
}
