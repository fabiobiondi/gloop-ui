import { Fragment, type ReactNode } from 'react'

// `code` e **grassetto** dentro una riga di testo
function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    return <Fragment key={i}>{part}</Fragment>
  })
}

type ListItem = { text: string; children: string[] }

/*
 * Markdown minimo per CHANGELOG.md (lo scrive Changesets): titoli ##/###,
 * paragrafi, elenchi puntati con un livello di annidamento, `code` e **grassetto**.
 * Il titolo # (nome del pacchetto) è già nell'header della pagina.
 */
export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = []
  let list: ListItem[] = []

  const flushList = () => {
    if (!list.length) return
    blocks.push(
      <ul key={blocks.length}>
        {list.map((item, i) => (
          <li key={i}>
            {inline(item.text)}
            {item.children.length > 0 && (
              <ul>
                {item.children.map((child, j) => (
                  <li key={j}>{inline(child)}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>,
    )
    list = []
  }

  for (const line of source.split('\n')) {
    const nested = line.match(/^\s{2,}- (.*)/)
    const item = line.match(/^- (.*)/)
    if (nested && list.length) {
      list[list.length - 1].children.push(nested[1])
      continue
    }
    if (item) {
      list.push({ text: item[1], children: [] })
      continue
    }
    flushList()
    if (line.startsWith('# ') || !line.trim()) continue
    if (line.startsWith('## ')) blocks.push(<h2 key={blocks.length}>{line.slice(3)}</h2>)
    else if (line.startsWith('### ')) blocks.push(<h3 key={blocks.length}>{line.slice(4)}</h3>)
    else blocks.push(<p key={blocks.length}>{inline(line)}</p>)
  }
  flushList()

  return <div className="pg-prose">{blocks}</div>
}
