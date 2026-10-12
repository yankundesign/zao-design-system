import { SectionFigure } from './figures/section-figures';
import type { SectionFigureKind } from './figures/section-figures';

export type NavSectionFigureKind = SectionFigureKind;

/** The nav draws each section's figure at 1:1 beside its title. */
export function NavSectionFigure({ kind }: { kind: NavSectionFigureKind }) {
  return <SectionFigure kind={kind} />;
}
