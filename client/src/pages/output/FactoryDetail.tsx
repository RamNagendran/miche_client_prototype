import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, Segmented, Table, Tabs } from 'antd'
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import dayjs from 'dayjs'
import { can, useApp } from '../../context/AppContext'
import { Formula, MaterialTag, PageHeader, ProductTag, SectionTitle, StatusTag } from '../../components/ui'
import ChartTooltip from '../../components/ChartTooltip'
import { buyerById, factoryOutputStock, factoryTotals, months, outputName, periodLabels, saleValue, warehouseById } from '../../data/selectors'
import { factories, production, sales } from '../../data/seed'
import { seriesColors } from '../../theme/theme'
import { formatDate, formatINR, formatINRShort, formatKg, formatPercent, formatRate, formatTonnes } from '../../utils/format'
import type { OutputId } from '../../data/types'

export default function FactoryDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { role, period } = useApp()
  const [product, setProduct] = useState<OutputId>('rubber')
  const f = factories.find((x) => x.id === id)
  if (!f) return <Navigate to="/output-stock" replace />

  const stock = factoryOutputStock(f.id)
  const t = factoryTotals(f.id, period)
  const line = stock.lines.find((l) => l.product === product)!
  const chart = months.map((m) => {
    const pr = production.filter((p) => p.factoryId === f.id && p.date.startsWith(m))
    return {
      month: dayjs(`${m}-01`).format('MMM'),
      rubber: pr.reduce((s, p) => s + p.outputs.rubber, 0),
      steel: pr.reduce((s, p) => s + p.outputs.steel, 0),
      other: pr.reduce((s, p) => s + p.outputs.other, 0),
    }
  })

  return (
    <div className="page">
      <PageHeader
        eyebrow={
          <a onClick={() => navigate('/output-stock')} style={{ color: 'inherit' }}>
            <ArrowLeftOutlined /> All factories
          </a>
        }
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="loc-badge fa">{f.code}</span>
            {f.name}
          </span>
        }
        subtitle={`${f.city} · managed by ${f.manager} · gets raw material from ${f.suppliedBy.map((w) => warehouseById(w).name).join(' and ')}`}
        extra={
          can(role).enterData && (
            <>
              <Button size="large" icon={<PlusOutlined />} onClick={() => navigate('/sales/new')}>
                Record a sale
              </Button>
              <Button size="large" type="primary" icon={<PlusOutlined />} onClick={() => navigate('/production/new')}>
                Record production
              </Button>
            </>
          )
        }
      />

      <div className="grid grid-4">
        <div className="surface" style={{ padding: 20, background: '#191919', color: '#fff', border: 'none' }}>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 700, fontSize: 13 }}>{periodLabels[period]}</div>
          <div className="num" style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>
            {formatTonnes(t.consumed)} <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>used</span>
          </div>
          <div className="num" style={{ color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            {formatTonnes(t.rubber + t.steel + t.other)} produced · yield {formatPercent(t.yieldPct)}
          </div>
          <div className="num" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {formatINRShort(t.salesRevenue)} sold · {t.runs} entries
          </div>
        </div>
        {stock.lines.map((l) => (
          <div
            key={l.product}
            className="surface"
            onClick={() => setProduct(l.product)}
            style={{ padding: 20, cursor: 'pointer', borderColor: product === l.product ? '#D82E54' : undefined, boxShadow: product === l.product ? '0 0 0 3px rgba(216,46,84,0.1)' : undefined }}
          >
            <ProductTag id={l.product} />
            <div className="num strong" style={{ fontSize: 24, marginTop: 12 }}>
              {formatKg(l.current)}
            </div>
            <div className="faint" style={{ fontSize: 12.5 }}>
              available to sell
            </div>
            <div className="num muted" style={{ fontSize: 12.5, marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>Produced {formatTonnes(l.in)}</span>
              <span>Sold {formatTonnes(l.out)}</span>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle
        title={`How the ${outputName(product).toLowerCase()} stock is worked out`}
        hint="since 1 April 2026"
        extra={<Segmented value={product} onChange={(v) => setProduct(v as OutputId)} options={stock.lines.map((l) => ({ value: l.product, label: outputName(l.product) }))} />}
      />
      <div className="surface" style={{ padding: 20 }}>
        <Formula
          parts={[
            { label: 'Opening stock (1 Apr)', value: formatKg(line.opening) },
            { op: '+', label: 'Produced', value: formatKg(line.in), kind: 'in' },
            { op: '−', label: 'Sold', value: formatKg(line.out), kind: 'out' },
            { op: '=', label: 'Available now', value: formatKg(line.current), kind: 'result' },
          ]}
        />
      </div>

      <div className="surface" style={{ padding: 22, marginTop: 16 }}>
        <div className="strong" style={{ fontSize: 16 }}>
          Production by month
        </div>
        <div className="faint" style={{ fontSize: 13 }}>
          kg produced at {f.name}
        </div>
        <div style={{ height: 260, marginTop: 10 }}>
          <ResponsiveContainer>
            <BarChart data={chart} barCategoryGap="30%" margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#eef0f3" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8a919e', fontSize: 12.5 }} />
              <YAxis axisLine={false} tickLine={false} width={56} tick={{ fill: '#8a919e', fontSize: 12 }} tickFormatter={(v) => formatTonnes(v)} />
              <Tooltip cursor={{ fill: 'rgba(16,24,40,0.04)' }} content={<ChartTooltip format={(v) => formatKg(v)} />} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 13 }} formatter={(v) => <span style={{ color: '#3a3f47', fontWeight: 600 }}>{v}</span>} />
              <Bar isAnimationActive={false} dataKey="rubber" name="Rubber" stackId="a" fill={seriesColors.rubber} stroke="#fff" strokeWidth={1} maxBarSize={44} />
              <Bar isAnimationActive={false} dataKey="steel" name="Steel" stackId="a" fill={seriesColors.steel} stroke="#fff" strokeWidth={1} maxBarSize={44} />
              <Bar isAnimationActive={false} dataKey="other" name="Other" stackId="a" fill={seriesColors.other} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface table-card" style={{ marginTop: 16 }}>
        <div style={{ padding: '4px 20px 0' }}>
          <Tabs
            items={[
              {
                key: 'prod',
                label: 'Production history',
                children: (
                  <Table
                    scroll={{ x: 'max-content' }}
                    rowKey="id"
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    dataSource={[...production].reverse().filter((p) => p.factoryId === f.id)}
                    columns={[
                      { title: 'Entry', render: (_, p) => <div><span className="id-link">{p.id}</span><div className="faint" style={{ fontSize: 12.5 }}>{formatDate(p.date)}</div></div> },
                      { title: 'Raw material', render: (_, p) => <MaterialTag id={p.material} /> },
                      { title: 'From', render: (_, p) => warehouseById(p.warehouseId).name },
                      { title: 'Used', align: 'right', render: (_, p) => <span className="num strong">{formatKg(p.inputKg)}</span> },
                      { title: 'Rubber', align: 'right', render: (_, p) => <span className="num">{formatKg(p.outputs.rubber)}</span> },
                      { title: 'Steel', align: 'right', render: (_, p) => <span className="num">{formatKg(p.outputs.steel)}</span> },
                      { title: 'Other', align: 'right', render: (_, p) => <span className="num">{formatKg(p.outputs.other)}</span> },
                    ]}
                  />
                ),
              },
              {
                key: 'sales',
                label: 'Sales from this factory',
                children: (
                  <Table
                    scroll={{ x: 'max-content' }}
                    rowKey="id"
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    dataSource={[...sales].reverse().filter((s) => s.factoryId === f.id)}
                    columns={[
                      { title: 'Sale', render: (_, s) => <div><span className="id-link">{s.id}</span><div className="faint" style={{ fontSize: 12.5 }}>{formatDate(s.date)}</div></div> },
                      { title: 'Buyer', render: (_, s) => buyerById(s.buyerId).name },
                      { title: 'Product', render: (_, s) => <ProductTag id={s.product} /> },
                      { title: 'Quantity', align: 'right', render: (_, s) => <span className="num">{formatKg(s.qtyKg)}</span> },
                      { title: 'Rate', align: 'right', render: (_, s) => <span className="num">{formatRate(s.rate)}</span> },
                      { title: 'Value', align: 'right', render: (_, s) => <span className="num strong">{formatINR(saleValue(s))}</span> },
                      { title: 'Status', render: (_, s) => <StatusTag status={s.status} /> },
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
