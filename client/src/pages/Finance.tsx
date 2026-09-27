import { Button, Dropdown, Table } from 'antd'
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined, InfoCircleFilled } from '@ant-design/icons'
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../context/AppContext'
import { Formula, PageHeader, SectionTitle } from '../components/ui'
import ChartTooltip from '../components/ChartTooltip'
import { confirmedPurchases, factoryTotals, materialName, monthlySeries, periodLabels, periodRange, periodSubtitle, periodTotals, purchaseValue, warehouseTotals } from '../data/selectors'
import { factories, materials, warehouses } from '../data/seed'
import { seriesColors } from '../theme/theme'
import { formatINR, formatINRShort, formatKg, formatPercent, formatTonnes } from '../utils/format'

export default function Finance() {
  const { period } = useApp()
  const t = periodTotals(period)
  const series = monthlySeries()
  const [from, to] = periodRange(period)

  const byMaterial = materials.map((m) => {
    const list = confirmedPurchases.filter((p) => p.material === m.id && p.date >= from && p.date <= to)
    return { key: m.id, name: m.name, kg: list.reduce((s, p) => s + p.qtyKg, 0), value: list.reduce((s, p) => s + purchaseValue(p), 0) }
  })

  return (
    <div className="page">
      <PageHeader
        title="Finance"
        subtitle={`A simple view of money spent and money received · ${periodLabels[period].toLowerCase()} (${periodSubtitle(period)})`}
        extra={
          <Dropdown
            menu={{
              items: [
                { key: 'pdf', icon: <FilePdfOutlined />, label: 'Download as PDF' },
                { key: 'xls', icon: <FileExcelOutlined />, label: 'Download as Excel' },
              ],
            }}
          >
            <Button size="large" icon={<DownloadOutlined />}>
              Download report
            </Button>
          </Dropdown>
        }
      />

      <div className="info-banner" style={{ marginBottom: 20 }}>
        <InfoCircleFilled style={{ marginTop: 3 }} />
        <div>
          <b>Stage 1 shows a basic difference only:</b> sales received minus purchases spent. Labour, electricity, transport and other overheads are not included yet — they come in Stage 2.
        </div>
      </div>

      <div className="surface" style={{ padding: 24 }}>
        <Formula
          parts={[
            { label: `Received from sales · ${t.salesCount} invoices`, value: formatINR(t.salesRevenue), kind: 'in' },
            { op: '−', label: `Spent on purchases · ${t.purchaseCount} bills`, value: formatINR(t.purchaseSpend), kind: 'out' },
            { op: '=', label: `Basic difference · ${formatPercent(t.marginPct)} of sales`, value: formatINR(t.margin), kind: 'result' },
          ]}
        />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', marginTop: 16 }}>
        <div className="surface" style={{ padding: 22 }}>
          <div className="strong" style={{ fontSize: 16 }}>
            Month by month
          </div>
          <div className="faint" style={{ fontSize: 13 }}>
            Purchases, sales and the basic difference · all figures in ₹
          </div>
          <div style={{ height: 300, marginTop: 8 }}>
            <ResponsiveContainer>
              <ComposedChart data={series} barGap={2} barCategoryGap="28%" margin={{ top: 16, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eef0f3" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8a919e', fontSize: 12.5 }} />
                <YAxis axisLine={false} tickLine={false} width={64} tick={{ fill: '#8a919e', fontSize: 12 }} tickFormatter={(v) => formatINRShort(v).replace('.00', '')} />
                <Tooltip cursor={{ fill: 'rgba(16,24,40,0.04)' }} content={<ChartTooltip format={(v) => formatINRShort(v)} />} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 13, paddingTop: 8 }} formatter={(v) => <span style={{ color: '#3a3f47', fontWeight: 600 }}>{v}</span>} />
                <Bar isAnimationActive={false} dataKey="purchase" name="Purchases" fill={seriesColors.purchase} radius={[4, 4, 0, 0]} maxBarSize={34} />
                <Bar isAnimationActive={false} dataKey="sales" name="Sales" fill={seriesColors.sales} radius={[4, 4, 0, 0]} maxBarSize={34} />
                <Line isAnimationActive={false} dataKey="margin" name="Basic difference" stroke={seriesColors.margin} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="surface" style={{ padding: 22 }}>
          <div className="strong" style={{ fontSize: 16 }}>
            Worked example
          </div>
          <div className="faint" style={{ fontSize: 13, marginBottom: 14 }}>
            How the basic difference is calculated
          </div>
          {(
            [
              ['Purchase', '5,000 kg × ₹10/kg', '₹50,000'],
              ['Production', '3,200 kg rubber + 1,400 kg steel', ''],
              ['Rubber sold', '', '₹60,000'],
              ['Steel sold', '', '₹20,000'],
            ] as [string, string, string][]
          ).map(([a, b, c]) => (
            <div key={a} className="summary-line">
              <span>
                <b>{a}</b>
                {b && (
                  <span className="muted" style={{ display: 'block', fontSize: 12.5 }}>
                    {b}
                  </span>
                )}
              </span>
              <b className="num">{c}</b>
            </div>
          ))}
          <div style={{ background: '#191919', color: '#fff', borderRadius: 12, padding: '14px 16px', marginTop: 12 }}>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12.5, fontWeight: 700 }}>₹80,000 sales − ₹50,000 purchase</div>
            <div className="num" style={{ fontSize: 22, fontWeight: 800 }}>
              = ₹30,000 basic difference
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="surface" style={{ padding: 22 }}>
          <div className="strong" style={{ fontSize: 16 }}>
            Sales by product
          </div>
          <div className="faint" style={{ fontSize: 13 }}>
            {periodLabels[period]}
          </div>
          <div style={{ height: 200, marginTop: 8 }}>
            <ResponsiveContainer>
              <BarChart data={t.salesByProduct.map((p) => ({ ...p, name: p.product === 'rubber' ? 'Rubber' : p.product === 'steel' ? 'Steel' : 'Other' }))} layout="vertical" margin={{ left: 8, right: 60 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={64} tick={{ fill: '#3a3f47', fontSize: 13, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: 'rgba(16,24,40,0.04)' }} content={<ChartTooltip format={(v) => formatINR(v)} />} />
                <Bar isAnimationActive={false} dataKey="value" name="Sales value" radius={[0, 4, 4, 0]} barSize={26} label={{ position: 'right', formatter: (v: unknown) => formatINRShort(Number(v)), fill: '#1f2329', fontSize: 12.5, fontWeight: 700 }}>
                  {t.salesByProduct.map((p) => (
                    <Cell key={p.product} fill={seriesColors[p.product]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="surface" style={{ padding: 22 }}>
          <div className="strong" style={{ fontSize: 16 }}>
            Purchases by tyre type
          </div>
          <div className="faint" style={{ fontSize: 13 }}>
            {periodLabels[period]}
          </div>
          <div style={{ height: 200, marginTop: 8 }}>
            <ResponsiveContainer>
              <BarChart data={byMaterial} layout="vertical" margin={{ left: 8, right: 60 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={120} tick={{ fill: '#3a3f47', fontSize: 13, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: 'rgba(16,24,40,0.04)' }} content={<ChartTooltip format={(v) => formatINR(v)} />} />
                <Bar isAnimationActive={false} dataKey="value" name="Purchase cost" radius={[0, 4, 4, 0]} barSize={22} label={{ position: 'right', formatter: (v: unknown) => formatINRShort(Number(v)), fill: '#1f2329', fontSize: 12.5, fontWeight: 700 }}>
                  {byMaterial.map((m) => (
                    <Cell key={m.key} fill={seriesColors[m.key]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div>
          <SectionTitle title="Spend by warehouse" hint={periodLabels[period]} />
          <div className="surface table-card">
            <Table
              scroll={{ x: 'max-content' }}
              pagination={false}
              rowKey="id"
              dataSource={warehouses}
              columns={[
                { title: 'Warehouse', dataIndex: 'name', render: (v) => <b>{v}</b> },
                { title: 'Bought', align: 'right', render: (_, w) => <span className="num">{formatTonnes(warehouseTotals(w.id, period).purchasedKg)}</span> },
                { title: 'Spent', align: 'right', render: (_, w) => <span className="num strong">{formatINR(warehouseTotals(w.id, period).purchaseSpend)}</span> },
              ]}
            />
          </div>
        </div>
        <div>
          <SectionTitle title="Sales by factory" hint={periodLabels[period]} />
          <div className="surface table-card">
            <Table
              scroll={{ x: 'max-content' }}
              pagination={false}
              rowKey="id"
              dataSource={factories}
              columns={[
                { title: 'Factory', dataIndex: 'name', render: (v) => <b>{v}</b> },
                { title: 'Sold', align: 'right', render: (_, f) => <span className="num">{formatTonnes(factoryTotals(f.id, period).salesKg)}</span> },
                { title: 'Received', align: 'right', render: (_, f) => <span className="num strong">{formatINR(factoryTotals(f.id, period).salesRevenue)}</span> },
              ]}
            />
          </div>
        </div>
      </div>

      <SectionTitle title="Monthly summary" hint="Financial year 2026-27" />
      <div className="surface table-card">
        <Table
          scroll={{ x: 'max-content' }}
          pagination={false}
          rowKey="month"
          dataSource={series}
          columns={[
            { title: 'Month', dataIndex: 'month', render: (v) => <b>{v} 2026</b> },
            { title: 'Bought', dataIndex: 'purchaseKg', align: 'right', render: (v) => <span className="num">{formatKg(v)}</span> },
            { title: 'Purchase cost', dataIndex: 'purchase', align: 'right', render: (v) => <span className="num">{formatINR(v)}</span> },
            { title: 'Sold', dataIndex: 'salesKg', align: 'right', render: (v) => <span className="num">{formatKg(v)}</span> },
            { title: 'Sales value', dataIndex: 'sales', align: 'right', render: (v) => <span className="num">{formatINR(v)}</span> },
            {
              title: 'Basic difference',
              dataIndex: 'margin',
              align: 'right',
              render: (v: number) => (
                <span className="num" style={{ fontWeight: 800, color: v < 0 ? '#c0392b' : '#137a52' }}>
                  {v < 0 ? '−' : ''}
                  {formatINR(Math.abs(v))}
                </span>
              ),
            },
          ]}
          summary={(data) => {
            const p = data.reduce((s, r) => s + r.purchase, 0)
            const s = data.reduce((a, r) => a + r.sales, 0)
            return (
              <Table.Summary.Row className="total-row">
                <Table.Summary.Cell index={0}>
                  <b>Total</b>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <b className="num">{formatKg(data.reduce((a, r) => a + r.purchaseKg, 0))}</b>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <b className="num">{formatINR(p)}</b>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <b className="num">{formatKg(data.reduce((a, r) => a + r.salesKg, 0))}</b>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <b className="num">{formatINR(s)}</b>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <b className="num" style={{ color: '#137a52' }}>
                    {formatINR(s - p)}
                  </b>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }}
        />
      </div>
      <div className="faint" style={{ fontSize: 12.5, marginTop: 10 }}>
        Tyre types shown: {materials.map((m) => materialName(m.id)).join(', ')}. All values before GST.
      </div>
    </div>
  )
}
