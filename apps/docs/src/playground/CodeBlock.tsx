import { Fragment, useEffect, useMemo, useState } from 'react'
import { tokenize, type Lang } from './highlight'

export function CodeBlock({ code, lang = 'tsx' }: { code: string; lang?: Lang }) {
  const [copied, setCopied] = useState(false)
  const [toggled, setToggled] = useState(false)
  const lines = useMemo(() => tokenize(code, lang), [code, lang])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1400)
    return () => clearTimeout(t)
  }, [copied])

  return (
    <div className="pg-code">
      <pre>
        <code>
          {lines.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && '\n'}
              {line.map((token, j) => (
                <span key={j} style={{ color: token.color }}>
                  {token.content}
                </span>
              ))}
            </Fragment>
          ))}
        </code>
      </pre>
      <button
        type="button"
        className="pg-code__copy"
        data-toggled={toggled || undefined}
        onClick={() =>
          navigator.clipboard.writeText(code).then(() => {
            setToggled(true)
            setCopied(true)
          })
        }
      >
        {/* Le due scritte stanno nella stessa cella e si scambiano con una dissolvenza sfocata */}
        <span data-active={!copied || undefined} aria-hidden={copied}>
          Copy
        </span>
        <span data-active={copied || undefined} aria-hidden={!copied}>
          Copied
        </span>
      </button>
    </div>
  )
}
