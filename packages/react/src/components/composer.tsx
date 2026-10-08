'use client';

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { IconButton } from './icon-button.js';
import type { IconButtonIcon } from './icon-button.js';
import { AttachIcon, FileIcon, RemoveIcon, SendIcon, StopIcon } from './composer-icons.js';

export interface ComposerAttachment {
  /** A stable identity, independent of the filename. */
  id: string;
  file: File;
}

export interface ComposerDraft {
  /** The original draft, including its whitespace and line breaks. */
  text: string;
  /** A snapshot of the attachments supplied when Send was activated. */
  attachments: readonly ComposerAttachment[];
}

export interface ComposerContextChipProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children'
> {
  /** The visible name of the supplied context. */
  label: string;
  /** An optional decorative icon supplied by the host to identify the context. */
  icon?: IconButtonIcon;
  /** The host removes this context from the next request. */
  onRemove: () => void;
  disabled?: boolean;
}

const DraftFocusContext = createContext<{
  focusDraft: (pointer: boolean) => void;
  disabled: boolean;
} | null>(null);

/** A removable context tag for Composer's context slot; the host owns its contents. */
export const ComposerContextChip = forwardRef<HTMLDivElement, ComposerContextChipProps>(
  function ComposerContextChip(
    { label, icon: Icon, onRemove, disabled = false, className, ...props },
    ref,
  ) {
    const composer = useContext(DraftFocusContext);
    const unavailable = disabled || composer?.disabled;
    return (
      <div
        {...props}
        ref={ref}
        data-zao-slot="context-chip"
        data-zao-disabled={unavailable ? '' : undefined}
        className={[
          'inline-flex max-w-full min-w-0 items-center gap-1 rounded-none border border-transparent bg-sunken pl-2',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {Icon ? (
          <span
            data-zao-slot="context-icon"
            aria-hidden="true"
            className={`composer-context-icon inline-flex shrink-0 ${unavailable ? 'text-disabled' : 'text-muted'}`}
          >
            <Icon aria-hidden="true" focusable="false" />
          </span>
        ) : null}
        <span
          className={`composer-context-label min-w-0 type-caption ${unavailable ? 'text-disabled' : 'text-default'}`}
        >
          {label}
        </span>
        <IconButton
          icon={RemoveIcon}
          aria-label={`Remove ${label} context`}
          variant="quiet"
          size="small"
          type="button"
          disabled={unavailable}
          onClick={(event) => {
            event.preventDefault();
            const pointer =
              event.detail > 0 ||
              ('pointerType' in event.nativeEvent && Boolean(event.nativeEvent.pointerType));
            onRemove();
            composer?.focusDraft(pointer);
          }}
        />
      </div>
    );
  },
);

export type ComposerTextareaProps = Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'children' | 'value' | 'defaultValue' | 'onChange' | 'disabled' | 'rows'
>;

export interface ComposerProps extends Omit<
  ComponentPropsWithoutRef<'form'>,
  'children' | 'onSubmit'
> {
  /** The accessible label for the writing area; visually hidden in the compact control. */
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  /** The host accepts the draft and decides when to clear it. */
  onSend: (draft: ComposerDraft) => void | Promise<void>;
  /** The host confirms when a response has begun or stopped. */
  responding?: boolean;
  onStop?: () => void | Promise<void>;
  disabled?: boolean;
  error?: ReactNode;
  context?: ReactNode;
  actions?: ReactNode;
  attachments?: readonly ComposerAttachment[];
  /** Enables local file selection. Uploading remains the host's responsibility. */
  onFilesSelect?: (files: File[]) => void;
  onRemoveAttachment?: (id: string) => void;
  accept?: string;
  multiple?: boolean;
  placeholder?: string;
  /** Native textarea attributes and events, including keyboard interception. */
  textareaProps?: ComposerTextareaProps;
}

const emptyAttachments: readonly ComposerAttachment[] = [];
const sendFailure = 'Could not send your request. Your draft is preserved. Try sending again.';
const stopFailure = 'Could not stop the response. Try stopping again.';
const fileUnits = ['bytes', 'KB', 'MB', 'GB', 'TB'] as const;
const fileNumber = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });

function formatFileSize(bytes: number) {
  if (bytes === 1) return '1 byte';
  const unit = bytes > 0 ? Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 4) : 0;
  return `${fileNumber.format(bytes / 1024 ** unit)} ${fileUnits[unit]}`;
}

/** Each image owns its URL so unrelated draft edits never recreate previews. */
function AttachmentPreview({ file }: { file: File }) {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file.type.startsWith('image/') || typeof URL.createObjectURL !== 'function') return;
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (preview?.file !== file || preview.url === failedUrl) {
    return <FileIcon aria-hidden="true" className="h-8 w-8 shrink-0 text-muted" />;
  }

  return (
    <img
      src={preview.url}
      alt={`Preview of ${file.name}`}
      draggable={false}
      data-zao-slot="attachment-preview"
      className="h-8 w-8 shrink-0 border border-subtle bg-surface object-cover"
      onError={() => setFailedUrl(preview.url)}
    />
  );
}

function resizeTextarea(textarea: HTMLTextAreaElement) {
  const style = window.getComputedStyle(textarea);
  const lineHeight = Number.parseFloat(style.lineHeight);
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;
  const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
  const border =
    Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth);
  const minimum = Math.max(lineHeight + padding + border, Number.parseFloat(style.minHeight) || 0);
  const maximum = lineHeight * 8 + padding + border;

  // Reset before measuring so deleting text can shrink the writing plane immediately.
  textarea.style.height = 'auto';
  const height = Math.min(maximum, Math.max(minimum, textarea.scrollHeight + border));
  textarea.style.height = `${height}px`;
  textarea.style.overflowY = textarea.scrollHeight + border > maximum ? 'auto' : 'hidden';
}

/** A controlled writing control; the host owns requests, uploads, and draft clearing. */
export const Composer = forwardRef<HTMLFormElement, ComposerProps>(function Composer(
  {
    label,
    value,
    onValueChange,
    onSend,
    responding = false,
    onStop,
    disabled = false,
    error,
    context,
    actions,
    attachments = emptyAttachments,
    onFilesSelect,
    onRemoveAttachment,
    accept,
    multiple = true,
    placeholder,
    textareaProps = {},
    className,
    ...formProps
  },
  forwardedRef,
) {
  const generatedId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false);
  const sendingRef = useRef(false);
  const stoppingRef = useRef(false);
  const mountedRef = useRef(true);
  const [sending, setSending] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [pointerFocus, setPointerFocus] = useState(false);
  const displayedError = error || localError;
  const invalid = Boolean(displayedError);
  const canSend =
    !disabled && !responding && !sending && (value.trim().length > 0 || attachments.length > 0);
  const {
    id = `${generatedId}-draft`,
    className: textareaClassName,
    onKeyDown,
    onCompositionStart,
    onCompositionEnd,
    onBlur,
    onPointerDown,
    'aria-describedby': describedBy,
    ...nativeTextareaProps
  } = textareaProps;
  const guidanceId = `${generatedId}-guidance`;
  const errorId = `${generatedId}-error`;

  const focusDraft = useCallback((pointer: boolean) => {
    setPointerFocus(pointer);
    textareaRef.current?.focus({ preventScroll: true });
  }, []);
  const draftFocus = useMemo(() => ({ focusDraft, disabled }), [focusDraft, disabled]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (textareaRef.current) resizeTextarea(textareaRef.current);
  }, [value]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    let width = textarea.getBoundingClientRect().width;
    const resize = () => resizeTextarea(textarea);
    const observer =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            const nextWidth = textarea.getBoundingClientRect().width;
            if (nextWidth !== width) {
              width = nextWidth;
              resize();
            }
          })
        : null;
    observer?.observe(textarea);
    document.fonts?.addEventListener('loadingdone', resize);
    return () => {
      observer?.disconnect();
      document.fonts?.removeEventListener('loadingdone', resize);
    };
  }, []);

  async function sendDraft() {
    if (!canSend || sendingRef.current || composingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setLocalError(null);
    const draft: ComposerDraft = {
      text: value,
      attachments: attachments.map(({ id: attachmentId, file }) => ({ id: attachmentId, file })),
    };

    try {
      await onSend(draft);
    } catch {
      if (mountedRef.current) setLocalError(sendFailure);
    } finally {
      sendingRef.current = false;
      if (mountedRef.current) setSending(false);
    }
  }

  async function stopResponse() {
    if (disabled || !responding || !onStop || stoppingRef.current) return;
    stoppingRef.current = true;
    setStopping(true);
    setLocalError(null);
    try {
      await onStop();
    } catch {
      if (mountedRef.current) setLocalError(stopFailure);
    } finally {
      stoppingRef.current = false;
      if (mountedRef.current) setStopping(false);
    }
  }

  return (
    <DraftFocusContext.Provider value={draftFocus}>
      <form
        {...formProps}
        ref={forwardedRef}
        aria-label={formProps['aria-label'] ?? label}
        data-zao-component="composer"
        data-zao-disabled={disabled ? '' : undefined}
        data-zao-invalid={invalid ? '' : undefined}
        data-zao-pending={sending ? '' : undefined}
        data-zao-responding={responding ? '' : undefined}
        className={[
          'composer-construction flex min-w-0 flex-col gap-2 rounded-none border border-subtle bg-canvas px-4 py-3 text-default',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        onSubmit={(event) => {
          if (event.defaultPrevented) return;
          event.preventDefault();
          void sendDraft();
        }}
      >
        {context ? (
          <div
            data-zao-slot="context"
            className="flex min-w-0 flex-wrap items-center gap-2 type-caption text-muted"
          >
            {context}
          </div>
        ) : null}
        {attachments.length > 0 ? (
          <ul
            aria-label="Included attachments"
            data-zao-slot="attachments"
            className="flex min-w-0 flex-wrap gap-2"
          >
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="composer-attachment flex min-w-0 items-center gap-2 border border-subtle bg-surface p-2"
              >
                <AttachmentPreview file={attachment.file} />
                <div className="min-w-0 flex-1">
                  <p
                    data-zao-slot="attachment-name"
                    className="composer-filename type-label text-default"
                    title={attachment.file.name}
                  >
                    {attachment.file.name}
                  </p>
                  <p className="type-caption figures-tabular text-muted">
                    {formatFileSize(attachment.file.size)}
                  </p>
                </div>
                {onRemoveAttachment ? (
                  <IconButton
                    icon={RemoveIcon}
                    variant="quiet"
                    size="small"
                    disabled={disabled}
                    aria-label={`Remove ${attachment.file.name}`}
                    onClick={() => {
                      setLocalError(null);
                      onRemoveAttachment(attachment.id);
                    }}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        <div data-zao-slot="writing" className="flex min-w-0 flex-col gap-2">
          <label htmlFor={id} data-zao-slot="label" className="sr-only">
            {label}
          </label>
          <textarea
            {...nativeTextareaProps}
            ref={textareaRef}
            id={id}
            rows={1}
            value={value}
            disabled={disabled}
            placeholder={placeholder ?? nativeTextareaProps.placeholder ?? 'Ask anything…'}
            aria-invalid={invalid || undefined}
            aria-describedby={[guidanceId, invalid ? errorId : null, describedBy]
              .filter(Boolean)
              .join(' ')}
            data-zao-slot="input"
            data-zao-pointer-focus={pointerFocus ? '' : undefined}
            className={[
              'composer-input w-full min-w-0 bg-canvas type-body text-default outline-focus placeholder:text-muted disabled:cursor-not-allowed disabled:bg-sunken disabled:text-disabled disabled:placeholder:text-disabled',
              textareaClassName,
            ]
              .filter(Boolean)
              .join(' ')}
            onChange={(event) => {
              setLocalError(null);
              onValueChange(event.target.value);
            }}
            onCompositionStart={(event) => {
              composingRef.current = true;
              onCompositionStart?.(event);
            }}
            onCompositionEnd={(event) => {
              composingRef.current = false;
              onCompositionEnd?.(event);
            }}
            onBlur={(event) => {
              composingRef.current = false;
              setPointerFocus(false);
              onBlur?.(event);
            }}
            onPointerDown={(event) => {
              onPointerDown?.(event);
              if (!disabled && !event.defaultPrevented) setPointerFocus(true);
            }}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (
                event.defaultPrevented ||
                composingRef.current ||
                event.nativeEvent.isComposing ||
                event.nativeEvent.keyCode === 229
              )
                return;
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                if (!event.repeat) event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <p id={guidanceId} data-zao-slot="guidance" className="sr-only">
            Enter adds a line. Ctrl or Cmd + Enter sends.
          </p>
          {invalid ? (
            <div
              id={errorId}
              role="alert"
              data-zao-slot="error"
              className="type-caption text-danger"
            >
              {displayedError}
            </div>
          ) : null}
        </div>
        <div
          data-zao-slot="actions"
          className="flex min-w-0 flex-wrap items-center justify-between gap-2"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {onFilesSelect ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  multiple={multiple}
                  disabled={disabled}
                  hidden
                  aria-label="Attach files"
                  onChange={(event) => {
                    const files = Array.from(event.currentTarget.files ?? []);
                    event.currentTarget.value = '';
                    if (files.length === 0) return;
                    setLocalError(null);
                    onFilesSelect(files);
                  }}
                />
                <IconButton
                  icon={AttachIcon}
                  className="composer-attach"
                  aria-label="Attach files"
                  variant="quiet"
                  size="small"
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                />
              </>
            ) : null}
            {actions}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            {responding ? (
              <IconButton
                icon={StopIcon}
                aria-label="Stop response"
                size="small"
                type="button"
                variant="secondary"
                disabled={disabled || stopping || !onStop}
                aria-busy={stopping || undefined}
                onClick={(event) => {
                  // A synchronous host update can reuse this node as Send before click's default action.
                  event.preventDefault();
                  void stopResponse();
                }}
              />
            ) : (
              <IconButton
                icon={SendIcon}
                aria-label="Send"
                variant="primary"
                size="small"
                type="submit"
                disabled={!canSend}
                aria-busy={sending || undefined}
              />
            )}
          </div>
        </div>
      </form>
    </DraftFocusContext.Provider>
  );
});
