'use client';

import { useState } from 'react';
import { Copy, NavArrowRight, Plus } from 'iconoir-react';
import { Button, Menu, TextField } from '@zao/react';

/** The same button markup is used for the default finish and every CSS study. */
export function ButtonSpecimen() {
  const [demoState, setDemoState] = useState<'idle' | 'loading' | 'complete'>('idle');
  const [demoSubmissions, setDemoSubmissions] = useState(0);
  const [demoClicks, setDemoClicks] = useState(0);
  const loading = demoState === 'loading';

  return (
    <div data-zao-specimen="button" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="type-label font-medium">Emphasis</p>
        <div className="button-line flex flex-wrap items-center gap-2">
          <Button className="study-button is-primary">Save changes</Button>
          <Button variant="secondary" className="study-button is-secondary">
            Review details
          </Button>
          <Button variant="quiet" className="study-button is-quiet">
            Cancel
          </Button>
          <Button variant="danger" className="study-button is-danger">
            Delete workspace
          </Button>
          <Button className="study-button is-disabled" disabled>
            Unavailable
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="type-label font-medium">Size</p>
        <div className="button-line flex flex-wrap items-center gap-2">
          <Button
            size="small"
            className="study-button is-secondary"
            variant="secondary"
            leadingIcon={Copy}
          >
            Small
          </Button>
          <Button
            size="default"
            className="study-button is-secondary"
            variant="secondary"
            leadingIcon={Copy}
          >
            Default
          </Button>
          <Button
            size="large"
            className="study-button is-secondary"
            variant="secondary"
            leadingIcon={Copy}
          >
            Large
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="type-label font-medium">Icon content</p>
        <div className="button-line flex flex-wrap items-center gap-2">
          <Button variant="secondary" leadingIcon={Plus}>
            Create workspace
          </Button>
          <Button variant="secondary" trailingIcon={NavArrowRight}>
            Open report
          </Button>
          <Button variant="secondary" trailingAction={NavArrowRight}>
            Read guide
          </Button>
          <Button
            variant="secondary"
            leadingIcon={Copy}
            trailingIcon={NavArrowRight}
            trailingAction={NavArrowRight}
          >
            Export report
          </Button>
          <Menu
            trigger="More actions"
            items={[{ label: 'Review activity' }, { label: 'View workspace history' }]}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <p className="type-label font-medium">Width</p>
        <div data-zao-button-example="block" className="min-w-0">
          <Button variant="secondary" leadingIcon={Plus} trailingAction={NavArrowRight} block>
            Continue setup
          </Button>
        </div>
        <div className="button-line flex flex-wrap items-center gap-2">
          <Button variant="secondary">Review preferences</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="type-label font-medium">Loading</p>
        <div className="button-line flex flex-wrap items-center gap-2">
          <Button loading data-zao-button-example="loading-label">
            Save report
          </Button>
          <Button
            variant="secondary"
            leadingIcon={Plus}
            trailingIcon={Copy}
            trailingAction={NavArrowRight}
            loading
            data-zao-button-example="loading-leading"
          >
            Sync workspace
          </Button>
          <Button
            variant="quiet"
            trailingIcon={NavArrowRight}
            trailingAction={NavArrowRight}
            loading
            data-zao-button-example="loading-trailing"
          >
            Open summary
          </Button>
          <Button
            variant="danger"
            trailingAction={NavArrowRight}
            loading
            data-zao-button-example="loading-action"
          >
            Delete draft
          </Button>
          <Button
            variant="secondary"
            leadingIcon={Copy}
            disabled
            loading
            data-zao-button-example="loading-disabled"
          >
            Unavailable sync
          </Button>
        </div>
      </div>

      <form
        data-zao-button-demo="loading"
        data-demo-submissions={demoSubmissions}
        data-demo-clicks={demoClicks}
        className="flex min-w-0 flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (loading) return;
          setDemoSubmissions((count) => count + 1);
          setDemoState('loading');
        }}
      >
        <p className="type-label font-medium">Loading demo</p>
        <TextField label="Draft name" defaultValue="Workspace settings" />
        <div className="button-line flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            leadingIcon={Copy}
            loading={loading}
            loadingAnnouncement="Saving draft."
            onClick={() => setDemoClicks((count) => count + 1)}
          >
            Save draft
          </Button>
          <Button variant="secondary" disabled={!loading} onClick={() => setDemoState('complete')}>
            Complete demo
          </Button>
        </div>
        <p className="type-caption text-muted" role="status" aria-live="polite">
          {demoState === 'complete'
            ? 'Saved draft in the demo.'
            : 'This local demo does not save data.'}
        </p>
      </form>
    </div>
  );
}
