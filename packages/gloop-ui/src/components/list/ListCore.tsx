import { useId, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import GooPill from '../GooPill'
import '../theme.css'
import './List.css'

export type ListItem = {
  /** Identificativo univoco nella lista */
  id: string
  label: string
  icon?: ReactNode
  /** Contenuto secondario allineato a destra (contatori, scorciatoie…) */
  meta?: ReactNode
  /** Con href la voce è un link */
  href?: string
  disabled?: boolean
}

/** Linea orizzontale tra due voci */
export type ListDivider = { type: 'divider'; id?: string }

/** Voci raccolte sotto un titolo */
export type ListGroup = { type: 'group'; id: string; label: string; items: ListItem[] }

/** Cosa può stare in una lista: voci, gruppi di voci e divisori */
export type ListEntry = ListItem | ListDivider | ListGroup

const isDivider = (entry: ListEntry): entry is ListDivider => 'type' in entry && entry.type === 'divider'
const isGroup = (entry: ListEntry): entry is ListGroup => 'type' in entry && entry.type === 'group'

/** Solo le voci, nell'ordine in cui compaiono (gli indici di selectedIndex e onItemClick) */
export function flattenEntries(entries: ListEntry[]): ListItem[] {
  return entries.flatMap((entry) => (isDivider(entry) ? [] : isGroup(entry) ? entry.items : [entry]))
}

// Altezze fisse di titolo e divisore: la pillola calcola le posizioni senza misurare il DOM
const GROUP_LABEL_HEIGHT = 28
const DIVIDER_HEIGHT = 9

export type ListCoreProps = {
  items: ListEntry[]
  /** Voce selezionata: aria-current e pillola fissa */
  selectedIndex?: number | null
  /** Mostra la pillola fissa sulla voce selezionata */
  showSelected?: boolean
  /** Pillola leggera che segue cursore e focus */
  hover?: boolean
  hoverOpacity?: number
  itemHeight?: number
  gap?: number
  radius?: number
  /** Voci di un menu (TabMenuSubmenu): il role="menu" sta sul contenitore, ul e li diventano neutri */
  itemRole?: 'menuitem'
  onItemClick?: (index: number, item: ListItem, event: MouseEvent) => void
}

/*
 * Nucleo condiviso da List e TabMenuSubmenu: voci ad altezza fissa con una pillola
 * liquida sulla voce selezionata e una, più leggera, sotto cursore/focus.
 * Le misure arrivano solo da qui: la pillola le usa per il passo, il CSS tramite variabili.
 */
function ListCore({
  items,
  selectedIndex = null,
  showSelected = true,
  hover = false,
  hoverOpacity = 0.06,
  itemHeight = 40,
  gap = 2,
  radius = 14,
  itemRole,
  onItemClick,
}: ListCoreProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const groupIdPrefix = useId()
  const flat = flattenEntries(items)

  /*
   * Distanza dall'alto di ogni voce. Le righe (voci, titoli, divisori) hanno altezze fisse
   * e sono separate da `gap`, sia nella lista sia dentro i gruppi: basta sommarle.
   */
  const offsets: number[] = []
  let y = 0
  const row = (height: number) => {
    const top = y
    y += height + gap
    return top
  }
  for (const entry of items) {
    if (isDivider(entry)) row(DIVIDER_HEIGHT)
    else if (isGroup(entry)) {
      row(GROUP_LABEL_HEIGHT)
      for (let k = 0; k < entry.items.length; k++) offsets.push(row(itemHeight))
    } else offsets.push(row(itemHeight))
  }

  // step 1: l'indice passato alla pillola è già la distanza in px
  const pill = { step: 1, length: itemHeight, inset: 0, axis: 'y' as const, radius }
  const vars = {
    '--list-item-height': `${itemHeight}px`,
    '--list-gap': `${gap}px`,
    '--list-radius': `${radius}px`,
    '--list-group-label-height': `${GROUP_LABEL_HEIGHT}px`,
    '--list-divider-height': `${DIVIDER_HEIGHT}px`,
  } as CSSProperties

  // Le voci disabilitate non ricevono la pillola
  const track = (i: number) => (hover && !flat[i].disabled ? () => setHovered(i) : undefined)
  const neutral = itemRole ? 'none' : undefined

  const renderItem = (item: ListItem, i: number) => {
    const selected = i === selectedIndex
    const content = (
      <>
        {item.icon && (
          <span className="list__icon" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span className="list__label">{item.label}</span>
        {item.meta !== undefined && <span className="list__meta">{item.meta}</span>}
      </>
    )
    const common = {
      className: 'list__item',
      role: itemRole,
      onClick: (e: MouseEvent) => onItemClick?.(i, item, e),
      onPointerEnter: track(i),
      onFocus: track(i),
      onBlur: hover ? () => setHovered(null) : undefined,
      whileTap: item.disabled ? undefined : { scale: 0.97 },
    }

    return (
      <li key={item.id} role={neutral}>
        {item.href !== undefined ? (
          // Link disabilitato: senza href non è navigabile né raggiungibile col Tab
          <motion.a
            {...common}
            href={item.disabled ? undefined : item.href}
            aria-disabled={item.disabled || undefined}
            aria-current={selected ? 'page' : undefined}
          >
            {content}
          </motion.a>
        ) : (
          <motion.button
            {...common}
            type="button"
            disabled={item.disabled}
            aria-current={selected ? 'true' : undefined}
          >
            {content}
          </motion.button>
        )}
      </li>
    )
  }

  // Indice della prossima voce nella lista piatta
  let next = 0

  return (
    <div className="list__body" style={vars} onPointerLeave={() => setHovered(null)}>
      <AnimatePresence initial={false}>
        {showSelected && selectedIndex !== null && selectedIndex >= 0 && (
          <GooPill key="selected" index={offsets[selectedIndex]} {...pill} opacity={0.1} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {hover && hovered !== null && <GooPill key="hover" index={offsets[hovered]} {...pill} opacity={hoverOpacity} />}
      </AnimatePresence>

      <ul className="list__items" role={neutral}>
        {items.map((entry, e) => {
          if (isDivider(entry)) {
            // In un menu il separatore resta un separatore
            return <li key={entry.id ?? `divider-${e}`} className="list__divider" role="separator" />
          }
          if (isGroup(entry)) {
            const labelId = `${groupIdPrefix}-${entry.id}`
            return (
              <li key={entry.id} className="list__group" role={neutral}>
                <span id={labelId} className="list__group-label">
                  {entry.label}
                </span>
                {entry.items.length > 0 && (
                  <ul className="list__items" role="group" aria-labelledby={labelId}>
                    {entry.items.map((item) => renderItem(item, next++))}
                  </ul>
                )}
              </li>
            )
          }
          return renderItem(entry, next++)
        })}
      </ul>
    </div>
  )
}

export default ListCore
