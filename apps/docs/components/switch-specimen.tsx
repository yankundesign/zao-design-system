'use client';

import { useState } from 'react';
import { Switch } from '@zao/react';

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
