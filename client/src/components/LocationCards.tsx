import { useNavigate } from 'react-router-dom'
import { RightOutlined, FunctionOutlined } from '@ant-design/icons'
import { seriesColors } from '../theme/theme'
import {
  companyOutputStock,
  companyRawByMaterial,
  companyRawTotal,
  factoryById,
  factoryOutputStock,
  factoryTotals,
  materialName,
  outputName,
  warehouseStock,
  type Period,
} from '../data/selectors'
import { formatKg, formatTonnes } from '../utils/format'
import { StockBar } from './ui'

export function WarehouseCard({ id }: { id: string }) {
  const navigate = useNavigate()
  const { warehouse, lines, total } = warehouseStock(id)
  return (
    <div className="surface loc-card fade-in" onClick={() => navigate(`/warehouses/${id}`)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="loc-badge wh">{warehouse.code}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="strong" style={{ fontSize: 15 }}>
            {warehouse.name}
          </div>
          <div className="faint" style={{ fontSize: 12.5 }}>
            {warehouse.city} · supplies {warehouse.supplies.map((f) => factoryById(f).name).join(', ')}
          </div>
        </div>
        <RightOutlined className="faint" />
      </div>

      <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="num strong" style={{ fontSize: 24, letterSpacing: '-0.02em' }}>
          {formatKg(total.current)}
        </span>
        <span className="faint num" style={{ fontWeight: 600 }}>
          {formatTonnes(total.current)}
        </span>
      </div>
      <div className="faint" style={{ fontSize: 12.5, marginBottom: 12 }}>
        Raw material in stock now
      </div>
      <StockBar parts={lines.map((l) => ({ key: materialName(l.material), value: l.current, color: seriesColors[l.material] }))} />
      <div style={{ marginTop: 10 }}>
        {lines.map((l) => (
          <div className="mat-row" key={l.material}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="legend-dot" style={{ background: seriesColors[l.material] }} />
              {materialName(l.material)}
            </span>
            <span className="num" style={{ fontWeight: 700 }}>
              {formatKg(l.current)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CompanyRawCard() {
  const total = companyRawTotal()
  const byMat = companyRawByMaterial().filter((m) => m.current > 0)
  return (
    <div className="surface loc-card total-card fade-in" style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="loc-badge total" style={{ background: '#D82E54' }}>
          <FunctionOutlined />
        </div>
        <div>
          <div className="strong" style={{ fontSize: 15 }}>
            Company total
          </div>
          <div className="faint" style={{ fontSize: 12.5 }}>
            All warehouses added together
          </div>
        </div>
      </div>
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="num strong" style={{ fontSize: 24, letterSpacing: '-0.02em' }}>
          {formatKg(total)}
        </span>
        <span className="faint num" style={{ fontWeight: 600 }}>
          {formatTonnes(total)}
        </span>
      </div>
      <div className="faint" style={{ fontSize: 12.5, marginBottom: 12 }}>
        Raw material in stock now
      </div>
      <StockBar parts={byMat.map((m) => ({ key: materialName(m.material), value: m.current, color: seriesColors[m.material] }))} />
      <div style={{ marginTop: 10 }}>
        {byMat.map((m) => (
          <div className="mat-row" key={m.material}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="legend-dot" style={{ background: seriesColors[m.material] }} />
              {materialName(m.material)}
            </span>
            <span className="num" style={{ fontWeight: 700 }}>
              {formatKg(m.current)}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
        A simple sum of each warehouse. Warehouses keep their own stock — nothing is shared or transferred.
      </div>
    </div>
  )
}

export function FactoryCard({ id, period }: { id: string; period: Period }) {
  const navigate = useNavigate()
  const { factory, lines } = factoryOutputStock(id)
  const t = factoryTotals(id, period)
  return (
    <div className="surface loc-card fade-in" onClick={() => navigate(`/factories/${id}`)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="loc-badge fa">{factory.code}</div>
        <div style={{ flex: 1 }}>
          <div className="strong" style={{ fontSize: 15 }}>
            {factory.name}
          </div>
          <div className="faint" style={{ fontSize: 12.5 }}>
            {factory.city} · {t.runs} production entries
          </div>
        </div>
        <RightOutlined className="faint" />
      </div>

      <div className="grid grid-2" style={{ marginTop: 16, gap: 10 }}>
        <div style={{ background: '#f7f8fa', borderRadius: 10, padding: '10px 12px' }}>
          <div className="faint" style={{ fontSize: 12, fontWeight: 700 }}>
            Raw material used
          </div>
          <div className="num strong" style={{ fontSize: 17 }}>
            {formatTonnes(t.consumed)}
          </div>
        </div>
        <div style={{ background: '#f7f8fa', borderRadius: 10, padding: '10px 12px' }}>
          <div className="faint" style={{ fontSize: 12, fontWeight: 700 }}>
            Output produced
          </div>
          <div className="num strong" style={{ fontSize: 17 }}>
            {formatTonnes(t.rubber + t.steel + t.other)}
          </div>
        </div>
      </div>

      <div className="faint" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '16px 0 4px' }}>
        Ready to sell now
      </div>
      {lines.map((l) => (
        <div className="mat-row" key={l.product}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="legend-dot" style={{ background: seriesColors[l.product] }} />
            {outputName(l.product)}
          </span>
          <span className="num" style={{ fontWeight: 700 }}>
            {formatKg(l.current)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function CompanyOutputCard({ period }: { period: Period }) {
  const lines = companyOutputStock()
  const total = lines.reduce((s, l) => s + l.current, 0)
  const produced = ['FA', 'FB', 'FC'].reduce((s, f) => {
    const t = factoryTotals(f, period)
    return s + t.rubber + t.steel + t.other
  }, 0)
  return (
    <div className="surface loc-card total-card fade-in" style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="loc-badge total" style={{ background: '#D82E54' }}>
          <FunctionOutlined />
        </div>
        <div>
          <div className="strong" style={{ fontSize: 15 }}>
            Company total
          </div>
          <div className="faint" style={{ fontSize: 12.5 }}>
            All factories added together
          </div>
        </div>
      </div>
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="num strong" style={{ fontSize: 24, letterSpacing: '-0.02em' }}>
          {formatKg(total)}
        </span>
        <span className="faint num" style={{ fontWeight: 600 }}>
          {formatTonnes(total)}
        </span>
      </div>
      <div className="faint" style={{ fontSize: 12.5, marginBottom: 12 }}>
        Output ready to sell · {formatTonnes(produced)} produced this period
      </div>
      <StockBar parts={lines.map((l) => ({ key: outputName(l.product), value: l.current, color: seriesColors[l.product] }))} />
      <div style={{ marginTop: 10 }}>
        {lines.map((l) => (
          <div className="mat-row" key={l.product}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="legend-dot" style={{ background: seriesColors[l.product] }} />
              {outputName(l.product)}
            </span>
            <span className="num" style={{ fontWeight: 700 }}>
              {formatKg(l.current)}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
        A simple sum of each factory's own output stock.
      </div>
    </div>
  )
}
