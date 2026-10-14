/** Thin CLI wrapper around the 举折 and grade math in @zao/engine. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { foldCurves, gradeDurations } from '@zao/engine/motion';
import { motion } from '../motion.config.ts';

const root = new URL('../', import.meta.url);
const output = new URL('src/motion/', root);

const gradeSource = JSON.parse(
  await readFile(new URL('src/base/grade.tokens.json', root), 'utf8'),
) as { grade: Record<string, { $value: number } | string> };
const heights = Object.fromEntries(
  Object.entries(gradeSource.grade)
    .filter(([key]) => /^\d+$/.test(key))
    .map(([key, token]) => [key, (token as { $value: number }).$value]),
);

/** Builds one finish's generated motion document. Exported for the drift test. */
export function motionDocument(finish: keyof typeof motion) {
  const input = motion[finish];
  const fold = foldCurves(input.rafters);
  const durations = gradeDurations(heights, input.gradeUnit);
  const curve = (kind: 'enter' | 'exit') => ({
    $value: fold[kind].cubic,
    $description:
      kind === 'enter'
        ? `举折 enter curve: the ${input.rafters}-rafter roof profile turned 180°. It starts quickly and settles without overshoot. CSS uses the exact faceted linear() curve; the cubic-bezier value is a smoothed fit for tools that need one.`
        : `举折 exit curve: the ${input.rafters}-rafter roof profile as built. It starts slowly and accelerates away. CSS uses the exact faceted linear() curve; the cubic-bezier value is a smoothed fit.`,
    $extensions: {
      'dev.zao.motion': {
        linear: fold[kind].linear,
        rafters: input.rafters,
        points: fold[kind].points,
      },
    },
  });
  return {
    $description:
      'Generated from motion.config.ts and src/base/grade.tokens.json by scripts/generate-motion.ts. Do not edit by hand; change the inputs and run `pnpm motion`.',
    motion: {
      'grade-unit': {
        $type: 'duration',
        $value: { value: input.gradeUnit, unit: 'ms' },
        $description:
          'Milliseconds per 寸 of 材 height. A grade’s duration is its height (grade.N) times this unit.',
      },
      duration: {
        $type: 'duration',
        grade: Object.fromEntries(
          Object.entries(durations).map(([grade, ms]) => [
            grade,
            {
              $value: { value: ms, unit: 'ms' },
              $description: `Grade ${grade}: ${heights[grade]} 寸 × ${input.gradeUnit}ms. Parts of this grade move over this duration.`,
            },
          ]),
        ),
        hold: {
          $value: { value: input.bands.hold * durations['1']!, unit: 'ms' },
          $description: `Press-and-hold confirmation: ${input.bands.hold} grade-1 beats, one band per beat. Reduced motion keeps the safety delay and removes only fill travel.`,
          $extensions: { 'dev.zao.motion': { bands: input.bands.hold } },
        },
        impress: {
          $value: '{motion.duration.reveal}',
          $description: 'A seal impression inks onto an approved record.',
        },
      },
      easing: {
        $type: 'cubicBezier',
        'fold-enter': curve('enter'),
        'fold-exit': curve('exit'),
        hold: {
          $value: [0, 0, 1, 1],
          $description: `${input.bands.hold} hold bands land at the end of each beat.`,
          $extensions: {
            'dev.zao.motion': {
              css: `steps(${input.bands.hold}, jump-end)`,
              bands: input.bands.hold,
              jump: 'end',
            },
          },
        },
        impress: {
          $value: [0, 0, 1, 1],
          $description: `${input.bands.impress} impression bands land with the first at once.`,
          $extensions: {
            'dev.zao.motion': {
              css: `steps(${input.bands.impress}, jump-start)`,
              bands: input.bands.impress,
              jump: 'start',
            },
          },
        },
      },
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await mkdir(output, { recursive: true });
  for (const finish of Object.keys(motion) as Array<keyof typeof motion>) {
    await writeFile(
      new URL(`${finish}.generated.tokens.json`, output),
      JSON.stringify(motionDocument(finish), null, 2) + '\n',
    );
  }
  const fold = foldCurves(motion.su.rafters);
  console.log(
    `Motion written. 举折 ${motion.su.rafters} rafters\n  enter ${fold.enter.linear}\n  exit  ${fold.exit.linear}\n  fit   enter cubic-bezier(${fold.enter.cubic.join(', ')}), exit cubic-bezier(${fold.exit.cubic.join(', ')})`,
  );
}
