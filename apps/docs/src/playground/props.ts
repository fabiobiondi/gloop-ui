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

const direction = (fallback: string, description: string): PropDoc => ({
  name: 'direction',
  type: "'top' | 'bottom' | 'left' | 'right'",
  default: `'${fallback}'`,
  description,
})

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
    { name: 'reserveSpace', type: 'boolean', default: 'true', description: 'true: the open width is reserved up front and content on the right stays still. false: content sits next to the magnifier and is pushed aside as the field opens.' },
  ],
  input: [
    { name: 'label', type: 'string', required: true, description: 'Label inside the empty field; drips out on top as a liquid tab on focus or with a value.' },
    { name: 'placeholder', type: 'string', description: 'Shown only once the label has moved up.' },
    { name: 'value / defaultValue / onChange', type: 'native', description: 'Works controlled or uncontrolled; browser autofill also lifts the label.' },
    { name: 'ref', type: 'Ref<HTMLInputElement>', description: 'Points to the native <input>.' },
    { name: 'className / style', type: 'string / CSSProperties', description: 'Applied to the wrapper, not to the <input>.' },
    { name: '...rest', type: 'InputHTMLAttributes', description: 'Every other native input attribute (type, name, disabled, autoComplete…) goes to the <input>.' },
  ],
  slider: [
    { name: 'label', type: 'string', description: 'Accessible name of the slider (or use aria-labelledby).' },
    { name: 'value / defaultValue', type: 'number', default: 'min', description: 'Controlled / initial value. Snapped to step and kept between min and max.' },
    { name: 'onChange', type: '(value: number) => void', description: 'Called at every step while dragging or pressing keys.' },
    { name: 'onChangeEnd', type: '(value: number) => void', description: 'Called once the drag or the key is released, e.g. to save.' },
    { name: 'min / max / step', type: 'number', default: '0 / 100 / 1', description: 'Range and granularity. Decimal steps are supported.' },
    { name: 'marks', type: 'boolean | (number | { value; label? })[]', description: 'true: a dot for every step (up to 50). An array: dots at those values, with optional labels underneath.' },
    { name: 'showValue', type: "'auto' | 'always' | 'never'", default: "'auto'", description: 'auto: the value drips out while dragging or focused from the keyboard.' },
    { name: 'valuePlacement', type: "'top' | 'bottom'", default: "'top'", description: 'Side of the thumb the value drop comes out of. Mark labels move to the opposite side.' },
    { name: 'formatValue', type: '(value: number) => string', description: 'Text of the value drop, also announced as aria-valuetext.' },
    { name: 'name', type: 'string', description: 'Submits the value with forms through a hidden input.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Ignores pointer and keyboard and dims the slider.' },
    { name: 'ref', type: 'Ref<HTMLDivElement>', description: 'Points to the focusable element with role="slider".' },
    { name: 'className / style', type: 'string / CSSProperties', description: 'Applied to the wrapper. Sizes can be tuned with --slider-* variables; text on the accent uses --slider-on-accent.' },
  ],
  'circle-menu': [
    { name: 'items', type: 'CircleMenuItem[]', required: true, description: '1 to 6 items: { icon, label, onSelect?, tooltip?, panel?, items? }. items opens a sub-menu of 2 to 5 icons. panel (leaves only): any content or ({ close, back }) => content, or { content, placement?, label? }; opens a liquid panel next to the icon instead of onSelect. tooltip: true (shows the label), text/JSX, or { content, placement?, delay? }; it opens on the side facing away from the menu by default.' },
    { name: 'label', type: 'string', default: "'Menu'", description: 'Accessible name of the "+" button.' },
    { name: 'direction', type: 'CircleMenuDirection', description: "Where the arc opens: 'top', 'right', 'bottom-left'… Without it the items fill the whole circle." },
    { name: 'angle', type: 'number', description: 'Free direction in degrees (0 = right, 90 = down). Wins over direction.' },
    { name: 'arc', type: 'number', default: '90 / 180 / 360', description: 'Arc width in degrees (diagonal / side / no direction).' },
    { name: 'radius', type: 'number', default: 'auto', description: 'Distance of the items from the center, in px. Defaults to the minimum that keeps them apart.' },
    { name: 'subRadius', type: 'number', default: '60', description: 'Distance of sub-menu items from their parent, in px.' },
    { name: 'reserveSpace', type: 'boolean', default: 'true', description: 'true: the open menu area is reserved in the layout. false: only the "+" takes space and icons open on a layer above surrounding content (clipped by ancestors with overflow: hidden).' },
    { name: 'open / defaultOpen', type: 'boolean', description: 'Controlled / initial open state, e.g. to open the menu from a right-click (context menu).' },
    { name: 'onOpenChange', type: '(open: boolean) => void', description: 'Called when the menu opens or closes: "+", Escape, outside click, a choice or close() from a panel.' },
  ],
  dialog: [
    { name: 'open', type: 'boolean', required: true, description: 'Whether the dialog is shown.' },
    { name: 'onClose', type: '() => void', required: true, description: 'Called on Escape, backdrop click or after an action.' },
    { name: 'title', type: 'string', required: true, description: 'Title, also the accessible name of the dialog.' },
    { name: 'children', type: 'ReactNode', description: 'Body of the dialog.' },
    { name: 'icon', type: 'ReactNode', description: 'Icon in a badge that detaches from the top of the card.' },
    { name: 'actions', type: 'DialogAction[]', default: '[]', description: 'Buttons that drip out of the card: { label, icon?, iconOnly?, color?, onClick?, autoFocus? }. Return false from onClick to keep it open.' },
    { name: 'backdropColor', type: 'string', default: "'#000'", description: 'Color of the layer behind the dialog.' },
    { name: 'backdropOpacity', type: 'number', default: '0.45', description: 'Opacity of the backdrop color, from 0 to 1.' },
    { name: 'backdropBlur', type: 'number', default: '0', description: 'Blur of the page behind the dialog, in px.' },
  ],
  tooltip: [
    { name: 'content', type: 'ReactNode', required: true, description: 'Text or JSX shown in the bubble.' },
    { name: 'children', type: 'ReactElement', required: true, description: 'The trigger: a single element that accepts a ref (e.g. a <button>). Wrap disabled buttons in a <span>.' },
    { name: 'placement', type: "'top' | 'right' | 'bottom' | 'left' | 'auto'", default: "'top'", description: "Side of the trigger. Flips when there is no room. 'auto' picks the first side where it fits: top, bottom, right, left." },
    { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", description: 'Alignment along the trigger edge. Shifts to stay inside the viewport.' },
    { name: 'delay', type: 'number', default: '400', description: 'Delay before opening on hover, in ms. Keyboard focus opens right away.' },
    { name: 'closeDelay', type: 'number', default: '100', description: 'Delay before closing after the pointer leaves, in ms.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Never show the tooltip.' },
    { name: 'maxWidth', type: 'number', default: '240', description: 'Maximum width of the bubble, in px.' },
  ],
  popover: [
    { name: 'content', type: 'ReactNode | ({ close }) => ReactNode', required: true, description: 'Body of the popover. As a function it receives close(); nested components can use usePopover().' },
    { name: 'children', type: 'ReactElement', required: true, description: 'The trigger: a single element that accepts a ref. Click toggles the popover.' },
    { name: 'open', type: 'boolean', description: 'Controlled mode.' },
    { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Initial state in uncontrolled mode.' },
    { name: 'onOpenChange', type: '(open: boolean) => void', description: 'Called whenever the popover asks to open or close.' },
    { name: 'placement', type: "'top' | 'right' | 'bottom' | 'left' | 'auto'", default: "'bottom'", description: "Side of the trigger. Flips when there is no room. 'auto' picks the first side where it fits: top, bottom, right, left." },
    { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", description: 'Alignment along the trigger edge.' },
    { name: 'closeOnOutsideClick', type: 'boolean', default: 'true', description: 'Close on a click outside trigger and popover (nested popovers count as inside).' },
    { name: 'closeOnEscape', type: 'boolean', default: 'true', description: 'Close on Escape; only the innermost popover closes.' },
    { name: 'closeOnLeave', type: 'boolean', default: 'false', description: 'Close when the pointer leaves trigger and popover.' },
    { name: 'leaveDelay', type: 'number', default: '250', description: 'Delay of the rollout close, in ms.' },
    { name: 'label', type: 'string', description: 'Accessible name of the popover (role="dialog").' },
  ],
  list: [
    { name: 'items', type: '{ id: string; label: string; icon?: ReactNode; meta?: ReactNode; href?: string; disabled?: boolean }[]', required: true, description: 'Items of the list. With href an item is a link and the list is a <nav>.' },
    { name: 'value', type: 'string | null', description: 'Id of the selected item (controlled).' },
    { name: 'defaultValue', type: 'string | null', default: 'null', description: 'Initially selected id (uncontrolled).' },
    { name: 'onChange', type: '(id: string, item: ListItem) => void', description: 'Called when an item is clicked.' },
    { name: 'highlight', type: "'both' | 'selected' | 'hover' | 'none'", default: "'both'", description: 'What the liquid pill follows.' },
    { name: 'label', type: 'string', description: 'Accessible name of the list.' },
    { name: 'itemHeight', type: 'number', default: '40', description: 'Height of each item, in px.' },
    { name: 'gap', type: 'number', default: '2', description: 'Space between items, in px.' },
    { name: 'radius', type: 'number', default: '14', description: 'Corner radius of the pill, in px.' },
    { name: 'className', type: 'string', description: 'Extra class on the root element.' },
  ],
  'tab-menu': [...tabMenuProps, direction('top', 'Side of the "+" where the bar appears. The bar is always a row: above, below or beside the "+".')],
  'tab-menu-motion': [
    ...tabMenuProps,
    direction('left', 'Side of the "+" the bar grows from. left / right: horizontal bar; top / bottom: a column, first tab next to the "+".'),
  ],
  'tab-menu-submenu': [
    ...tabMenuProps.slice(0, 2),
    { name: 'tabs', type: '{ icon: ReactNode; label: string; items?: string[] }[]', required: true, description: 'Tabs that drop out of the trigger; items opens a sub-menu.' },
    direction('left', 'Side of the "+" the bar grows from. left / right: horizontal bar, sub-menus above; top / bottom: a column, sub-menus to the right of the tab.'),
  ],
  'tab-bar': [
    { name: 'tabs', type: '{ icon: ReactNode; label: string }[]', required: true, description: 'Tabs of the bar.' },
    { name: 'label', type: 'string', default: "'Main'", description: 'Accessible name of the navigation.' },
    { name: 'onChange', type: '(index: number) => void', description: 'Called with the index of the selected tab.' },
  ],
  'shape-editor': [],
}
