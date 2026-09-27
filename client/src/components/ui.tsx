import type { ReactNode } from 'react'
import { Tag, Tooltip } from 'antd'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  EditOutlined,
  InfoCircleOutlined,
  ThunderboltFilled,
} from '@ant-design/icons'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { formatKg, formatTonnes } from '../utils/format'
import { seriesColors } from '../theme/theme'
import { materialName, outputName } from '../data/selectors'
import type { EntrySource, EntryStatus, MaterialId, OutputId } from '../data/types'

/* ---------- Brand ---------- */

export function MichyMark({ size = 28, ink = '#191919' }: { size?: number; ink?: string }) {
  return (
    <svg width={size} height={(size * 90) / 120} viewBox="0 0 120 90" aria-hidden>
      <path fill={ink} d="M96 0H120V90H98V34L72 68L60 52Z" />
      <path fill="#D82E54" d="M0 0H26L70 58V90H48L22 55V90H0Z" />
    </svg>
  )
}

/* ---------- Page scaffolding ---------- */

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  extra,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  extra?: ReactNode
}) {
  return (
    <div className="page-header fade-in">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <div className="subtitle">{subtitle}</div>}
      </div>
      {extra && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{extra}</div>}
    </div>
  )
}

export function SectionTitle({ title, hint, extra }: { title: ReactNode; hint?: ReactNode; extra?: ReactNode }) {
  return (
    <div className="section-title">
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <h2>{title}</h2>
        {hint && <span className="hint">{hint}</span>}
      </div>
      {extra}
    </div>
  )
}

export function Help({ text }: { text: ReactNode }) {
  return (
    <Tooltip title={text}>
      <InfoCircleOutlined style={{ color: '#9aa1ad', fontSize: 13, cursor: 'help' }} />
    </Tooltip>
  )
}

/* ---------- Numbers ---------- */

export function Qty({ kg, block, strong }: { kg: number; block?: boolean; strong?: boolean }) {
  return (
    <span className="num" style={{ display: block ? 'block' : 'inline' }}>
      <span style={{ fontWeight: strong ? 800 : 600, color: strong ? '#191919' : undefined }}>{formatKg(kg)}</span>
      <span className="faint" style={{ fontSize: '0.86em', marginLeft: block ? 0 : 6, display: block ? 'block' : 'inline' }}>
        {formatTonnes(kg)}
      </span>
    </span>
  )
}

export function Delta({ value, inverse, suffix = 'vs last' }: { value: number; inverse?: boolean; suffix?: string }) {
  const good = inverse ? value < 0 : value > 0
  const cls = Math.abs(value) < 0.5 ? 'flat' : good ? 'up' : 'down'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <span className={`delta ${cls}`}>
        {value >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        {Math.abs(value).toFixed(1)}%
      </span>
      <span className="faint" style={{ fontSize: 12 }}>
        {suffix}
      </span>
    </span>
  )
}

export function Sparkline({ data, color }: { data: number[]; color: string }) {
  const id = `sp-${color.replace('#', '')}`
  return (
    <div style={{ width: 84, height: 30 }}>
      <ResponsiveContainer>
        <AreaChart data={data.map((v, i) => ({ i, v }))} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function KpiCard({
  label,
  value,
  sub,
  icon,
  tone,
  delta,
  deltaInverse,
  spark,
  help,
  onClick,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon: ReactNode
  tone: { bg: string; fg: string }
  delta?: number
  deltaInverse?: boolean
  spark?: number[]
  help?: ReactNode
  onClick?: () => void
}) {
  return (
    <div className="surface kpi fade-in" onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
      <div className="kpi-label">
        <span className="kpi-icon" style={{ background: tone.bg, color: tone.fg }}>
          {icon}
        </span>
        {label}
        {help && <Help text={help} />}
      </div>
      <div className="kpi-value" style={{ marginTop: 6 }}>
        {value}
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
      <div className="kpi-foot">
        {delta !== undefined ? <Delta value={delta} inverse={deltaInverse} /> : <span />}
        {spark && <Sparkline data={spark} color={tone.fg} />}
      </div>
    </div>
  )
}

/* ---------- Formula card ---------- */

export interface FormulaPart {
  label: string
  value: string
  op?: '+' | '−' | '='
  kind?: 'in' | 'out' | 'result'
}

export function Formula({ parts }: { parts: FormulaPart[] }) {
  return (
    <div className="formula">
      {parts.map((p, i) => (
        <div key={i} style={{ display: 'contents' }}>
          {p.op && <div className="formula-op">{p.op}</div>}
          <div className={`formula-item ${p.kind ?? ''}`}>
            <div className="f-label">{p.label}</div>
            <div className="f-value">{p.value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- Tags ---------- */

export function MaterialTag({ id }: { id: MaterialId }) {
  return (
    <span className="pill" style={{ background: '#fff', border: '1px solid #e6e8ec', color: '#3a3f47' }}>
      <span className="legend-dot" style={{ background: seriesColors[id] }} />
      {materialName(id)}
    </span>
  )
}

export function ProductTag({ id }: { id: OutputId }) {
  return (
    <span className="pill" style={{ background: '#fff', border: '1px solid #e6e8ec', color: '#3a3f47' }}>
      <span className="legend-dot" style={{ background: seriesColors[id] }} />
      {outputName(id)}
    </span>
  )
}

export function StatusTag({ status }: { status: EntryStatus }) {
  return status === 'confirmed' ? (
    <Tag color="success" icon={<CheckCircleFilled />} variant="filled" style={{ fontWeight: 700, borderRadius: 999, paddingInline: 10 }}>
      Confirmed
    </Tag>
  ) : (
    <Tag color="warning" icon={<ClockCircleFilled />} variant="filled" style={{ fontWeight: 700, borderRadius: 999, paddingInline: 10 }}>
      Needs review
    </Tag>
  )
}

export function SourceTag({ source }: { source: EntrySource }) {
  return source === 'ai' ? (
    <Tooltip title="Details read from the uploaded bill by AI, then checked and confirmed by a person">
      <span className="pill" style={{ background: '#f4efff', color: '#6941c6' }}>
        <ThunderboltFilled /> From PDF
      </span>
    </Tooltip>
  ) : (
    <span className="pill">
      <EditOutlined /> Typed in
    </span>
  )
}

/* ---------- Stock bar ---------- */

export function StockBar({ parts, total, height = 10 }: { parts: { key: string; value: number; color: string }[]; total?: number; height?: number }) {
  const sum = total ?? parts.reduce((s, p) => s + p.value, 0)
  return (
    <div className="stockbar" style={{ height }}>
      {parts.map((p) => (
        <Tooltip key={p.key} title={`${p.key}: ${formatKg(p.value)}`}>
          <span style={{ width: `${(Math.max(p.value, 0) / (sum || 1)) * 100}%`, background: p.color }} />
        </Tooltip>
      ))}
    </div>
  )
}
