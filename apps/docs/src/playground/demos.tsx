import type { ReactNode } from 'react'
import {
  CircleMenu,
  ExpandButton,
  GloopLoading,
  Input,
  List,
  ProgressBar,
  Search,
  ShapeEditor,
  Slider,
  TabBar,
  TabMenu,
  TabMenuMotion,
  TabMenuSubmenu,
  Tooltip,
} from 'gloop-ui'
import { CircleMenuContextDemo, CircleMenuPanelsDemo } from './CircleMenuPanels'
import DialogDemo, { DialogFormDemo } from './DialogDemo'
import { ControlledSliderDemo } from './SliderDemo'
import { GloopLoadingPlayground } from './GloopLoadingDemo'
import { ProgressBarAutoDemo, ProgressBarPlayground } from './ProgressBarDemo'
import { AutoPlacementDemo, DirectionDemo } from './DirectionDemo'
import {
  CardMenuPopover,
  ControlledPopover,
  DemoButton,
  EdgeTest,
  HoverCard,
  NestedPopover,
  ProfilePopover,
  TooltipPlacements,
} from './FloatingDemos'
import {
  AlertIcon,
  BookmarkIcon,
  CheckIcon,
  CameraIcon,
  CopyIcon,
  DownloadIcon,
  FolderIcon,
  HeartIcon,
  HomeIcon,
  ImageIcon,
  LinkIcon,
  MailIcon,
  MessageIcon,
  PlusIcon,
  SearchIcon,
  ShareIcon,
  SparkleIcon,
  StarIcon,
  TrashIcon,
  UserIcon,
  VideoIcon,
} from './icons'

export type Demo = {
  title: string
  description?: string
  preview: ReactNode
  code: string
  stage?: {
    /** Altezza minima dell'area di prova: i menu si aprono fuori dal trigger */
    minHeight?: number
    /** 'end': il trigger sta in basso, il menu si apre verso l'alto */
    align?: 'center' | 'end'
    /** Contiene gli elementi position: fixed (TabBar) */
    device?: boolean
    /** Senza padding: il componente ha già il suo sfondo (ShapeEditor) */
    bleed?: boolean
  }
}

export type Entry = {
  id: string
  name: string
  description: string
  /** Sottogruppo della sidebar */
  group: 'forms' | 'overlays' | 'menus' | 'various'
  /** Componente non ancora stabile: badge in sidebar e nell'intestazione */
  status?: 'experimental'
  /** Avviso mostrato sotto la descrizione */
  notice?: string
  /** Anteprima compatta per la griglia della home (default: la prima demo) */
  card?: ReactNode
  demos: Demo[]
}

export const entries: Entry[] = [
  {
    id: 'search',
    name: 'Search',
    group: 'forms',
    description: 'A magnifier that stretches into a field to the right; the lens morphs into a close icon.',
    card: <Search width={180} />,
    demos: [
      {
        title: 'Default',
        preview: <Search />,
        code: `<Search />`,
      },
      {
        title: 'Custom width and handler',
        preview: <Search placeholder="Search docs…" width={220} />,
        code: `<Search
  placeholder="Search docs…"
  width={220}
  onSearch={(query) => console.log(query)}
/>`,
      },
      {
        title: 'Buttons on the right · pushed aside',
        description:
          'With reserveSpace={false} the buttons sit right next to the magnifier. Open the search: they slide to the right with the same spring, and slide back when it closes.',
        preview: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Search placeholder="Search docs…" width={220} reserveSpace={false} />
            <Tooltip content="Open the docs">
              <DemoButton>Docs</DemoButton>
            </Tooltip>
            <Tooltip content="Profile">
              <DemoButton aria-label="Profile">{UserIcon}</DemoButton>
            </Tooltip>
          </div>
        ),
        code: `<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
  <Search placeholder="Search docs…" width={220} reserveSpace={false} />
  <button>Docs</button>
  <button aria-label="Profile"><UserIcon /></button>
</div>`,
      },
      {
        title: 'Buttons on the right · fixed',
        description:
          'Default (reserveSpace={true}). The open width is reserved up front: the buttons never move, at the cost of an empty gap while the search is closed.',
        preview: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Search placeholder="Search docs…" width={220} />
            <Tooltip content="Open the docs">
              <DemoButton>Docs</DemoButton>
            </Tooltip>
            <Tooltip content="Profile">
              <DemoButton aria-label="Profile">{UserIcon}</DemoButton>
            </Tooltip>
          </div>
        ),
        code: `<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
  <Search placeholder="Search docs…" width={220} />
  <button>Docs</button>
  <button aria-label="Profile"><UserIcon /></button>
</div>`,
      },
    ],
  },
  {
    id: 'input',
    name: 'Input',
    group: 'forms',
    description:
      'A text field whose label drips out on top as a liquid tab when focused; the placeholder shows up underneath.',
    card: <Input label="Email" type="email" placeholder="name@mail.com" />,
    demos: [
      {
        title: 'Default',
        preview: (
          <div style={{ width: 280 }}>
            <Input label="Email" type="email" placeholder="name@mail.com" />
          </div>
        ),
        code: `<Input label="Email" type="email" placeholder="name@mail.com" />`,
      },
      {
        title: 'With value',
        description: 'With a value the label stays on top.',
        preview: (
          <div style={{ width: 280 }}>
            <Input label="Name" defaultValue="Ada Lovelace" placeholder="Your name" />
          </div>
        ),
        code: `<Input label="Name" defaultValue="Ada Lovelace" placeholder="Your name" />`,
      },
      {
        title: 'Form',
        preview: (
          <form style={{ display: 'grid', gap: 12, width: 280 }} onSubmit={(e) => e.preventDefault()}>
            <Input label="Name" name="name" placeholder="Ada Lovelace" autoComplete="name" />
            <Input label="Email" name="email" type="email" placeholder="ada@mail.com" autoComplete="email" />
            <Input label="Password" name="password" type="password" placeholder="At least 8 characters" />
            <Input label="Company" placeholder="Not editable" disabled />
          </form>
        ),
        code: `<form style={{ display: 'grid', gap: 12 }}>
  <Input label="Name" name="name" placeholder="Ada Lovelace" autoComplete="name" />
  <Input label="Email" name="email" type="email" placeholder="ada@mail.com" autoComplete="email" />
  <Input label="Password" name="password" type="password" placeholder="At least 8 characters" />
  <Input label="Company" placeholder="Not editable" disabled />
</form>`,
      },
    ],
  },
  {
    id: 'slider',
    name: 'Slider',
    group: 'forms',
    status: 'experimental',
    description:
      'A range slider whose thumb is a liquid drop: it stretches into a trail while dragged and its value drips out on top.',
    card: <Slider label="Volume" defaultValue={40} />,
    demos: [
      {
        title: 'Default',
        description: 'Drag, click anywhere on the track or use the arrow keys. The value drips out while dragging or focused from the keyboard.',
        preview: (
          <div style={{ width: 280 }}>
            <Slider label="Volume" defaultValue={40} />
          </div>
        ),
        code: `<Slider label="Volume" defaultValue={40} />`,
      },
      {
        title: 'Controlled',
        description: 'onChange fires at every step, onChangeEnd once the drag or the key is released.',
        preview: <ControlledSliderDemo />,
        code: `const [volume, setVolume] = useState(40)

<Slider label="Volume" value={volume} onChange={setVolume} onChangeEnd={save} />`,
      },
      {
        title: 'Steps and marks',
        description: 'marks={true} draws a dot for every step (up to 50).',
        preview: (
          <div style={{ width: 280 }}>
            <Slider label="Rating" min={0} max={10} step={1} defaultValue={6} marks />
          </div>
        ),
        code: `<Slider label="Rating" min={0} max={10} step={1} defaultValue={6} marks />`,
      },
      {
        title: 'Labelled marks',
        description: 'Custom marks with labels, and formatValue for the drop and screen readers.',
        preview: (
          <div style={{ width: 280 }}>
            <Slider
              label="Temperature"
              min={16}
              max={28}
              step={0.5}
              defaultValue={21}
              marks={[{ value: 16, label: '16°' }, { value: 22, label: '22°' }, { value: 28, label: '28°' }]}
              formatValue={(v) => `${v.toFixed(1)}°C`}
            />
          </div>
        ),
        code: `<Slider
  label="Temperature"
  min={16}
  max={28}
  step={0.5}
  defaultValue={21}
  marks={[{ value: 16, label: '16°' }, { value: 22, label: '22°' }, { value: 28, label: '28°' }]}
  formatValue={(v) => \`\${v.toFixed(1)}°C\`}
/>`,
      },
      {
        title: 'Value always visible',
        description: 'The drop sits on top by default; valuePlacement="bottom" moves it underneath (mark labels switch to the top).',
        preview: (
          <div style={{ display: 'grid', gap: 24, width: 280 }}>
            <Slider label="Opacity" defaultValue={75} showValue="always" formatValue={(v) => `${v}%`} />
            <Slider
              label="Brightness"
              defaultValue={40}
              showValue="always"
              valuePlacement="bottom"
              formatValue={(v) => `${v}%`}
            />
          </div>
        ),
        code: `<Slider label="Opacity" defaultValue={75} showValue="always" formatValue={(v) => \`\${v}%\`} />

<Slider
  label="Brightness"
  defaultValue={40}
  showValue="always"
  valuePlacement="bottom"
  formatValue={(v) => \`\${v}%\`}
/>`,
      },
      {
        title: 'Disabled',
        preview: (
          <div style={{ width: 280 }}>
            <Slider label="Locked" defaultValue={30} disabled />
          </div>
        ),
        code: `<Slider label="Locked" defaultValue={30} disabled />`,
      },
    ],
  },
  {
    id: 'circle-menu',
    name: 'CircleMenu',
    group: 'menus',
    description:
      'A "+" that throws icons around itself with a liquid blob effect. Full circle or arc, with optional sub-menus.',
    demos: [
      {
        title: 'Circle · 3 icons',
        description: 'Share opens a sub-menu.',
        preview: (
          <CircleMenu
            label="quick actions"
            items={[
              { icon: HomeIcon, label: 'Home' },
              { icon: SearchIcon, label: 'Search' },
              {
                icon: ShareIcon,
                label: 'Share',
                items: [
                  { icon: MailIcon, label: 'Email' },
                  { icon: LinkIcon, label: 'Copy link' },
                  { icon: MessageIcon, label: 'Message' },
                ],
              },
            ]}
          />
        ),
        code: `<CircleMenu
  label="quick actions"
  items={[
    { icon: HomeIcon, label: 'Home' },
    { icon: SearchIcon, label: 'Search' },
    {
      icon: ShareIcon,
      label: 'Share',
      items: [
        { icon: MailIcon, label: 'Email' },
        { icon: LinkIcon, label: 'Copy link' },
        { icon: MessageIcon, label: 'Message' },
      ],
    },
  ]}
/>`,
      },
      {
        title: 'Circle · 6 icons',
        description: 'Share opens 5 icons, Camera opens 2.',
        preview: (
          <CircleMenu
            label="actions"
            items={[
              { icon: HomeIcon, label: 'Home' },
              { icon: SearchIcon, label: 'Search' },
              { icon: HeartIcon, label: 'Favorites' },
              {
                icon: ShareIcon,
                label: 'Share',
                items: [
                  { icon: MailIcon, label: 'Email' },
                  { icon: LinkIcon, label: 'Copy link' },
                  { icon: CopyIcon, label: 'Duplicate' },
                  { icon: MessageIcon, label: 'Message' },
                  { icon: DownloadIcon, label: 'Download' },
                ],
              },
              {
                icon: CameraIcon,
                label: 'Camera',
                items: [
                  { icon: ImageIcon, label: 'Photo' },
                  { icon: VideoIcon, label: 'Video' },
                ],
              },
              { icon: UserIcon, label: 'Profile' },
            ]}
          />
        ),
        code: `<CircleMenu
  label="actions"
  items={[
    { icon: HomeIcon, label: 'Home' },
    { icon: SearchIcon, label: 'Search' },
    { icon: HeartIcon, label: 'Favorites' },
    {
      icon: ShareIcon,
      label: 'Share',
      items: [
        { icon: MailIcon, label: 'Email' },
        { icon: LinkIcon, label: 'Copy link' },
        { icon: CopyIcon, label: 'Duplicate' },
        { icon: MessageIcon, label: 'Message' },
        { icon: DownloadIcon, label: 'Download' },
      ],
    },
    {
      icon: CameraIcon,
      label: 'Camera',
      items: [
        { icon: ImageIcon, label: 'Photo' },
        { icon: VideoIcon, label: 'Video' },
      ],
    },
    { icon: UserIcon, label: 'Profile' },
  ]}
/>`,
      },
      {
        title: 'Arc · bottom-left · 3 icons',
        description: 'direction: top, right, bottom, left or any diagonal.',
        preview: (
          <CircleMenu
            label="share"
            direction="bottom-left"
            items={[
              { icon: MailIcon, label: 'Email' },
              { icon: LinkIcon, label: 'Copy link' },
              {
                icon: MessageIcon,
                label: 'Message',
                items: [
                  { icon: ImageIcon, label: 'Photo' },
                  { icon: VideoIcon, label: 'Video' },
                ],
              },
            ]}
          />
        ),
        code: `<CircleMenu
  label="share"
  direction="bottom-left"
  items={[
    { icon: MailIcon, label: 'Email' },
    { icon: LinkIcon, label: 'Copy link' },
    {
      icon: MessageIcon,
      label: 'Message',
      items: [
        { icon: ImageIcon, label: 'Photo' },
        { icon: VideoIcon, label: 'Video' },
      ],
    },
  ]}
/>`,
      },
      {
        title: 'Arc · bottom-left · overlay',
        description:
          'With reserveSpace={false} the menu only takes the size of the "+": icons open on a layer above the content, which never moves.',
        stage: { minHeight: 280 },
        preview: (
          <div className="pg-overlay-card">
            <p>
              The text wraps right next to the "+", because the closed menu only takes 56px. Open it: the
              icons and the Message sub-menu drop over this paragraph without pushing it. Nothing in this card
              moves or reflows while the menu opens and closes, and once it is closed the text underneath can be
              selected and clicked again, right up to the edge of the button.
            </p>
            <CircleMenu
              label="share"
              direction="bottom-left"
              reserveSpace={false}
              items={[
                { icon: MailIcon, label: 'Email' },
                { icon: LinkIcon, label: 'Copy link' },
                {
                  icon: MessageIcon,
                  label: 'Message',
                  items: [
                    { icon: ImageIcon, label: 'Photo' },
                    { icon: VideoIcon, label: 'Video' },
                  ],
                },
              ]}
            />
          </div>
        ),
        code: `<div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
  <p style={{ flex: 1 }}>Some content…</p>
  <CircleMenu
    label="share"
    direction="bottom-left"
    reserveSpace={false}
    items={[
      { icon: MailIcon, label: 'Email' },
      { icon: LinkIcon, label: 'Copy link' },
      {
        icon: MessageIcon,
        label: 'Message',
        items: [
          { icon: ImageIcon, label: 'Photo' },
          { icon: VideoIcon, label: 'Video' },
        ],
      },
    ]}
  />
</div>`,
      },
      {
        title: 'Arc · top-right · 5 icons',
        description: 'With a narrow arc the icons move further out so they never touch.',
        preview: (
          <CircleMenu
            label="create"
            direction="top-right"
            items={[
              { icon: HomeIcon, label: 'Home' },
              { icon: SearchIcon, label: 'Search' },
              {
                icon: CameraIcon,
                label: 'Camera',
                items: [
                  { icon: ImageIcon, label: 'Photo' },
                  { icon: VideoIcon, label: 'Video' },
                ],
              },
              { icon: HeartIcon, label: 'Favorites' },
              { icon: UserIcon, label: 'Profile' },
            ]}
          />
        ),
        code: `<CircleMenu
  label="create"
  direction="top-right"
  items={[
    { icon: HomeIcon, label: 'Home' },
    { icon: SearchIcon, label: 'Search' },
    {
      icon: CameraIcon,
      label: 'Camera',
      items: [
        { icon: ImageIcon, label: 'Photo' },
        { icon: VideoIcon, label: 'Video' },
      ],
    },
    { icon: HeartIcon, label: 'Favorites' },
    { icon: UserIcon, label: 'Profile' },
  ]}
/>`,
      },
      {
        title: 'Arc · top-right · 5 icons · closer',
        description:
          'Set radius to bring the icons closer. If the arc is too narrow for that distance, it widens (still centered on the direction) so they never touch.',
        preview: (
          <CircleMenu
            label="create"
            direction="top-right"
            radius={100}
            items={[
              { icon: HomeIcon, label: 'Home' },
              { icon: SearchIcon, label: 'Search' },
              {
                icon: CameraIcon,
                label: 'Camera',
                items: [
                  { icon: ImageIcon, label: 'Photo' },
                  { icon: VideoIcon, label: 'Video' },
                ],
              },
              { icon: HeartIcon, label: 'Favorites' },
              { icon: UserIcon, label: 'Profile' },
            ]}
          />
        ),
        code: `<CircleMenu
  label="create"
  direction="top-right"
  radius={100}
  items={[
    { icon: HomeIcon, label: 'Home' },
    { icon: SearchIcon, label: 'Search' },
    {
      icon: CameraIcon,
      label: 'Camera',
      items: [
        { icon: ImageIcon, label: 'Photo' },
        { icon: VideoIcon, label: 'Video' },
      ],
    },
    { icon: HeartIcon, label: 'Favorites' },
    { icon: UserIcon, label: 'Profile' },
  ]}
/>`,
      },
      {
        title: 'Tooltips',
        description:
          'Set tooltip on any item, sub-menu items included: true shows the label, or pass text/JSX, or { content, placement, delay }. By default it opens on the side facing away from the menu.',
        stage: { minHeight: 300 },
        preview: (
          <CircleMenu
            label="quick actions"
            items={[
              { icon: HomeIcon, label: 'Home', tooltip: true },
              { icon: SearchIcon, label: 'Search', tooltip: 'Search the docs' },
              {
                icon: ShareIcon,
                label: 'Share',
                tooltip: { content: 'Share with…', delay: 0 },
                items: [
                  { icon: MailIcon, label: 'Email', tooltip: true },
                  { icon: LinkIcon, label: 'Copy link', tooltip: true },
                  { icon: MessageIcon, label: 'Message', tooltip: true },
                ],
              },
            ]}
          />
        ),
        code: `<CircleMenu
  label="quick actions"
  items={[
    { icon: HomeIcon, label: 'Home', tooltip: true },
    { icon: SearchIcon, label: 'Search', tooltip: 'Search the docs' },
    {
      icon: ShareIcon,
      label: 'Share',
      tooltip: { content: 'Share with…', delay: 0 },
      items: [
        { icon: MailIcon, label: 'Email', tooltip: true },
        { icon: LinkIcon, label: 'Copy link', tooltip: true },
        { icon: MessageIcon, label: 'Message', tooltip: true },
      ],
    },
  ]}
/>`,
      },
      {
        title: 'Custom panels · circle',
        description:
          'panel opens any component next to the icon: a slider, a list, swatches, a form… It receives { close, back }: close() closes everything, back() only the panel. Here every item is a panel.',
        stage: { minHeight: 380 },
        preview: <CircleMenuPanelsDemo variant="circle" />,
        code: `const [style, setStyle] = useState(initial)

<CircleMenu
  label="style"
  items={[
    {
      icon: PaletteIcon,
      label: 'Color',
      tooltip: true,
      panel: ({ back }) => (
        <ColorPanel value={style.color} onChange={(color) => { setStyle({ ...style, color }); back() }} />
      ),
    },
    {
      icon: OpacityIcon,
      label: 'Opacity',
      tooltip: true,
      // Stays open: closes on outside click or Escape
      panel: (
        <input type="range" min={0} max={100} value={style.opacity}
          onChange={(e) => setStyle({ ...style, opacity: +e.target.value })} />
      ),
    },
    {
      icon: SizeIcon,
      label: 'Font size',
      tooltip: true,
      // { content, placement, label } for full control
      panel: {
        label: 'Font size',
        content: ({ close }) => (
          <FontSizeList value={style.fontSize} onChange={(fontSize) => { setStyle({ ...style, fontSize }); close() }} />
        ),
      },
    },
    { icon: DashIcon, label: 'Stroke style', tooltip: true, panel: (api) => <StrokeStylePanel {...api} /> },
    { icon: WidthIcon, label: 'Stroke width', tooltip: true, panel: (api) => <StrokeWidthPanel {...api} /> },
  ]}
/>`,
      },
      {
        title: 'Context menu · right-click',
        description:
          'Controlled with open / onOpenChange and reserveSpace={false}: right-click anywhere in the area and the menu opens at that point, with the same panels as above. Shift+F10 opens it from the keyboard.',
        stage: { minHeight: 380 },
        preview: <CircleMenuContextDemo />,
        code: `const [pos, setPos] = useState({ x: 0, y: 0 })
const [open, setOpen] = useState(false)

function onContextMenu(e: React.MouseEvent<HTMLDivElement>) {
  e.preventDefault()
  const area = e.currentTarget.getBoundingClientRect()
  // Icons are placed relative to the "+": move it and open it in the same render
  setPos({ x: e.clientX - area.left, y: e.clientY - area.top })
  setOpen(true)
}

<div className="canvas" style={{ position: 'relative' }} onContextMenu={onContextMenu}>
  {/* Always mounted, hidden while closed. It only takes the "+" (56px): center it on the click */}
  <div
    className="context-menu"
    data-open={open || undefined}
    style={{ position: 'absolute', left: pos.x - 28, top: pos.y - 28 }}
  >
    <CircleMenu
      label="style"
      reserveSpace={false}
      open={open}
      onOpenChange={setOpen}
      items={[color, opacity, fontSize, strokeStyle, strokeWidth]}
    />
  </div>
</div>

/* .context-menu:not([data-open]) { opacity: 0; visibility: hidden; transition: … } */`,
      },
      {
        title: 'Custom panels · arc · sub-menus',
        description:
          'Panels work on the last branch too: Text and Line open a sub-menu, and each of its icons opens its own panel.',
        stage: { minHeight: 420 },
        preview: <CircleMenuPanelsDemo variant="arc" />,
        code: `<CircleMenu
  label="style"
  direction="right"
  items={[
    { icon: PaletteIcon, label: 'Color', panel: (api) => <ColorPanel {...api} /> },
    {
      icon: TypeIcon,
      label: 'Text',
      items: [
        { icon: SizeIcon, label: 'Font size', panel: (api) => <FontSizePanel {...api} /> },
        { icon: OpacityIcon, label: 'Opacity', panel: <OpacitySlider /> },
      ],
    },
    {
      icon: LineIcon,
      label: 'Line',
      items: [
        { icon: DashIcon, label: 'Stroke style', panel: (api) => <StrokeStylePanel {...api} /> },
        { icon: WidthIcon, label: 'Stroke width', panel: (api) => <StrokeWidthPanel {...api} /> },
      ],
    },
  ]}
/>`,
      },
      {
        title: 'Arc · custom angle',
        description: 'angle (0 = right, 90 = down) and arc in degrees, radius in px.',
        preview: (
          <CircleMenu
            label="custom"
            angle={-90}
            arc={120}
            radius={90}
            items={[
              { icon: HomeIcon, label: 'Home' },
              { icon: SearchIcon, label: 'Search' },
              { icon: UserIcon, label: 'Profile' },
            ]}
          />
        ),
        code: `<CircleMenu
  label="custom"
  angle={-90}
  arc={120}
  radius={90}
  items={[
    { icon: HomeIcon, label: 'Home' },
    { icon: SearchIcon, label: 'Search' },
    { icon: UserIcon, label: 'Profile' },
  ]}
/>`,
      },
    ],
  },
  {
    id: 'dialog',
    name: 'Dialog',
    group: 'overlays',
    description:
      'Modal that swells open like a liquid drop: the action buttons (ExpandButton) drip out of its bottom edge.',
    demos: [
      {
        title: 'Confirm · icon badge · 2 actions',
        description: 'Buttons with and without icon; the colored one is the primary action.',
        preview: (
          <DialogDemo
            trigger="Delete project"
            title="Delete this project?"
            body={<p>All files and settings will be removed. This can't be undone.</p>}
            icon={AlertIcon}
            actions={[
              { label: 'Cancel' },
              { label: 'Delete', icon: TrashIcon, color: '#e11d48' },
            ]}
          />
        ),
        code: `const [open, setOpen] = useState(false)

<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Delete this project?"
  icon={AlertIcon}
  actions={[
    { label: 'Cancel' },
    { label: 'Delete', icon: TrashIcon, color: '#e11d48', onClick: deleteProject },
  ]}
>
  <p>All files and settings will be removed. This can't be undone.</p>
</Dialog>`,
      },
      {
        title: 'Form',
        description:
          'Inputs as children, actions outside the form. An onClick that returns false keeps the dialog open: Invite waits for an email.',
        preview: <DialogFormDemo />,
        code: `const [open, setOpen] = useState(false)
const [email, setEmail] = useState('')

// false keeps the dialog open
function invite() {
  if (!email.trim()) return false
  sendInvite(email)
}

<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Invite a teammate"
  icon={UserIcon}
  actions={[
    { label: 'Cancel', icon: XIcon },
    { label: 'Invite', icon: CheckIcon, color: 'var(--ui-accent)', onClick: invite },
  ]}
>
  <form onSubmit={(e) => { e.preventDefault(); if (invite() !== false) setOpen(false) }}>
    <Input label="Name" placeholder="Your teammate's name" />
    <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
  </form>
</Dialog>`,
      },
      {
        title: 'Icon-only actions',
        description: 'iconOnly buttons: the label stays as accessible name.',
        preview: (
          <DialogDemo
            trigger="Share"
            title="Share this page"
            icon={ShareIcon}
            actions={[
              { label: 'Email', icon: MailIcon, iconOnly: true },
              { label: 'Copy link', icon: LinkIcon, iconOnly: true },
              { label: 'Message', icon: MessageIcon, iconOnly: true },
              { label: 'Download', icon: DownloadIcon, iconOnly: true },
            ]}
          />
        ),
        code: `<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Share this page"
  icon={ShareIcon}
  actions={[
    { label: 'Email', icon: MailIcon, iconOnly: true },
    { label: 'Copy link', icon: LinkIcon, iconOnly: true },
    { label: 'Message', icon: MessageIcon, iconOnly: true },
    { label: 'Download', icon: DownloadIcon, iconOnly: true },
  ]}
/>`,
      },
      {
        title: 'Single action, no badge',
        preview: (
          <DialogDemo
            trigger="What's new"
            title="Liquid menus are here"
            body={<p>Every menu now opens like a drop. Try them from the sidebar.</p>}
            actions={[{ label: 'Got it', icon: CheckIcon, color: '#2563eb', autoFocus: true }]}
          />
        ),
        code: `<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Liquid menus are here"
  actions={[{ label: 'Got it', icon: CheckIcon, color: '#2563eb', autoFocus: true }]}
>
  <p>Every menu now opens like a drop. Try them from the sidebar.</p>
</Dialog>`,
      },
      {
        title: 'Three text actions',
        preview: (
          <DialogDemo
            trigger="Unsaved changes"
            title="Save changes before closing?"
            icon={SparkleIcon}
            actions={[
              { label: "Don't save" },
              { label: 'Cancel' },
              { label: 'Save', color: '#16a34a' },
            ]}
          />
        ),
        code: `<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Save changes before closing?"
  icon={SparkleIcon}
  actions={[
    { label: "Don't save" },
    { label: 'Cancel' },
    { label: 'Save', color: '#16a34a' },
  ]}
/>`,
      },
      {
        title: 'Custom backdrop · color, opacity, blur',
        description: 'backdropColor, backdropOpacity (0–1) and backdropBlur (px) restyle the layer behind the dialog.',
        preview: (
          <DialogDemo
            trigger="Focus mode"
            title="Focus mode is on"
            body={<p>Everything behind this dialog is tinted and blurred.</p>}
            icon={SparkleIcon}
            actions={[{ label: 'Got it', icon: CheckIcon, color: '#4f46e5', autoFocus: true }]}
            backdropColor="#312e81"
            backdropOpacity={0.3}
            backdropBlur={8}
          />
        ),
        code: `<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Focus mode is on"
  icon={SparkleIcon}
  actions={[{ label: 'Got it', icon: CheckIcon, color: '#4f46e5', autoFocus: true }]}
  backdropColor="#312e81"
  backdropOpacity={0.3}
  backdropBlur={8}
>
  <p>Everything behind this dialog is tinted and blurred.</p>
</Dialog>`,
      },
    ],
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    group: 'overlays',
    description:
      'Hover or focus the trigger: after a delay a drop leaks out of the arrow and swells into a bubble. Text or JSX.',
    demos: [
      {
        title: 'Text',
        description: 'Opens after 400ms on hover, right away on keyboard focus. You can move the pointer onto it.',
        preview: (
          <Tooltip content="Copy link to clipboard">
            <DemoButton>Hover me</DemoButton>
          </Tooltip>
        ),
        code: `<Tooltip content="Copy link to clipboard">
  <button>Hover me</button>
</Tooltip>`,
      },
      {
        title: 'JSX content',
        preview: (
          <Tooltip
            maxWidth={200}
            content={
              <span>
                <strong>Search</strong> everything. Press <kbd>⌘K</kbd> anywhere.
              </span>
            }
          >
            <DemoButton aria-label="Search">{SearchIcon}</DemoButton>
          </Tooltip>
        ),
        code: `<Tooltip
  maxWidth={200}
  content={
    <span>
      <strong>Search</strong> everything. Press <kbd>⌘K</kbd> anywhere.
    </span>
  }
>
  <button aria-label="Search"><SearchIcon /></button>
</Tooltip>`,
      },
      {
        title: 'Placement',
        description: 'top, right, bottom, left. Without room it flips to the other side and shifts inside the viewport.',
        preview: <TooltipPlacements />,
        code: `<Tooltip content="Placement: right" placement="right">
  <button>right</button>
</Tooltip>`,
        stage: { minHeight: 220 },
      },
      {
        title: 'Edge test',
        description:
          'The dashed area is a FloatingBoundary: it acts as the viewport, so there is no room outside it. Triggers sit in the corners, on the edges and in the center; pick a placement (auto by default) and align: the tooltip flips and shifts to stay inside, and the arrow keeps pointing at the trigger.',
        preview: <EdgeTest kind="tooltip" />,
        stage: { minHeight: 560 },
        code: `<FloatingBoundary>
  <Tooltip content="..." placement="auto">
    <button>top-left</button>
  </Tooltip>
</FloatingBoundary>`,
      },
      {
        title: 'Custom delays',
        preview: (
          <Tooltip content="Instant" delay={0} closeDelay={300}>
            <DemoButton>No delay</DemoButton>
          </Tooltip>
        ),
        code: `<Tooltip content="Instant" delay={0} closeDelay={300}>
  <button>No delay</button>
</Tooltip>`,
      },
    ],
  },
  {
    id: 'popover',
    name: 'Popover',
    group: 'overlays',
    description:
      'Click the trigger: a liquid bubble drips out of the arrow and can hold forms and other components. Closes on outside click, Escape, from code or on rollout.',
    demos: [
      {
        title: 'Form · close from inside',
        description: 'Cancel uses the render-prop close; Save is a nested component that calls usePopover().close.',
        preview: <ProfilePopover />,
        code: `function SaveButton() {
  const { close } = usePopover()
  return <ExpandButton variant="action" label="Save" icon={CheckIcon} activeColor="var(--ui-accent)" onClick={() => { save(); close() }} />
}

<Popover
  label="Edit profile"
  content={({ close }) => (
    <form>
      <Input label="Name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="Email" type="email" placeholder="ada@example.com" />
      <ExpandButton variant="action" label="Cancel" icon={XIcon} onClick={close} />
      <SaveButton />
    </form>
  )}
>
  <button>{name || 'Edit profile'}</button>
</Popover>`,
        stage: { minHeight: 320 },
      },
      {
        title: 'Card menu · flips when needed',
        description:
          'A ⋮ button on a card opens an action menu below it (placement bottom, align end). The dashed area is a FloatingBoundary: the last card has no room below, so the menu flips above.',
        preview: <CardMenuPopover />,
        code: `<FloatingBoundary>
  <article className="card">
    <strong>Release notes</strong>
    <Popover
      label="Card actions"
      placement="bottom"
      align="end"
      content={({ close }) => (
        <div role="menu">
          <button role="menuitem" onClick={close}>{ShareIcon} Share</button>
          <button role="menuitem" onClick={close}>{CopyIcon} Copy link</button>
          <button role="menuitem" onClick={close}>{TrashIcon} Delete</button>
        </div>
      )}
    >
      <button aria-label="Card actions">{DotsVerticalIcon}</button>
    </Popover>
  </article>
</FloatingBoundary>`,
        stage: { minHeight: 360 },
      },
      {
        title: 'Close on rollout',
        description: 'closeOnLeave: it closes when the pointer leaves both trigger and bubble.',
        preview: <HoverCard />,
        code: `<Popover
  closeOnLeave
  placement="top"
  content={<div><strong>Ada Lovelace</strong> First programmer</div>}
>
  <button>@ada</button>
</Popover>`,
        stage: { minHeight: 220 },
      },
      {
        title: 'Controlled',
        preview: <ControlledPopover />,
        code: `const [open, setOpen] = useState(false)

<Popover open={open} onOpenChange={setOpen} placement="right" content={<p>Opened from outside.</p>}>
  <button>Popover</button>
</Popover>
<button onClick={() => setOpen((o) => !o)}>Toggle</button>`,
      },
      {
        title: 'Nested · tooltips inside',
        description: 'Clicks inside a nested popover do not close the parent; Escape closes the innermost one.',
        preview: <NestedPopover />,
        code: `<Popover
  label="Style"
  content={
    <Popover
      label="Color"
      placement="right"
      content={({ close }) =>
        colors.map((c) => (
          <Tooltip key={c} content={c} placement="bottom">
            <button aria-label={c} onClick={() => { setColor(c); close() }} />
          </Tooltip>
        ))
      }
    >
      <button>Color</button>
    </Popover>
  }
>
  <button>Style</button>
</Popover>`,
        stage: { minHeight: 260 },
      },
      {
        title: 'Edge test',
        description:
          'The dashed area is a FloatingBoundary that acts as the viewport. Popovers in the corners, on the edges and in the center, placement auto by default; "Open all" opens all nine at once to check flip, shift and arrow at a glance.',
        preview: <EdgeTest kind="popover" />,
        stage: { minHeight: 560 },
        code: `<FloatingBoundary>
  <Popover content={<Card />} placement="auto">
    <button>bottom-left</button>
  </Popover>
</FloatingBoundary>`,
      },
    ],
  },
  {
    id: 'tab-menu',
    name: 'TabMenu',
    group: 'menus',
    description: 'A "+" that blooms a dark tab bar above itself.',
    demos: [
      {
        title: 'Default',
        stage: { minHeight: 240, align: 'end' },
        preview: (
          <TabMenu
            icon={PlusIcon}
            label="Open menu"
            tabs={[
              { icon: HomeIcon, label: 'Home' },
              { icon: SearchIcon, label: 'Search' },
              { icon: UserIcon, label: 'Profile' },
            ]}
          />
        ),
        code: `<TabMenu
  icon={PlusIcon}
  label="Open menu"
  tabs={[
    { icon: HomeIcon, label: 'Home' },
    { icon: SearchIcon, label: 'Search' },
    { icon: UserIcon, label: 'Profile' },
  ]}
/>`,
      },
      {
        title: 'Detached',
        description: 'By default a liquid neck keeps the open bar joined to the "+". attached={false} lets the drop break away.',
        stage: { minHeight: 240, align: 'end' },
        preview: (
          <TabMenu
            icon={PlusIcon}
            label="Open menu"
            attached={false}
            tabs={[
              { icon: HomeIcon, label: 'Home' },
              { icon: SearchIcon, label: 'Search' },
              { icon: UserIcon, label: 'Profile' },
            ]}
          />
        ),
        code: `<TabMenu
  icon={PlusIcon}
  label="Open menu"
  attached={false}
  tabs={[
    { icon: HomeIcon, label: 'Home' },
    { icon: SearchIcon, label: 'Search' },
    { icon: UserIcon, label: 'Profile' },
  ]}
/>`,
      },
      {
        title: 'Direction',
        description:
          'The bar always stays a row: top / bottom above or below the "+", left / right beside it. Default: top.',
        stage: { minHeight: 460 },
        preview: (
          <DirectionDemo initial="top">
            {(direction) => (
              <TabMenu
                icon={PlusIcon}
                label="Open menu"
                direction={direction}
                tabs={[
                  { icon: HomeIcon, label: 'Home' },
                  { icon: SearchIcon, label: 'Search' },
                  { icon: UserIcon, label: 'Profile' },
                ]}
              />
            )}
          </DirectionDemo>
        ),
        code: `<TabMenu
  icon={PlusIcon}
  label="Open menu"
  direction="top" // 'top' | 'bottom' | 'left' | 'right'
  tabs={[
    { icon: HomeIcon, label: 'Home' },
    { icon: SearchIcon, label: 'Search' },
    { icon: UserIcon, label: 'Profile' },
  ]}
/>`,
      },
      {
        title: 'Auto placement',
        description:
          'direction="auto": on open the bar takes the first side with room (top, bottom, right, left) inside the nearest FloatingBoundary, or the viewport. Move the menu to another corner and open it.',
        stage: { minHeight: 480 },
        preview: (
          <AutoPlacementDemo>
            <TabMenu
              icon={PlusIcon}
              label="Open menu"
              direction="auto"
              tabs={[
                { icon: HomeIcon, label: 'Home' },
                { icon: SearchIcon, label: 'Search' },
                { icon: UserIcon, label: 'Profile' },
              ]}
            />
          </AutoPlacementDemo>
        ),
        code: `<FloatingBoundary className="area">
  <TabMenu
    icon={PlusIcon}
    label="Open menu"
    direction="auto"
    tabs={[
      { icon: HomeIcon, label: 'Home' },
      { icon: SearchIcon, label: 'Search' },
      { icon: UserIcon, label: 'Profile' },
    ]}
  />
</FloatingBoundary>`,
      },
    ],
  },
  {
    id: 'tab-menu-motion',
    name: 'TabMenuMotion',
    group: 'menus',
    description: 'The "+" itself morphs into the tab bar.',
    demos: [
      {
        title: 'Default',
        preview: (
          <TabMenuMotion
            icon={PlusIcon}
            label="Open menu"
            tabs={[
              { icon: HomeIcon, label: 'Home' },
              { icon: SearchIcon, label: 'Search' },
              { icon: UserIcon, label: 'Profile' },
            ]}
          />
        ),
        code: `<TabMenuMotion
  icon={PlusIcon}
  label="Open menu"
  tabs={[
    { icon: HomeIcon, label: 'Home' },
    { icon: SearchIcon, label: 'Search' },
    { icon: UserIcon, label: 'Profile' },
  ]}
/>`,
      },
      {
        title: 'Direction',
        description:
          'left / right: horizontal bar on that side of the "+". top / bottom: a column above or below, with the first tab next to the "+". Default: left.',
        stage: { minHeight: 460 },
        preview: (
          <DirectionDemo initial="left">
            {(direction) => (
              <TabMenuMotion
                icon={PlusIcon}
                label="Open menu"
                direction={direction}
                tabs={[
                  { icon: HomeIcon, label: 'Home' },
                  { icon: SearchIcon, label: 'Search' },
                  { icon: UserIcon, label: 'Profile' },
                ]}
              />
            )}
          </DirectionDemo>
        ),
        code: `<TabMenuMotion
  icon={PlusIcon}
  label="Open menu"
  direction="left" // 'top' | 'bottom' | 'left' | 'right'
  tabs={[
    { icon: HomeIcon, label: 'Home' },
    { icon: SearchIcon, label: 'Search' },
    { icon: UserIcon, label: 'Profile' },
  ]}
/>`,
      },
      {
        title: 'Auto placement',
        description:
          'direction="auto": on open the bar grows towards the first side with room (left, right, then the columns) inside the nearest FloatingBoundary, or the viewport.',
        stage: { minHeight: 480 },
        preview: (
          <AutoPlacementDemo>
            <TabMenuMotion
              icon={PlusIcon}
              label="Open menu"
              direction="auto"
              tabs={[
                { icon: HomeIcon, label: 'Home' },
                { icon: SearchIcon, label: 'Search' },
                { icon: UserIcon, label: 'Profile' },
              ]}
            />
          </AutoPlacementDemo>
        ),
        code: `<FloatingBoundary className="area">
  <TabMenuMotion
    icon={PlusIcon}
    label="Open menu"
    direction="auto"
    tabs={[
      { icon: HomeIcon, label: 'Home' },
      { icon: SearchIcon, label: 'Search' },
      { icon: UserIcon, label: 'Profile' },
    ]}
  />
</FloatingBoundary>`,
      },
    ],
  },
  {
    id: 'tab-menu-submenu',
    name: 'TabMenuSubmenu',
    group: 'menus',
    description: 'Morphing tab bar where each tab can open a panel of items above it.',
    demos: [
      {
        title: 'With sub-menus',
        description: 'Open the tab bar, then pick an icon to see its sub-menu.',
        stage: { minHeight: 340, align: 'end' },
        preview: (
          <TabMenuSubmenu
            icon={PlusIcon}
            label="Open menu"
            tabs={[
              { icon: HomeIcon, label: 'Home', items: ['Dashboard', 'Activity'] },
              { icon: SearchIcon, label: 'Search', items: ['Recent', 'Saved', 'Advanced filters'] },
              { icon: UserIcon, label: 'Profile', items: ['Settings', 'Notifications', 'Log out'] },
            ]}
          />
        ),
        code: `<TabMenuSubmenu
  icon={PlusIcon}
  label="Open menu"
  tabs={[
    { icon: HomeIcon, label: 'Home', items: ['Dashboard', 'Activity'] },
    { icon: SearchIcon, label: 'Search', items: ['Recent', 'Saved', 'Advanced filters'] },
    { icon: UserIcon, label: 'Profile', items: ['Settings', 'Notifications', 'Log out'] },
  ]}
/>`,
      },
      {
        title: 'With icons',
        description: 'Sub-menu items can be plain strings or { label, icon } objects: the icon is optional.',
        stage: { minHeight: 340, align: 'end' },
        preview: (
          <TabMenuSubmenu
            icon={PlusIcon}
            label="Open menu"
            tabs={[
              { icon: HomeIcon, label: 'Home', items: ['Dashboard', 'Activity'] },
              {
                icon: SearchIcon,
                label: 'Search',
                items: [
                  { label: 'Saved', icon: BookmarkIcon },
                  { label: 'Starred', icon: StarIcon },
                  { label: 'Images', icon: ImageIcon },
                ],
              },
              {
                icon: UserIcon,
                label: 'Profile',
                items: [
                  { label: 'Messages', icon: MessageIcon },
                  { label: 'Favorites', icon: HeartIcon },
                  { label: 'Share profile', icon: ShareIcon },
                ],
              },
            ]}
          />
        ),
        code: `<TabMenuSubmenu
  icon={PlusIcon}
  label="Open menu"
  tabs={[
    { icon: HomeIcon, label: 'Home', items: ['Dashboard', 'Activity'] },
    {
      icon: SearchIcon,
      label: 'Search',
      items: [
        { label: 'Saved', icon: BookmarkIcon },
        { label: 'Starred', icon: StarIcon },
        { label: 'Images', icon: ImageIcon },
      ],
    },
    {
      icon: UserIcon,
      label: 'Profile',
      items: [
        { label: 'Messages', icon: MessageIcon },
        { label: 'Favorites', icon: HeartIcon },
        { label: 'Share profile', icon: ShareIcon },
      ],
    },
  ]}
/>`,
      },
      {
        title: 'Detached',
        description: 'By default a liquid neck keeps the sub-menu joined to its tab. With attached={false} there is no drop: the sub-menu appears on its own, without melting into the tab.',
        stage: { minHeight: 340, align: 'end' },
        preview: (
          <TabMenuSubmenu
            icon={PlusIcon}
            label="Open menu"
            attached={false}
            tabs={[
              { icon: HomeIcon, label: 'Home', items: ['Dashboard', 'Activity'] },
              { icon: SearchIcon, label: 'Search', items: ['Recent', 'Saved', 'Advanced filters'] },
              { icon: UserIcon, label: 'Profile', items: ['Settings', 'Notifications', 'Log out'] },
            ]}
          />
        ),
        code: `<TabMenuSubmenu
  icon={PlusIcon}
  label="Open menu"
  attached={false}
  tabs={[
    { icon: HomeIcon, label: 'Home', items: ['Dashboard', 'Activity'] },
    { icon: SearchIcon, label: 'Search', items: ['Recent', 'Saved', 'Advanced filters'] },
    { icon: UserIcon, label: 'Profile', items: ['Settings', 'Notifications', 'Log out'] },
  ]}
/>`,
      },
      {
        title: 'Direction',
        description:
          'left / right: horizontal bar with sub-menus above it. top / bottom: a column, and each sub-menu opens to the right of its tab. Default: left.',
        stage: { minHeight: 460 },
        preview: (
          <DirectionDemo initial="left">
            {(direction) => (
              <TabMenuSubmenu
                icon={PlusIcon}
                label="Open menu"
                direction={direction}
                tabs={[
                  { icon: HomeIcon, label: 'Home', items: ['Dashboard', 'Activity'] },
                  { icon: SearchIcon, label: 'Search', items: ['Recent', 'Saved', 'Advanced filters'] },
                  { icon: UserIcon, label: 'Profile', items: ['Settings', 'Notifications', 'Log out'] },
                ]}
              />
            )}
          </DirectionDemo>
        ),
        code: `<TabMenuSubmenu
  icon={PlusIcon}
  label="Open menu"
  direction="left" // 'top' | 'bottom' | 'left' | 'right'
  tabs={[
    { icon: HomeIcon, label: 'Home', items: ['Dashboard', 'Activity'] },
    { icon: SearchIcon, label: 'Search', items: ['Recent', 'Saved', 'Advanced filters'] },
    { icon: UserIcon, label: 'Profile', items: ['Settings', 'Notifications', 'Log out'] },
  ]}
/>`,
      },
      {
        title: 'Auto placement',
        description:
          'direction="auto" picks the side of the bar on open. Sub-menus flip by themselves, with or without auto: below the bar when there is no room above (top corners), to the left of a column when there is no room on the right. They follow scroll and resize while open.',
        stage: { minHeight: 480 },
        preview: (
          <AutoPlacementDemo>
            <TabMenuSubmenu
              icon={PlusIcon}
              label="Open menu"
              direction="auto"
              tabs={[
                { icon: HomeIcon, label: 'Home', items: ['Dashboard', 'Activity'] },
                { icon: SearchIcon, label: 'Search', items: ['Recent', 'Saved', 'Advanced filters'] },
                { icon: UserIcon, label: 'Profile', items: ['Settings', 'Notifications', 'Log out'] },
              ]}
            />
          </AutoPlacementDemo>
        ),
        code: `<FloatingBoundary className="area">
  <TabMenuSubmenu
    icon={PlusIcon}
    label="Open menu"
    direction="auto"
    tabs={[
      { icon: HomeIcon, label: 'Home', items: ['Dashboard', 'Activity'] },
      { icon: SearchIcon, label: 'Search', items: ['Recent', 'Saved', 'Advanced filters'] },
      { icon: UserIcon, label: 'Profile', items: ['Settings', 'Notifications', 'Log out'] },
    ]}
  />
</FloatingBoundary>`,
      },
    ],
  },
  {
    id: 'list',
    name: 'List',
    group: 'various',
    description: 'Vertical list with a liquid pill on the selected item and a lighter one that follows hover and focus.',
    card: (
      <List
        label="Mailbox"
        defaultValue="inbox"
        itemHeight={34}
        items={[
          { id: 'inbox', label: 'Inbox', icon: MailIcon, meta: 12 },
          { id: 'starred', label: 'Starred', icon: StarIcon, meta: 3 },
          { id: 'trash', label: 'Trash', icon: TrashIcon },
        ]}
      />
    ),
    demos: [
      {
        title: 'Selectable',
        description: 'Uncontrolled: the pill moves to the clicked item.',
        preview: (
          <div style={{ width: 240 }}>
            <List
              label="Mailbox"
              defaultValue="inbox"
              items={[
                { id: 'inbox', label: 'Inbox', icon: MailIcon, meta: 12 },
                { id: 'starred', label: 'Starred', icon: StarIcon, meta: 3 },
                { id: 'saved', label: 'Saved', icon: BookmarkIcon },
                { id: 'trash', label: 'Trash', icon: TrashIcon },
              ]}
            />
          </div>
        ),
        code: `<List
  label="Mailbox"
  defaultValue="inbox"
  items={[
    { id: 'inbox', label: 'Inbox', icon: MailIcon, meta: 12 },
    { id: 'starred', label: 'Starred', icon: StarIcon, meta: 3 },
    { id: 'saved', label: 'Saved', icon: BookmarkIcon },
    { id: 'trash', label: 'Trash', icon: TrashIcon },
  ]}
  onChange={(id) => console.log(id)}
/>`,
      },
      {
        title: 'Hover only',
        description: 'No selection: the pill only follows the cursor and keyboard focus.',
        preview: (
          <div style={{ width: 240 }}>
            <List
              label="Actions"
              highlight="hover"
              items={[
                { id: 'share', label: 'Share', icon: ShareIcon },
                { id: 'copy', label: 'Copy link', icon: LinkIcon },
                { id: 'download', label: 'Download', icon: DownloadIcon },
              ]}
            />
          </div>
        ),
        code: `<List
  label="Actions"
  highlight="hover"
  items={[
    { id: 'share', label: 'Share', icon: ShareIcon },
    { id: 'copy', label: 'Copy link', icon: LinkIcon },
    { id: 'download', label: 'Download', icon: DownloadIcon },
  ]}
/>`,
      },
      {
        title: 'Disabled item',
        preview: (
          <div style={{ width: 240 }}>
            <List
              label="Profile"
              defaultValue="profile"
              items={[
                { id: 'profile', label: 'Profile', icon: UserIcon },
                { id: 'messages', label: 'Messages', icon: MessageIcon },
                { id: 'billing', label: 'Billing', icon: AlertIcon, disabled: true },
              ]}
            />
          </div>
        ),
        code: `<List
  label="Profile"
  defaultValue="profile"
  items={[
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'messages', label: 'Messages', icon: MessageIcon },
    { id: 'billing', label: 'Billing', icon: AlertIcon, disabled: true },
  ]}
/>`,
      },
      {
        title: 'Groups',
        description: 'Items gathered under a title. The pill glides from one group to the other.',
        preview: (
          <div style={{ width: 240 }}>
            <List
              label="Mailbox"
              defaultValue="inbox"
              items={[
                {
                  type: 'group',
                  id: 'mail',
                  label: 'Mail',
                  items: [
                    { id: 'inbox', label: 'Inbox', icon: MailIcon, meta: 12 },
                    { id: 'starred', label: 'Starred', icon: StarIcon, meta: 3 },
                    { id: 'saved', label: 'Saved', icon: BookmarkIcon },
                  ],
                },
                {
                  type: 'group',
                  id: 'media',
                  label: 'Media',
                  items: [
                    { id: 'photos', label: 'Photos', icon: ImageIcon },
                    { id: 'videos', label: 'Videos', icon: VideoIcon },
                  ],
                },
              ]}
            />
          </div>
        ),
        code: `<List
  label="Mailbox"
  defaultValue="inbox"
  items={[
    {
      type: 'group',
      id: 'mail',
      label: 'Mail',
      items: [
        { id: 'inbox', label: 'Inbox', icon: MailIcon, meta: 12 },
        { id: 'starred', label: 'Starred', icon: StarIcon, meta: 3 },
        { id: 'saved', label: 'Saved', icon: BookmarkIcon },
      ],
    },
    {
      type: 'group',
      id: 'media',
      label: 'Media',
      items: [
        { id: 'photos', label: 'Photos', icon: ImageIcon },
        { id: 'videos', label: 'Videos', icon: VideoIcon },
      ],
    },
  ]}
/>`,
      },
      {
        title: 'Divider',
        description: 'A thin line between items, here to set the destructive action apart.',
        preview: (
          <div style={{ width: 240 }}>
            <List
              label="Actions"
              highlight="hover"
              items={[
                { id: 'share', label: 'Share', icon: ShareIcon },
                { id: 'copy', label: 'Copy link', icon: LinkIcon },
                { id: 'download', label: 'Download', icon: DownloadIcon },
                { type: 'divider' },
                { id: 'delete', label: 'Delete', icon: TrashIcon },
              ]}
            />
          </div>
        ),
        code: `<List
  label="Actions"
  highlight="hover"
  items={[
    { id: 'share', label: 'Share', icon: ShareIcon },
    { id: 'copy', label: 'Copy link', icon: LinkIcon },
    { id: 'download', label: 'Download', icon: DownloadIcon },
    { type: 'divider' },
    { id: 'delete', label: 'Delete', icon: TrashIcon },
  ]}
/>`,
      },
    ],
  },
  {
    id: 'tab-bar',
    name: 'TabBar',
    group: 'menus',
    description:
      'Always-visible navigation bar with a liquid selection pill: fixed to the bottom of the screen, or inline in a header.',
    card: (
      <TabBar
        layout="inline"
        position="static"
        enterFrom={false}
        tabs={[
          { icon: HomeIcon, label: 'Home' },
          { icon: HeartIcon, label: 'Saved', value: 3 },
        ]}
      />
    ),
    demos: [
      {
        title: 'Default',
        description: 'In the app it is fixed to the viewport; here it is pinned to the preview.',
        stage: { minHeight: 220, device: true },
        preview: (
          <TabBar
            tabs={[
              { icon: HomeIcon, label: 'Home' },
              { icon: SearchIcon, label: 'Search' },
              { icon: HeartIcon, label: 'Saved' },
              { icon: UserIcon, label: 'Profile' },
            ]}
          />
        ),
        code: `<TabBar
  tabs={[
    { icon: HomeIcon, label: 'Home' },
    { icon: SearchIcon, label: 'Search' },
    { icon: HeartIcon, label: 'Saved' },
    { icon: UserIcon, label: 'Profile' },
  ]}
  onChange={(index) => console.log(index)}
/>`,
      },
      {
        title: 'Enter from',
        description: 'Side the bar slides in from on mount, or none to show it without animation. Default: bottom.',
        stage: { minHeight: 300, device: true },
        preview: (
          <DirectionDemo initial="bottom" options={['bottom', 'top', 'left', 'right', 'none']} label="enterFrom">
            {(side) => (
              <TabBar
                enterFrom={side === 'none' ? false : side}
                tabs={[
                  { icon: HomeIcon, label: 'Home' },
                  { icon: SearchIcon, label: 'Search' },
                  { icon: HeartIcon, label: 'Saved' },
                  { icon: UserIcon, label: 'Profile' },
                ]}
              />
            )}
          </DirectionDemo>
        ),
        code: `<TabBar
  enterFrom="bottom" // 'bottom' | 'top' | 'left' | 'right' | false
  tabs={[
    { icon: HomeIcon, label: 'Home' },
    { icon: SearchIcon, label: 'Search' },
    { icon: HeartIcon, label: 'Saved' },
    { icon: UserIcon, label: 'Profile' },
  ]}
/>`,
      },
      {
        title: 'Inline with values',
        description:
          'layout="inline" puts icon, label and value on one row; each tab is as wide as its content and the pill stretches to follow it. position="static" keeps the bar in the page flow, e.g. in a header.',
        stage: { minHeight: 160 },
        preview: (
          <TabBar
            layout="inline"
            position="static"
            enterFrom={false}
            tabs={[
              { icon: HomeIcon, label: 'Home', value: 3 },
              { icon: FolderIcon, label: 'Projects', value: 3 },
              { icon: LinkIcon, label: 'Links', value: 2 },
            ]}
          />
        ),
        code: `<TabBar
  layout="inline"
  position="static"
  enterFrom={false}
  tabs={[
    { icon: HomeIcon, label: 'Home', value: 3 },
    { icon: FolderIcon, label: 'Projects', value: 3 },
    { icon: LinkIcon, label: 'Links', value: 2 },
  ]}
/>`,
      },
      {
        title: 'Values as badges',
        description: 'In the default stacked layout the value becomes a small badge next to the icon.',
        stage: { minHeight: 220, device: true },
        preview: (
          <TabBar
            tabs={[
              { icon: HomeIcon, label: 'Home' },
              { icon: MessageIcon, label: 'Inbox', value: 12 },
              { icon: HeartIcon, label: 'Saved' },
              { icon: UserIcon, label: 'Profile', value: '!' },
            ]}
          />
        ),
        code: `<TabBar
  tabs={[
    { icon: HomeIcon, label: 'Home' },
    { icon: MessageIcon, label: 'Inbox', value: 12 },
    { icon: HeartIcon, label: 'Saved' },
    { icon: UserIcon, label: 'Profile', value: '!' },
  ]}
/>`,
      },
    ],
  },
  {
    id: 'expand-button',
    name: 'ExpandButton',
    group: 'menus',
    description: "Icon button that expands into a label when pressed, with a pop and a burst.",
    demos: [
      {
        title: 'With label',
        preview: (
          <div style={{ display: 'flex', gap: 12 }}>
            <ExpandButton icon={HeartIcon} label="Added" activeColor="#e11d48" />
            <ExpandButton icon={BookmarkIcon} label="Saved" activeColor="#2563eb" />
          </div>
        ),
        code: `<ExpandButton icon={HeartIcon} label="Added" activeColor="#e11d48" />
<ExpandButton icon={BookmarkIcon} label="Saved" activeColor="#2563eb" />`,
      },
      {
        title: 'Icon only',
        description: 'The label is only announced to screen readers.',
        preview: <ExpandButton icon={StarIcon} label="Starred" iconOnly activeColor="#f59e0b" />,
        code: `<ExpandButton icon={StarIcon} label="Starred" iconOnly activeColor="#f59e0b" />`,
      },
      {
        title: 'Action variant',
        description: 'Label always visible, onClick runs an action. Used by Dialog.',
        preview: (
          <div style={{ display: 'flex', gap: 12 }}>
            <ExpandButton variant="action" label="Cancel" />
            <ExpandButton variant="action" label="Delete" icon={TrashIcon} activeColor="#e11d48" />
          </div>
        ),
        code: `<ExpandButton variant="action" label="Cancel" onClick={cancel} />
<ExpandButton variant="action" label="Delete" icon={TrashIcon} activeColor="#e11d48" onClick={remove} />`,
      },
      {
        title: 'Drip',
        description: 'Drops keep dripping from the bottom edge and melt into the button, like a liquid logo.',
        stage: { minHeight: 160 },
        preview: (
          <div style={{ display: 'flex', gap: 12 }}>
            <ExpandButton drip icon={HeartIcon} label="Added" activeColor="#e11d48" />
            <ExpandButton drip variant="action" label="Subscribe" activeColor="#2563eb" />
          </div>
        ),
        code: `<ExpandButton drip icon={HeartIcon} label="Added" activeColor="#e11d48" />
<ExpandButton drip variant="action" label="Subscribe" activeColor="#2563eb" />`,
      },
      {
        title: 'Drip on hover',
        description: 'A liquid blob drips only while the pointer is over the button; on leave each drop finishes its fall.',
        stage: { minHeight: 160 },
        preview: (
          <div style={{ display: 'flex', gap: 12 }}>
            <ExpandButton drip="hover" icon={BookmarkIcon} label="Saved" activeColor="#2563eb" />
            <ExpandButton drip="hover" variant="action" label="Delete" icon={TrashIcon} activeColor="#e11d48" />
          </div>
        ),
        code: `<ExpandButton drip="hover" icon={BookmarkIcon} label="Saved" activeColor="#2563eb" />
<ExpandButton drip="hover" variant="action" label="Delete" icon={TrashIcon} activeColor="#e11d48" />`,
      },
    ],
  },
  {
    id: 'gloop-loading',
    name: 'GloopLoading',
    group: 'various',
    description: 'A liquid loader: a drop falls in, bounces, swells into a blob and keeps dripping.',
    card: <GloopLoading size={56} title="Loading" />,
    demos: [
      {
        title: 'Title and description',
        stage: { minHeight: 280 },
        preview: <GloopLoading title="Loading" description="Fetching your data…" />,
        code: `<GloopLoading title="Loading" description="Fetching your data…" />`,
      },
      {
        title: 'Try it',
        description: 'Change the size, the color and the speed of the blob.',
        stage: { minHeight: 420 },
        preview: <GloopLoadingPlayground />,
        code: `<GloopLoading
  size={96}
  speed={1}
  color={['#ff7ab6', '#7b5cff']}
  title="Loading"
  description="Fetching your data…"
/>`,
      },
      {
        title: 'Solid colors, sizes and speeds',
        description: 'Without a title it is announced with label (default "Loading"). intro={false} skips the fall and starts dripping right away.',
        stage: { minHeight: 200 },
        preview: (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32 }}>
            <GloopLoading size={40} speed={2} color="#e11d48" intro={false} />
            <GloopLoading size={64} color={['#38bdf8', '#2563eb']} />
            <GloopLoading size={88} speed={0.5} color="#16a34a" title="Slow" />
          </div>
        ),
        code: `<GloopLoading size={40} speed={2} color="#e11d48" intro={false} />
<GloopLoading size={64} color={['#38bdf8', '#2563eb']} />
<GloopLoading size={88} speed={0.5} color="#16a34a" title="Slow" />`,
      },
    ],
  },
  {
    id: 'progress-bar',
    name: 'ProgressBar',
    group: 'various',
    status: 'experimental',
    description:
      'A bar that fills up like liquid: a blob head springs ahead on every update and the fill catches up. Without a value it runs forever.',
    card: <ProgressBar label="Upload" value={60} />,
    demos: [
      {
        title: 'Default',
        preview: (
          <div style={{ width: 'min(100%, 360px)' }}>
            <ProgressBar label="Upload" value={60} />
          </div>
        ),
        code: `<ProgressBar label="Upload" value={60} />`,
      },
      {
        title: 'Animated',
        description:
          'Every time the value changes the head jumps ahead with a bounce, stretching a liquid neck that the fill then swallows. At 100% it gulps once.',
        stage: { minHeight: 200 },
        preview: <ProgressBarAutoDemo />,
        code: `const [value, setValue] = useState(0)

<ProgressBar label="Upload" value={value} showValue="bubble" color={['#ff7ab6', '#7b5cff']} />`,
      },
      {
        title: 'Try it',
        description: 'Drag the value to feel the spring, then try thickness, colors, drip and the indeterminate mode.',
        stage: { minHeight: 420 },
        preview: <ProgressBarPlayground />,
        code: `<ProgressBar
  label="Progress"
  value={45}
  thickness={10}
  drip
  showValue="bubble"
/>`,
      },
      {
        title: 'Indeterminate',
        description:
          'Without value (undefined or null) blobs run along the track, merge when they touch and pull apart. aria-valuenow is left out, as the ARIA spec asks.',
        preview: (
          <div style={{ display: 'grid', gap: 24, width: 'min(100%, 360px)' }}>
            <ProgressBar label="Loading" />
            <ProgressBar label="Loading" color={['#38bdf8', '#2563eb']} thickness={6} speed={0.6} />
          </div>
        ),
        code: `<ProgressBar label="Loading" />
<ProgressBar label="Loading" color={['#38bdf8', '#2563eb']} thickness={6} speed={0.6} />`,
      },
      {
        title: 'Drip',
        description: 'drip makes drops ooze out of the fill (or out of the running blobs). The space below is reserved, so the layout never jumps.',
        stage: { minHeight: 220 },
        preview: (
          <div style={{ display: 'grid', gap: 16, width: 'min(100%, 360px)' }}>
            <ProgressBar label="Upload" value={70} drip color={['#ff7ab6', '#7b5cff']} />
            <ProgressBar label="Loading" drip color="#16a34a" />
          </div>
        ),
        code: `<ProgressBar label="Upload" value={70} drip color={['#ff7ab6', '#7b5cff']} />
<ProgressBar label="Loading" drip color="#16a34a" />`,
      },
      {
        title: 'Value inside and sizes',
        description: 'showValue="inside" writes the value at the end of the fill (thickness is raised to at least 18px). formatValue changes the text.',
        preview: (
          <div style={{ display: 'grid', gap: 16, width: 'min(100%, 360px)' }}>
            <ProgressBar label="Storage" value={72} showValue="inside" color="#e11d48" />
            <ProgressBar
              label="Files"
              value={9}
              max={12}
              thickness={22}
              showValue="inside"
              formatValue={(v) => `${v} / 12 files`}
              color={['#a3e635', '#16a34a']}
            />
            <ProgressBar label="Steps" value={2} max={5} thickness={4} />
          </div>
        ),
        code: `<ProgressBar label="Storage" value={72} showValue="inside" color="#e11d48" />
<ProgressBar
  label="Files"
  value={9}
  max={12}
  thickness={22}
  showValue="inside"
  formatValue={(v) => \`\${v} / 12 files\`}
  color={['#a3e635', '#16a34a']}
/>
<ProgressBar label="Steps" value={2} max={5} thickness={4} />`,
      },
    ],
  },
  {
    id: 'shape-editor',
    name: 'ShapeEditor',
    group: 'various',
    description: 'Excalidraw-style toolbar with nested popovers, revealed when the shape is selected.',
    status: 'experimental',
    notice:
      "This component is an early prototype: it doesn't accept any props yet, so colors, tools and shapes can't be customized. We're working on it, and the API may change.",
    demos: [
      {
        title: 'Click the rectangle',
        stage: { bleed: true },
        preview: <ShapeEditor />,
        code: `<ShapeEditor />`,
      },
    ],
  },
]
