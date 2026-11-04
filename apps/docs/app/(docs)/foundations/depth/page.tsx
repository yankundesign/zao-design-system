import type { Metadata } from 'next';
import { DepthDemo } from '@/components/depth-demo';
import { getQuietInstrumentStudy } from '@/lib/style-studies';
import { allTokens, tokensIn } from '@/lib/tokens';

export const metadata: Metadata = { title: 'Depth' };

const order = [
  'depth.rest.small',
  'depth.rest.control',
  'depth.rest.surface',
  'depth.lift',
  'depth.contact',
  'depth.axis.x',
  'depth.axis.y',
];

export default async function DepthPage() {
  const tokens = tokensIn('depth.').sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const study = await getQuietInstrumentStudy();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="type-title">Depth</h1>
        <p className="type-body text-muted">
          A lifted part has a face, a fixed base a rest depth behind it, and the gap between them,
          drawn as two side planes toward the shared screen axis. Hover lifts the face further;
          press seats it onto its base. These finish tokens control paint only: native targets,
          focus brackets, content spacing, and neighboring layout stay fixed.
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
                  <dt className="type-code text-muted">{id}</dt>
                  <dd className="type-label figures-tabular">{String(token.value)}</dd>
                </div>
                <dd className="type-caption text-muted">{token.description}</dd>
                <dd className="type-code text-muted">{token.cssVar}</dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section aria-labelledby="depth-side-planes" className="flex max-w-2xl flex-col gap-3">
        <h2 id="depth-side-planes" className="type-heading">
          Side planes
        </h2>
        <p className="type-body text-muted">
          Each plane is drawn in two flat bands, 叠晕: the near band beside the face and the far
          band at the base. The bands are shades of the part’s own semantic face. Light faces step
          toward black, dark faces toward white, and solid seal faces always toward black. The
          bottom plane is only slightly darker than the side plane, so it never reads as a detached
          shadow. Depth is drawn, never blurred.
        </p>
        <p className="type-body text-muted">
          One leading corner of a lifted face is faceted, 卷杀. Browsers without corner shaping keep
          it square.
        </p>
      </section>

      <section aria-labelledby="depth-wells" className="flex max-w-2xl flex-col gap-3">
        <h2 id="depth-wells" className="type-heading">
          Wells
        </h2>
        <p className="type-body text-muted">
          Fields, the Switch channel, the Progress track and the secondary Tabs list are recessed.
          Their inner walls on the far side of the axis step down in two hard steps of the contact
          distance.
        </p>
      </section>
    </div>
  );
}
