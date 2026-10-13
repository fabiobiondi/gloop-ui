import { useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
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

export type ListCoreProps = {
  items: ListItem[]
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

  const pill = { step: itemHeight + gap, length: itemHeight, inset: 0, axis: 'y' as const, radius }
  const vars = {
    '--list-item-height': `${itemHeight}px`,
    '--list-gap': `${gap}px`,
    '--list-radius': `${radius}px`,
  } as CSSProperties

  // Le voci disabilitate non ricevono la pillola
  const track = (i: number) => (hover && !items[i].disabled ? () => setHovered(i) : undefined)

  return (
    <div className="list__body" style={vars} onPointerLeave={() => setHovered(null)}>
      <AnimatePresence initial={false}>
        {showSelected && selectedIndex !== null && selectedIndex >= 0 && (
          <GooPill key="selected" index={selectedIndex} {...pill} opacity={0.1} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {hover && hovered !== null && <GooPill key="hover" index={hovered} {...pill} opacity={hoverOpacity} />}
      </AnimatePresence>

      <ul className="list__items" role={itemRole ? 'none' : undefined}>
        {items.map((item, i) => {
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
            <li key={item.id} role={itemRole ? 'none' : undefined}>
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
        })}
      </ul>
    </div>
  )
}

export default ListCore
