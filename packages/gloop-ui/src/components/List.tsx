import { useState } from 'react'
import { type Transition } from 'motion/react'
import ListCore, { flattenEntries, type ListDivider, type ListEntry, type ListGroup, type ListItem } from './list/ListCore'
import { MotionScope, useGloopMotion, type MotionProps } from './motion'

export type { ListDivider, ListEntry, ListGroup, ListItem }

export type ListProps = {
  /** Voci, gruppi con un titolo ({ type: 'group' }) e divisori ({ type: 'divider' }) */
  items: ListEntry[]
  /** Id della voce selezionata (controllato) */
  value?: string | null
  /** Id selezionato all'inizio (non controllato) */
  defaultValue?: string | null
  onChange?: (id: string, item: ListItem) => void
  /** Cosa segue la pillola liquida */
  highlight?: 'both' | 'selected' | 'hover' | 'none'
  /** Nome accessibile; con voci href la lista è una <nav> */
  label?: string
  itemHeight?: number
  gap?: number
  radius?: number
  className?: string
} & MotionProps

const morph: Transition = { type: 'spring', duration: 0.5, bounce: 0.25 }

function List({
  items,
  value,
  defaultValue = null,
  onChange,
  highlight = 'both',
  label,
  itemHeight,
  gap,
  radius,
  className,
  ...motionProps
}: ListProps) {
  const m = useGloopMotion(motionProps)
  const [internal, setInternal] = useState(defaultValue)
  const selected = value !== undefined ? value : internal
  const flat = flattenEntries(items)
  const selectedIndex = selected === null ? -1 : flat.findIndex((item) => item.id === selected)

  const showSelected = highlight === 'both' || highlight === 'selected'
  const Root = flat.some((item) => item.href !== undefined) ? 'nav' : 'div'

  return (
    <MotionScope m={m} props={motionProps} transition={morph}>
      <Root
        {...m.rootProps}
        className={className ? `list ${className}` : 'list'}
        // Un <div> ha bisogno di un ruolo per esporre il nome
        role={Root === 'div' && label ? 'group' : undefined}
        aria-label={label}
      >
        <ListCore
          items={items}
          // aria-current resta sulla voce anche se la pillola fissa è spenta
          selectedIndex={selectedIndex}
          showSelected={showSelected}
          hover={highlight === 'both' || highlight === 'hover'}
          itemHeight={itemHeight}
          gap={gap}
          radius={radius}
          onItemClick={(_, item) => {
            // I link navigano da soli (niente preventDefault)
            if (value === undefined) setInternal(item.id)
            onChange?.(item.id, item)
          }}
        />
      </Root>
    </MotionScope>
  )
}

export default List
