import { GloopLoading } from 'gloop-ui'
import type { Guide } from './guides'
import './upcoming.css'

// Segnaposto dei componenti in arrivo
function ComingSoon({ ideas }: { ideas: string[] }) {
  return (
    <div className="soon">
      <GloopLoading className="soon__loading" title="Coming soon" description="This component is still dripping out of the lab." />
      <ul className="soon__ideas" aria-label="Planned">
        {ideas.map((idea) => (
          <li key={idea}>{idea}</li>
        ))}
      </ul>
    </div>
  )
}

const soon = (id: string, name: string, description: string, ideas: string[]): Guide => ({
  id,
  name,
  description,
  content: <ComingSoon ideas={ideas} />,
})

export const upcoming: Guide[] = [
  soon('bar-chart', 'Bar Chart', 'Bars that rise and wobble like jelly when the data changes.', [
    'Animated updates',
    'Tooltips on every bar',
  ]),
  soon('form-components', 'Forms components', 'More form controls in the same liquid style as Input.', [
    'Checkbox and radio',
    'Switch',
    'Select',
  ]),
  soon('modals', 'Modals', 'Full-size modals and sheets, beyond the compact Dialog.', [
    'Bottom sheet on mobile',
    'Scrollable content',
  ]),
  soon('side-panel', 'SidePanel', 'A panel that oozes in from the edge of the screen.', [
    'Left or right',
    'Drag to close',
  ]),
]
