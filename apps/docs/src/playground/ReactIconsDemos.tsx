import { useState } from 'react'
import { Dialog, ExpandButton, TabBar } from 'gloop-ui'
import { FaRegHeart } from 'react-icons/fa6'
import { LuBell, LuHouse, LuSearch, LuUser } from 'react-icons/lu'
import { MdCheck, MdClose, MdDeleteOutline } from 'react-icons/md'

// Esempi della guida "With React Icons": ogni anteprima ha accanto il codice completo, import compresi

export const REACT_ICONS_INSTALL = `npm install react-icons`

export function ExpandButtonExample() {
  return <ExpandButton icon={<FaRegHeart />} label="Liked" />
}

export const EXPAND_BUTTON_CODE = `import { ExpandButton } from 'gloop-ui'
import { FaRegHeart } from 'react-icons/fa6'

export function LikeButton() {
  return <ExpandButton icon={<FaRegHeart />} label="Liked" />
}`

export function TabBarExample() {
  return (
    <TabBar
      layout="inline"
      position="static"
      enterFrom={false}
      tabs={[
        { icon: <LuHouse />, label: 'Home' },
        { icon: <LuSearch />, label: 'Search' },
        { icon: <LuBell />, label: 'Alerts', value: 3 },
        { icon: <LuUser />, label: 'Profile' },
      ]}
    />
  )
}

export const TAB_BAR_CODE = `import { TabBar } from 'gloop-ui'
import { LuBell, LuHouse, LuSearch, LuUser } from 'react-icons/lu'

export function Header() {
  return (
    <TabBar
      layout="inline"
      position="static"
      tabs={[
        { icon: <LuHouse />, label: 'Home' },
        { icon: <LuSearch />, label: 'Search' },
        { icon: <LuBell />, label: 'Alerts', value: 3 },
        { icon: <LuUser />, label: 'Profile' },
      ]}
    />
  )
}`

export function DialogExample() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ExpandButton variant="action" label="Delete file" icon={<MdDeleteOutline />} onClick={() => setOpen(true)} />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete this file?"
        icon={<MdDeleteOutline />}
        actions={[
          { label: 'Cancel', icon: <MdClose /> },
          { label: 'Delete', icon: <MdCheck />, color: '#e11d48' },
        ]}
      >
        It will be gone for good.
      </Dialog>
    </>
  )
}

export const DIALOG_CODE = `import { useState } from 'react'
import { Dialog, ExpandButton } from 'gloop-ui'
import { MdCheck, MdClose, MdDeleteOutline } from 'react-icons/md'

export function DeleteFile() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ExpandButton
        variant="action"
        label="Delete file"
        icon={<MdDeleteOutline />}
        onClick={() => setOpen(true)}
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete this file?"
        icon={<MdDeleteOutline />}
        actions={[
          { label: 'Cancel', icon: <MdClose /> },
          { label: 'Delete', icon: <MdCheck />, color: '#e11d48' },
        ]}
      >
        It will be gone for good.
      </Dialog>
    </>
  )
}`
