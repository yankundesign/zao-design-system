/**
 * Records each Gallery plate as a looping GIF and an MP4, with real pointer and keyboard input.
 *
 *   node apps/docs/scripts/record-gallery.ts [--set components|charts] [--plates button,switch]
 *     [--modes light,dark] [--base http://localhost:3000] [--out output/gallery] [--scale 2]
 *     [--bare] [--grid]
 *
 * `--set charts` records `/gallery/charts` at 640 by 480 into `output/gallery/charts`. `--grid`
 * also lays every recorded plate out on one sheet, in plate order, as `all-<count>`.
 *
 * Needs the docs server running (`pnpm dev`) and ffmpeg on the PATH. Frames come from Chrome's
 * screencast, so each one is a real paint at the moment it happened; ffmpeg holds every frame
 * for its measured duration, then encodes.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const args = new Map<string, string>();
for (let index = 2; index < process.argv.length; index++) {
  const flag = process.argv[index]!;
  if (!flag.startsWith('--')) continue;
  const next = process.argv[index + 1];
  args.set(flag.slice(2), next && !next.startsWith('--') ? (index++, next) : '');
}

const set = args.get('set') || 'components';
if (set !== 'components' && set !== 'charts') throw new Error(`Unknown set ${set}`);
const charts = set === 'charts';
const base = args.get('base') || 'http://localhost:3000';
const path = charts ? '/gallery/charts' : '/gallery';
const out = resolve(args.get('out') || (charts ? 'output/gallery/charts' : 'output/gallery'));
/** Both sets encode at 960 by 720. */
const scale = Number(args.get('scale') || (charts ? 1.5 : 2));
const bare = args.has('bare');
const modes = (args.get('modes') || 'light').split(',') as ('light' | 'dark')[];
/** The plate's CSS size: 4:3, the shape of a slide's grid cell. Charts need the larger plate. */
const width = charts ? 640 : 480;
const height = charts ? 480 : 360;

type Point = { x: number; y: number };
/** Where the pointer rests between gestures, so each loop starts and ends on the same frame. */
const rest: Point = { x: width - 30, y: height - 32 };

class Hand {
  at: Point = rest;
  page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  async park() {
    await this.page.mouse.move(rest.x, rest.y);
    this.at = rest;
  }

  /** An ease-in-out glide, one pointer event per frame. */
  async glide(to: Point | Locator, ms = 560) {
    const target = 'x' in to ? to : await centre(to);
    const from = this.at;
    const steps = Math.max(1, Math.round(ms / 16));
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
      await this.page.mouse.move(
        from.x + (target.x - from.x) * eased,
        from.y + (target.y - from.y) * eased,
      );
      await sleep(16);
    }
    this.at = target;
  }

  async press(hold = 150) {
    await this.page.mouse.down();
    await sleep(hold);
    await this.page.mouse.up();
  }

  async key(key: string, hold = 90) {
    await this.page.keyboard.down(key);
    await sleep(hold);
    await this.page.keyboard.up(key);
  }
}

async function centre(locator: Locator): Promise<Point> {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`No box for ${locator}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

type Script = (page: Page, hand: Hand) => Promise<void>;

/** One gesture script per plate. Each returns the plate to the state it started in when it can. */
const scripts: Record<string, Script> = {
  async button(page, hand) {
    const save = page.getByRole('button', { name: 'Save draft' });
    const approve = page.getByRole('button', { name: 'Approve 3 changes' });
    await sleep(500);
    await hand.glide(save, 620);
    await sleep(520);
    await hand.press(180);
    await sleep(380);
    await hand.glide(approve, 480);
    await sleep(480);
    await hand.press(220);
    await sleep(420);
    await hand.glide(rest, 620);
    await sleep(320);
    await hand.key('Tab');
    await sleep(760);
    await hand.key('Tab');
    await sleep(620);
    await hand.key(' ', 200);
    await sleep(520);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await sleep(700);
  },

  async switch(page, hand) {
    const email = page.getByRole('switch', { name: 'Email updates' });
    const alerts = page.getByRole('switch', { name: 'Activity alerts' });
    await sleep(500);
    await hand.glide(alerts, 620);
    await sleep(380);
    await hand.press(170);
    await sleep(640);
    await hand.glide(email, 420);
    await sleep(300);
    await hand.press(110);
    await sleep(70);
    await hand.press(110);
    await sleep(700);
    await hand.glide(alerts, 420);
    await sleep(260);
    await hand.press(150);
    await sleep(560);
    await hand.glide(rest, 620);
    await sleep(600);
  },

  async tabs(page, hand) {
    const tab = (name: string) => page.getByRole('tab', { name, exact: true });
    await sleep(500);
    await hand.glide(tab('Activity'), 620);
    await sleep(420);
    await hand.press(170);
    await sleep(560);
    await hand.glide(tab('Members'), 420);
    await sleep(300);
    await hand.press(150);
    await sleep(560);
    await hand.glide(tab('Month'), 520);
    await sleep(300);
    await hand.press(150);
    await sleep(520);
    await hand.glide(tab('Day'), 460);
    await sleep(240);
    await hand.press(140);
    await sleep(420);
    await hand.glide(tab('Overview'), 520);
    await sleep(240);
    await hand.press(140);
    await sleep(480);
    await hand.glide(rest, 560);
    await sleep(500);
  },

  async menu(page, hand) {
    const item = (name: string) => page.getByRole('menuitem', { name });
    await sleep(500);
    await hand.glide(page.getByRole('button', { name: 'Workspace actions' }), 620);
    await sleep(420);
    await hand.press(150);
    await sleep(700);
    await hand.glide(await centre(item('Rename workspace')), 420);
    await sleep(360);
    await hand.glide(await centre(item('Copy workspace ID')), 260);
    await sleep(360);
    await hand.glide(await centre(item('Archive workspace')), 260);
    await sleep(420);
    await hand.glide(await centre(item('Copy workspace ID')), 260);
    await sleep(300);
    await hand.press(140);
    await sleep(900);
    await hand.glide(rest, 620);
    await sleep(700);
  },

  async composer(page, hand) {
    const draft = page.locator('[data-zao-component="composer"] textarea');
    await sleep(500);
    await hand.glide(draft, 640);
    await hand.press(110);
    await sleep(260);
    await page.keyboard.type('Summarize this week’s access changes.', { delay: 38 });
    await sleep(420);
    const attach = page.getByRole('button', { name: 'Attach files' });
    await hand.glide(attach, 460);
    await sleep(240);
    const chooser = page.waitForEvent('filechooser');
    await hand.press(130);
    await (
      await chooser
    ).setFiles({
      name: 'access-report.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n'),
    });
    await sleep(760);
    await hand.glide(page.getByRole('button', { name: 'Send' }), 520);
    await sleep(380);
    await hand.press(170);
    await sleep(2300);
    await hand.glide(rest, 620);
    await sleep(900);
  },

  async plan() {
    await sleep(7200);
  },

  async 'approval-gate'(page, hand) {
    await sleep(600);
    await hand.glide(page.getByRole('button', { name: 'Approve removal' }), 680);
    await sleep(520);
    await hand.press(180);
    await sleep(1400);
    await hand.glide(rest, 700);
    await sleep(1600);
  },

  async ring(page, hand) {
    await sleep(2200);
    const chart = await page.locator('[data-zao-slot="storage-chart"]').boundingBox();
    if (!chart) throw new Error('No ring');
    const cx = chart.x + chart.width / 2;
    const cy = chart.y + chart.height / 2;
    // The marks sit between radius 60 and 76 of the 160-unit drawing.
    const at = (percent: number) => {
      const angle = ((percent * 3.6 - 90) * Math.PI) / 180;
      const radius = (68 / 160) * chart.width;
      return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
    };
    await hand.glide(at(30), 700);
    await sleep(900);
    for (const percent of [42, 54, 66, 76, 86]) await hand.glide(at(percent), 140);
    await sleep(1000);
    await hand.glide(rest, 640);
    await sleep(800);
  },
};

/** A datum's control, aimed a little below its middle, where bars and samples are drawn. */
async function datum(page: Page, index: number): Promise<Point> {
  const box = await page.locator('[data-zao-slot="chart-datum"]').nth(index).boundingBox();
  if (!box) throw new Error(`No datum ${index}`);
  return { x: box.x + box.width / 2, y: box.y + box.height * 0.62 };
}

/** Steps through data with a pause on each: [index, glide ms, pause ms]. */
async function visit(
  page: Page,
  hand: Hand,
  stops: readonly (readonly [number, number, number])[],
) {
  for (const [index, ms, pause] of stops) {
    await hand.glide(await datum(page, index), ms);
    await sleep(pause);
  }
}

/**
 * One gesture script per chart plate. Every plate arrives as its drawing and builds, so each
 * script waits that out first, and each ends at rest with nothing selected.
 */
const chartScripts: Record<string, Script> = {
  async 'bar-prism'(page, hand) {
    await sleep(1900);
    await visit(page, hand, [
      [0, 620, 520],
      [1, 320, 360],
      [2, 320, 460],
      [3, 320, 420],
    ]);
    // A click keeps apac raised while the pointer looks at the others.
    await hand.press(160);
    await sleep(520);
    await visit(page, hand, [
      [4, 360, 420],
      [5, 320, 560],
      [3, 520, 320],
    ]);
    await hand.press(140);
    await sleep(420);
    await hand.glide(rest, 620);
    await sleep(600);
  },

  async ring(page, hand) {
    await scripts.ring!(page, hand);
    // Then the region controls: select one region, then the other, then clear.
    const region = (name: string) =>
      page.getByRole('button', { name: `Inspect ${name} capacity`, exact: true });
    await hand.glide(region('available'), 620);
    await sleep(300);
    await hand.press(150);
    await sleep(1000);
    await hand.glide(region('used'), 380);
    await sleep(300);
    await hand.press(150);
    await sleep(1000);
    await hand.press(150);
    await sleep(500);
    await hand.glide(rest, 620);
    await sleep(600);
  },

  async line(page, hand) {
    await sleep(1900);
    await visit(page, hand, [
      [4, 640, 300],
      // The deploy at −5 h: the readout names it.
      [37, 2600, 1100],
      [47, 700, 800],
    ]);
    await hand.glide(rest, 640);
    await sleep(600);
  },

  async heatmap(page, hand) {
    const cell = (day: number, hour: number) =>
      centre(page.locator('[data-zao-slot="chart-datum"]').nth(day * 24 + hour));
    await sleep(1900);
    await hand.glide(await cell(1, 7), 640);
    await sleep(400);
    await hand.glide(await cell(1, 16), 1500);
    await sleep(500);
    // The current hour, then the rest of the week with no data yet.
    await hand.glide(await cell(4, 15), 700);
    await sleep(900);
    await hand.glide(await cell(4, 20), 600);
    await sleep(700);
    await hand.glide(rest, 640);
    await sleep(600);
  },

  async histogram(page, hand) {
    const box = await page.locator('.chart-plot').first().boundingBox();
    if (!box) throw new Error('No histogram');
    const minute = (value: number) => ({
      x: box.x + 8 + (value / 60) * (box.width - 16),
      y: box.y + box.height * 0.62,
    });
    await sleep(1900);
    await hand.glide(minute(3), 640);
    await sleep(300);
    await hand.glide(minute(36), 3000);
    await sleep(700);
    await hand.glide(minute(11.25), 900);
    await sleep(900);
    await hand.glide(rest, 640);
    await sleep(600);
  },

  async bar(page, hand) {
    await sleep(1900);
    await visit(page, hand, [
      [0, 620, 520],
      [1, 320, 380],
      [2, 320, 520],
      [3, 320, 380],
      [4, 320, 380],
      [5, 320, 600],
    ]);
    await hand.glide(rest, 640);
    await sleep(700);
  },
};

/** These plates start from their own arrival, so the hand stays out of frame. */
const handless = new Set(['plan']);

async function record(page: Page, id: string, dir: string) {
  const frames: { file: string; at: number }[] = [];
  const writes: Promise<void>[] = [];
  const cdp = await page.context().newCDPSession(page);

  const hand = new Hand(page);
  if (!handless.has(id)) await hand.park();
  await page.evaluate(() => window.__galleryReplay?.());
  await sleep(60);

  // Chrome's screencast paints at CSS size; a clip-scaled capture renders at device size. Each
  // frame is stamped at the middle of its capture.
  let capturing = true;
  const capture = (async () => {
    while (capturing) {
      const asked = performance.now();
      const { data } = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        optimizeForSpeed: true,
        clip: { x: 0, y: 0, width, height, scale },
      });
      const file = join(dir, `${String(frames.length).padStart(5, '0')}.png`);
      frames.push({ file, at: (asked + performance.now()) / 2000 });
      writes.push(writeFile(file, Buffer.from(data, 'base64')));
    }
  })();
  const started = performance.now() / 1000;
  await active[id]!(page, hand);
  capturing = false;
  await capture;
  const ended = performance.now() / 1000;
  await Promise.all(writes);
  await cdp.detach();
  if (frames.length === 0) throw new Error(`${id}: no frames`);

  const lines: string[] = [];
  frames.forEach((frame, index) => {
    const next = frames[index + 1]?.at ?? ended;
    lines.push(`file '${frame.file}'`, `duration ${Math.max(0.001, next - frame.at).toFixed(4)}`);
  });
  lines.push(`file '${frames.at(-1)!.file}'`);
  const list = join(dir, 'frames.txt');
  await writeFile(list, `${lines.join('\n')}\n`);
  return { list, frames: frames.length, seconds: ended - started };
}

function encode(list: string, target: string) {
  const input = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list];
  execFileSync('ffmpeg', [
    ...input,
    '-vf',
    'fps=30,format=yuv420p',
    '-c:v',
    'libx264',
    '-crf',
    '14',
    '-preset',
    'slow',
    '-movflags',
    '+faststart',
    `${target}.mp4`,
  ]);
  execFileSync('ffmpeg', [
    ...input,
    '-vf',
    'fps=30,split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=none:diff_mode=rectangle',
    '-loop',
    '0',
    `${target}.gif`,
  ]);
}

/**
 * Lays the plates out on one sheet in plate order, three or four across on a 1920px canvas in the
 * page's canvas color. Shorter plates hold their last frame until the longest ends.
 */
function grid(files: readonly string[], target: string, background: string) {
  const columns = files.length <= 6 ? 3 : 4;
  const gap = 30;
  const canvas = 1920;
  const tileWidth = Math.floor((canvas - (columns + 1) * gap) / columns / 2) * 2;
  const tileHeight = Math.round((tileWidth * 3) / 4 / 2) * 2;
  const rows = Math.ceil(files.length / columns);
  const sheetHeight = rows * tileHeight + (rows + 1) * gap;
  const durations = files.map((file) =>
    Number(
      execFileSync('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=nw=1:nk=1',
        file,
      ]).toString(),
    ),
  );
  const longest = Math.max(...durations);
  const filters = files.map(
    (_, index) =>
      `[${index}:v]fps=25,scale=${tileWidth}:${tileHeight}:flags=lanczos,` +
      `tpad=stop_mode=clone:stop_duration=${(longest - durations[index]! + 0.1).toFixed(3)}[t${index}]`,
  );
  filters.push(`color=c=${background}:s=${canvas}x${sheetHeight}:r=25:d=${longest.toFixed(3)}[s0]`);
  files.forEach((_, index) => {
    const x = gap + (index % columns) * (tileWidth + gap);
    const y = gap + Math.floor(index / columns) * (tileHeight + gap);
    filters.push(`[s${index}][t${index}]overlay=${x}:${y}[s${index + 1}]`);
  });
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    ...files.flatMap((file) => ['-i', file]),
    '-filter_complex',
    filters.join(';'),
    '-map',
    `[s${files.length}]`,
    '-c:v',
    'libx264',
    '-crf',
    '14',
    '-preset',
    'slow',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    `${target}.mp4`,
  ]);
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-i',
    `${target}.mp4`,
    '-vf',
    'fps=25,split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=none:diff_mode=rectangle',
    '-loop',
    '0',
    `${target}.gif`,
  ]);
}

/** The canvas color behind the plates, as ffmpeg's 0xRRGGBB. */
async function canvasColor(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.background = 'var(--zao-color-bg-canvas)';
    document.querySelector('.gallery')!.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const context = document.createElement('canvas').getContext('2d')!;
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
    return `0x${[red, green, blue].map((value) => value!.toString(16).padStart(2, '0')).join('')}`;
  });
}

const counts: Record<number, string> = { 6: 'six', 8: 'eight' };
const active = charts ? chartScripts : scripts;
const all = Object.keys(active);
const selected = args.get('plates')?.split(',') ?? all;
const browser = await chromium.launch();
try {
  for (const mode of modes) {
    await mkdir(join(out, mode), { recursive: true });
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: scale,
      colorScheme: mode,
      reducedMotion: 'no-preference',
    });
    const page = await context.newPage();
    const recorded: string[] = [];
    let background = '';
    for (const id of selected) {
      if (!active[id]) throw new Error(`Unknown plate ${id}; use ${all.join(', ')}`);
      await page.goto(`${base}${path}?plate=${id}&record${bare ? '&bare' : ''}`);
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
      await page.locator('[data-gallery-ready]').waitFor();
      await sleep(600);
      background ||= await canvasColor(page);
      const dir = await mkdtemp(join(tmpdir(), `gallery-${id}-`));
      const { list, frames, seconds } = await record(page, id, dir);
      const name = `${String(all.indexOf(id) + 1).padStart(2, '0')}-${id}`;
      encode(list, join(out, mode, name));
      recorded.push(`${join(out, mode, name)}.mp4`);
      await rm(dir, { recursive: true, force: true });
      console.log(`${mode}/${name}: ${frames} frames, ${seconds.toFixed(1)}s`);
    }
    if (args.has('grid') && recorded.length > 1) {
      const name = `all-${counts[recorded.length] ?? recorded.length}`;
      grid(recorded, join(out, mode, name), background);
      console.log(`${mode}/${name}: ${recorded.length} plates`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
