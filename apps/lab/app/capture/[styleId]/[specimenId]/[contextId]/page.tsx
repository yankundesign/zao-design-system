import { notFound } from 'next/navigation';
import { baselineStyles } from '@zao/engine';
import { resolveExtraCss } from '@/lib/extra-css';
import { listFontFiles } from '@/lib/fonts-server';
import { listStyleFiles } from '@/lib/styles-server';
import { isContextId, renderVariables } from '@/lib/token-data';
import { CaptureExtraCss } from './capture-extra-css';
import { CaptureSpecimen } from './capture-specimen';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ styleId: string; specimenId: string; contextId: string }>;
}

export default async function CapturePage({ params }: Props) {
  if (process.env.NODE_ENV !== 'development') notFound();
  const { styleId, specimenId, contextId } = await params;
  if (!isContextId(contextId)) notFound();
  const [styles, fontFiles] = await Promise.all([listStyleFiles(), listFontFiles()]);
  const baseline = baselineStyles();
  const style = styles.find((entry) => entry.id === styleId) ?? baseline[styleId as 'su' | 'yu'];
  if (!style) notFound();
  const variables = renderVariables(style, contextId, styles);
  const library = { ...baseline, ...Object.fromEntries(styles.map((entry) => [entry.id, entry])) };
  const extraCss = resolveExtraCss(style, library).css;
  const [theme, mode] = contextId.split('-') as ['su' | 'yu', 'light' | 'dark'];
  const localFontFaces = fontFiles
    .map((font) => {
      const family = font.name.replace(/\.(woff2?|otf|ttf)$/i, '');
      return (
        '@font-face { font-family: "' +
        family +
        '"; src: url("' +
        font.url +
        '"); font-display: swap; }'
      );
    })
    .join('\n');

  return (
    <>
      {localFontFaces ? <style>{localFontFaces}</style> : null}
      <main
        data-lab-island="capture"
        data-zao-theme={theme}
        data-zao-mode={mode}
        className="lab-island"
        style={{
          ...(variables as React.CSSProperties),
          colorScheme: mode,
          width: '960px',
          minHeight: '640px',
        }}
      >
        <CaptureExtraCss source={extraCss} />
        <CaptureSpecimen id={specimenId} />
      </main>
    </>
  );
}
