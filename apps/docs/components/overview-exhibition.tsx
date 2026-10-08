'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Settings } from 'iconoir-react';
import { Button, IconButton, Menu, Switch, Tabs, finish } from '@zao/react';
import { CardSpecimen } from './component-specimens';
import { useFinish } from './use-finish';

const documentLink =
  'inline-flex min-h-6 items-center type-caption text-muted underline underline-offset-2 outline-focus hover:text-default focus-visible:outline-2 focus-visible:outline-offset-2';

/** A local sample connects existing controls without introducing component interactions. */
export function OverviewExhibition({
  quietStudy,
}: {
  quietStudy: { title: string; cssUrl: string } | null;
}) {
  const { theme, resolved } = useFinish();
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [savedEmailUpdates, setSavedEmailUpdates] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const settingsControl = useRef<HTMLElement>(null);
  const cardContainer = useRef<HTMLDivElement>(null);
  const activeStyle = quietStudy ? 'quiet-instrument' : 'baseline';

  function reviewSettings() {
    settingsControl.current?.focus();
  }

  function inspectStorage() {
    cardContainer.current
      ?.querySelector<HTMLButtonElement>('[aria-label="Inspect used capacity"]')
      ?.focus();
  }

  function saveChanges() {
    setSavedEmailUpdates(emailUpdates);
    setAnnouncement(`Saved email updates: ${emailUpdates ? 'on' : 'off'}.`);
  }

  function resetChanges() {
    setEmailUpdates(savedEmailUpdates);
    setAnnouncement('Reset changes.');
  }

  function resetDefaults() {
    setEmailUpdates(true);
    setSavedEmailUpdates(true);
    setAnnouncement('Reset defaults.');
  }

  return (
    <section data-zao-overview-exhibition aria-label="Working exhibition">
      {quietStudy ? <link rel="stylesheet" href={quietStudy.cssUrl} /> : null}
      <div
        {...finish(theme, resolved)}
        data-study={activeStyle}
        className="study flex min-w-0 flex-col gap-6 bg-canvas text-default"
      >
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="type-label">Card · Storage study</h2>
            <p className="type-caption text-muted">
              {quietStudy
                ? `${quietStudy.title} · Local Su study · Sample data`
                : 'ZAO baseline · Sample data'}
            </p>
          </div>
          <div ref={cardContainer} className="min-w-0 [&_button]:scroll-mt-20">
            <CardSpecimen
              recordStatus="Sample"
              actions={
                <>
                  <Button variant="secondary" onClick={reviewSettings}>
                    Review settings
                  </Button>
                  <Button onClick={inspectStorage}>Inspect storage</Button>
                </>
              }
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link className={documentLink} href="/components/card">
              Card
            </Link>
            <Link className={documentLink} href="/foundations/data-visualization">
              Data visualization
            </Link>
          </div>
        </div>

        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <section
            aria-labelledby="overview-actions-heading"
            className="flex min-w-0 flex-col gap-4 border-t border-subtle pt-4"
          >
            <h2 id="overview-actions-heading" className="type-label text-muted">
              Actions
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={saveChanges}>Save changes</Button>
              <Button variant="secondary" onClick={resetChanges}>
                Reset changes
              </Button>
              <IconButton icon={Settings} aria-label="Review settings" onClick={reviewSettings} />
            </div>
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="min-h-6 type-caption text-muted"
            >
              {announcement}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Link className={documentLink} href="/components/button">
                Button
              </Link>
              <Link className={documentLink} href="/components/icon-button">
                IconButton
              </Link>
            </div>
          </section>

          <section
            aria-labelledby="overview-navigation-heading"
            className="flex min-w-0 flex-col gap-4 border-t border-subtle pt-4 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            <h2 id="overview-navigation-heading" className="type-label text-muted">
              Navigation
            </h2>
            <Tabs.Root defaultValue="summary">
              <Tabs.List aria-label="Sample workspace views">
                <Tabs.Tab value="summary">Summary</Tabs.Tab>
                <Tabs.Tab value="members">Members</Tabs.Tab>
                <Tabs.Tab value="settings">Settings</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="summary" aria-label="Summary" className="min-h-20">
                <h3 className="type-heading">North workspace</h3>
                <p className="mt-2 type-body text-muted">Operational</p>
              </Tabs.Panel>
              <Tabs.Panel value="members" aria-label="Members" className="min-h-20">
                <h3 className="type-heading">Workspace members</h3>
                <p className="mt-2 type-body text-muted">12 active members</p>
              </Tabs.Panel>
              <Tabs.Panel value="settings" aria-label="Settings" className="min-h-20">
                <h3 className="type-heading">Workspace settings</h3>
                <p className="mt-2 type-body text-muted">
                  Email updates are {emailUpdates ? 'on' : 'off'}.
                </p>
              </Tabs.Panel>
            </Tabs.Root>
            <Link className={documentLink} href="/components/tabs">
              Tabs
            </Link>
          </section>

          <section
            aria-labelledby="overview-settings-heading"
            className="flex min-w-0 flex-col gap-4 border-t border-subtle pt-4 lg:col-start-1 lg:row-start-2"
          >
            <h2 id="overview-settings-heading" className="type-label text-muted">
              Settings
            </h2>
            <label className="flex min-h-6 cursor-pointer items-center justify-between gap-4">
              <span className="type-body">Email updates</span>
              <Switch
                ref={settingsControl}
                checked={emailUpdates}
                onCheckedChange={setEmailUpdates}
                className="scroll-mt-20"
              />
            </label>
            <Menu
              trigger="Workspace actions"
              items={[
                { label: 'Reset changes', onSelect: resetChanges },
                { label: 'Reset defaults', onSelect: resetDefaults },
                { separator: true },
                { label: 'Archive workspace', disabled: true },
              ]}
            />
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Link className={documentLink} href="/components/switch">
                Switch
              </Link>
              <Link className={documentLink} href="/components/menu">
                Menu
              </Link>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
