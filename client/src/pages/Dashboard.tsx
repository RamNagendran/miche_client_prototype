import { useNavigate } from 'react-router-dom'
import { Button, Timeline } from 'antd'
import {
  DownloadOutlined,
  InboxOutlined,
  RiseOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  RightOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import dayjs from 'dayjs'
import { useApp } from '../context/AppContext'
import { Formula, KpiCard, PageHeader, SectionTitle } from '../components/ui'
import ChartTooltip from '../components/ChartTooltip'
import { CompanyOutputCard, CompanyRawCard, FactoryCard, WarehouseCard } from '../components/LocationCards'
import {
  allRecords,
  companyOutputStock,
  companyRawTotal,
  factoryTotals,
  outputName,
  periodLabels,
  periodSubtitle,
  periodTotals,
  warehouseStock,
} from '../data/selectors'
import { factories, TODAY, warehouses } from '../data/seed'
import { brand, seriesColors } from '../theme/theme'
import { formatDateShort, formatINRShort, formatKg, formatPercent, formatTonnes } from '../utils/format'

export default function Dashboard() {
  const { user, period } = useApp()
  const navigate = useNavigate()
  const t = periodTotals(period)
  const rawTotal = companyRawTotal()
  const out = companyOutputStock()
  const rubber = out.find((o) => o.product === 'rubber')!
  const steel = out.find((o) => o.product === 'steel')!
  const hour = dayjs().hour()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const produceMix = [
    { name: 'Rubber', key: 'rubber', value: t.produced.rubber },
    { name: 'Steel', key: 'steel', value: t.produced.steel },
    { name: 'Other', key: 'other', value: t.produced.other },
  ] as const

  const flow = [
    { title: 'Purchased', value: formatTonnes(t.purchaseKg), sub: `${formatINRShort(t.purchaseSpend)} · ${t.purchaseCount} bills`, to: '/purchases', icon: <ShoppingCartOutlined /> },
    { title: 'In warehouses now', value: formatTonnes(rawTotal), sub: `${warehouses.length} warehouses`, to: '/warehouses', icon: <InboxOutlined /> },
    { title: 'Sent to factories', value: formatTonnes(t.consumedKg), sub: `${t.productionCount} production entries`, to: '/production', icon: <ExperimentOutlined /> },
    {
      title: 'Produced',
      value: formatTonnes(t.producedKg),
      sub: `Rubber ${formatTonnes(t.produced.rubber)} · Steel ${formatTonnes(t.produced.steel)}`,
      to: '/output-stock',
      icon: <RiseOutlined />,
    },
    { title: 'Sold', value: formatTonnes(t.salesKg), sub: `${formatINRShort(t.salesRevenue)} · ${t.salesCount} invoices`, to: '/sales', icon: <ShopOutlined /> },
  ]

  const quickAnswers = [
    { q: 'What did we purchase?', a: `${formatTonnes(t.purchaseKg)} for ${formatINRShort(t.purchaseSpend)}`, to: '/purchases' },
    {
      q: 'How much raw material is in each warehouse?',
      a: warehouses.map((w) => `${w.code}: ${formatTonnes(warehouseStock(w.id).total.current)}`).join(' · '),
      to: '/warehouses',
    },
    { q: 'How much has each factory used?', a: factories.map((f) => `${f.code}: ${formatTonnes(factoryTotals(f.id, period).consumed)}`).join(' · '), to: '/production' },
    {
      q: 'What has each factory produced?',
      a: factories.map((f) => {
        const ft = factoryTotals(f.id, period)
        return `${f.code}: ${formatTonnes(ft.rubber + ft.steel + ft.other)}`
      }).join(' · '),
      to: '/output-stock',
    },
    { q: 'How much rubber / steel is available?', a: `Rubber ${formatKg(rubber.current)} · Steel ${formatKg(steel.current)}`, to: '/output-stock' },
    { q: 'What have we sold?', a: `${formatTonnes(t.salesKg)} across ${t.salesCount} invoices`, to: '/sales' },
    { q: 'How much did we spend on purchases?', a: formatINRShort(t.purchaseSpend), to: '/finance' },
    { q: 'How much did we receive from sales?', a: formatINRShort(t.salesRevenue), to: '/finance' },
    { q: 'What is the basic difference?', a: `${formatINRShort(t.margin)} (${formatPercent(t.marginPct)} of sales)`, to: '/finance' },
    { q: 'Company-wide totals?', a: `Raw ${formatTonnes(rawTotal)} · Output ${formatTonnes(out.reduce((s, o) => s + o.current, 0))}`, to: '/warehouses' },
  ]

  const recent = allRecords().slice(0, 7)

  return (
    <div className="page">
      <PageHeader
        eyebrow={dayjs(TODAY).format('dddd, D MMMM YYYY')}
        title={`${greeting}, ${user?.name.split(' ')[0]}`}
        subtitle={
          <>
            Here's how the business is doing — <b>{periodLabels[period].toLowerCase()}</b> ({periodSubtitle(period)}).
          </>
        }
        extra={
          <Button icon={<DownloadOutlined />} size="large">
            Download summary
          </Button>
        }
      />

      <div className="grid grid-4">
        <KpiCard
          label="Spent on purchases"
          value={formatINRShort(t.purchaseSpend)}
          sub={`${formatKg(t.purchaseKg)} of raw material`}
          icon={<ShoppingCartOutlined />}
          tone={{ bg: '#eef4fb', fg: seriesColors.purchase }}
          onClick={() => navigate('/purchases')}
        />
        <KpiCard
          label="Received from sales"
          value={formatINRShort(t.salesRevenue)}
          sub={`${formatKg(t.salesKg)} sold`}
          icon={<ShopOutlined />}
          tone={{ bg: brand.primarySoft, fg: brand.primary }}
          onClick={() => navigate('/sales')}
        />
        <KpiCard
          label="Basic difference"
          value={formatINRShort(t.margin)}
          sub={`${formatPercent(t.marginPct)} of sales value`}
          icon={<RiseOutlined />}
          tone={{ bg: '#e6f5f3', fg: seriesColors.margin }}
          help="Sales received minus purchases spent. Labour, electricity and transport costs are not included."
          onClick={() => navigate('/finance')}
        />
        <KpiCard
          label="Raw material in stock"
          value={formatTonnes(rawTotal)}
          sub={`${formatKg(rawTotal)} across ${warehouses.length} warehouses`}
          icon={<InboxOutlined />}
          tone={{ bg: '#f1f2f5', fg: '#3a3f47' }}
          help="Stock right now, whatever period is selected."
          onClick={() => navigate('/warehouses')}
        />
      </div>

      <SectionTitle title="How material moved" hint={`${periodLabels[period]} · click any step for details`} />
      <div className="surface flow">
        {flow.map((f, i) => (
          <div key={f.title} className="flow-step" onClick={() => navigate(f.to)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="step-no">{i + 1}</span>
              <span className="step-title">{f.title}</span>
            </div>
            <div className="step-value">{f.value}</div>
            <div className="step-sub">{f.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', marginTop: 16 }}>
        <div className="surface" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div className="strong" style={{ fontSize: 16 }}>
                Money in and out
              </div>
              <div className="faint" style={{ fontSize: 13 }}>
                {periodLabels[period]} · all figures before GST
              </div>
            </div>
            <Button type="link" onClick={() => navigate('/finance')} style={{ paddingInline: 0 }}>
              Open finance <RightOutlined />
            </Button>
          </div>
          <Formula
            parts={[
              { label: `Received from sales · ${t.salesCount} invoices`, value: formatINRShort(t.salesRevenue), kind: 'in' },
              { op: '−', label: `Spent on purchases · ${t.purchaseCount} bills`, value: formatINRShort(t.purchaseSpend), kind: 'out' },
              { op: '=', label: 'Basic difference', value: formatINRShort(t.margin), kind: 'result' },
            ]}
          />
          <div className="faint" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '22px 0 10px' }}>
            Sales by product
          </div>
          {t.salesByProduct.map((p) => (
            <div key={p.product} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 190px', alignItems: 'center', gap: 14, padding: '7px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                <span className="legend-dot" style={{ background: seriesColors[p.product] }} />
                {outputName(p.product)}
              </span>
              <div style={{ height: 10, borderRadius: 99, background: '#eef0f3', overflow: 'hidden' }}>
                <div style={{ width: `${(p.value / (t.salesRevenue || 1)) * 100}%`, height: '100%', background: seriesColors[p.product], borderRadius: 99 }} />
              </div>
              <span className="num" style={{ textAlign: 'right' }}>
                <b>{formatINRShort(p.value)}</b>
                <span className="faint" style={{ marginLeft: 8 }}>
                  {formatTonnes(p.kg)}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="surface" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
          <div className="strong" style={{ fontSize: 16 }}>
            What we produced
          </div>
          <div className="faint" style={{ fontSize: 13 }}>
            {periodLabels[period]} · all factories
          </div>
          <div style={{ height: 190, position: 'relative', marginTop: 8 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={produceMix as unknown as { name: string; value: number }[]} isAnimationActive={false} dataKey="value" nameKey="name" innerRadius={62} outerRadius={86} paddingAngle={2} stroke="#fff" strokeWidth={2} startAngle={90} endAngle={-270}>
                  {produceMix.map((m) => (
                    <Cell key={m.key} fill={seriesColors[m.key]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip format={(v) => formatKg(v)} />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="num strong" style={{ fontSize: 22 }}>
                  {formatTonnes(t.producedKg)}
                </div>
                <div className="faint" style={{ fontSize: 12 }}>
                  total output
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 'auto' }}>
            {produceMix.map((m) => (
              <div className="mat-row" key={m.key}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="legend-dot" style={{ background: seriesColors[m.key] }} />
                  {m.name}
                </span>
                <span className="num">
                  <b>{formatKg(m.value)}</b>
                  <span className="faint" style={{ marginLeft: 8 }}>
                    {formatPercent((m.value / (t.producedKg || 1)) * 100, 0)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionTitle
        title="Warehouses"
        hint="Raw material in stock right now"
        extra={
          <Button type="link" onClick={() => navigate('/warehouses')}>
            All warehouses <RightOutlined />
          </Button>
        }
      />
      <div className="grid grid-4">
        {warehouses.map((w) => (
          <WarehouseCard key={w.id} id={w.id} />
        ))}
        <CompanyRawCard />
      </div>

      <SectionTitle
        title="Factories"
        hint={`Production ${periodLabels[period].toLowerCase()} and output stock right now`}
        extra={
          <Button type="link" onClick={() => navigate('/output-stock')}>
            All output stock <RightOutlined />
          </Button>
        }
      />
      <div className="grid grid-4">
        {factories.map((f) => (
          <FactoryCard key={f.id} id={f.id} period={period} />
        ))}
        <CompanyOutputCard period={period} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr', marginTop: 32 }}>
        <div className="surface" style={{ padding: '20px 22px' }}>
          <div className="strong" style={{ fontSize: 16 }}>
            Quick answers
          </div>
          <div className="faint" style={{ fontSize: 13, marginBottom: 8 }}>
            The 10 questions management asks most · {periodLabels[period].toLowerCase()}
          </div>
          {quickAnswers.map((qa, i) => (
            <div key={qa.q} className="qa-row" onClick={() => navigate(qa.to)}>
              <span className="qa-no">{i + 1}</span>
              <span style={{ flex: 1, fontWeight: 600, color: '#3a3f47' }}>{qa.q}</span>
              <span className="num strong" style={{ fontSize: 13.5, textAlign: 'right' }}>
                {qa.a}
              </span>
              <RightOutlined className="faint" style={{ fontSize: 11 }} />
            </div>
          ))}
        </div>

        <div className="surface" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="strong" style={{ fontSize: 16 }}>
              Latest entries
            </div>
            <Button type="link" onClick={() => navigate('/records')} style={{ paddingInline: 0 }}>
              All records
            </Button>
          </div>
          <Timeline
            style={{ marginTop: 18 }}
            items={recent.map((r) => ({
              color: r.type === 'purchase' ? seriesColors.purchase : r.type === 'sale' ? brand.primary : '#3a3f47',
              title: (
                <span className="faint" style={{ fontSize: 12 }}>
                  {formatDateShort(r.date)} · {r.id}
                </span>
              ),
              content: (
                <div style={{ marginTop: -2 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                    {r.type === 'purchase' ? 'Purchase' : r.type === 'sale' ? 'Sale' : 'Production'} · {r.item}
                  </div>
                  <div className="muted num" style={{ fontSize: 12.5 }}>
                    {formatKg(r.qtyKg)} · {r.location}
                    {r.value !== null && ` · ${formatINRShort(r.value)}`}
                    {r.status === 'review' && <span style={{ color: brand.amber, fontWeight: 700 }}> · needs review</span>}
                  </div>
                </div>
              ),
            }))}
          />
        </div>
      </div>
    </div>
  )
}
