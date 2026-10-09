'use client';

import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Copy, Plus, Search, Settings, Trash } from 'iconoir-react';
import type { ButtonSize } from '@zao/react';
import { StorageRingStudy } from './storage-ring-study';
import {
  Button,
  Card,
  Combobox,
  Dialog,
  IconButton,
  Menu,
  Progress,
  Select,
  Switch,
  Tabs,
  TextField,
} from '@zao/react';

/** The same button markup is used for the default finish and every CSS study. */
export function ButtonSpecimen() {
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
          <Button className="study-button is-disabled" disabled>
            Unavailable
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="type-label font-medium">Size</p>
        <div className="button-line flex flex-wrap items-center gap-2">
          <Button size="small" className="study-button is-secondary" variant="secondary">
            Small
          </Button>
          <Button size="default" className="study-button is-secondary" variant="secondary">
            Default
          </Button>
          <Button size="large" className="study-button is-secondary" variant="secondary">
            Large
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Iconoir actions share Button's construction and expose their labels in tooltips. */
export function IconButtonSpecimen() {
  const [action, setAction] = useState<string | null>(null);

  return (
    <div data-zao-specimen="icon-button" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="type-label font-medium">Emphasis</p>
        <div className="flex flex-wrap items-center gap-3">
          <IconButton
            icon={Plus}
            aria-label="Add workspace"
            variant="primary"
            onClick={() => setAction('Added workspace.')}
          />
          <IconButton
            icon={Settings}
            aria-label="Open settings"
            onClick={() => setAction('Opened settings.')}
          />
          <IconButton
            icon={Copy}
            aria-label="Copy workspace ID"
            variant="quiet"
            onClick={() => setAction('Copied workspace ID.')}
          />
          <IconButton
            icon={Trash}
            aria-label="Delete workspace"
            disabled
            onClick={() => setAction('Deleted workspace.')}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <p className="type-label font-medium">Size</p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col items-center gap-2">
            <IconButton
              icon={Search}
              aria-label="Search workspaces"
              size="small"
              onClick={() => setAction('Searched workspaces.')}
            />
            <span className="type-caption text-muted">Small</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <IconButton
              icon={Settings}
              aria-label="Open workspace settings"
              onClick={() => setAction('Opened workspace settings.')}
            />
            <span className="type-caption text-muted">Default</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <IconButton
              icon={Plus}
              aria-label="Add member"
              size="large"
              onClick={() => setAction('Added member.')}
            />
            <span className="type-caption text-muted">Large</span>
          </div>
        </div>
      </div>
      <p className="type-caption text-muted" aria-live="polite">
        {action ?? 'Choose an action to see its result.'}
      </p>
    </div>
  );
}

/** Labels, guidance, errors, and disabled state share one stable field layout. */
export function TextFieldSpecimen() {
  return (
    <div data-zao-specimen="text-field" className="fields-layout grid gap-4">
      <div className="field min-w-0">
        <TextField
          label="Workspace name"
          defaultValue="North workspace"
          description={<span className="field-note">This name appears in invitations.</span>}
        />
      </div>
      <div className="field field-invalid min-w-0">
        <TextField
          label="Contact address"
          type="email"
          defaultValue="team@outside.example"
          error={<span className="field-error">Use a workspace email address.</span>}
        />
      </div>
      <div className="field min-w-0">
        <TextField label="Workspace ID" defaultValue="north-01" disabled />
      </div>
      <TextField label="Reference name" defaultValue="North workspace" readOnly />
    </div>
  );
}

/** A grounded content card with one measurement and a joined bottom action row. */
export function CardSpecimen({
  actions,
  recordStatus = 'live',
}: {
  actions?: ReactNode;
  recordStatus?: string;
} = {}) {
  return (
    <div data-zao-specimen="card" className="@container">
      <Card className="system-card w-full">
        <div className="card-topline flex flex-wrap items-start justify-between gap-3 pb-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="type-heading">North workspace</h3>
            <span className="type-caption figures-id text-muted">Workspace / 001</span>
          </div>
          <span className="status inline-flex items-center gap-1 type-caption text-success">
            <i aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-pill bg-success" />
            Operational
          </span>
        </div>

        <div className="card-main grid gap-4 pb-4 @xl:grid-cols-2">
          <div className="card-copy flex min-w-0 flex-col gap-4">
            <p className="type-body text-muted">
              Review settings before they are shared with your team.
            </p>
            <dl className="flex flex-col gap-2 type-caption">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Active members</dt>
                <dd className="figures-tabular">12</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Last update</dt>
                <dd>Today</dd>
              </div>
            </dl>
          </div>

          <div
            data-zao-slot="card-data"
            className="min-w-0 border-t border-subtle pt-4 @xl:border-t-0 @xl:border-l @xl:pt-0 @xl:pl-4"
          >
            <StorageRingStudy />
          </div>
        </div>

        <div className="card-foot flex flex-wrap items-center justify-between gap-3 border-t border-subtle pt-4">
          <span className="type-caption text-muted">
            <span className="figures-id">Record 01</span> / {recordStatus}
          </span>
          <div className="card-actions ml-auto flex max-w-full flex-wrap justify-end gap-2">
            {actions ?? (
              <>
                <Button variant="secondary">Review settings</Button>
                <Button>Manage storage</Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

const uploadProgress = 68;
const transferProgress = { value: 34.2, total: 50 };

/** Illustrative task readings share a stable quantitative scale. */
export function ProgressSpecimen() {
  return (
    <div data-zao-specimen="progress" className="flex max-w-xl flex-col gap-6">
      <p className="type-caption text-muted">Illustrative task readings</p>
      <div className="flex flex-col gap-2">
        <Progress label="Upload files" value={uploadProgress} />
        <p className="type-caption figures-tabular text-muted">{100 - uploadProgress}% remaining</p>
      </div>
      <div className="flex flex-col gap-2">
        <Progress label="Prepare workspace" value={100} />
        <p className="type-caption text-muted">Complete</p>
      </div>
      <div className="flex flex-col gap-6 border-t border-subtle pt-6">
        <Progress label="Start backup" value={0} />
        <div className="flex flex-col gap-2">
          <Progress
            label="Transfer archive"
            value={transferProgress.value}
            max={transferProgress.total}
            locale="en-US"
            format={{ style: 'unit', unit: 'megabyte', maximumFractionDigits: 1 }}
            getAriaValueText={() =>
              `${transferProgress.value} of ${transferProgress.total} megabytes transferred`
            }
          />
          <p className="type-caption figures-tabular text-muted">
            Of {transferProgress.total} MB total ·{' '}
            {(transferProgress.total - transferProgress.value).toFixed(1)} MB remaining
          </p>
        </div>
      </div>
    </div>
  );
}

/** Related workspace views share a stable tab strip. */
export function TabsSpecimen() {
  return (
    <div data-zao-specimen="tabs" className="max-w-xl">
      <Tabs.Root defaultValue="overview">
        <Tabs.List aria-label="Workspace views">
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="activity">Activity</Tabs.Tab>
          <Tabs.Tab value="permissions">Permissions</Tabs.Tab>
          <Tabs.Tab value="archive" disabled>
            Archive
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="overview" aria-label="Overview" keepMounted>
          <Tabs.Root defaultValue="summary">
            <Tabs.List variant="secondary" aria-label="Overview views">
              <Tabs.Tab value="summary">Summary</Tabs.Tab>
              <Tabs.Tab value="members">
                Members
                <span className="border-l border-subtle pl-2 type-caption figures-tabular">12</span>
              </Tabs.Tab>
              <Tabs.Tab value="settings">Settings</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="summary" aria-label="Summary">
              <h3 className="type-heading">North workspace</h3>
              <p className="mt-2 text-muted">12 members are active in this workspace.</p>
            </Tabs.Panel>
            <Tabs.Panel value="members" aria-label="Members 12">
              <h3 className="type-heading">Workspace members</h3>
              <p className="mt-2 text-muted">12 members can access this workspace.</p>
            </Tabs.Panel>
            <Tabs.Panel value="settings" aria-label="Settings">
              <h3 className="type-heading">Workspace settings</h3>
              <p className="mt-2 text-muted">Manage the workspace name and sharing preferences.</p>
            </Tabs.Panel>
          </Tabs.Root>
        </Tabs.Panel>
        <Tabs.Panel value="activity" aria-label="Activity">
          <h3 className="type-heading">Recent activity</h3>
          <p className="mt-2 text-muted">Three settings were updated today.</p>
        </Tabs.Panel>
        <Tabs.Panel value="permissions" aria-label="Permissions">
          <h3 className="type-heading">Permissions</h3>
          <p className="mt-2 text-muted">Members can view shared files.</p>
        </Tabs.Panel>
        <Tabs.Panel value="archive" aria-label="Archive">
          <p className="text-muted">Archive access is unavailable.</p>
        </Tabs.Panel>
      </Tabs.Root>
    </div>
  );
}

/** The same construction retains vertical navigation and explicit keyboard activation. */
export function TabsNavigationSpecimen() {
  return (
    <Tabs.Root defaultValue="profile" orientation="vertical">
      <Tabs.List aria-label="Account sections" activateOnFocus={false}>
        <Tabs.Tab value="profile">Profile</Tabs.Tab>
        <Tabs.Tab value="security">Security</Tabs.Tab>
        <Tabs.Tab value="billing">Billing</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="profile" aria-label="Profile">
        <p className="text-muted">Arrow keys move focus. Press Enter or Space to open a section.</p>
      </Tabs.Panel>
      <Tabs.Panel value="security" aria-label="Security">
        <p className="text-muted">Review account access and sign-in preferences.</p>
      </Tabs.Panel>
      <Tabs.Panel value="billing" aria-label="Billing">
        <p className="text-muted">Review billing details and invoices.</p>
      </Tabs.Panel>
    </Tabs.Root>
  );
}

const workspaces = [
  { value: 'north', label: 'North workspace' },
  { value: 'east', label: 'East workspace' },
  { value: 'west', label: 'West workspace' },
  { value: 'archive', label: 'Archive workspace', disabled: true },
];

const workspaceDirectory = Array.from({ length: 18 }, (_, index) => ({
  value: `location-${index + 1}`,
  label:
    index === 0
      ? 'North workspace — customer operations and international service coordination'
      : `Workspace location ${String(index + 1).padStart(2, '0')}`,
  disabled: index === 8,
}));

/** Search, empty results, and disabled choices use the same options. */
export function ComboboxSpecimen() {
  return (
    <div data-zao-specimen="combobox" className="grid max-w-xl gap-5">
      <Combobox
        label="Workspace"
        options={workspaces}
        defaultValue="north"
        description="Search by workspace name."
      />
      <Combobox label="Destination workspace" options={workspaces} placeholder="Find a workspace" />
      <Combobox label="Locked workspace" options={workspaces} defaultValue="east" disabled />
      <Combobox label="Backup workspace" options={workspaces} error="Choose a backup workspace." />
      <Combobox
        label="Workspace directory"
        options={workspaceDirectory}
        placeholder="Find a workspace"
        description="Type a name to filter the list. Unmatched names show no matches."
      />
    </div>
  );
}

function DialogSizeSpecimen({ size }: { size: ButtonSize }) {
  const portalContainer = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={portalContainer}
      data-zao-dialog-size={size}
      className="flex flex-wrap items-center gap-2"
    >
      <Dialog.Root>
        <Dialog.Trigger size={size}>Review {size} access</Dialog.Trigger>
        <Dialog.Trigger size={size} disabled>
          Unavailable {size} review
        </Dialog.Trigger>
        <Dialog.Portal container={portalContainer}>
          <Dialog.Backdrop />
          <Dialog.Viewport>
            <Dialog.Popup>
              <div className="flex flex-col gap-3">
                <Dialog.Title>Review {size} workspace access</Dialog.Title>
                <Dialog.Description>
                  Approving gives the three invited members access to North workspace.
                </Dialog.Description>
                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <Dialog.Close size={size}>Cancel {size}</Dialog.Close>
                  <Dialog.Close size={size} variant="primary">
                    Approve {size}
                  </Dialog.Close>
                </div>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/** The overlay stays in this preview's finish island. */
export function DialogSpecimen() {
  const portalContainer = useRef<HTMLDivElement>(null);
  const [approved, setApproved] = useState(false);

  return (
    <div ref={portalContainer} data-zao-specimen="dialog" className="flex flex-col gap-3">
      <Dialog.Root>
        <Dialog.Trigger>Review access</Dialog.Trigger>
        <Dialog.Portal container={portalContainer}>
          <Dialog.Backdrop />
          <Dialog.Viewport>
            <Dialog.Popup>
              <div className="flex flex-col gap-3">
                <Dialog.Title>Review workspace access</Dialog.Title>
                <Dialog.Description>
                  Approving gives the three invited members access to North workspace.
                </Dialog.Description>
                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <Dialog.Close>Cancel</Dialog.Close>
                  <Dialog.Close variant="primary" onClick={() => setApproved(true)}>
                    Approve access
                  </Dialog.Close>
                </div>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
      {approved && <p className="type-caption text-success">Approved access for 3 members.</p>}
      <div data-zao-specimen="dialog-sizes" className="flex flex-col gap-3">
        <p className="type-label font-medium">Sizes</p>
        {(['small', 'default', 'large'] as const).map((size) => (
          <DialogSizeSpecimen key={size} size={size} />
        ))}
      </div>
    </div>
  );
}

/** A short action set with a separator, disabled item, and visible result. */
export function MenuSpecimen() {
  const [action, setAction] = useState<string | null>(null);

  return (
    <div data-zao-specimen="menu" className="flex flex-col items-start gap-3">
      <Menu
        trigger="Workspace actions"
        items={[
          { label: 'Rename workspace', onSelect: () => setAction('Rename workspace selected.') },
          { label: 'Copy workspace ID', onSelect: () => setAction('Copied workspace ID.') },
          { separator: true },
          { label: 'Archive workspace', disabled: true },
        ]}
      />
      <p className="type-caption text-muted" aria-live="polite">
        {action ?? 'Choose an action to see its result.'}
      </p>
    </div>
  );
}

/** Single choices show default, invalid, and disabled states. */
export function SelectSpecimen() {
  return (
    <div data-zao-specimen="select" className="grid max-w-xl gap-5">
      <Select
        label="Region"
        options={[
          { value: 'west', label: 'West' },
          { value: 'central', label: 'Central' },
          { value: 'east', label: 'East' },
        ]}
        defaultValue="west"
        description="Choose the region for this workspace."
      />
      <Select
        label="Backup region"
        options={[
          { value: 'west', label: 'West' },
          { value: 'central', label: 'Central' },
        ]}
        error="Choose a backup region."
      />
      <Select
        label="Current plan"
        options={[{ value: 'standard', label: 'Standard' }]}
        defaultValue="standard"
        disabled
      />
      <Select
        label="Workspace location"
        options={workspaceDirectory}
        description="Open the list to browse complete names and scroll through locations."
      />
    </div>
  );
}

/** Immediate settings show on, off, and disabled states. */
export function SwitchSpecimen() {
  const [activityAlerts, setActivityAlerts] = useState(false);

  return (
    <form
      aria-label="Notification settings"
      data-zao-specimen="switch"
      className="flex max-w-xl flex-col gap-4"
    >
      <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-subtle pb-3">
        <span className="type-body">Email updates</span>
        <Switch
          aria-label="Email updates"
          name="email-updates"
          uncheckedValue="off"
          defaultChecked
        />
      </label>
      <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-subtle pb-3">
        <span className="type-body">Activity alerts</span>
        <Switch
          aria-label="Activity alerts"
          name="activity-alerts"
          uncheckedValue="off"
          checked={activityAlerts}
          onCheckedChange={setActivityAlerts}
        />
      </label>
      <label className="flex cursor-not-allowed items-center justify-between gap-4">
        <span className="type-body text-muted">Locked setting</span>
        <Switch aria-label="Locked setting" name="locked-setting" defaultChecked disabled />
      </label>
    </form>
  );
}
