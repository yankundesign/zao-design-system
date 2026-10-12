import Link from 'next/link';
import { docsSections } from '@/lib/docs-sections';
import type { DocsSectionId } from '@/lib/docs-sections';
import { SectionFigure } from '../figures/section-figures';

const componentCount = docsSections.find((section) => section.id === 'components')!.links.length;
const chartCount = docsSections.find((section) => section.id === 'charts')!.links.length - 1;

// Spell out counts below ten, as in running text.
const small = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const count = (value: number) => small[value] ?? String(value);

const tiles: {
  id: Exclude<DocsSectionId, 'start'>;
  title: string;
  detail: string;
  href: string;
}[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    detail: 'Color, type, fen spacing and depth.',
    href: '/foundations/color',
  },
  {
    id: 'components',
    title: 'Components',
    detail: `${componentCount} parts, one construction.`,
    href: '/components/button',
  },
  {
    id: 'charts',
    title: 'Charts',
    detail: `Five rules, ${count(chartCount)} instruments.`,
    href: '/charts',
  },
];

/** Section 5: the index, as three built objects. The whole tile is the link. */
export function Explore() {
  return (
    <section
      aria-labelledby="landing-explore-heading"
      data-landing-section="explore"
      className="landing-section flex flex-col gap-6"
    >
      <h2 id="landing-explore-heading" className="type-title">
        Explore ZAO
      </h2>
      <ul className="landing-explore grid min-w-0 gap-4">
        {tiles.map((tile) => (
          <li key={tile.id} className="min-w-0">
            <Link
              href={tile.href}
              className="landing-explore-tile flex h-full flex-col gap-4 border-t border-subtle pt-4 outline-focus"
            >
              <SectionFigure kind={tile.id} className="docs-nav-figure landing-explore-figure" />
              <span className="flex flex-col gap-1">
                <span className="type-heading">{tile.title}</span>
                <span className="type-body text-muted">{tile.detail}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="type-caption text-muted">
        Named for 营造法式 Yingzao Fashi, the Song building manual of 1103.
      </p>
    </section>
  );
}
