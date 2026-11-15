// Builds option-sheet.html from the gates below and the captures in study/ (see study.mjs).
// Usage: node sheet.mjs
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const groups = [
  {
    title: 'The pigment',
    note: 'What azurite itself looks like. Every change here goes through palette.config.ts and the generator; the contrast promises hold for every candidate.',
    gates: [
      {
        id: 'Z1',
        title: 'Which azurite?',
        ask: 'Today’s ramp has a chroma of 0.10: at Button size it reads as a slate navy, and at hairline size (the Tabs line, a check, a chart square) it is close to ink. The candidates keep the lightness and raise the chroma or turn the hue.',
        reopens: 'The Oct 11 azurite inputs (V1).',
        lean: 'Mineral. It still reads as a pigment, and it stays blue on the small marks the other gates would add. Vivid starts to read as a product blue.',
        wide: true,
        views: ['buttonRow', 'tabsPrimary', 'switchOn', 'record'],
        options: [
          [
            'today',
            'Today',
            'Hue 261, chroma 0.10. Light #2c4c83, dark #8aafee. On canvas 8.1:1 and 8.5:1.',
          ],
          [
            'mineral',
            'Mineral',
            'Hue 259, chroma 0.13. Light #15448c, dark #72a5f5. On canvas 8.9:1 and 7.6:1.',
          ],
          [
            'vivid',
            'Vivid',
            'Hue 259, chroma 0.16. Light #00419b, dark #64a4ff. On canvas 9.0:1 and 7.5:1.',
          ],
          [
            'qing',
            'Qing 青',
            'Hue 245, chroma 0.12, toward blue-green. Light #005189, dark #65b2f1. On canvas 7.9:1 and 8.3:1.',
          ],
        ],
      },
      {
        id: 'Z2',
        title: 'The seal face in dark mode',
        ask: 'In dark mode the seal is a light blue face with an ink label, so it is a different color from light mode’s. The alternative keeps the deep pigment on the dark ground with a white label. Shown on the Mineral ramp.',
        reopens: 'The Oct 11 dark solid lightness (V1).',
        lean: 'Keep the light face. The deep face holds 3.4:1 on canvas and 3.1:1 on surface, which is enough for a Button but thin for a 2px Tabs line or a check.',
        modes: ['dark'],
        views: ['buttonRow', 'tabsPrimary', 'switchOn', 'record'],
        options: [
          ['light', 'Light face, ink label', 'Dark #72a5f5. On canvas 7.6:1; label 6.5:1.'],
          [
            'deep',
            'Deep face, white label',
            'Dark #3767b3. On canvas 3.4:1; label 5.6:1, 4.7:1 on hover.',
          ],
        ],
      },
    ],
  },
  {
    title: 'Components',
    note: 'Where the seal goes beyond the primary action, the Switch channel, the Tabs line and the approved record. Each is paint only: no size, target or motion changes.',
    gates: [
      {
        id: 'S1',
        title: 'The committed value in Select and Combobox',
        ask: 'The check beside the committed value is ink. It is a current selection, which the seal rule already covers.',
        reopens: 'Nothing. D8’s item fill and square corners stay.',
        lean: 'A.',
        views: ['selectOpen'],
        options: [
          ['today', 'Today', 'Ink check.'],
          ['a', 'A', 'The check takes the seal’s text role (5.8:1 or better on the popup).'],
        ],
      },
      {
        id: 'S2',
        title: 'Table selection',
        ask: 'A selected row has a neutral fill and an ink checkbox. Shown with two rows selected.',
        reopens: 'The Oct 6 Table refinement’s neutral bg-active selection, for B and C.',
        lean: 'A. The checkbox is the selection mark; a blue row fill puts the seal behind text and status glyphs. If you want the row to carry color, C sits better on the warm paper than B.',
        views: ['tableSelected'],
        options: [
          ['today', 'Today', 'Neutral row fill, ink checkbox.'],
          ['a', 'A', 'Checkbox in the seal. Row fill stays neutral.'],
          ['b', 'B', 'Checkbox in the seal, row in the seal’s subtle role (ramp step 3).'],
          ['c', 'C', 'Checkbox in the seal, row washed with the seal: 8% mixed into the surface.'],
        ],
      },
      {
        id: 'S3',
        title: 'Secondary Tabs: the selected face',
        ask: 'The sliding face is a neutral surface, so the header’s own Seal and mode switches show no seal. Primary Tabs already carry it on their line.',
        reopens: 'The Oct 7 Tabs approval’s neutral secondary face.',
        lean: 'Today, or A if you want it marked. B puts a second filled seal next to every primary Button.',
        views: ['headerSwitch', 'tabsSecondary'],
        options: [
          ['today', 'Today', 'Neutral face.'],
          ['a', 'A', 'The selected label takes the seal’s text role.'],
          ['b', 'B', 'The neutral face rests on seal planes.'],
          ['c', 'C', 'A seal face with the on-seal label.'],
        ],
      },
      {
        id: 'S4',
        title: 'Plan: the step in progress',
        ask: 'Every marker is ink. The running step is the plan’s current position.',
        reopens: 'CR17’s gauge inks, for B only.',
        lean: 'A. Finished steps are a record, so they stay ink; one mark carries the seal.',
        views: ['plan', 'planGauge'],
        options: [
          ['today', 'Today', 'Ink markers and gauge.'],
          ['a', 'A', 'The running step’s marker takes the seal.'],
          ['b', 'B', 'A, plus finished markers and their gauge ticks.'],
        ],
      },
      {
        id: 'S5',
        title: 'Progress: the reading',
        ask: 'Progress keeps ink under either seal, because a reading is data (finish plan rule 3). At 100% its frame takes the same ink (CR10). Meter uses the same face and would follow this choice.',
        reopens: 'Finish plan rule 3 for Progress, and the ink named in CR10.',
        lean: 'Today. A page with a primary Button and a Progress bar would otherwise show two filled seals, and the bar would read as an action.',
        views: ['progress'],
        options: [
          ['today', 'Today', 'Ink face in both seals.'],
          ['a', 'A', 'The face, its edge and the full frame take the active seal.'],
        ],
      },
      {
        id: 'S6',
        title: 'Focus',
        ask: 'Focus brackets and outlines are ink in both seals (V1c).',
        reopens: 'V1c.',
        lean: 'Today. Focus has to read on a seal face too, and ink does.',
        views: ['focusButton', 'focusField'],
        options: [
          ['today', 'Today', 'Ink brackets and outline.'],
          ['a', 'A', 'Brackets and outline in the seal.'],
        ],
      },
      {
        id: 'S7',
        title: 'Links',
        ask: 'Links are underlined ink (Oct 11). The seal has a text role that promises 4.5:1 and is unused.',
        reopens: 'The Oct 11 “links in ink” audit.',
        lean: 'Today. A is the cheapest way to put more azurite on a page, and also the fastest way to make it ordinary.',
        views: ['links'],
        options: [
          ['today', 'Today', 'Ink, underlined.'],
          ['a', 'A', 'The seal’s text role, underlined.'],
        ],
      },
    ],
  },
  {
    title: 'Charts',
    note: 'Docs-local. Today no chart carries the seal: the accent square, the lead series and every inspected mark are ink, and the guideline says data never carries it. References stay dashed and muted in every option.',
    gates: [
      {
        id: 'C1',
        title: 'How far the seal goes into a chart',
        ask: 'Four of the overview’s seven charts under each option: Ring, Share strip, Bar and Histogram. A returns the accent square to the accent role it was named for (DV2). B adds the one datum a chart is about. C gives the seal to all data ink.',
        reopens:
          'Guideline rule 4 (“data never carries the seal”) and the Oct 11 move of the accent square to ink.',
        lean: 'A. One square per chart is the value that matters most, which is what the seal means everywhere else. B makes the square redundant; C spends the seal on every mark.',
        wide: true,
        views: ['chartRing', 'chartShare', 'chartBar', 'chartHistogram'],
        options: [
          ['today', 'Today', 'Everything in ink.'],
          [
            'a',
            'A',
            'The accent square (and the heatmap’s brackets, the share strip’s chip) in the seal.',
          ],
          ['b', 'B', 'A, plus the emphasized datum: Bar’s lead bar and Share strip’s lead part.'],
          [
            'c',
            'C',
            'A, plus all data ink: ring marks, bins, the line, the heatmap ramp, the meter reading.',
          ],
        ],
      },
      {
        id: 'C2',
        title: 'The inspected or selected datum',
        ask: 'Bar with a datum under the pointer, and the prism form with one bar selected and another previewed.',
        reopens: 'P3’s ink face and neutral planes, for B.',
        lean: 'A. The square already follows the inspected datum. B is the bolder reading of “selection carries the seal”; its prism planes would step from the seal toward the canvas.',
        views: ['barInspected', 'prismSelected'],
        options: [
          ['today', 'Today', 'Ink datum, ink square.'],
          ['a', 'A', 'Seal square beside an ink datum.'],
          ['b', 'B', 'The datum itself in the seal.'],
        ],
      },
      {
        id: 'C3',
        title: 'Heatmap',
        ask: 'The ramp mixes ink into the canvas (pending DV3), and the current cell has ink corner brackets.',
        reopens: 'The DV3 ramp, for B.',
        lean: 'A. B is the one place where the seal as data is defensible, because a single-hue ramp is still one variable; it is the strongest “azurite in charts” candidate if you want one.',
        views: ['heatmap'],
        options: [
          ['today', 'Today', 'Ink ramp, ink brackets.'],
          ['a', 'A', 'Ink ramp, seal brackets.'],
          ['b', 'B', 'The ramp mixes the seal into the canvas; seal brackets.'],
        ],
      },
    ],
  },
  {
    title: 'Docs and landing',
    note: 'Docs-local.',
    gates: [
      {
        id: 'L1',
        title: 'The bracket set’s picked course',
        ask: 'On the landing hero, a picked course is ink while the others are ghosted, and its measure on the ruler is ink.',
        reopens: 'L14 and L17’s ink for the picked course.',
        lean: 'A. It is a selection, and it puts the seal in the hero figure only while the reader is touching it.',
        views: ['bracket'],
        options: [
          ['today', 'Today', 'Picked course in ink.'],
          ['a', 'A', 'Picked course and its ruler measure in the seal.'],
        ],
      },
      {
        id: 'L2',
        title: 'The Seal switch',
        ask: 'The header switch names the two seals but shows neither color.',
        reopens: 'Nothing.',
        lean: 'A.',
        views: ['sealSwitch'],
        options: [
          ['today', 'Today', 'Both characters in the label ink.'],
          ['a', 'A', '青 is set in azurite’s text role, whichever seal is active.'],
        ],
      },
    ],
  },
];

const esc = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const figure = (gate, [key, name, detail], mode) => {
  const images = gate.views
    .map((view) => `study/${gate.id}-${view}-${key}-${mode}.png`)
    .filter((file) => existsSync(here(`./${file}`)))
    .map(
      (file) =>
        `<button type="button" class="shot" aria-label="Enlarge ${esc(name)}, ${mode}"><img src="${file}" alt="${esc(`${gate.id} ${name}, ${mode}`)}" loading="lazy"></button>`,
    )
    .join('');
  return `<figure class="option"><figcaption><b>${esc(name)}</b><span>${esc(detail)}</span></figcaption><div class="shots" data-ground="${mode}">${images}</div></figure>`;
};
const gateHtml = (gate) => {
  const modes = gate.modes ?? ['light', 'dark'];
  const rows = modes
    .map(
      (mode) =>
        `<div class="mode"><h4>${mode === 'light' ? 'Light' : 'Dark'}</h4><div class="options${gate.wide ? ' wide' : ''}" style="--count:${gate.options.length}">${gate.options.map((option) => figure(gate, option, mode)).join('')}</div></div>`,
    )
    .join('');
  const picks = gate.options
    .map(
      ([key, name]) =>
        `<label><input type="radio" name="${gate.id}" id="${gate.id}-${key}" value="${esc(name)}"><span>${esc(name)}</span></label>`,
    )
    .join('');
  return `<section class="gate" id="${gate.id.toLowerCase()}">
  <header><span class="id">${gate.id}</span><h3>${esc(gate.title)}</h3></header>
  <p class="ask">${esc(gate.ask)}</p>
  <dl><div><dt>Reopens</dt><dd>${esc(gate.reopens)}</dd></div><div><dt>Lean</dt><dd>${esc(gate.lean)}</dd></div></dl>
  ${rows}
  <fieldset class="pick"><legend>Your choice for ${gate.id}</legend>${picks}</fieldset>
</section>`;
};

const html = `<title>Azurite option sheet</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap">
<style>
/* Layout: one ruled column, a drawing sheet. Each gate is a plate: question, then captures on
   their own light or dark ground, then the choice. */
:root {
  --paper: #fcf9f4; --surface: #fffdf9; --sunken: #f1ede5; --ink: #23201a; --muted: #69645c;
  --rule: #dad4ca; --rule-strong: #c3beb4; --seal: #15448c; --seal-on: #ffffff;
  --ground-light: #fcf9f4; --ground-dark: #13110e;
  --display: 'Newsreader', 'Iowan Old Style', Georgia, serif;
  --text: 'Geist', ui-sans-serif, system-ui, sans-serif;
  --mono: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --paper: #13110e; --surface: #1d1b16; --sunken: #0b0a08; --ink: #f2ede6; --muted: #a9a49b;
  --rule: #464239; --rule-strong: #5e5950; --seal: #72a5f5; --seal-on: #23201a; color-scheme: dark } }
:root[data-theme="dark"] {
  --paper: #13110e; --surface: #1d1b16; --sunken: #0b0a08; --ink: #f2ede6; --muted: #a9a49b;
  --rule: #464239; --rule-strong: #5e5950; --seal: #72a5f5; --seal-on: #23201a; color-scheme: dark }
body { background: var(--paper); color: var(--ink); font: 400 14px/1.5 var(--text); }
.sheet { max-width: 1240px; margin: 0 auto; padding-block: 40px 120px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));
  display: flex; flex-direction: column; gap: 56px; }
h1 { font: 400 40px/1.1 var(--display); letter-spacing: -0.01em; margin: 0; text-wrap: balance; }
h2 { font: 400 26px/1.2 var(--display); margin: 0; }
h3 { font: 600 17px/1.3 var(--text); margin: 0; }
h4 { font: 500 11px/1 var(--mono); letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin: 0; }
p { margin: 0; max-width: 68ch; text-wrap: pretty; }
.eyebrow { font: 400 12px/1 var(--mono); color: var(--muted); }
.lede { display: flex; flex-direction: column; gap: 16px; }
.lede p { color: var(--muted); font-size: 15px; }
.audit { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0; border-top: 1px solid var(--rule-strong); }
.audit > div { padding: 16px 16px 16px 0; border-bottom: 1px solid var(--rule); display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.audit b { font-weight: 600; }
.audit span { color: var(--muted); }
.group { display: flex; flex-direction: column; gap: 32px; }
.group > header { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--ink); padding-top: 16px; }
.group > header p { color: var(--muted); }
.gate { display: flex; flex-direction: column; gap: 16px; padding-top: 24px; border-top: 1px solid var(--rule); scroll-margin-top: 16px; }
.gate > header { display: flex; align-items: baseline; gap: 12px; }
.id { font: 500 12px/1 var(--mono); color: var(--seal-on); background: var(--seal); padding: 4px 6px; }
dl { margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px 32px; }
dl div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
dt { font: 500 11px/1.4 var(--mono); letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
dd { margin: 0; max-width: 60ch; }
.mode { display: flex; flex-direction: column; gap: 8px; }
.options { display: grid; grid-template-columns: repeat(var(--count), minmax(0, 1fr)); gap: 12px; }
.options.wide { grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (max-width: 760px) { .options, .options.wide { grid-template-columns: minmax(0, 1fr); } }
.option { margin: 0; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
figcaption { display: flex; flex-direction: column; gap: 2px; min-height: 3.6em; }
figcaption span { color: var(--muted); font-size: 12.5px; line-height: 1.4; }
.shots { display: flex; flex-direction: column; gap: 1px; border: 1px solid var(--rule-strong); flex: 1; }
.shots[data-ground="light"] { background: var(--ground-light); }
.shots[data-ground="dark"] { background: var(--ground-dark); }
.shot { all: unset; display: block; cursor: zoom-in; }
.shot:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.shot img { display: block; width: 100%; height: auto; }
.pick { border: 0; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.pick legend { float: left; margin-right: 12px; padding: 0; font: 500 11px/28px var(--mono); letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
.pick label { display: inline-flex; }
.pick input { position: absolute; opacity: 0; pointer-events: none; }
.pick span { display: block; padding: 4px 12px; border: 1px solid var(--rule-strong); background: var(--surface); cursor: pointer; line-height: 20px; }
.pick input:checked + span { background: var(--seal); border-color: var(--seal); color: var(--seal-on); }
.pick input:focus-visible + span { outline: 2px solid var(--ink); outline-offset: 2px; }
.tally { position: fixed; inset: auto 0 0 0; z-index: 5; background: var(--surface); border-top: 1px solid var(--rule-strong);
  padding-block: 10px calc(10px + env(safe-area-inset-bottom, 0px));
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.tally > div { max-width: 1240px; margin: 0 auto; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.tally output { flex: 1; min-width: 0; font: 400 12px/1.5 var(--mono); color: var(--muted); overflow-wrap: anywhere; }
.tally button { font: 500 14px/20px var(--text); padding: 6px 16px; border: 1px solid var(--seal); background: var(--seal); color: var(--seal-on); cursor: pointer; }
.tally button:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.viewer { position: fixed; inset: 0; z-index: 20; background: color-mix(in oklab, var(--paper) 88%, transparent); overflow: auto; padding: 24px; cursor: zoom-out; }
.viewer img { display: block; margin: 0 auto; max-width: none; width: min(100%, var(--natural)); border: 1px solid var(--rule-strong); }
ul.plain { margin: 0; padding-left: 18px; max-width: 68ch; color: var(--muted); display: flex; flex-direction: column; gap: 6px; }
</style>
<main class="sheet">
  <header class="lede">
    <span class="eyebrow">ZAO · Su 素 · azurite 青 · Nov 14, 2026</span>
    <h1>Azurite option sheet</h1>
    <p>What azurite looks like today, and ${groups.reduce((sum, group) => sum + group.gates.length, 0)} places it could change. Every picture is the built docs site under <code>data-zao-seal="azurite"</code>; the options are study CSS laid over the real parts, so nothing in the source has changed yet. Pick per gate, or say “leans” for any you want to leave to the lean.</p>
  </header>

  <section class="group">
    <header><h2>Azurite today</h2><p>Captured on every component page, every Charts page and the landing page, in light and dark.</p></header>
    <div class="audit">
      <div><b>Where it appears</b><span>Primary Button (with Composer’s Send and ApprovalGate’s approve), the Switch’s on channel, the primary Tabs line and fishtails, ApprovalGate’s impression and seal well, the docs nav’s current-page mark, and text selection.</span></div>
      <div><b>Where it is absent</b><span>Menu, Select, Combobox, TextField, Dialog, Table, Plan, Progress, Card, Conversation, secondary Tabs and all seven charts. Ten of sixteen component pages show azurite only in the nav.</span></div>
      <div><b>Where it reads weak</b><span>Chroma 0.10 reads as slate; on 2px marks it is close to ink. The dark face is a different, lighter blue. The subtle, border and text roles exist but only the Switch’s edge uses one.</span></div>
      <div><b>What already holds</b><span>Label contrast is 8.5:1 in light and 7.3:1 in dark; the face stands 8:1 off both grounds; planes step toward black from the seal face in both modes; focus is ink.</span></div>
    </div>
    <ul class="plain">
      <li><b>One fix, not a gate.</b> On the ApprovalGate page the “Ink seal record” specimens turn azurite when the page’s seal is azurite, so both columns look the same. They will be pinned to ink.</li>
      <li><b>Not proposed.</b> Status colors, Card, Dialog, Message, the Composer tray, chart references and loading drawings stay as they are in every option.</li>
    </ul>
  </section>

  ${groups
    .map(
      (group) =>
        `<section class="group"><header><h2>${esc(group.title)}</h2><p>${esc(group.note)}</p></header>${group.gates.map(gateHtml).join('\n')}</section>`,
    )
    .join('\n')}
</main>
<div class="tally"><div><output id="tally" for="">No choices yet.</output><button type="button" id="copy">Copy choices</button></div></div>
<div class="viewer" id="viewer" hidden><img id="viewer-image" alt=""></div>
<script>
  const ids = ${JSON.stringify(groups.flatMap((group) => group.gates.map((gate) => gate.id)))};
  const tally = document.getElementById('tally');
  const summary = () => ids.map((id) => {
    const picked = document.querySelector('input[name="' + id + '"]:checked');
    return picked ? id + ': ' + picked.value : null;
  }).filter(Boolean).join('; ');
  const refresh = () => {
    const text = summary();
    tally.textContent = text || 'No choices yet.';
    try { localStorage.setItem('azurite-choices', JSON.stringify(Object.fromEntries(ids.map((id) => [id, document.querySelector('input[name="' + id + '"]:checked')?.id ?? null])))); } catch {}
  };
  try {
    const saved = JSON.parse(localStorage.getItem('azurite-choices') ?? '{}');
    for (const id of Object.values(saved)) if (id) { const input = document.getElementById(id); if (input) input.checked = true; }
  } catch {}
  document.addEventListener('change', refresh);
  refresh();
  const copy = document.getElementById('copy');
  copy.addEventListener('click', async () => {
    const text = summary() || 'No choices yet.';
    try { await navigator.clipboard.writeText(text); copy.textContent = 'Copied choices'; }
    catch { const range = document.createRange(); range.selectNodeContents(tally); getSelection().removeAllRanges(); getSelection().addRange(range); copy.textContent = 'Selected: copy it'; }
    setTimeout(() => { copy.textContent = 'Copy choices'; }, 2000);
  });
  const viewer = document.getElementById('viewer');
  const viewerImage = document.getElementById('viewer-image');
  document.addEventListener('click', (event) => {
    const shot = event.target.closest('.shot');
    if (shot) {
      const image = shot.querySelector('img');
      viewerImage.src = image.src;
      viewerImage.style.setProperty('--natural', image.naturalWidth / 2 + 'px');
      viewer.hidden = false;
    } else if (!viewer.hidden) viewer.hidden = true;
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') viewer.hidden = true; });
</script>
`;
writeFileSync(here('./option-sheet.html'), html);
console.log('option-sheet.html written');
