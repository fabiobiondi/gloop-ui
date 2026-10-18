import type { ReactNode } from 'react'
import {
  ArcMenu,
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
  TabPop,
  TabFab,
  Tooltip,
} from 'gloop-ui'
import { CircleMenuContextDemo, CircleMenuPanelsDemo } from './CircleMenuPanels'
import DialogDemo, { DialogFormDemo } from './DialogDemo'
import ToastDemo, { ToastVariantsDemo } from './ToastDemo'
import ModalDemo, { LOREM, ModalCustomFooterDemo, ModalProgrammaticDemo } from './ModalDemo'
import { ControlledSliderDemo } from './SliderDemo'
import { GloopLoadingPlayground } from './GloopLoadingDemo'
import { ProgressBarAutoDemo, ProgressBarPlayground } from './ProgressBarDemo'
import { TextEditorDemo } from './TextEditorDemo'
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
  XIcon,
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
    id: 'arc-menu',
    name: 'ArcMenu',
    group: 'menus',
    status: 'experimental',
    description:
      'The same "+" with liquid blobs as CircleMenu, animated with CSS only: springs become linear() easings, no Motion.',
    notice:
      'ArcMenu is a copy of CircleMenu without Motion: same props, same behavior, but every animation is a CSS transition or keyframe. It is a test bench to drop the motion dependency.',
    demos: [
      {
        title: 'Circle · 3 icons',
        description: 'Share opens a sub-menu.',
        preview: (
          <ArcMenu
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
        code: `<ArcMenu
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
          <ArcMenu
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
        code: `<ArcMenu
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
          <ArcMenu
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
        code: `<ArcMenu
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
            <ArcMenu
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
  <ArcMenu
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
          <ArcMenu
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
        code: `<ArcMenu
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
          <ArcMenu
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
        code: `<ArcMenu
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
          <ArcMenu
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
        code: `<ArcMenu
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
        preview: <CircleMenuPanelsDemo variant="circle" menu="arc" />,
        code: `const [style, setStyle] = useState(initial)

<ArcMenu
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
        preview: <CircleMenuContextDemo menu="arc" />,
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
    <ArcMenu
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
        preview: <CircleMenuPanelsDemo variant="arc" menu="arc" />,
        code: `<ArcMenu
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
          <ArcMenu
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
        code: `<ArcMenu
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
    id: 'modal',
    name: 'Modal',
    group: 'overlays',
    description:
      'Full-size modal that oozes open as a soft blob: optional title with close button, scrollable content and a footer with buttons or custom JSX.',
    demos: [
      {
        title: 'Title · scrollable content · actions',
        description: 'The content adapts to the available height and scrolls; header and footer stay put.',
        preview: (
          <ModalDemo
            trigger="Release notes"
            title="What's new in 0.4"
            body={LOREM}
            actions={[
              { label: 'Later' },
              { label: 'Got it', icon: CheckIcon, color: 'var(--ui-accent)', autoFocus: true },
            ]}
          />
        ),
        code: `const [open, setOpen] = useState(false)

<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="What's new in 0.4"
  actions={[
    { label: 'Later' },
    { label: 'Got it', icon: CheckIcon, color: 'var(--ui-accent)', autoFocus: true },
  ]}
>
  {longContent}
</Modal>`,
      },
      {
        title: 'Entrance · swell vs drop',
        description:
          'enter="drop": a drop flies out of the button you clicked, splats in the middle and spreads into the card like jelly. On close it flies back to the button. Default is "swell".',
        preview: (
          <div className="md-row">
            <ModalDemo
              trigger="Swell"
              size="sm"
              title="Swell"
              body={<p>One drop that swells into the card.</p>}
              actions={[{ label: 'Close', icon: XIcon }]}
            />
            <ModalDemo
              trigger="Drop · small"
              size="sm"
              enter="drop"
              title="Drop"
              body={<p>It came out of the button you clicked.</p>}
              actions={[{ label: 'Close', icon: XIcon }]}
            />
            <ModalDemo
              trigger="Drop · large"
              enter="drop"
              title="What's new in 0.4"
              body={LOREM}
              actions={[{ label: 'Close', icon: XIcon }]}
            />
          </div>
        ),
        code: `<Modal open={open} onClose={() => setOpen(false)} enter="drop" title="Drop">
  <p>It came out of the button you clicked.</p>
</Modal>`,
      },
      {
        title: 'Jelly · 0, 0.5 (default), 1',
        description: 'jelly sets how much the card wobbles when it opens: bounce of width and height, and wavy sides.',
        preview: (
          <div className="md-row">
            <ModalDemo trigger="Jelly 0" size="sm" jelly={0} title="Jelly 0" body={<p>No bounce, still sides.</p>} />
            <ModalDemo trigger="Jelly 0.5" size="sm" title="Jelly 0.5" body={<p>The default: a soft wobble.</p>} />
            <ModalDemo trigger="Jelly 1" size="sm" jelly={1} title="Jelly 1" body={<p>Wide bounces, wavy sides.</p>} />
          </div>
        ),
        code: `<Modal open={open} onClose={() => setOpen(false)} jelly={1} title="Jelly 1">
  <p>Wide bounces, wavy sides.</p>
</Modal>`,
      },
      {
        title: 'Custom footer',
        description:
          'footer takes any JSX; with actions it sits on the left. An onClick that returns false keeps the modal open: Accept waits for the checkbox.',
        preview: <ModalCustomFooterDemo />,
        code: `<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Terms of service"
  footer={
    <label>
      <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I agree
    </label>
  }
  actions={[
    { label: 'Decline', icon: XIcon },
    { label: 'Accept', icon: CheckIcon, color: 'var(--ui-accent)', onClick: () => (agree ? undefined : false) },
  ]}
>
  {terms}
</Modal>`,
      },
      {
        title: 'Programmatic · useModal()',
        description:
          'Inside a ModalProvider, useModal().open() shows a modal without state. handle.result resolves with the value of the button pressed (undefined on X, Escape or backdrop).',
        preview: <ModalProgrammaticDemo />,
        code: `// Once, near the root
<ModalProvider>
  <App />
</ModalProvider>

// Anywhere below
const modal = useModal()

async function confirmDelete() {
  const ok = await modal.open<boolean>({
    title: 'Delete 3 files?',
    size: 'sm',
    content: <p>They will be moved to the trash.</p>,
    actions: [
      { label: 'Cancel', value: false },
      { label: 'Delete', icon: TrashIcon, color: '#e11d48', value: true },
    ],
  }).result
  if (ok) deleteFiles()
}

// The handle closes it from your own code
const handle = modal.open({ title: 'Uploading…', content: <ProgressBar indeterminate /> })
await upload()
handle.close()`,
      },
      {
        title: 'Custom title · no close button',
        description: 'title also takes JSX. closeButton={false} hides the X; Escape and the backdrop still close it.',
        preview: (
          <ModalDemo
            trigger="Custom title"
            size="sm"
            closeButton={false}
            title={
              <span className="md-row" style={{ justifyContent: 'flex-start', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'grid', width: 22, height: 22 }}>{SparkleIcon}</span>
                <strong style={{ fontSize: 18 }}>Pro tip</strong>
              </span>
            }
            body={<p>Press Escape or click outside to close this modal.</p>}
          />
        ),
        code: `<Modal
  open={open}
  onClose={() => setOpen(false)}
  size="sm"
  closeButton={false}
  title={
    <span className="title">
      {SparkleIcon} <strong>Pro tip</strong>
    </span>
  }
>
  <p>Press Escape or click outside to close this modal.</p>
</Modal>`,
      },
      {
        title: 'Large · blurred backdrop',
        preview: (
          <ModalDemo
            trigger="Large modal"
            size="lg"
            title="Project overview"
            body={LOREM}
            backdropColor="#312e81"
            backdropOpacity={0.3}
            backdropBlur={8}
            actions={[{ label: 'Close', icon: XIcon }]}
          />
        ),
        code: `<Modal
  open={open}
  onClose={() => setOpen(false)}
  size="lg"
  title="Project overview"
  backdropColor="#312e81"
  backdropOpacity={0.3}
  backdropBlur={8}
  actions={[{ label: 'Close', icon: XIcon }]}
>
  {content}
</Modal>`,
      },
    ],
  },
  {
    id: 'toast',
    name: 'Toast',
    group: 'overlays',
    status: 'experimental',
    description:
      'Notification that drips from the edge of the screen as a liquid drop and swells into a pill. Closes by itself; hovering pauses the timer.',
    demos: [
      {
        title: 'From the top',
        description: 'The drop detaches from the top edge, stretches down and swells. Click again to close it early.',
        preview: (
          <ToastDemo trigger="Show toast" title="Saved" icon={CheckIcon}>
            Your changes are live.
          </ToastDemo>
        ),
        code: `const [open, setOpen] = useState(false)

<Toast open={open} onClose={() => setOpen(false)} title="Saved" icon={CheckIcon}>
  Your changes are live.
</Toast>`,
      },
      {
        title: 'Variants · custom color',
        description:
          'info, success, warning and error fill the whole liquid blob and bring their own icon (icon={null} removes it). color takes any CSS color and wins over variant. Errors are announced right away (role="alert").',
        preview: <ToastVariantsDemo />,
        code: `<Toast open={open} onClose={close} variant="success" title="Saved">
  Your changes are live.
</Toast>

<Toast open={open} onClose={close} variant="error" title="Upload failed">
  Check your connection and retry.
</Toast>

// Any CSS color
<Toast open={open} onClose={close} color="#7c3aed" title="Custom color">
  Any CSS color via color.
</Toast>

/* Theme the variant colors */
:root {
  --ui-info: #2563eb;
  --ui-success: #15803d;
  --ui-warning: #f59e0b;
  --ui-error: #dc2626;
}`,
      },
      {
        title: 'From the bottom · persistent',
        description: 'duration={Infinity} keeps it open until the X is pressed.',
        preview: (
          <ToastDemo trigger="Show toast" position="bottom" duration={Infinity} icon={AlertIcon}>
            Connection lost. Retrying…
          </ToastDemo>
        ),
        code: `<Toast
  open={open}
  onClose={() => setOpen(false)}
  position="bottom"
  duration={Infinity}
  icon={AlertIcon}
>
  Connection lost. Retrying…
</Toast>`,
      },
      {
        title: 'Aligned to the end · no X',
        preview: (
          <ToastDemo trigger="Show toast" align="end" closeButton={false} duration={2500}>
            Link copied
          </ToastDemo>
        ),
        code: `<Toast open={open} onClose={() => setOpen(false)} align="end" closeButton={false} duration={2500}>
  Link copied
</Toast>`,
      },
      {
        title: 'Slow motion',
        description: 'speed={0.2}: the edge swells, the drop drips down with a liquid neck, then swells into the pill.',
        preview: (
          <ToastDemo trigger="Show toast" speed={0.2} duration={Infinity} title="Slow motion" icon={SparkleIcon}>
            Watch the drop detach from the edge.
          </ToastDemo>
        ),
        code: `<Toast open={open} onClose={() => setOpen(false)} speed={0.2} duration={Infinity} title="Slow motion">
  Watch the drop detach from the edge.
</Toast>`,
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
        title: 'Jelly · off, default (0.5), 1',
        description: 'jelly makes the bubble wobble when it opens. Just jelly uses the default, 0.5, like the Modal; a number from 0 to 1 sets how much.',
        preview: (
          <div style={{ display: 'flex', gap: 12 }}>
            <Tooltip content="No jelly">
              <DemoButton>Off</DemoButton>
            </Tooltip>
            <Tooltip content="Jelly: the default wobble" jelly>
              <DemoButton>jelly</DemoButton>
            </Tooltip>
            <Tooltip content="Jelly 1: wide bounces" jelly={1}>
              <DemoButton>jelly={'{1}'}</DemoButton>
            </Tooltip>
          </div>
        ),
        code: `<Tooltip content="Jelly: the default wobble" jelly>
  <button>jelly</button>
</Tooltip>

<Tooltip content="Jelly 1: wide bounces" jelly={1}>
  <button>jelly={1}</button>
</Tooltip>`,
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
    id: 'tab-pop',
    name: 'TabPop',
    group: 'menus',
    description: 'A "+" that blooms a dark tab bar above itself.',
    demos: [
      {
        title: 'Default',
        stage: { minHeight: 240, align: 'end' },
        preview: (
          <TabPop
            icon={PlusIcon}
            label="Open menu"
            tabs={[
              { icon: HomeIcon, label: 'Home' },
              { icon: SearchIcon, label: 'Search' },
              { icon: UserIcon, label: 'Profile' },
            ]}
          />
        ),
        code: `<TabPop
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
          <TabPop
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
        code: `<TabPop
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
        title: 'Animations',
        description:
          'animation sets how the bar opens. slide (default): the bar leaves the "+" like a drop, growing as it moves away. pop: the drop reaches out from the "×" first, then the bar pops open from its center toward the sides with a slight bounce. bounce: opens like pop, with a back-out ease on its width: it overshoots its size, then settles.',
        stage: { minHeight: 240, align: 'end' },
        preview: (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 170 }}>
            {(['slide', 'pop', 'bounce'] as const).map((animation) => (
              <TabPop
                key={animation}
                icon={PlusIcon}
                label={`Open menu (${animation})`}
                animation={animation}
                tabs={[
                  { icon: HomeIcon, label: 'Home' },
                  { icon: SearchIcon, label: 'Search' },
                  { icon: UserIcon, label: 'Profile' },
                ]}
              />
            ))}
          </div>
        ),
        code: `<TabPop
  icon={PlusIcon}
  label="Open menu"
  animation="slide" // default
  tabs={tabs}
/>

<TabPop
  icon={PlusIcon}
  label="Open menu"
  animation="pop"
  tabs={tabs}
/>

<TabPop
  icon={PlusIcon}
  label="Open menu"
  animation="bounce"
  tabs={tabs}
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
              <TabPop
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
        code: `<TabPop
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
            <TabPop
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
  <TabPop
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
      {
        title: 'Text editor',
        description: 'The classic formatting toolbar of a WYSIWYG editor, with icons from react-icons. iconOnly hides the tab labels, tabGap sets the space between icons, down to 0.',
        stage: { minHeight: 340, align: 'end' },
        preview: <TextEditorDemo />,
        code: `import { TabPop } from 'gloop-ui'
import {
  LuBold,
  LuItalic,
  LuLink,
  LuList,
  LuPlus,
  LuStrikethrough,
  LuUnderline,
} from 'react-icons/lu'

<TabPop
  icon={<LuPlus />}
  label="Text formatting"
  iconOnly // only the icons, labels stay for screen readers
  tabGap={12} // px between icons, default 50 (0: icons side by side)
  tabs={[
    { icon: <LuBold />, label: 'Bold' },
    { icon: <LuItalic />, label: 'Italic' },
    { icon: <LuUnderline />, label: 'Underline' },
    { icon: <LuStrikethrough />, label: 'Strike' },
    { icon: <LuList />, label: 'List' },
    { icon: <LuLink />, label: 'Link' },
  ]}
/>`,
      },
    ],
  },
  {
    id: 'tab-fab',
    name: 'TabFab',
    group: 'menus',
    description: 'The "+" itself morphs into the tab bar; tabs with items open a sub-menu panel.',
    demos: [
      {
        title: 'Default',
        preview: (
          <TabFab
            icon={PlusIcon}
            label="Open menu"
            tabs={[
              { icon: HomeIcon, label: 'Home' },
              { icon: SearchIcon, label: 'Search' },
              { icon: UserIcon, label: 'Profile' },
            ]}
          />
        ),
        code: `<TabFab
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
              <TabFab
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
        code: `<TabFab
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
            <TabFab
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
  <TabFab
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
      {
        title: 'With sub-menus',
        description: 'Open the tab bar, then pick an icon to see its sub-menu.',
        stage: { minHeight: 340, align: 'end' },
        preview: (
          <TabFab
            icon={PlusIcon}
            label="Open menu"
            tabs={[
              { icon: HomeIcon, label: 'Home', items: ['Dashboard', 'Activity'] },
              { icon: SearchIcon, label: 'Search', items: ['Recent', 'Saved', 'Advanced filters'] },
              { icon: UserIcon, label: 'Profile', items: ['Settings', 'Notifications', 'Log out'] },
            ]}
          />
        ),
        code: `<TabFab
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
          <TabFab
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
        code: `<TabFab
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
          <TabFab
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
        code: `<TabFab
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
        title: 'Sub-menus: direction',
        description:
          'left / right: horizontal bar with sub-menus above it. top / bottom: a column, and each sub-menu opens to the right of its tab. Default: left.',
        stage: { minHeight: 460 },
        preview: (
          <DirectionDemo initial="left">
            {(direction) => (
              <TabFab
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
        code: `<TabFab
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
        title: 'Sub-menus: auto placement',
        description:
          'direction="auto" picks the side of the bar on open. Sub-menus flip by themselves, with or without auto: below the bar when there is no room above (top corners), to the left of a column when there is no room on the right. They follow scroll and resize while open.',
        stage: { minHeight: 480 },
        preview: (
          <AutoPlacementDemo>
            <TabFab
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
  <TabFab
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
        title: 'Vertical',
        description:
          'orientation="vertical" stacks the tabs in a column and the pill slides up and down. Works with both layouts; fixed bars are pinned to the left edge.',
        stage: { minHeight: 280 },
        preview: (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <TabBar
              orientation="vertical"
              position="static"
              enterFrom={false}
              tabs={[
                { icon: HomeIcon, label: 'Home' },
                { icon: SearchIcon, label: 'Search' },
                { icon: HeartIcon, label: 'Saved' },
                { icon: UserIcon, label: 'Profile' },
              ]}
            />
            <TabBar
              orientation="vertical"
              layout="inline"
              position="static"
              enterFrom={false}
              tabs={[
                { icon: HomeIcon, label: 'Home', value: 3 },
                { icon: FolderIcon, label: 'Projects', value: 3 },
                { icon: LinkIcon, label: 'Links', value: 2 },
              ]}
            />
          </div>
        ),
        code: `<TabBar
  orientation="vertical"
  position="static"
  tabs={[
    { icon: HomeIcon, label: 'Home' },
    { icon: SearchIcon, label: 'Search' },
    { icon: HeartIcon, label: 'Saved' },
    { icon: UserIcon, label: 'Profile' },
  ]}
/>

<TabBar
  orientation="vertical"
  layout="inline"
  position="static"
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
