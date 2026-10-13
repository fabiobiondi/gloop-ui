export type PropDoc = {
  name: string
  type: string
  default?: string
  required?: boolean
  description: string
}

const tabMenuProps: PropDoc[] = [
  { name: 'icon', type: 'ReactNode', required: true, description: 'Icon of the trigger button.' },
  { name: 'label', type: 'string', required: true, description: 'Accessible name of the trigger.' },
  { name: 'tabs', type: '{ icon: ReactNode; label: string }[]', required: true, description: 'Tabs that drop out of the trigger.' },
]

// Props documentate per ogni componente, indicizzate con l'id della voce (vedi demos.tsx)
export const propsById: Record<string, PropDoc[]> = {
  'expand-button': [
    { name: 'label', type: 'string', required: true, description: 'Accessible name; also the visible text unless iconOnly.' },
    { name: 'icon', type: 'ReactNode', description: 'Icon shown in the button.' },
    { name: 'iconOnly', type: 'boolean', default: 'false', description: 'The button does not expand; the label is only announced to screen readers.' },
    { name: 'variant', type: "'toggle' | 'action'", default: "'toggle'", description: 'toggle: activates, colors and shows the label on click. action: label always visible, click runs onClick.' },
    { name: 'activeColor', type: 'string', default: "'#e11d48' / --ui-bg", description: 'toggle: color when active. action: background color.' },
    { name: 'onClick', type: '() => void', description: 'Called on click.' },
    { name: 'autoFocus', type: 'boolean', description: 'Focus the button on mount.' },
  ],
  search: [
    { name: 'placeholder', type: 'string', default: "'Search…'", description: 'Placeholder of the field, revealed letter by letter.' },
    { name: 'width', type: 'number', default: '280', description: 'Width of the open field, in px.' },
    { name: 'onSearch', type: '(query: string) => void', description: 'Called when the user submits a query.' },
  ],
  'circle-menu': [
    { name: 'items', type: 'CircleMenuItem[]', required: true, description: '1 to 6 items: { icon, label, onSelect?, items? }. items opens a sub-menu of 2 to 5 icons.' },
    { name: 'label', type: 'string', default: "'Menu'", description: 'Accessible name of the "+" button.' },
    { name: 'direction', type: 'CircleMenuDirection', description: "Where the arc opens: 'top', 'right', 'bottom-left'… Without it the items fill the whole circle." },
    { name: 'angle', type: 'number', description: 'Free direction in degrees (0 = right, 90 = down). Wins over direction.' },
    { name: 'arc', type: 'number', default: '90 / 180 / 360', description: 'Arc width in degrees (diagonal / side / no direction).' },
    { name: 'radius', type: 'number', default: 'auto', description: 'Distance of the items from the center, in px. Defaults to the minimum that keeps them apart.' },
    { name: 'subRadius', type: 'number', default: '60', description: 'Distance of sub-menu items from their parent, in px.' },
  ],
  dialog: [
    { name: 'open', type: 'boolean', required: true, description: 'Whether the dialog is shown.' },
    { name: 'onClose', type: '() => void', required: true, description: 'Called on Escape, backdrop click or after an action.' },
    { name: 'title', type: 'string', required: true, description: 'Title, also the accessible name of the dialog.' },
    { name: 'children', type: 'ReactNode', description: 'Body of the dialog.' },
    { name: 'icon', type: 'ReactNode', description: 'Icon in a badge that detaches from the top of the card.' },
    { name: 'actions', type: 'DialogAction[]', default: '[]', description: 'Buttons that drip out of the card: { label, icon?, iconOnly?, color?, onClick?, autoFocus? }. Return false from onClick to keep it open.' },
  ],
  'tab-menu': tabMenuProps,
  'tab-menu-motion': tabMenuProps,
  'tab-menu-submenu': [
    ...tabMenuProps.slice(0, 2),
    { name: 'tabs', type: '{ icon: ReactNode; label: string; items?: string[] }[]', required: true, description: 'Tabs that drop out of the trigger; items opens a sub-menu.' },
  ],
  'tab-bar': [
    { name: 'tabs', type: '{ icon: ReactNode; label: string }[]', required: true, description: 'Tabs of the bar.' },
    { name: 'label', type: 'string', default: "'Main'", description: 'Accessible name of the navigation.' },
    { name: 'onChange', type: '(index: number) => void', description: 'Called with the index of the selected tab.' },
  ],
  'shape-editor': [],
}
