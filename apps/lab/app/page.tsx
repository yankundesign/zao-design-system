import { baselineStyles } from '@zao/engine';
import { LabShell } from './lab-shell';
import { frozenShellVariables } from '@/lib/frozen-shell';
import { listStyleFiles } from '@/lib/styles-server';
import { listFontFiles } from '@/lib/fonts-server';
import { baselineParameters, contexts, renderAllContexts } from '@/lib/token-data';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let styles: Awaited<ReturnType<typeof listStyleFiles>> = [];
  let libraryError = '';
  let fontFiles: Awaited<ReturnType<typeof listFontFiles>> = [];
  if (process.env.NODE_ENV === 'development') {
    try {
      styles = await listStyleFiles();
      fontFiles = await listFontFiles();
    } catch (error) {
      libraryError = error instanceof Error ? error.message : 'Could not read saved styles.';
    }
  }
  return (
    <LabShell
      initialStyles={styles}
      initialLibraryError={libraryError}
      baselineVars={renderAllContexts(baselineStyles().su)}
      baselineParams={
        Object.fromEntries(
          contexts.map((context) => [context.id, baselineParameters(context.id)]),
        ) as Record<(typeof contexts)[number]['id'], Record<string, unknown>>
      }
      fontFiles={fontFiles}
      shellVars={frozenShellVariables}
    />
  );
}
