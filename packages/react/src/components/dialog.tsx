'use client';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type {
  DialogBackdropProps as BaseDialogBackdropProps,
  DialogCloseProps as BaseDialogCloseProps,
  DialogDescriptionProps as BaseDialogDescriptionProps,
  DialogPopupProps as BaseDialogPopupProps,
  DialogPortalProps as BaseDialogPortalProps,
  DialogRootProps as BaseDialogRootProps,
  DialogTitleProps as BaseDialogTitleProps,
  DialogTriggerProps as BaseDialogTriggerProps,
  DialogViewportProps as BaseDialogViewportProps,
} from '@base-ui/react/dialog';
import { forwardRef } from 'react';

export type DialogRootProps = BaseDialogRootProps;
export type DialogPortalProps = BaseDialogPortalProps;

type StyledPartProps<T> = Omit<T, 'className' | 'render' | 'style'> & {
  /** Layout classes appended after the component's ZAO classes. */
  className?: string;
};

export type DialogTriggerProps = StyledPartProps<BaseDialogTriggerProps>;
export type DialogBackdropProps = StyledPartProps<BaseDialogBackdropProps>;
export type DialogViewportProps = StyledPartProps<BaseDialogViewportProps>;
export type DialogPopupProps = StyledPartProps<BaseDialogPopupProps>;
export type DialogTitleProps = StyledPartProps<BaseDialogTitleProps>;
export type DialogDescriptionProps = StyledPartProps<BaseDialogDescriptionProps>;
export type DialogCloseProps = StyledPartProps<BaseDialogCloseProps>;

function classes(base: string, extra?: string) {
  return extra ? `${base} ${extra}` : base;
}

const Trigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(function DialogTrigger(
  { className, ...props },
  ref,
) {
  return (
    <BaseDialog.Trigger
      {...props}
      ref={ref}
      data-zao-slot="trigger"
      className={classes(
        'inline-flex h-8 min-w-7 items-center justify-center gap-2 rounded-action border border-default bg-surface px-3 type-label trim-label font-medium text-default outline-focus transition-colors duration-fast hover:bg-hover',
        className,
      )}
    />
  );
});

const Backdrop = forwardRef<HTMLDivElement, DialogBackdropProps>(function DialogBackdrop(
  { className, ...props },
  ref,
) {
  return (
    <BaseDialog.Backdrop
      {...props}
      ref={ref}
      data-zao-slot="backdrop"
      className={classes('fixed inset-0 z-40', className)}
    />
  );
});

const Viewport = forwardRef<HTMLDivElement, DialogViewportProps>(function DialogViewport(
  { className, ...props },
  ref,
) {
  return (
    <BaseDialog.Viewport
      {...props}
      ref={ref}
      data-zao-slot="viewport"
      className={classes(
        'pointer-events-none fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4',
        className,
      )}
    />
  );
});

const Popup = forwardRef<HTMLDivElement, DialogPopupProps>(function DialogPopup(
  { className, ...props },
  ref,
) {
  return (
    <BaseDialog.Popup
      {...props}
      ref={ref}
      data-zao-component="dialog"
      data-zao-slot="popup"
      className={classes(
        'material-overlay pointer-events-auto relative w-full max-w-lg p-4 text-default outline-focus',
        className,
      )}
    />
  );
});

const Title = forwardRef<HTMLHeadingElement, DialogTitleProps>(function DialogTitle(
  { className, ...props },
  ref,
) {
  return (
    <BaseDialog.Title
      {...props}
      ref={ref}
      data-zao-slot="title"
      className={classes('type-heading text-default', className)}
    />
  );
});

const Description = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  function DialogDescription({ className, ...props }, ref) {
    return (
      <BaseDialog.Description
        {...props}
        ref={ref}
        data-zao-slot="description"
        className={classes('type-body text-muted', className)}
      />
    );
  },
);

const Close = forwardRef<HTMLButtonElement, DialogCloseProps>(function DialogClose(
  { className, ...props },
  ref,
) {
  return (
    <BaseDialog.Close
      {...props}
      ref={ref}
      data-zao-slot="close"
      className={classes(
        'inline-flex h-8 min-w-7 items-center justify-center rounded-action px-3 type-label trim-label font-medium text-default outline-focus transition-colors duration-fast hover:bg-hover',
        className,
      )}
    />
  );
});

/** A modal dialog with accessible title, focus management, and dismissal from Base UI. */
export const Dialog = {
  Root: BaseDialog.Root,
  Trigger,
  Portal: BaseDialog.Portal,
  Backdrop,
  Viewport,
  Popup,
  Title,
  Description,
  Close,
};
