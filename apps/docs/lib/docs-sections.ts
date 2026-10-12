/** The docs sections and their pages, shared by the nav and the landing page's index. */
export const docsSections = [
  { id: 'start', title: 'Start', links: [{ href: '/', label: 'Overview' }] },
  {
    id: 'foundations',
    title: 'Foundations',
    links: [
      { href: '/foundations/color', label: 'Color' },
      { href: '/foundations/typography', label: 'Typography' },
      { href: '/foundations/space', label: 'Space' },
      { href: '/foundations/depth', label: 'Depth' },
      { href: '/foundations/motion', label: 'Motion' },
      { href: '/foundations/parts', label: 'Parts' },
      { href: '/foundations/design', label: 'Design notes' },
      { href: '/foundations/data-visualization', label: 'Data visualization' },
    ],
  },
  {
    id: 'components',
    title: 'Components',
    links: [
      { href: '/components/button', label: 'Button' },
      { href: '/components/icon-button', label: 'IconButton' },
      { href: '/components/text-field', label: 'TextField' },
      { href: '/components/composer', label: 'Composer' },
      { href: '/components/conversation', label: 'Conversation' },
      { href: '/components/card', label: 'Card' },
      { href: '/components/combobox', label: 'Combobox' },
      { href: '/components/dialog', label: 'Dialog' },
      { href: '/components/menu', label: 'Menu' },
      { href: '/components/progress', label: 'Progress' },
      { href: '/components/select', label: 'Select' },
      { href: '/components/switch', label: 'Switch' },
      { href: '/components/table', label: 'Table' },
      { href: '/components/tabs', label: 'Tabs' },
    ],
  },
  {
    id: 'charts',
    title: 'Charts',
    links: [
      { href: '/charts', label: 'Overview' },
      { href: '/charts/ring', label: 'Ring' },
      { href: '/charts/bar', label: 'Bar' },
      { href: '/charts/line', label: 'Line' },
      { href: '/charts/heatmap', label: 'Heatmap' },
      { href: '/charts/histogram', label: 'Histogram' },
    ],
  },
] as const;

export type DocsSectionId = (typeof docsSections)[number]['id'];
