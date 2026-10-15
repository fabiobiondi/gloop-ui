import { useState } from 'react'
import { Slider, TabMenu } from 'gloop-ui'
import { LuBold, LuItalic, LuLink, LuList, LuPlus, LuStrikethrough, LuUnderline } from 'react-icons/lu'

// Demo "Text editor" del TabMenu: barra di formattazione WYSIWYG, con o senza testi e con spazio tra le tab regolabile
export function TextEditorDemo() {
  const [iconOnly, setIconOnly] = useState(false)
  const [tabGap, setTabGap] = useState(50)

  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 20 }}>
      <TabMenu
        icon={<LuPlus />}
        label="Text formatting"
        iconOnly={iconOnly}
        tabGap={tabGap}
        tabs={[
          { icon: <LuBold />, label: 'Bold' },
          { icon: <LuItalic />, label: 'Italic' },
          { icon: <LuUnderline />, label: 'Underline' },
          { icon: <LuStrikethrough />, label: 'Strike' },
          { icon: <LuList />, label: 'List' },
          { icon: <LuLink />, label: 'Link' },
        ]}
      />
      <div style={{ width: 280, maxWidth: '100%' }}>
        <Slider label="Tab gap" min={0} max={60} value={tabGap} onChange={setTabGap} showValue="always" formatValue={(v) => `${v}px`} />
      </div>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
        <input type="checkbox" checked={iconOnly} onChange={(e) => setIconOnly(e.target.checked)} /> Icons only
      </label>
    </div>
  )
}
