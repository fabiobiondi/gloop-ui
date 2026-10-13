import { Fragment, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { tokenize, type Lang } from './highlight'

export function CodeBlock({ code, lang = 'tsx' }: { code: string; lang?: Lang }) {
  const [copied, setCopied] = useState(false)
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
        onClick={() => navigator.clipboard.writeText(code).then(() => setCopied(true))}
      >
        {/* Le due scritte si scambiano con una dissolvenza sfocata */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copied ? 'copied' : 'copy'}
            initial={{ opacity: 0, filter: 'blur(2px)', y: 4 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, filter: 'blur(2px)', y: -4 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          >
            {copied ? 'Copied' : 'Copy'}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  )
}
