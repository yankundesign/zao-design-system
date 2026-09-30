import Link from 'next/link';
import { FinishSample } from '@/components/finish-sample';

const shipped = [
  [
    'Tokens',
    'W3C DTCG files with a resolver for Su and Yu in light and dark, built to CSS variables and JSON by Terrazzo.',
  ],
  [
    'Palettes',
    'Generated in OKLCH from a hue, a chroma and a few lightness anchors per finish. Run pnpm palette after changing them.',
  ],
  [
    'Tailwind theme',
    "Tailwind's defaults removed; only ZAO's colors, type roles, radii and materials compile.",
  ],
  [
    'Fonts',
    'Geist, Geist Mono and Newsreader, self-hosted with every OpenType feature and metric-matched fallbacks.',
  ],
  [
    'Tests',
    'Every finish is complete, structure never changes between finishes, and text meets its contrast minimums.',
  ],
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex max-w-2xl flex-col gap-4">
        <p className="type-caption text-muted">v0.1 · Milestone 1, foundation</p>
        <h1 className="type-display text-balance">ZAO is the foundation for how we build.</h1>
        <p className="type-body text-muted">
          Inspired by the principles of Yingzao Fashi, it defines the shared materials, patterns,
          and rules that help teams construct consistent digital experiences.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex max-w-2xl flex-col gap-1">
          <h2 className="type-heading">Structure is shared, finish is chosen</h2>
          <p className="type-body text-muted">
            The same markup in both finishes. Spacing, control heights and type sizes come from the
            structure set and never change. Color, radius, material and the title face come from the
            finish. Each sample is an island: a finish applies to any element, not just the page.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <FinishSample theme="su" mode="light" label="Su 素 · plain · light" />
          <FinishSample theme="yu" mode="dark" label="Yu 玉 · jade · dark" />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="type-heading">What exists today</h2>
        <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {shipped.map(([term, detail]) => (
            <div key={term} className="flex flex-col gap-1 border-t border-subtle pt-3">
              <dt className="type-body font-medium">{term}</dt>
              <dd className="m-0 type-body text-muted">{detail}</dd>
            </div>
          ))}
        </dl>
        <p className="type-body text-muted">
          Start with{' '}
          <Link className="text-accent underline underline-offset-2" href="/foundations/color">
            color
          </Link>
          ,{' '}
          <Link className="text-accent underline underline-offset-2" href="/foundations/typography">
            typography
          </Link>{' '}
          and{' '}
          <Link className="text-accent underline underline-offset-2" href="/foundations/space">
            space
          </Link>
          . Components arrive in milestone 2.
        </p>
      </section>
    </div>
  );
}
