import type { ReactNode } from 'react'
import {
  CircleMenu,
  ExpandButton,
  Search,
  ShapeEditor,
  TabBar,
  TabMenu,
  TabMenuMotion,
  TabMenuSubmenu,
} from 'gloop-ui'
import DialogDemo from './DialogDemo'
import {
  AlertIcon,
  BookmarkIcon,
  CheckIcon,
  CameraIcon,
  CopyIcon,
  DownloadIcon,
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
  demos: Demo[]
}

export const entries: Entry[] = [
  {
    id: 'expand-button',
    name: 'ExpandButton',
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
    ],
  },
  {
    id: 'search',
    name: 'Search',
    description: 'A magnifier that stretches into a field to the right; the lens morphs into a close icon.',
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
    ],
  },
  {
    id: 'circle-menu',
    name: 'CircleMenu',
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
    ],
  },
  {
    id: 'tab-menu',
    name: 'TabMenu',
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
    ],
  },
  {
    id: 'tab-menu-motion',
    name: 'TabMenuMotion',
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
    ],
  },
  {
    id: 'tab-menu-submenu',
    name: 'TabMenuSubmenu',
    description: 'Morphing tab bar where each tab can open a panel of items above it.',
    demos: [
      {
        title: 'With sub-menus',
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
    ],
  },
  {
    id: 'tab-bar',
    name: 'TabBar',
    description: 'Always-visible bar fixed to the bottom of the screen, with a liquid selection pill.',
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
              { icon: HeartIcon, label: 'Favorites' },
              { icon: UserIcon, label: 'Profile' },
            ]}
          />
        ),
        code: `<TabBar
  tabs={[
    { icon: HomeIcon, label: 'Home' },
    { icon: SearchIcon, label: 'Search' },
    { icon: HeartIcon, label: 'Favorites' },
    { icon: UserIcon, label: 'Profile' },
  ]}
  onChange={(index) => console.log(index)}
/>`,
      },
    ],
  },
  {
    id: 'shape-editor',
    name: 'ShapeEditor',
    description: 'Excalidraw-style toolbar with nested popovers, revealed when the shape is selected.',
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
