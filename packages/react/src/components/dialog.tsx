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
import { Button } from './button.js';
import type { ButtonProps } from './button.js';

export type DialogRootProps = BaseDialogRootProps;
export type DialogPortalProps = BaseDialogPortalProps;

type StyledPartProps<T> = Omit<T, 'className' | 'render' | 'style'> & {
  /** Layout classes appended after the component's ZAO classes. */
  className?: string;
};

type StyledButtonPartProps<T> = StyledPartProps<T> & Pick<ButtonProps, 'size' | 'variant'>;

export type DialogTriggerProps = StyledButtonPartProps<BaseDialogTriggerProps>;
export type DialogBackdropProps = StyledPartProps<BaseDialogBackdropProps>;
export type DialogViewportProps = StyledPartProps<BaseDialogViewportProps>;
export type DialogPopupProps = StyledPartProps<BaseDialogPopupProps>;
export type DialogTitleProps = StyledPartProps<BaseDialogTitleProps>;
export type DialogDescriptionProps = StyledPartProps<BaseDialogDescriptionProps>;
export type DialogCloseProps = StyledButtonPartProps<BaseDialogCloseProps>;

function classes(base: string, extra?: string) {
  return extra ? `${base} ${extra}` : base;
}

const Trigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(function DialogTrigger(
  { className, size = 'default', variant = 'secondary', ...props },
  ref,
) {
  return (
    <BaseDialog.Trigger
      {...props}
      ref={ref}
      data-zao-slot="trigger"
      render={<Button variant={variant} size={size} />}
      className={className}
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
      className={classes('dialog-backdrop-construction fixed inset-0 z-40', className)}
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
        'dialog-construction card-shaded-construction construction-shading pointer-events-auto relative w-full max-w-lg rounded-none border border-subtle bg-surface p-4 text-default outline-focus',
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
  { className, size = 'default', variant = 'quiet', ...props },
  ref,
) {
  return (
    <BaseDialog.Close
      {...props}
      ref={ref}
      data-zao-slot="close"
      render={<Button variant={variant} size={size} />}
      className={className}
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
