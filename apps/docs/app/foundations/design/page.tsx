import type { Metadata } from 'next';
import { connection } from 'next/server';
import { DesignNotes } from '@/components/design-notes';
import { getQuietInstrumentStudy } from '@/lib/style-studies';

export const metadata: Metadata = { title: 'Design notes' };

export default async function DesignPage() {
  await connection();
  const study = await getQuietInstrumentStudy();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="type-title">Design notes</h1>
        <p className="type-body text-muted">
          Quiet instrument is the chosen direction for Su. Read its intent, component decisions, and
          what to judge as the style develops.
        </p>
      </header>

      {study ? (
        <DesignNotes markdown={study.designMarkdown} />
      ) : (
        <p className="type-body text-muted">Quiet instrument design notes are unavailable.</p>
      )}
    </div>
  );
}
