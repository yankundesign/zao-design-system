import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { MotionDemo } from '@/components/motion-demo';
import { MotionInventory } from '@/components/motion-inventory';
import { FoldFigure, FoldRace, GradeLadder } from '@/components/motion-rules';
import { motionRoles } from '@/lib/motion';
import type { MotionValues } from '@/lib/motion';
import { getQuietInstrumentStudy } from '@/lib/style-studies';
import { allTokens } from '@/lib/tokens';

export const metadata: Metadata = { title: 'Motion' };

export default async function MotionPage() {
  if (process.env.ZAO_DOCS_STATIC_EXPORT !== '1') await connection();
  const [markdown, study] = await Promise.all([
    readFile(resolve(process.cwd(), '../../docs/motion.md'), 'utf8'),
    getQuietInstrumentStudy(),
  ]);
  const initial = Object.fromEntries(
    motionRoles.map((role) => [
      role,
      {
        duration: Number.parseFloat(String(allTokens['motion.duration.' + role]!.value)),
        easing: String(
          allTokens['motion.easing.' + (role === 'reveal-exit' ? 'exit' : role)]!.value,
        ),
      },
    ]),
  ) as MotionValues;

  return (
    <div className="flex min-w-0 flex-col gap-10">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="type-title">Motion</h1>
        <p className="type-body text-muted">
          ZAO’s motion is derived, not picked. Curves come from the Song roof-fold rule, 举折;
          durations come from the eight timber grades, 材分八等. Lift, seat, slide and reveal are
          roles that point at them. Only paint moves: targets, focus brackets and neighboring layout
          stay fixed.
        </p>
      </header>
      <section className="flex flex-col gap-4" aria-labelledby="fold-heading">
        <div className="flex max-w-2xl flex-col gap-2">
          <h2 id="fold-heading" className="type-heading">
            A curve from the roofline
          </h2>
          <p className="type-body text-muted">
            The roof profile from eave to ridge is the exit curve: it starts slowly and accelerates
            away. Turned 180°, it is the enter curve: it starts quickly and settles without
            overshoot. Both are faceted, five straight segments for a ten-rafter hall, and CSS draws
            them exactly with <code className="type-code">linear()</code>.
          </p>
        </div>
        <FoldFigure />
      </section>
      <section className="flex flex-col gap-4" aria-labelledby="race-heading">
        <div className="flex max-w-2xl flex-col gap-2">
          <h2 id="race-heading" className="type-heading">
            Same duration, different curve
          </h2>
          <p className="type-body text-muted">
            Both parts travel for 600ms. Slow the view to see where each spends its time.
          </p>
        </div>
        <FoldRace />
      </section>
      <section className="flex flex-col gap-4" aria-labelledby="grades-heading">
        <div className="flex max-w-2xl flex-col gap-2">
          <h2 id="grades-heading" className="type-heading">
            Size sets the pace
          </h2>
          <p className="type-body text-muted">
            Each part has a timber grade. Its duration is the grade’s 材 height times one unit, so
            heavier parts arrive later. Press is the exception: every face seats at the fast
            duration, because press is shorter than release.
          </p>
        </div>
        <GradeLadder />
      </section>
      <MotionDemo initial={initial} studyCssUrl={study?.cssUrl} />
      <MotionInventory markdown={markdown} />
    </div>
  );
}
