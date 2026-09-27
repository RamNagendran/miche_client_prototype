import type { ReactNode } from 'react'
import { Checkbox, Tooltip } from 'antd'
import type { DocField } from '../data/extraction'

/** How sure the AI was about one value. Anything under 90% asks the person to look. */
function Confidence({ value }: { value?: number }) {
  if (!value) return null
  const low = value < 90
  return (
    <Tooltip title={low ? 'The AI is not fully sure about this value. Please compare it with the bill.' : 'The AI read this clearly.'}>
      <span className="pill" style={{ fontSize: 11.5, padding: '1px 8px', background: low ? '#fff6e6' : '#e8f6ef', color: low ? '#b26b00' : '#1f9d6b' }}>
        {low ? 'Please check' : `${value}% sure`}
      </span>
    </Tooltip>
  )
}

/** One value read from the bill, with an optional "I've checked this" tick. */
export function XField({
  field,
  label,
  active,
  warn,
  confidence,
  note,
  verify,
  onFocus,
  children,
}: {
  field: DocField
  label: string
  active: DocField | null
  warn?: boolean
  confidence?: number
  note?: ReactNode
  verify?: { checked: boolean; onChange: (v: boolean) => void }
  onFocus: (f: DocField) => void
  children: ReactNode
}) {
  const low = confidence !== undefined && confidence > 0 && confidence < 90
  return (
    <div
      className={`xfield ${active === field ? 'active' : ''} ${warn || (low && !verify?.checked) ? 'warn' : ''} ${verify?.checked ? 'ok-verified' : ''}`}
      onClick={() => onFocus(field)}
    >
      <div className="xfield-label">
        <span>{label}</span>
        <Confidence value={confidence} />
      </div>
      {children}
      {note && (
        <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>
          {note}
        </div>
      )}
      {verify && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e6e8ec' }}>
          <Checkbox checked={verify.checked} onChange={(e) => verify.onChange(e.target.checked)}>
            <span style={{ fontWeight: 700, fontSize: 13, color: verify.checked ? '#1f9d6b' : '#3a3f47' }}>
              {verify.checked ? 'Checked against the bill' : "I've checked this against the bill"}
            </span>
          </Checkbox>
        </div>
      )}
    </div>
  )
}
