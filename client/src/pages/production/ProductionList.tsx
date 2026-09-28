import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Segmented, Select, Table } from 'antd'
import { DownloadOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { can, useApp } from '../../context/AppContext'
import { useScope } from '../../context/useScope'
import { MaterialTag, PageHeader } from '../../components/ui'
import { production } from '../../data/seed'
import { factoryById, productionOutputKg, warehouseById } from '../../data/selectors'
import { formatDate, formatKg, formatTonnes } from '../../utils/format'
import type { Production } from '../../data/types'

export default function ProductionList() {
  const navigate = useNavigate()
  const { role } = useApp()
  const [factory, setFactory] = useState<string>('all')
  const [wh, setWh] = useState<string>()
  const [q, setQ] = useState('')

  const scope = useScope()
  // Operators only see production at their factories, or material taken from their warehouses.
  const rows = [...production]
    .reverse()
    .filter((p) => scope.hasFactory(p.factoryId) || scope.hasWarehouse(p.warehouseId))
    .filter((p) => factory === 'all' || p.factoryId === factory)
    .filter((p) => !wh || p.warehouseId === wh)
    .filter((p) => !q || p.id.toLowerCase().includes(q.toLowerCase()))
  const input = rows.reduce((s, p) => s + p.inputKg, 0)
  const rubber = rows.reduce((s, p) => s + p.outputs.rubber, 0)
  const steel = rows.reduce((s, p) => s + p.outputs.steel, 0)
  const other = rows.reduce((s, p) => s + p.outputs.other, 0)

  const columns: ColumnsType<Production> = [
    { title: 'Entry', key: 'id', render: (_, p) => <div><span className="id-link">{p.id}</span><div className="faint" style={{ fontSize: 12.5 }}>{formatDate(p.date)}</div></div> },
    {
      title: 'Factory',
      key: 'f',
      render: (_, p) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="loc-badge fa" style={{ width: 26, height: 26, fontSize: 12, borderRadius: 7 }}>
            {factoryById(p.factoryId).code}
          </span>
          <span>
            <div style={{ fontWeight: 700 }}>{factoryById(p.factoryId).name}</div>
            <div className="faint" style={{ fontSize: 12.5 }}>
              from {warehouseById(p.warehouseId).name}
            </div>
          </span>
        </span>
      ),
    },
    { title: 'Raw material', key: 'm', render: (_, p) => <MaterialTag id={p.material} /> },
    { title: 'Used', key: 'in', align: 'right', render: (_, p) => <span className="num strong">{formatKg(p.inputKg)}</span> },
    { title: 'Rubber', key: 'r', align: 'right', render: (_, p) => <span className="num">{formatKg(p.outputs.rubber)}</span> },
    { title: 'Steel', key: 's', align: 'right', render: (_, p) => <span className="num">{formatKg(p.outputs.steel)}</span> },
    { title: 'Other', key: 'o', align: 'right', render: (_, p) => <span className="num faint">{p.outputs.other ? formatKg(p.outputs.other) : '—'}</span> },
    { title: 'Total output', key: 't', align: 'right', render: (_, p) => <span className="num strong">{formatKg(productionOutputKg(p))}</span> },
  ]

  return (
    <div className="page">
      <PageHeader
        title="Production"
        subtitle="What each factory used and what it produced. Entered by hand by the site team."
        extra={
          <>
            <Button icon={<DownloadOutlined />} size="large">
              Export
            </Button>
            {can(role).enterData && (
              <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => navigate('/production/new')}>
                Record production
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        {[
          ['Raw material used', formatTonnes(input), `${rows.length} entries`],
          ['Rubber produced', formatTonnes(rubber), formatKg(rubber)],
          ['Steel produced', formatTonnes(steel), formatKg(steel)],
          ['Other produced', formatTonnes(other), formatKg(other)],
        ].map(([l, v, s]) => (
          <div key={l} className="surface" style={{ padding: '16px 20px' }}>
            <div className="muted" style={{ fontWeight: 700, fontSize: 13 }}>
              {l}
            </div>
            <div className="num strong" style={{ fontSize: 22, marginTop: 4 }}>
              {v}
            </div>
            <div className="faint" style={{ fontSize: 12.5 }}>
              {s}
            </div>
          </div>
        ))}
      </div>

      <div className="surface table-card">
        <div style={{ display: 'flex', gap: 10, padding: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Segmented value={factory} onChange={(v) => setFactory(String(v))} options={[{ value: 'all', label: 'All factories' }, ...scope.factories.map((f) => ({ value: f.id, label: f.name }))]} />
          <Select allowClear placeholder="Any warehouse" style={{ width: 180 }} value={wh} onChange={setWh} options={scope.warehouses.map((w) => ({ value: w.id, label: w.name }))} />
          <Input prefix={<SearchOutlined className="faint" />} placeholder="Search entry ID" style={{ width: 220 }} allowClear value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Table scroll={{ x: 'max-content' }} rowKey="id" columns={columns} dataSource={rows} pagination={{ pageSize: 12, showSizeChanger: false }} />
      </div>
    </div>
  )
}
