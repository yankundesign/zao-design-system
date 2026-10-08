/**
 * @zao/react
 *
 * The Tailwind theme (`@zao/react/theme.css`), self-hosted fonts
 * (`@zao/react/fonts.css`), finish helpers, and components.
 */

export { Button } from './components/button.js';
export type { ButtonProps, ButtonSize, ButtonVariant } from './components/button.js';
export { IconButton } from './components/icon-button.js';
export type { IconButtonProps, IconButtonIcon } from './components/icon-button.js';
export { Card } from './components/card.js';
export type { CardProps } from './components/card.js';
export { Table } from './components/table.js';
export type {
  TableRootProps,
  TableCaptionProps,
  TableHeaderProps,
  TableBodyProps,
  TableFooterProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
} from './components/table.js';
export { Combobox } from './components/combobox.js';
export type { ComboboxProps, ComboboxOption, ComboboxSize } from './components/combobox.js';
export { Dialog } from './components/dialog.js';
export type {
  DialogRootProps,
  DialogTriggerProps,
  DialogPortalProps,
  DialogBackdropProps,
  DialogViewportProps,
  DialogPopupProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogCloseProps,
} from './components/dialog.js';
export { Menu } from './components/menu.js';
export type { MenuProps, MenuAction, MenuSize } from './components/menu.js';
export { Progress } from './components/progress.js';
export type { ProgressProps } from './components/progress.js';
export { Select } from './components/select.js';
export type { SelectProps, SelectOption, SelectSize } from './components/select.js';
export { Switch } from './components/switch.js';
export type { SwitchProps } from './components/switch.js';
export { Tabs } from './components/tabs.js';
export type {
  TabsRootProps,
  TabsListProps,
  TabsTabProps,
  TabsPanelProps,
  TabsVariant,
} from './components/tabs.js';
export { TextField } from './components/text-field.js';
export type { TextFieldProps, TextFieldSize } from './components/text-field.js';
export { Composer, ComposerContextChip } from './components/composer.js';
export type {
  ComposerProps,
  ComposerAttachment,
  ComposerDraft,
  ComposerTextareaProps,
  ComposerContextChipProps,
} from './components/composer.js';
export { Conversation } from './components/conversation.js';
export type {
  ConversationRootProps,
  ConversationViewportProps,
  ConversationListProps,
  ConversationItemProps,
  ConversationLatestProps,
} from './components/conversation.js';
export { Message } from './components/message.js';
export type {
  MessageRootProps,
  MessageContentProps,
  MessageActionsProps,
  MessageKind,
  MessageStatus,
} from './components/message.js';

export type Theme = 'su' | 'yu';
export type Mode = 'light' | 'dark';

/**
 * Data attributes that apply a finish to an element and its children.
 * Leave `mode` out to follow the reader's OS setting (Su) or the finish's default (Yu is dark first).
 *
 * @example
 * <html {...finish('su')}>
 * <section {...finish('yu', 'dark')}>
 */
export function finish(theme: Theme, mode?: Mode) {
  return {
    'data-zao-theme': theme,
    ...(mode ? { 'data-zao-mode': mode } : {}),
  } as const;
}
