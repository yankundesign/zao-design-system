import Link from 'next/link';
import { ComponentPreview } from './component-preview';
import { getQuietInstrumentStudy } from '@/lib/style-studies';

export type ComponentId =
  | 'button'
  | 'icon-button'
  | 'text-field'
  | 'composer'
  | 'conversation'
  | 'card'
  | 'combobox'
  | 'dialog'
  | 'menu'
  | 'progress'
  | 'select'
  | 'switch'
  | 'table'
  | 'tabs';
export type ComponentSearchParams = Promise<Record<string, string | string[] | undefined>>;

interface ComponentDefinition {
  title: string;
  description: string;
  usage: string[];
  accessibility: string;
  example: string;
  props: { name: string; values: string; defaultValue: string }[];
}

const definitions: Record<ComponentId, ComponentDefinition> = {
  composer: {
    title: 'Composer',
    description: 'A compact raised writing tray for a request, its context, and local attachments.',
    usage: [
      'Keep the draft controlled. The host accepts requests, clears accepted drafts, processes uploads, and owns the response lifecycle.',
      'Start with a compact one-line draft. Enter adds a line; Cmd or Ctrl + Enter and the Send control share a guarded submission path. The writing plane grows to eight lines, then scrolls.',
      'Keep one square, stationary tray: a border-subtle perimeter and border-default lower contact edge frame the clear writing plane. Only focus within the textarea strengthens the contact edge to border-strong; toolbar focus keeps the tray at rest.',
      'Supply context and named attachments before the writing plane. File selection and previews are local; accept and validation belong to the product.',
      'Use filled bg-sunken ComposerContextChip tags in the context slot for supplied context. An optional decorative SVG component, such as an Iconoir icon, indicates its type. The host removes context through onRemove; removal returns focus to the draft without sending or changing its contents.',
      'Use the icon-only toolbar for Attach files, Send, and Stop response. The larger plus drawing aligns with the draft and chips; inset spacing gives its 28px target room within the tray. Keep the next draft editable during a response. Stop asks the host to stop; keep responding true until the host confirms the outcome. Pending controls block repeated requests without adding a caption row.',
      'Preserve failed drafts and explain how to retry. onSend can return a promise; Composer catches failures and blocks duplicate sends while it is pending.',
    ],
    accessibility:
      'Composer uses a native form and textarea with a visually hidden, required label. Pointer clicks keep the writing plane unframed; keyboard entry retains a visible focus outline. Textarea focus strengthens only the tray’s contact edge. Error and keyboard guidance are associated with the input. IME composition never sends. IconButtons, including context removal, provide accessible names, visible focus, and hover or focus tooltips. Optional context icons are hidden from assistive technology; labels name the context. Filenames stay complete in the accessibility tree; compact file tiles fit keyboard and touch use.',
    example: `import { Composer, ComposerContextChip } from '@zao/react';\nimport { Database } from 'iconoir-react';\n\n<Composer\n  label="Request"\n  value={draft}\n  onValueChange={setDraft}\n  onSend={acceptRequest}\n  responding={responding}\n  onStop={stopResponse}\n  context={snapshotIncluded ? (\n    <ComposerContextChip\n      label="Storage snapshot"\n      icon={Database}\n      onRemove={() => setSnapshotIncluded(false)}\n    />\n  ) : undefined}\n/>`,
    props: [
      {
        name: 'label',
        values: 'string; visually hidden accessible name',
        defaultValue: 'required',
      },
      {
        name: 'value / onValueChange',
        values: 'controlled string / (value) => void',
        defaultValue: 'required',
      },
      {
        name: 'onSend',
        values: '(draft: ComposerDraft) => void | Promise<void>',
        defaultValue: 'required',
      },
      {
        name: 'responding / onStop',
        values: 'boolean / () => void | Promise<void>; host confirms stopping',
        defaultValue: 'false / —',
      },
      { name: 'attachments', values: 'readonly { id: string; file: File }[]', defaultValue: '[]' },
      {
        name: 'onFilesSelect / onRemoveAttachment',
        values: '(files: File[]) => void / (id: string) => void',
        defaultValue: '—',
      },
      {
        name: 'accept / multiple',
        values: 'native file types / boolean',
        defaultValue: 'all types / true',
      },
      { name: 'context / actions', values: 'React content', defaultValue: '—' },
      {
        name: 'ComposerContextChip label / onRemove',
        values: 'string / () => void; native div props and ref',
        defaultValue: 'required',
      },
      {
        name: 'ComposerContextChip icon',
        values: 'IconButtonIcon; optional decorative SVG component',
        defaultValue: '—',
      },
      {
        name: 'disabled / error',
        values: 'boolean / correction guidance',
        defaultValue: 'false / —',
      },
      {
        name: 'textareaProps',
        values: 'uncontrolled native attributes and events',
        defaultValue: '—',
      },
    ],
  },
  conversation: {
    title: 'Conversation',
    description: 'A readable record of requests, responses, and results that preserves your place.',
    usage: [
      'Compose Viewport, List, Item, and Message inside a named Conversation.Root. Give the root a bounded height; the viewport fills the available reading space.',
      'Use stable keys for chronological items. The host owns history and response content; Message accepts ordinary React content, including sources, Cards, and Tables.',
      'Keep author labels explicit. User requests use a restrained surface; assistant prose remains open on the canvas. Put message actions in Message.Actions.',
      'Conversation follows new content while at the bottom. Reading earlier messages suspends following; Latest response restores it without taking keyboard focus.',
      'Set Message status for streaming, stopped, and failed responses. Keep partial output readable. Use Root announcement for host lifecycle feedback, or allow Message transitions to announce it.',
    ],
    accessibility:
      'The transcript is a native ordered list inside a named, keyboard-focusable scroll region. Messages have visible author labels and native content semantics. A separate polite status region announces lifecycle changes rather than streamed tokens. Latest response preserves focus; content and native controls remain operable in reduced motion.',
    example: `import { Conversation, Message } from '@zao/react';\n\n<Conversation.Root aria-label="Workspace assistant" className="h-dvh">\n  <Conversation.Viewport>\n    <Conversation.List>\n      <Conversation.Item>\n        <Message.Root author="Assistant" kind="assistant">\n          <Message.Content><p>Here is the result.</p></Message.Content>\n        </Message.Root>\n      </Conversation.Item>\n    </Conversation.List>\n  </Conversation.Viewport>\n  <Conversation.Latest />\n</Conversation.Root>`,
    props: [
      { name: 'Conversation.Root aria-label', values: 'string', defaultValue: 'required' },
      {
        name: 'Root announcement',
        values: 'host lifecycle text; overrides automatic announcements',
        defaultValue: '—',
      },
      {
        name: 'Viewport / List / Item',
        values: 'native div / ol / li attributes and refs',
        defaultValue: '—',
      },
      {
        name: 'Latest',
        values: 'quiet Button; appears when reading earlier content',
        defaultValue: 'Latest response',
      },
      {
        name: 'Message.Root author / kind',
        values: 'string / user | assistant',
        defaultValue: 'required',
      },
      {
        name: 'Message.Root status',
        values: 'complete | streaming | stopped | error',
        defaultValue: 'complete',
      },
      { name: 'Message.Root metadata / error', values: 'React content', defaultValue: '—' },
      {
        name: 'Message.Content / Actions',
        values: 'React children and native div props',
        defaultValue: '—',
      },
    ],
  },
  'icon-button': {
    title: 'IconButton',
    description: 'A compact action with an Iconoir symbol and a clear text alternative.',
    usage: [
      'Use an icon button when its symbol is familiar and the surrounding context makes the action clear. Use Button when a visible label would explain the action better.',
      'Choose an icon from iconoir-react and provide an aria-label that names the action. The same label appears in the tooltip on hover or keyboard focus.',
      'IconButton shares Button’s square construction, hover lift, and press feedback. Use secondary or quiet for supporting actions and primary for the main action.',
    ],
    accessibility:
      'The required aria-label names the native button. The icon is hidden from assistive technology. The tooltip appears on hover or keyboard focus, can be hovered, and closes on Escape. Disabled buttons skip the tab order and do not activate. Keyboard focus and the hit area stay fixed while the face moves; reduced motion keeps the face stationary.',
    example: `import { IconButton } from '@zao/react';\nimport { Settings } from 'iconoir-react';\n\n<IconButton icon={Settings} aria-label="Open settings" />`,
    props: [
      { name: 'icon', values: 'Iconoir component', defaultValue: 'required' },
      { name: 'aria-label', values: 'string', defaultValue: 'required' },
      { name: 'variant', values: 'primary | secondary | quiet', defaultValue: 'secondary' },
      { name: 'size', values: 'small | default | large', defaultValue: 'default' },
      { name: 'disabled', values: 'boolean', defaultValue: 'false' },
      { name: 'className', values: 'wrapper layout classes', defaultValue: '—' },
      { name: 'button props', values: 'native attributes and event handlers', defaultValue: '—' },
    ],
  },
  button: {
    title: 'Button',
    description: 'A direct action with clear emphasis and a predictable result.',
    usage: [
      'Use primary for the main action in a group. Use secondary or quiet for supporting actions.',
      'Name the result of the action in the label, such as “Save changes”.',
    ],
    accessibility:
      'Button uses a native button through Base UI. It is keyboard operable, has a visible focus outline, and skips the tab order when disabled.',
    example: `import { Button } from '@zao/react';\n\n<Button variant="secondary">Review details</Button>`,
    props: [
      { name: 'variant', values: 'primary | secondary | quiet', defaultValue: 'primary' },
      { name: 'size', values: 'small | default | large', defaultValue: 'default' },
      { name: 'type', values: 'button | submit | reset', defaultValue: 'button' },
      { name: 'disabled', values: 'boolean', defaultValue: 'false' },
    ],
  },
  'text-field': {
    title: 'TextField',
    description: 'A labeled input for one line of text, with guidance and a clear correction.',
    usage: [
      'Keep the label visible. Use description for information that helps before typing.',
      'Set error when validation fails, and tell the person how to correct the value.',
    ],
    accessibility:
      'TextField uses Base UI Field to connect the label, description, and error to its native input. An error marks the input invalid; disabled inputs remain visibly and semantically disabled.',
    example: `import { TextField } from '@zao/react';\n\n<TextField label="Workspace name" description="This name appears in invitations." />`,
    props: [
      { name: 'label', values: 'string', defaultValue: 'required' },
      { name: 'description', values: 'ReactNode', defaultValue: '—' },
      { name: 'error', values: 'ReactNode', defaultValue: '—' },
      { name: 'size', values: 'small | default | large', defaultValue: 'default' },
      { name: 'disabled', values: 'boolean', defaultValue: 'false' },
    ],
  },
  card: {
    title: 'Card',
    description: 'A surface that groups related content without adding interaction of its own.',
    usage: [
      'Use a card when content needs a distinct surface and a clear boundary.',
      'Put headings and actions inside the card. Keep the card itself non-interactive.',
      'Choose Split for content beside data, Stacked for a single reading column, Compact for a short summary, or Media when a visual leads the content.',
      'Compose the layout with children and spacing classes. Each layout uses the same Card and follows the selected finish.',
    ],
    accessibility:
      'Card is a plain content container. It does not enter the tab order; headings, links, and buttons inside it keep their native semantics.',
    example: `import { Button, Card } from '@zao/react';\n\n<Card className="flex flex-col gap-4">\n  <h2 className="type-heading">North workspace</h2>\n  <p className="type-body text-muted">Review the settings.</p>\n  <div className="flex flex-wrap justify-end gap-2 border-t border-subtle pt-4">\n    <Button variant="secondary">Review settings</Button>\n    <Button>Manage storage</Button>\n  </div>\n</Card>`,
    props: [
      { name: 'children', values: 'ReactNode', defaultValue: '—' },
      { name: 'className', values: 'string', defaultValue: '—' },
      { name: 'div props', values: 'HTML div attributes', defaultValue: '—' },
    ],
  },
  combobox: {
    title: 'Combobox',
    description: 'A searchable single choice for a list that needs filtering.',
    usage: [
      'Use a combobox when the list is long enough that searching is faster than scanning.',
      'Give every option a distinct label. Use Select when the list is short and fixed.',
    ],
    accessibility:
      'Combobox connects its label, input, popup, and options through Base UI. Arrow keys move through results, Enter selects one, and Escape closes the list.',
    example: `import { Combobox } from '@zao/react';\n\n<Combobox label="Workspace" options={[{ value: 'north', label: 'North' }]} />`,
    props: [
      { name: 'label', values: 'string', defaultValue: 'required' },
      { name: 'options', values: 'Option[]', defaultValue: 'required' },
      { name: 'value / defaultValue', values: 'string', defaultValue: '—' },
      { name: 'onValueChange', values: '(value: string | null) => void', defaultValue: '—' },
      { name: 'placeholder', values: 'string', defaultValue: '—' },
      { name: 'disabled', values: 'boolean', defaultValue: 'false' },
    ],
  },
  dialog: {
    title: 'Dialog',
    description: 'A focused surface for a decision that needs the person’s attention.',
    usage: [
      'Use a dialog when the decision must be made before returning to the page.',
      'Give it a concise title and an explicit close action. Keep the main action inside the dialog.',
      'When the trigger is inside a finish island, pass an element in that island to Portal container.',
    ],
    accessibility:
      'Dialog uses Base UI to move focus into the open surface, keep focus there, close on Escape, and restore focus to its trigger. Title and description label the dialog.',
    example: `import { Dialog } from '@zao/react';\n\n<Dialog.Root>\n  <Dialog.Trigger>Review changes</Dialog.Trigger>\n  <Dialog.Portal>\n    <Dialog.Backdrop />\n    <Dialog.Viewport>\n      <Dialog.Popup>\n        <Dialog.Title>Review changes</Dialog.Title>\n        <Dialog.Description>Check these settings before saving.</Dialog.Description>\n        <Dialog.Close>Cancel</Dialog.Close>\n      </Dialog.Popup>\n    </Dialog.Viewport>\n  </Dialog.Portal>\n</Dialog.Root>`,
    props: [
      { name: 'Root', values: 'open, defaultOpen, onOpenChange', defaultValue: 'closed' },
      { name: 'Trigger', values: 'button props', defaultValue: '—' },
      { name: 'Portal', values: 'container', defaultValue: 'document body' },
      { name: 'Viewport / Popup', values: 'dialog layout and content props', defaultValue: '—' },
      { name: 'Title / Description', values: 'content', defaultValue: '—' },
      { name: 'Close', values: 'button props', defaultValue: '—' },
    ],
  },
  menu: {
    title: 'Menu',
    description: 'A short list of actions attached to a trigger.',
    usage: [
      'Use a menu for related actions that would crowd the page when shown together.',
      'Use clear verbs for actions. Do not hide the main action in a menu.',
    ],
    accessibility:
      'Menu uses Base UI menu semantics. Arrow keys move among enabled items, Enter or Space activates one, and Escape closes the popup and returns focus.',
    example: `import { Menu } from '@zao/react';\n\n<Menu trigger="Workspace actions" items={[{ label: 'Rename', onSelect: rename }]} />`,
    props: [
      { name: 'trigger', values: 'string', defaultValue: 'required' },
      { name: 'items', values: 'MenuAction[]', defaultValue: 'required' },
      { name: 'disabled', values: 'boolean', defaultValue: 'false' },
      { name: 'size', values: 'small | default | large', defaultValue: 'default' },
    ],
  },
  progress: {
    title: 'Progress',
    description: 'A fixed reference track and one advancing face show a named task’s completion.',
    usage: [
      'Use determinate progress when a meaningful total is known. Keep units, totals, and remaining work visible when available.',
      'Supply actual updates. The first reading appears at its value; the frame and labels stay fixed while the face changes length with existing finish motion.',
      'Zero and full values use the complete scale. Finite values are clamped to the range; non-finite values and invalid ranges show unknown completion. Use format and getAriaValueText for units or fractional readings.',
      'Use Progress for a task. A capacity reading belongs in a chart or meter.',
    ],
    accessibility:
      'Base UI derives the face, visible value, and progressbar semantics from the same reading. Essential information is visible without hover or focus; unknown completion omits aria-valuenow. Reduced motion makes updates immediate. If showValue is false, provide a visible reading nearby. Announce meaningful milestones in a host-owned status region rather than every progress update.',
    example: `import { Progress } from '@zao/react';\n\n<Progress label="Upload files" value={68} />`,
    props: [
      { name: 'label', values: 'string', defaultValue: 'required' },
      { name: 'value', values: 'number | null', defaultValue: 'required' },
      { name: 'min / max', values: 'number', defaultValue: '0 / 100' },
      { name: 'showValue', values: 'boolean', defaultValue: 'true' },
      {
        name: 'format / locale',
        values: 'Intl.NumberFormat options / locale',
        defaultValue: 'percentage / runtime locale',
      },
      {
        name: 'getAriaValueText',
        values: '(formattedValue, value) => string',
        defaultValue: 'formatted value',
      },
    ],
  },
  select: {
    title: 'Select',
    description: 'A single choice from a short, fixed set of options.',
    usage: [
      'Use Select when the available choices can be scanned without searching.',
      'Keep option labels short and distinct. Use Combobox when people need to filter a longer list.',
    ],
    accessibility:
      'Select connects its label, trigger, list, and selected option through Base UI. Arrow keys navigate options, Enter selects, and Escape closes the list.',
    example: `import { Select } from '@zao/react';\n\n<Select label="Region" options={[{ value: 'west', label: 'West' }]} />`,
    props: [
      { name: 'label', values: 'string', defaultValue: 'required' },
      { name: 'options', values: 'Option[]', defaultValue: 'required' },
      { name: 'value / defaultValue', values: 'string', defaultValue: '—' },
      { name: 'onValueChange', values: '(value: string | null) => void', defaultValue: '—' },
      { name: 'placeholder', values: 'string', defaultValue: '—' },
      { name: 'disabled', values: 'boolean', defaultValue: 'false' },
      { name: 'size', values: 'small | default | large', defaultValue: 'default' },
    ],
  },
  switch: {
    title: 'Switch',
    description: 'An immediate on or off setting.',
    usage: [
      'Use a switch when changing the setting takes effect right away.',
      'Use a clear label for the setting, not for the current state.',
    ],
    accessibility:
      'Switch uses Base UI switch semantics, exposes its checked state, and toggles with Space, a pointer, or its associated label. The housing and outside focus outline stay fixed as the face travels. Reduced motion makes state changes immediate and keeps the press feedback in the fill.',
    example: `import { Switch } from '@zao/react';\n\n<label>\n  Email updates\n  <Switch name="email-updates" defaultChecked />\n</label>`,
    props: [
      { name: 'checked / defaultChecked', values: 'boolean', defaultValue: 'false' },
      { name: 'onCheckedChange', values: '(checked: boolean) => void', defaultValue: '—' },
      { name: 'disabled', values: 'boolean', defaultValue: 'false' },
      { name: 'aria-label', values: 'string', defaultValue: 'required without visible label' },
    ],
  },
  table: {
    title: 'Table',
    description: 'An open, monochrome reading plane with precise columns and one grounded frame.',
    usage: [
      'Use a table when the same attributes repeat across records and people need to compare their values. Let the primary column lead; keep IDs and supporting metadata subordinate.',
      'Compose native table parts inside Root. Give the table an aria-label and use Caption for additional context. Use scope="row" on the primary cell when it names the record.',
      'Set numeric on number columns to align comparable values and use tabular figures. Keep units in the heading or alongside the value.',
      'Keep records on one steady reading plane. Sorting, selection, and actions belong to explicit buttons, checkboxes, and menus; the table does not manage their state.',
      'For sorting, put a Button in the column heading and set aria-sort on the sorted Head. For selection, use labeled checkboxes and a visible selected count. Keep the main action visible outside the frame.',
      'Give the primary column the available width. Keep supporting columns compact, use monospace IDs, and match the type-label role across static and sortable headings. Reserve space for sort indicators so columns stay steady.',
      'The current specimen uses plain foreground text for statuses, neutral checkbox selection, and a compact secondary action toolbar. Metadata gains default foreground on emphasized rows; the selected count stays concise, with a detailed live announcement for assistive technology.',
    ],
    accessibility:
      'Table preserves native table, row, column header, row header, and cell semantics. Head defaults to scope="col"; use scope="row" for record names. Root provides a named, keyboard focusable horizontal scroll region for narrow layouts. Readable status text, labeled native checkboxes, aria-sort on the active heading, and visible action focus support the specimen’s read, sort, and select workflow. Table does not add grid navigation or editable spreadsheet behavior.',
    example: `import { Table } from '@zao/react';\n\n<Table.Root aria-label="Recent requests">\n  <Table.Header>\n    <Table.Row>\n      <Table.Head>Request</Table.Head>\n      <Table.Head numeric>Items</Table.Head>\n    </Table.Row>\n  </Table.Header>\n  <Table.Body>\n    <Table.Row>\n      <Table.Head scope="row">Access review</Table.Head>\n      <Table.Cell numeric>24</Table.Cell>\n    </Table.Row>\n  </Table.Body>\n</Table.Root>`,
    props: [
      { name: 'Root aria-label', values: 'string', defaultValue: 'required' },
      { name: 'Root className', values: 'outer frame layout classes', defaultValue: '—' },
      { name: 'Root tableClassName', values: 'native table classes', defaultValue: '—' },
      { name: 'Caption', values: 'native caption props', defaultValue: '—' },
      { name: 'Header / Body / Footer', values: 'native table section props', defaultValue: '—' },
      { name: 'Row selected', values: 'boolean; visual selection', defaultValue: 'false' },
      { name: 'Head scope', values: 'col | row | colgroup | rowgroup', defaultValue: 'col' },
      {
        name: 'Head aria-sort',
        values: 'ascending | descending | none | other',
        defaultValue: '—',
      },
      { name: 'Head / Cell numeric', values: 'boolean', defaultValue: 'false' },
      {
        name: 'native props / ref',
        values: 'attributes and refs for each native element',
        defaultValue: '—',
      },
    ],
  },
  tabs: {
    title: 'Tabs',
    description: 'A fine ruler rail for primary views and a recessed selector for secondary views.',
    usage: [
      'Use tabs when each panel is a peer and people can switch without losing their work.',
      'Keep labels short and order tabs by a clear mental model.',
      'Use the primary ruler for top-level views. Use the secondary selector within a view, with no repeated underline.',
      'Keep secondary roots inside their owning panel. Set keepMounted on that panel to retain its local selection.',
    ],
    accessibility:
      'Base UI preserves tablist, tab, and tabpanel relationships. Arrow keys move focus and activate by default; set activateOnFocus={false} to activate with Enter or Space. Labels, targets, and focus outlines stay fixed. Long strips scroll within their viewport; reduced motion changes selection immediately.',
    example: `import { Tabs } from '@zao/react';\n\n<Tabs.Root defaultValue="overview">\n  <Tabs.List aria-label="Workspace views">\n    <Tabs.Tab value="overview">Overview</Tabs.Tab>\n    <Tabs.Tab value="activity">Activity</Tabs.Tab>\n  </Tabs.List>\n  <Tabs.Panel value="overview" keepMounted>\n    <Tabs.Root defaultValue="summary">\n      <Tabs.List variant="secondary" aria-label="Overview views">\n        <Tabs.Tab value="summary">Summary</Tabs.Tab>\n        <Tabs.Tab value="members">Members</Tabs.Tab>\n      </Tabs.List>\n      <Tabs.Panel value="summary">Workspace overview</Tabs.Panel>\n      <Tabs.Panel value="members">Workspace members</Tabs.Panel>\n    </Tabs.Root>\n  </Tabs.Panel>\n  <Tabs.Panel value="activity">Recent activity</Tabs.Panel>\n</Tabs.Root>`,
    props: [
      {
        name: 'Root',
        values: 'value, defaultValue, onValueChange, orientation',
        defaultValue: 'horizontal',
      },
      { name: 'List variant', values: 'primary, secondary', defaultValue: 'primary' },
      { name: 'List activateOnFocus', values: 'true, false', defaultValue: 'true' },
      { name: 'Tab', values: 'value, disabled', defaultValue: '—' },
      { name: 'Panel', values: 'value, children, keepMounted', defaultValue: '—' },
    ],
  },
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function ComponentDetail({
  component,
  searchParams,
}: {
  component: ComponentId;
  searchParams: ComponentSearchParams;
}) {
  const definition = definitions[component];
  // Export one shared Su preview; URL normalization stays in the client.
  const query = process.env.ZAO_DOCS_STATIC_EXPORT === '1' ? {} : await searchParams;
  const quietStudy = await getQuietInstrumentStudy();
  const requestedStyle = first(query.style);
  const style =
    requestedStyle === 'quiet-instrument' && quietStudy ? 'quiet-instrument' : 'baseline';

  return (
    <div className="flex flex-col gap-10">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="type-title">{definition.title}</h1>
        <p className="type-body text-muted">{definition.description}</p>
      </header>

      <ComponentPreview
        component={component}
        title={definition.title}
        selectedStyle={style}
        quietStudy={quietStudy ? { title: quietStudy.title, cssUrl: quietStudy.cssUrl } : null}
      />

      <section className="docs-detail-section grid gap-5 border-t border-subtle pt-5">
        <h2 className="type-heading">Usage</h2>
        <ul className="flex max-w-2xl list-disc flex-col gap-2 pl-4 type-body text-muted">
          {definition.usage.map((item) => (
            <li key={item}>{item}</li>
          ))}
          {component === 'progress' && (
            <li>
              Follow the{' '}
              <Link className="text-accent underline" href="/foundations/data-visualization">
                data visualization guideline
              </Link>{' '}
              when composing the reading.
            </li>
          )}
        </ul>
      </section>

      <section className="docs-detail-section grid gap-5 border-t border-subtle pt-5">
        <h2 className="type-heading">API</h2>
        <div className="docs-scroll-region min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-left type-body">
            <thead className="type-caption text-muted">
              <tr>
                <th className="border-b border-subtle pb-2 font-medium">Prop</th>
                <th className="border-b border-subtle pb-2 font-medium">Values</th>
                <th className="border-b border-subtle pb-2 font-medium">Default</th>
              </tr>
            </thead>
            <tbody>
              {definition.props.map((prop) => (
                <tr key={prop.name}>
                  <th className="border-b border-subtle py-2 pr-3 type-code">{prop.name}</th>
                  <td className="border-b border-subtle py-2 pr-3">{prop.values}</td>
                  <td className="border-b border-subtle py-2">{prop.defaultValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="docs-detail-section grid gap-5 border-t border-subtle pt-5">
        <h2 className="type-heading">Example</h2>
        <pre className="docs-scroll-region min-w-0 overflow-x-auto rounded-surface border border-subtle bg-sunken p-4 type-code">
          <code>{definition.example}</code>
        </pre>
      </section>

      <section className="docs-detail-section grid gap-5 border-t border-subtle pt-5">
        <h2 className="type-heading">Accessibility</h2>
        <p className="max-w-2xl type-body text-muted">{definition.accessibility}</p>
      </section>
    </div>
  );
}
