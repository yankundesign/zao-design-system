'use client';

import { useState } from 'react';
import { Check, Copy } from 'iconoir-react';
import { Button, IconButton } from '@zao/react';

/**
 * The result on the face (component review, CR1): once the host knows the outcome, the face
 * stays seated for one Hold beat and reads it, then lifts and shows the action again.
 */
export function ButtonResultSpecimen() {
  const [copied, setCopied] = useState(false);
  const [iconCopied, setIconCopied] = useState(false);
  const [save, setSave] = useState<'idle' | 'saving' | 'saved'>('idle');

  return (
    <div data-zao-specimen="button-result" className="flex flex-col gap-3">
      <p className="type-label font-medium">Result</p>
      <div className="button-line flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          result={copied ? 'Copied' : null}
          resultAnnouncement="Copied response"
          onResultEnd={() => setCopied(false)}
          onClick={() => setCopied(true)}
        >
          Copy response
        </Button>
        <IconButton
          icon={Copy}
          aria-label="Copy link"
          variant="quiet"
          result={iconCopied ? 'Copied link' : null}
          resultIcon={Check}
          onResultEnd={() => setIconCopied(false)}
          onClick={() => setIconCopied(true)}
        />
        <Button
          loading={save === 'saving'}
          loadingAnnouncement="Saving changes"
          result={save === 'saved' ? 'Saved' : null}
          resultAnnouncement="Saved changes"
          onResultEnd={() => setSave('idle')}
          onClick={() => {
            setSave('saving');
            window.setTimeout(() => setSave('saved'), 900);
          }}
        >
          Save changes
        </Button>
      </div>
      <p className="type-caption text-muted">
        Press an action. The face stays seated while it reads the result, then lifts. This local
        demo copies and saves nothing.
      </p>
    </div>
  );
}
