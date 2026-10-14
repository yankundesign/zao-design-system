'use client';

import { useId, useState, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { Button, Menu, Switch, TextField, finish } from '@zao/react';
import { motionRoles } from '@/lib/motion';
import type { MotionRole, MotionValues } from '@/lib/motion';
import { allTokens } from '@/lib/tokens';
import { useFinish } from './use-finish';

const gradeIds = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const roleLabels: Record<MotionRole, string> = {
  lift: 'Lift',
  seat: 'Seat',
  slide: 'Slide',
  reveal: 'Reveal',
  'reveal-exit': 'Reveal exit',
  hold: 'Hold',
  impress: 'Impress',
};

function subscribeReducedMotion(notify: () => void) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  preference.addEventListener('change', notify);
  return () => preference.removeEventListener('change', notify);
}

function reducedMotionSnapshot() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Keep the private editor within curves that have no overshoot. */
export function validMotionEasing(value: string) {
  if (['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'].includes(value.trim())) return true;
  if (/^steps\([1-9]\d*,\s*jump-(?:start|end)\)$/.test(value.trim())) return true;
  // 举折 curves are faceted linear() curves; every stop must stay within 0 and 1.
  const linear = value.trim().match(/^linear\(([^)]+)\)$/);
  if (linear) {
    const stops = linear[1]!.split(',').map((stop) => stop.trim().split(/\s+/));
    return (
      stops.length >= 2 &&
      stops.every(([output, position, extra]) => {
        if (extra !== undefined || output === undefined) return false;
        const y = Number(output);
        if (!Number.isFinite(y) || y < 0 || y > 1) return false;
        if (position === undefined) return true;
        const match = position.match(/^(\d+(?:\.\d+)?)%$/);
        return match !== null && Number(match[1]) >= 0 && Number(match[1]) <= 100;
      })
    );
  }
  const match = value.trim().match(/^cubic-bezier\(([^)]+)\)$/);
  if (!match) return false;
  const parts = match[1]!.split(',').map((part) => part.trim());
  return (
    parts.length === 4 &&
    parts.every((part) => {
      if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(part)) return false;
      const number = Number(part);
      return Number.isFinite(number) && number >= 0 && number <= 1;
    })
  );
}

/** Role values and playback speed apply only to these real component specimens. */
export function MotionDemo({
  initial,
  studyCssUrl,
}: {
  initial: MotionValues;
  studyCssUrl?: string;
}) {
  const speedId = useId();
  const { theme, resolved } = useFinish();
  const reduced = useSyncExternalStore(subscribeReducedMotion, reducedMotionSnapshot, () => false);
  const [values, setValues] = useState(initial);
  const [easingDrafts, setEasingDrafts] = useState(
    () =>
      Object.fromEntries(motionRoles.map((role) => [role, initial[role].easing])) as Record<
        MotionRole,
        string
      >,
  );
  const [speed, setSpeed] = useState(1);
  const [enabled, setEnabled] = useState(false);
  const [result, setResult] = useState('Use the specimens to inspect their response.');
  const [copyStatus, setCopyStatus] = useState('');
  const overrides = Object.fromEntries([
    ...motionRoles.flatMap((role) => [
      ['--zao-motion-duration-' + role, values[role].duration / speed + 'ms'],
      ['--zao-motion-easing-' + (role === 'reveal-exit' ? 'exit' : role), values[role].easing],
    ]),
    // Parts that read a grade directly (focus brackets, the Card's drawn states) slow down too.
    ...gradeIds.map((grade) => [
      '--zao-motion-duration-grade-' + grade,
      Number.parseFloat(String(allTokens['motion.duration.grade.' + grade]?.value)) / speed + 'ms',
    ]),
  ]) as CSSProperties;
  const output = motionRoles
    .flatMap((role) => [
      '--zao-motion-duration-' + role + ': ' + values[role].duration + 'ms;',
      '--zao-motion-easing-' +
        (role === 'reveal-exit' ? 'exit' : role) +
        ': ' +
        values[role].easing +
        ';',
    ])
    .join('\n');

  function reset() {
    setValues(initial);
    setEasingDrafts(
      Object.fromEntries(motionRoles.map((role) => [role, initial[role].easing])) as Record<
        MotionRole,
        string
      >,
    );
    setSpeed(1);
    setCopyStatus('');
  }

  return (
    <section
      aria-labelledby="motion-demo-title"
      className="flex min-w-0 flex-col gap-6"
      data-motion-demo=""
    >
      {studyCssUrl && <link rel="stylesheet" href={studyCssUrl} />}
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 id="motion-demo-title" className="type-heading">
          Inspect the response
        </h2>
        <p className="type-body text-muted">
          Use the real controls, then slow playback or edit a role. Values apply only to the
          specimens below. Reset restores the published values.
        </p>
        <label htmlFor={speedId} className="type-label font-medium">
          Playback speed
        </label>
        <select
          id={speedId}
          value={speed}
          onChange={(event) => setSpeed(Number(event.currentTarget.value))}
          className="h-control self-start rounded-control border border-field bg-canvas px-2 type-body text-default outline-focus"
        >
          {[1, 0.5, 0.25, 0.1].map((value) => (
            <option key={value} value={value}>
              {value}×
            </option>
          ))}
        </select>
        <p role="status" className="type-caption text-muted" data-motion-preference="">
          {reduced
            ? 'Reduced motion is on. Specimens show the destination immediately; spatial playback is disabled.'
            : 'Motion follows your input. Nothing runs while the controls are idle.'}
        </p>
      </div>

      <div
        {...finish(theme, resolved)}
        data-study="quiet-instrument"
        data-motion-island=""
        data-motion-speed={speed}
        className="study grid min-w-0 gap-6 border border-subtle bg-canvas p-5 text-default lg:grid-cols-2"
        style={overrides}
      >
        <section className="flex min-w-0 flex-col items-start gap-3" data-motion-part="lift">
          <h3 className="type-label font-medium">Lift</h3>
          <p className="type-body text-muted">Hover raises a face along the shared depth axis.</p>
          <Button variant="secondary" onClick={() => setResult('Inspected the lift action.')}>
            Inspect lift
          </Button>
        </section>
        <section className="flex min-w-0 flex-col items-start gap-3" data-motion-part="seat">
          <h3 className="type-label font-medium">Seat</h3>
          <p className="type-body text-muted">Hold a press to seat the face onto its fixed base.</p>
          <Button onClick={() => setResult('Inspected the seat action.')}>Inspect seat</Button>
        </section>
        <section className="flex min-w-0 flex-col items-start gap-3" data-motion-part="slide">
          <h3 className="type-label font-medium">Slide</h3>
          <p className="type-body text-muted">
            Activation moves one face between the track endpoints.
          </p>
          <label className="inline-flex min-h-6 items-center gap-3 type-label">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            Email updates
          </label>
        </section>
        <section
          className="docs-menu-preview flex min-w-0 flex-col items-start gap-3"
          data-motion-part="reveal"
        >
          <h3 className="type-label font-medium">Reveal</h3>
          <p className="type-body text-muted">
            A moving edge uncovers a stationary panel from its joint.
          </p>
          <div data-zao-specimen="menu">
            <Menu
              trigger="Inspect reveal"
              items={[
                {
                  label: 'Review workspace',
                  onSelect: () => setResult('Reviewed the local workspace.'),
                },
                {
                  label: 'Copy workspace ID',
                  onSelect: () => setResult('Inspected the local copy action.'),
                },
                { label: 'Archive workspace', disabled: true },
              ]}
            />
          </div>
        </section>
        <p className="type-caption text-muted lg:col-span-2" aria-live="polite">
          {result}
        </p>
      </div>

      <section aria-labelledby="motion-tuner-title" className="flex min-w-0 flex-col gap-4">
        <h2 id="motion-tuner-title" className="type-heading">
          Try role values
        </h2>
        <p className="max-w-2xl type-body text-muted">
          Su derives its role values (finish plan, Oct 11): lift and slide take grade 7, 157.5ms;
          reveal takes grade 5, 198ms; seat and reveal exit stay at 80ms. Lift, slide and reveal
          enter on the 举折 curve, reveal exit leaves on it, and seat keeps the standard curve.
          Changes here are local previews and need a separate approval to become published values.
        </p>
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          {motionRoles.map((role) => {
            const durationId = speedId + '-' + role;
            const label = roleLabels[role];
            return (
              <fieldset
                key={role}
                className="flex min-w-0 flex-col gap-3 border-t border-subtle pt-3"
                data-motion-role={role}
              >
                <legend className="type-label font-medium">{label}</legend>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <label htmlFor={durationId} className="type-label">
                    {label} duration
                  </label>
                  <output htmlFor={durationId} className="type-label figures-tabular">
                    {values[role].duration}ms
                  </output>
                </div>
                <input
                  id={durationId}
                  type="range"
                  min={0}
                  max={2000}
                  step={0.5}
                  value={values[role].duration}
                  aria-valuetext={values[role].duration + ' milliseconds'}
                  onChange={(event) => {
                    const duration = Number(event.currentTarget.value);
                    setValues((current) => ({
                      ...current,
                      [role]: { ...current[role], duration },
                    }));
                    setCopyStatus('');
                  }}
                  className="min-h-6 w-full outline-focus"
                  style={{ accentColor: 'var(--zao-color-accent-solid)' }}
                />
                <TextField
                  label={label + ' easing'}
                  value={easingDrafts[role]}
                  description="Use an easing keyword, cubic-bezier with four values from 0 to 1, linear() with stops from 0 to 1, or steps() with jump-start or jump-end."
                  error={
                    validMotionEasing(easingDrafts[role])
                      ? undefined
                      : 'Enter an easing keyword, cubic-bezier or linear() values from 0 to 1, or steps() with jump-start or jump-end.'
                  }
                  onChange={(event) => {
                    const draft = event.currentTarget.value;
                    setEasingDrafts((current) => ({ ...current, [role]: draft }));
                    if (validMotionEasing(draft)) {
                      setValues((current) => ({
                        ...current,
                        [role]: { ...current[role], easing: draft.trim() },
                      }));
                    }
                    setCopyStatus('');
                  }}
                />
              </fieldset>
            );
          })}
        </div>
        <Button variant="secondary" className="self-start" onClick={reset}>
          Reset motion
        </Button>
      </section>

      <section aria-labelledby="motion-copy-title" className="flex min-w-0 flex-col gap-3">
        <h2 id="motion-copy-title" className="type-heading">
          Copy values for review
        </h2>
        <p className="type-body text-muted">
          This output contains the unscaled role values. Playback speed is an inspection setting.
          Send any new values back for a separate review.
        </p>
        <label className="flex min-w-0 flex-col gap-2 type-label">
          Role values
          <textarea
            readOnly
            value={output}
            rows={10}
            className="w-full rounded-control border border-field bg-canvas p-3 type-code text-default outline-focus"
            data-motion-output=""
          />
        </label>
        <Button
          variant="secondary"
          className="self-start"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(output);
              setCopyStatus('Copied role values.');
            } catch {
              setCopyStatus('Copy is unavailable. Select the role values above and copy them.');
            }
          }}
        >
          Copy role values
        </Button>
        <p role="status" className="type-caption text-muted">
          {copyStatus}
        </p>
      </section>
    </section>
  );
}
