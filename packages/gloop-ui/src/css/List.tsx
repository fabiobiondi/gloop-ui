import { useState } from 'react'
import ListCore, { flattenEntries, type ListDivider, type ListEntry, type ListGroup, type ListItem } from './list/ListCore'
import { GloopMotionProvider, pickMotionProps, type MotionProps } from '../components/motion-context'
import { useCssMotion } from '../components/css-motion'

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
  // Animata solo in CSS (list/List.css): la molla morph della pressione è lì
  const m = useCssMotion(motionProps)
  const [internal, setInternal] = useState(defaultValue)
  const selected = value !== undefined ? value : internal
  const flat = flattenEntries(items)
  const selectedIndex = selected === null ? -1 : flat.findIndex((item) => item.id === selected)

  const showSelected = highlight === 'both' || highlight === 'selected'
  const Root = flat.some((item) => item.href !== undefined) ? 'nav' : 'div'

  return (
    <GloopMotionProvider {...pickMotionProps(motionProps)}>
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
    </GloopMotionProvider>
  )
}

export default List
