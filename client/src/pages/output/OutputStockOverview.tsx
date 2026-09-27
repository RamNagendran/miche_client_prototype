import { Table } from 'antd'
import { useApp } from '../../context/AppContext'
import { Formula, PageHeader, SectionTitle } from '../../components/ui'
import { CompanyOutputCard, FactoryCard } from '../../components/LocationCards'
import { companyOutputStock, outputName, outputStockLine } from '../../data/selectors'
import { factories, outputs } from '../../data/seed'
import { seriesColors } from '../../theme/theme'
import { formatKg } from '../../utils/format'

export default function OutputStockOverview() {
  const { period } = useApp()
  const company = companyOutputStock()

  const rows = factories.flatMap((f) =>
    outputs.map((o) => ({ key: `${f.id}-${o.id}`, factory: f.name, first: o.id === 'rubber', product: o.id, ...outputStockLine(f.id, o.id) })),
  )

  return (
    <div className="page">
      <PageHeader title="Output stock" subtitle="Rubber, steel and other output at each factory, ready to sell." />

      <div className="grid grid-4">
        {factories.map((f) => (
          <FactoryCard key={f.id} id={f.id} period={period} />
        ))}
        <CompanyOutputCard period={period} />
      </div>

      <SectionTitle title="How available stock is worked out" hint="Company-wide, since 1 April 2026" />
      <div className="grid" style={{ gap: 12 }}>
        {company
          .filter((c) => c.product !== 'other')
          .map((c) => (
            <div key={c.product} className="surface" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 90, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="legend-dot" style={{ background: seriesColors[c.product] }} />
                {outputName(c.product)}
              </div>
              <div style={{ flex: 1 }}>
                <Formula
                  parts={[
                    { label: 'Opening stock', value: formatKg(c.opening) },
                    { op: '+', label: 'Produced', value: formatKg(c.in), kind: 'in' },
                    { op: '−', label: 'Sold', value: formatKg(c.out), kind: 'out' },
                    { op: '=', label: 'Available now', value: formatKg(c.current), kind: 'result' },
                  ]}
                />
              </div>
            </div>
          ))}
      </div>

      <SectionTitle title="By factory and product" hint="since 1 April 2026" />
      <div className="surface table-card">
        <Table
          scroll={{ x: 'max-content' }}
          pagination={false}
          dataSource={rows}
          columns={[
            {
              title: 'Factory',
              dataIndex: 'factory',
              onCell: (r) => ({ rowSpan: r.first ? 3 : 0 }),
              render: (v) => <b>{v}</b>,
            },
            {
              title: 'Product',
              dataIndex: 'product',
              render: (p) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="legend-dot" style={{ background: seriesColors[p as 'rubber'] }} />
                  {outputName(p)}
                </span>
              ),
            },
            { title: 'Opening', dataIndex: 'opening', align: 'right', render: (v) => <span className="num muted">{formatKg(v)}</span> },
            { title: 'Produced', dataIndex: 'in', align: 'right', render: (v) => <span className="num" style={{ color: '#1f9d6b', fontWeight: 700 }}>+{formatKg(v)}</span> },
            { title: 'Sold', dataIndex: 'out', align: 'right', render: (v) => <span className="num" style={{ color: '#D82E54', fontWeight: 700 }}>−{formatKg(v)}</span> },
            { title: 'Available now', dataIndex: 'current', align: 'right', render: (v) => <span className="num strong">{formatKg(v)}</span> },
          ]}
        />
      </div>
    </div>
  )
}
