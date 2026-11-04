import type { Metadata } from 'next';
import { ColorTokens } from './color-tokens';

export const metadata: Metadata = { title: 'Color' };

export default function ColorPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="type-title">Color</h1>
        <p className="type-body text-muted">
          Use semantic tokens, never palette steps. The finish decides which palettes exist; the
          mode decides which step each role uses. Values below follow the finish and mode set in the
          header.
        </p>
      </header>
      <ColorTokens />
    </div>
  );
}
