'use client';

import { Tabs } from '@zao/react';

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
