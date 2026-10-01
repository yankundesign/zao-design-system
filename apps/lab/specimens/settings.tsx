'use client';

import { useId, useState } from 'react';

export const meta = {
  id: 'settings',
  title: 'Settings form',
  tags: ['form', 'controls', 'validation'],
  description: 'Labels, fields, selection, checkboxes, helper text and an error.',
};

export default function SettingsSpecimen() {
  const id = useId();
  const [name, setName] = useState('North workspace');
  const [contact, setContact] = useState('team@outside.example');
  const [status, setStatus] = useState('');
  const contactIsValid = contact.endsWith('@north.example');

  return (
    <section className="flex min-w-0 flex-col gap-6 p-5 text-default">
      <div>
        <p className="type-caption text-muted">Workspace settings</p>
        <h2 className="type-title">General</h2>
        <p className="type-body text-muted">
          Set the details people see when they join this workspace.
        </p>
      </div>
      <form
        className="flex max-w-xl flex-col gap-5 rounded-surface border border-subtle bg-surface p-5"
        onSubmit={(event) => {
          event.preventDefault();
          setStatus(contactIsValid ? `Saved ${name || 'workspace'} settings` : '');
        }}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-workspace-name`} className="type-label font-medium">
            Workspace name
          </label>
          <input
            id={`${id}-workspace-name`}
            className="h-8 w-full rounded-control border border-default bg-canvas px-2 type-body text-default outline-focus placeholder:text-muted"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <p className="type-caption text-muted">This name appears in invitations and reports.</p>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-region`} className="type-label font-medium">
            Report region
          </label>
          <select
            id={`${id}-region`}
            defaultValue="west"
            className="h-8 w-full rounded-control border border-default bg-canvas px-2 type-body text-default outline-focus"
          >
            <option value="west">West region</option>
            <option value="central">Central region</option>
            <option value="east">East region</option>
          </select>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="type-label font-medium">Notifications</legend>
          <label className="flex min-h-7 items-center gap-2 type-body">
            <input
              type="checkbox"
              defaultChecked
              style={{ accentColor: 'var(--zao-color-accent-solid)' }}
            />
            Daily summary
          </label>
          <label className="flex min-h-7 items-center gap-2 type-body">
            <input type="checkbox" style={{ accentColor: 'var(--zao-color-accent-solid)' }} />
            Changes that need approval
          </label>
        </fieldset>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-contact`} className="type-label font-medium">
            Contact address
          </label>
          <input
            id={`${id}-contact`}
            type="email"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            aria-invalid={!contactIsValid}
            aria-describedby={contactIsValid ? undefined : `${id}-contact-error`}
            className={`h-8 w-full rounded-control border bg-canvas px-2 type-body text-default outline-focus ${contactIsValid ? 'border-default' : 'border-danger'}`}
          />
          {!contactIsValid && (
            <p id={`${id}-contact-error`} className="type-caption text-danger">
              Use an address ending in @north.example.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-subtle pt-4">
          <button
            type="submit"
            className="h-8 rounded-action bg-accent px-3 type-label trim-label text-on-accent transition-colors duration-fast hover:bg-accent-hover"
          >
            Save settings
          </button>
          <button
            type="button"
            onClick={() => {
              setName('North workspace');
              setContact('team@outside.example');
              setStatus('');
            }}
            className="h-8 rounded-action border border-default bg-surface px-3 type-label trim-label"
          >
            Reset form
          </button>
        </div>
        {status && (
          <p role="status" className="type-caption text-success">
            {status}
          </p>
        )}
      </form>
    </section>
  );
}
