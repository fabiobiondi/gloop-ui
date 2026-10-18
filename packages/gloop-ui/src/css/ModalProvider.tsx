import { useMemo, useRef, useState, type ReactNode } from 'react'
import Modal from './Modal'
import { GloopMotionProvider, type MotionProps } from '../components/motion-context'
import { ModalContext, type ModalApi, type ModalHandle, type ModalOptions } from './modal-context'

type Entry = {
  options: ModalOptions<any>
  open: boolean
  handle: ModalHandle<any>
}

/** Le props di animazione valgono per i modal aperti con useModal() */
export type ModalProviderProps = { children?: ReactNode } & MotionProps

/*
 * Rende possibile useModal(): i modal aperti da codice vengono renderizzati qui
 * (sempre in un portal su <body>), quindi seguono il tema del punto in cui sta il provider.
 * Ogni modal resta montato finché la sua animazione di chiusura non è finita.
 */
function ModalProvider({ children, ...motionProps }: ModalProviderProps) {
  const entries = useRef(new Map<number, Entry>())
  const nextId = useRef(0)
  // Le voci vivono nel ref (le leggono gli handle), il render usa una copia nello stato
  const [list, setList] = useState<[number, Entry][]>([])
  const rerender = () => setList([...entries.current])

  const api = useMemo<ModalApi>(() => {
    function open<T>(options: ModalOptions<T>): ModalHandle<T> {
      const id = nextId.current++
      let resolve!: (result: T | undefined) => void
      const result = new Promise<T | undefined>((r) => (resolve = r))
      let settled = false

      const handle: ModalHandle<T> = {
        close(value) {
          const entry = entries.current.get(id)
          if (settled || !entry) return
          settled = true
          entry.open = false
          rerender()
          entry.options.onClose?.(value)
          resolve(value)
        },
        update(next) {
          const entry = entries.current.get(id)
          if (!entry || settled) return
          entry.options = { ...entry.options, ...next }
          rerender()
        },
        result,
      }

      entries.current.set(id, { options, open: true, handle })
      rerender()
      return handle
    }

    return {
      open,
      closeAll() {
        for (const entry of entries.current.values()) entry.handle.close()
      },
    }
  }, [])

  return (
    <ModalContext.Provider value={api}>
      {children}
      <GloopMotionProvider {...motionProps}>
        {list.map(([id, { options, open, handle }]) => {
          const { content, footer, actions, afterClose, onClose: _onClose, ...props } = options
          return (
            <Modal
              key={id}
              {...props}
              open={open}
              onClose={() => handle.close()}
              afterClose={() => {
                entries.current.delete(id)
                rerender()
                afterClose?.()
              }}
              // Il pulsante che chiude il modal risolve result con il suo value
              actions={actions?.map((action) => ({
                ...action,
                onClick: () => {
                  const keep = action.onClick?.()
                  if (keep !== false) handle.close(action.value)
                  return keep
                },
              }))}
              footer={typeof footer === 'function' ? footer(handle) : footer}
            >
              {typeof content === 'function' ? content(handle) : content}
            </Modal>
          )
        })}
      </GloopMotionProvider>
    </ModalContext.Provider>
  )
}

export default ModalProvider
