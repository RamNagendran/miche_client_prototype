import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, Segmented, Table, Tabs, Tag } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, WarningFilled, DownloadOutlined } from '@ant-design/icons'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import dayjs from 'dayjs'
import { can, useApp } from '../../context/AppContext'
import { Formula, MaterialTag, PageHeader, Qty, SectionTitle, StockBar } from '../../components/ui'
import ChartTooltip from '../../components/ChartTooltip'
import { confirmedPurchases, factoryById, materialName, purchaseValue, supplierById, warehouseLedger, warehouseStock, type LedgerRow } from '../../data/selectors'
import { FY_START, materials, production, TODAY, warehouses } from '../../data/seed'
import { seriesColors } from '../../theme/theme'
import { formatDate, formatINR, formatKg, formatRate, formatTonnes } from '../../utils/format'
import type { MaterialId, Warehouse } from '../../data/types'

/** Weekly closing balance per material, for the trend chart. */
function weeklyTrend(wh: Warehouse) {
  const ledgers = Object.fromEntries(wh.materials.map((m) => [m, warehouseLedger(wh.id, m).slice().reverse()]))
  const points: Record<string, number | string>[] = []
  for (let d = dayjs(FY_START); !d.isAfter(dayjs(TODAY)); d = d.add(7, 'day')) {
    const day = d.format('YYYY-MM-DD')
    const pt: Record<string, number | string> = { label: d.format('D MMM') }
    wh.materials.forEach((m) => {
      const rows = ledgers[m].filter((r) => r.date <= day)
      pt[m] = rows.length ? rows[rows.length - 1].balance : 0
    })
    points.push(pt)
  }
  return points
}

export default function WarehouseDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { role } = useApp()
  const wh = warehouses.find((w) => w.id === id)
  const [mat, setMat] = useState<MaterialId>(wh?.materials[0] ?? 'truck')
  const stock = wh ? warehouseStock(wh.id) : null

  const trend = wh ? weeklyTrend(wh) : []

  if (!wh || !stock) return <Navigate to="/warehouses" replace />
  const line = stock.lines.find((l) => l.material === mat)!
  const ledger = warehouseLedger(wh.id, mat)

  return (
    <div className="page">
      <PageHeader
        eyebrow={
          <a onClick={() => navigate('/warehouses')} style={{ color: 'inherit' }}>
            <ArrowLeftOutlined /> All warehouses
          </a>
        }
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="loc-badge wh">{wh.code}</span>
            {wh.name}
          </span>
        }
        subtitle={`${wh.city} · managed by ${wh.manager} · supplies ${wh.supplies.map((f) => factoryById(f).name).join(' and ')}`}
        extra={
          <>
            <Button size="large" icon={<DownloadOutlined />}>
              Stock report
            </Button>
            {can(role).enterData && (
              <Button size="large" type="primary" icon={<PlusOutlined />} onClick={() => navigate('/purchases/new')}>
                Record a purchase
              </Button>
            )}
          </>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: `repeat(${stock.lines.length + 1}, minmax(0, 1fr))` }}>
        <div className="surface" style={{ padding: 20, background: '#191919', border: 'none', color: '#fff' }}>
          <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>Total in this warehouse</div>
          <div className="num" style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
            {formatKg(stock.total.current)}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 14 }}>{formatTonnes(stock.total.current)}</div>
          <StockBar parts={stock.lines.map((l) => ({ key: materialName(l.material), value: l.current, color: seriesColors[l.material] }))} />
        </div>
        {stock.lines.map((l) => {
          const m = materials.find((x) => x.id === l.material)!
          const low = l.current < m.lowStockKg
          return (
            <div
              key={l.material}
              className="surface"
              onClick={() => setMat(l.material)}
              style={{ padding: 20, cursor: 'pointer', borderColor: mat === l.material ? '#D82E54' : undefined, boxShadow: mat === l.material ? '0 0 0 3px rgba(216,46,84,0.1)' : undefined }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <MaterialTag id={l.material} />
                {low && (
                  <Tag color="warning" icon={<WarningFilled />} style={{ fontWeight: 700, marginInlineEnd: 0 }}>
                    Low stock
                  </Tag>
                )}
              </div>
              <div className="num strong" style={{ fontSize: 24, marginTop: 12 }}>
                {formatKg(l.current)}
              </div>
              <div className="faint" style={{ fontSize: 12.5 }}>
                Reorder level {formatKg(m.lowStockKg)}
              </div>
              <div style={{ marginTop: 10, height: 6, borderRadius: 99, background: '#eef0f3', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (l.current / (m.lowStockKg * 3)) * 100)}%`, height: '100%', background: low ? '#d98a0b' : seriesColors[l.material] }} />
              </div>
            </div>
          )
        })}
      </div>

      <SectionTitle
        title={`How the ${materialName(mat).toLowerCase()} stock is worked out`}
        hint="since 1 April 2026"
        extra={<Segmented value={mat} onChange={(v) => setMat(v as MaterialId)} options={wh.materials.map((m) => ({ value: m, label: materialName(m) }))} />}
      />
      <div className="surface" style={{ padding: 20 }}>
        <Formula
          parts={[
            { label: 'Opening stock (1 Apr)', value: formatKg(line.opening) },
            { op: '+', label: `Purchased (${confirmedPurchases.filter((p) => p.warehouseId === wh.id && p.material === mat).length} bills)`, value: formatKg(line.in), kind: 'in' },
            { op: '−', label: `Sent to factories (${production.filter((p) => p.warehouseId === wh.id && p.material === mat).length} entries)`, value: formatKg(line.out), kind: 'out' },
            { op: '=', label: 'In stock now', value: formatKg(line.current), kind: 'result' },
          ]}
        />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr', marginTop: 16 }}>
        <div className="surface" style={{ padding: 22 }}>
          <div className="strong" style={{ fontSize: 16 }}>
            Stock level over time
          </div>
          <div className="faint" style={{ fontSize: 13 }}>
            Weekly closing balance by tyre type
          </div>
          <div style={{ height: 240, marginTop: 10 }}>
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
                <defs>
                  {wh.materials.map((m) => (
                    <linearGradient key={m} id={`g-${m}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={seriesColors[m]} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={seriesColors[m]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} stroke="#eef0f3" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#8a919e', fontSize: 12 }} interval={3} />
                <YAxis axisLine={false} tickLine={false} width={56} tick={{ fill: '#8a919e', fontSize: 12 }} tickFormatter={(v) => formatTonnes(v)} />
                <Tooltip content={<ChartTooltip format={(v) => formatKg(v)} />} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 13 }} formatter={(v) => <span style={{ color: '#3a3f47', fontWeight: 600 }}>{v}</span>} />
                {wh.materials.map((m) => (
                  <Area key={m} type="stepAfter" dataKey={m} name={materialName(m)} stroke={seriesColors[m]} strokeWidth={2} fill={`url(#g-${m})`} isAnimationActive={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="surface table-card" style={{ marginTop: 16 }}>
        <div style={{ padding: '4px 20px 0' }}>
          <Tabs
            items={[
              {
                key: 'ledger',
                label: `Stock movements · ${materialName(mat)}`,
                children: (
                  <Table<LedgerRow>
                    scroll={{ x: 'max-content' }}
                    rowKey="key"
                    dataSource={ledger}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                                        columns={[
                      { title: 'Date', dataIndex: 'date', render: (d) => formatDate(d) },
                      { title: 'Reference', dataIndex: 'ref', render: (r) => <span className="id-link">{r}</span> },
                      {
                        title: 'What happened',
                        dataIndex: 'description',
                        render: (d, r) => (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="legend-dot" style={{ background: r.kind === 'in' ? '#1f9d6b' : r.kind === 'out' ? '#D82E54' : '#8a919e', borderRadius: '50%' }} />
                            {d}
                          </span>
                        ),
                      },
                      { title: 'In', dataIndex: 'inKg', align: 'right', render: (v) => (v ? <span className="num" style={{ color: '#1f9d6b', fontWeight: 700 }}>+{formatKg(v)}</span> : '') },
                      { title: 'Out', dataIndex: 'outKg', align: 'right', render: (v) => (v ? <span className="num" style={{ color: '#D82E54', fontWeight: 700 }}>−{formatKg(v)}</span> : '') },
                      { title: 'Balance', dataIndex: 'balance', align: 'right', render: (v) => <span className="num strong">{formatKg(v)}</span> },
                    ]}
                  />
                ),
              },
              {
                key: 'purchases',
                label: 'Purchase history',
                children: (
                  <Table
                    scroll={{ x: 'max-content' }}
                    rowKey="id"
                                        pagination={{ pageSize: 10, showSizeChanger: false }}
                    dataSource={[...confirmedPurchases].reverse().filter((p) => p.warehouseId === wh.id)}
                    columns={[
                      { title: 'Purchase', dataIndex: 'id', render: (v, p) => <div><span className="id-link">{v}</span><div className="faint" style={{ fontSize: 12.5 }}>{formatDate(p.date)}</div></div> },
                      { title: 'Supplier', render: (_, p) => supplierById(p.supplierId).name },
                      { title: 'Tyre type', render: (_, p) => <MaterialTag id={p.material} /> },
                      { title: 'Quantity', align: 'right', render: (_, p) => <Qty kg={p.qtyKg} /> },
                      { title: 'Rate', align: 'right', render: (_, p) => <span className="num">{formatRate(p.rate)}</span> },
                      { title: 'Cost', align: 'right', render: (_, p) => <span className="num strong">{formatINR(purchaseValue(p))}</span> },
                    ]}
                  />
                ),
              },
              {
                key: 'consumed',
                label: 'Sent to factories',
                children: (
                  <Table
                    scroll={{ x: 'max-content' }}
                    rowKey="id"
                                        pagination={{ pageSize: 10, showSizeChanger: false }}
                    dataSource={[...production].reverse().filter((p) => p.warehouseId === wh.id)}
                    columns={[
                      { title: 'Entry', dataIndex: 'id', render: (v, p) => <div><span className="id-link">{v}</span><div className="faint" style={{ fontSize: 12.5 }}>{formatDate(p.date)}</div></div> },
                      { title: 'Factory', render: (_, p) => factoryById(p.factoryId).name },
                      { title: 'Tyre type', render: (_, p) => <MaterialTag id={p.material} /> },
                      { title: 'Quantity used', align: 'right', render: (_, p) => <Qty kg={p.inputKg} /> },
                      { title: 'Entered by', dataIndex: 'enteredBy' },
                    ]}
                  />
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
