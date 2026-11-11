'use client';

import { useRef, useState } from 'react';
import { Dialog, type ButtonSize } from '@zao/react';

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
