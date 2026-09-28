import { useNavigate } from 'react-router-dom'
import { Table } from 'antd'
import { useApp } from '../../context/AppContext'
import { useScope } from '../../context/useScope'
import { PageHeader, SectionTitle } from '../../components/ui'
import { CompanyRawCard, WarehouseCard } from '../../components/LocationCards'
import { factoryById, periodLabels, rawStockLine, warehouseTotals } from '../../data/selectors'
import { materials } from '../../data/seed'
import { seriesColors } from '../../theme/theme'
import { formatINRShort, formatKg } from '../../utils/format'

export default function WarehousesOverview() {
  const { period } = useApp()
  const navigate = useNavigate()
  // Operators see only their own warehouses, and no company-wide total.
  const { warehouses, everything } = useScope()

  const matrix = materials
    .filter((m) => warehouses.some((w) => w.materials.includes(m.id)))
    .map((m) => {
      const row: Record<string, number | string> = { key: m.id, name: m.name, color: seriesColors[m.id] }
      let total = 0
      warehouses.forEach((w) => {
        const v = w.materials.includes(m.id) ? rawStockLine(w.id, m.id).current : 0
        row[w.id] = v
        total += v
      })
      row.total = total
      return row
    })
  const totalRow: Record<string, number | string> = { key: 'total', name: 'All tyre types', color: '#191919' }
  ;[...warehouses.map((w) => w.id), 'total'].forEach((k) => (totalRow[k] = matrix.reduce((s, r) => s + Number(r[k]), 0)))

  return (
    <div className="page">
      <PageHeader
        title="Warehouses"
        subtitle={everything ? 'Raw material in each warehouse right now. Every warehouse keeps its own stock.' : 'Raw material in your warehouse right now.'}
      />

      <div className="grid grid-4">
        {warehouses.map((w) => (
          <WarehouseCard key={w.id} id={w.id} />
        ))}
        {everything && <CompanyRawCard />}
      </div>

      <SectionTitle title="Stock by tyre type" hint="kg in stock right now" />
      <div className="surface table-card">
        <Table
          scroll={{ x: 'max-content' }}
          pagination={false}
          dataSource={[...matrix, totalRow]}
          rowClassName={(r) => (r.key === 'total' ? 'total-row' : '')}
          columns={[
            {
              title: 'Tyre type',
              dataIndex: 'name',
              render: (v, r) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: r.key === 'total' ? 800 : 600 }}>
                  {r.key !== 'total' && <span className="legend-dot" style={{ background: String(r.color) }} />}
                  {v}
                </span>
              ),
            },
            ...warehouses.map((w) => ({
              title: w.name,
              dataIndex: w.id,
              align: 'right' as const,
              render: (v: number, r: Record<string, number | string>) =>
                v ? (
                  <span className="num" style={{ fontWeight: r.key === 'total' ? 800 : 600 }}>
                    {formatKg(v)}
                  </span>
                ) : (
                  <span className="faint">—</span>
                ),
            })),
            // With a single warehouse, a total column would only repeat it.
            ...(warehouses.length > 1
              ? [
                  {
                    title: everything ? 'Company total' : 'Total',
                    dataIndex: 'total',
                    align: 'right' as const,
                    render: (v: number) => (
                      <span className="num strong" style={{ fontWeight: 800 }}>
                        {formatKg(v)}
                      </span>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </div>

      <SectionTitle title="Movement" hint={periodLabels[period]} />
      <div className="surface table-card">
        <Table
          scroll={{ x: 'max-content' }}
          pagination={false}
          rowKey="id"
          dataSource={warehouses}
          onRow={(w) => ({ onClick: () => navigate(`/warehouses/${w.id}`), style: { cursor: 'pointer' } })}
          columns={[
            {
              title: 'Warehouse',
              render: (_, w) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="loc-badge wh" style={{ width: 30, height: 30, fontSize: 13, borderRadius: 8 }}>
                    {w.code}
                  </span>
                  <span>
                    <div style={{ fontWeight: 700 }}>{w.name}</div>
                    <div className="faint" style={{ fontSize: 12.5 }}>
                      {w.city}
                    </div>
                  </span>
                </span>
              ),
            },
            { title: 'Supplies', render: (_, w) => w.supplies.map((f) => factoryById(f).name).join(', ') },
            { title: 'Purchased in', align: 'right', render: (_, w) => <span className="num" style={{ color: '#1f9d6b', fontWeight: 700 }}>+{formatKg(warehouseTotals(w.id, period).purchasedKg)}</span> },
            { title: 'Sent to factories', align: 'right', render: (_, w) => <span className="num" style={{ color: '#D82E54', fontWeight: 700 }}>−{formatKg(warehouseTotals(w.id, period).consumedKg)}</span> },
            { title: 'Purchase cost', align: 'right', render: (_, w) => <span className="num" style={{ fontWeight: 700 }}>{formatINRShort(warehouseTotals(w.id, period).purchaseSpend)}</span> },
          ]}
        />
      </div>
    </div>
  )
}
