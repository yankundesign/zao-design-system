/** The Tailwind utility for each semantic color token, as defined in @zao/react/theme.css. */
export function utilityFor(id: string): string | undefined {
  const [, group, name] = id.split('.');
  if (!group || !name) return undefined;
  switch (group) {
    case 'bg':
      return `bg-${name}`;
    case 'fg':
      return `text-${name}`;
    case 'border':
      return `border-${name}`;
    case 'focus':
      return 'outline-focus';
    case 'accent':
      return {
        solid: 'bg-accent',
        'solid-hover': 'bg-accent-hover',
        subtle: 'bg-accent-subtle',
        'subtle-hover': 'bg-accent-subtle-hover',
        border: 'border-accent',
        text: 'text-accent',
      }[name];
    case 'success':
    case 'warning':
    case 'danger':
      return {
        solid: `bg-${group}`,
        subtle: `bg-${group}-subtle`,
        border: `border-${group}`,
        text: `text-${group}`,
      }[name];
    default:
      return undefined;
  }
}
