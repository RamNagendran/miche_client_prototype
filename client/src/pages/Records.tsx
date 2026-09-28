import { useMemo, useState } from 'react'
import { Button, DatePicker, Input, Segmented, Select, Table, Tooltip } from 'antd'
import { DownloadOutlined, SearchOutlined, ShopOutlined, ShoppingCartOutlined, ExperimentOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { PageHeader, StatusTag } from '../components/ui'
import { allRecords, type RecordRow, type RecordType } from '../data/selectors'
import { factories, warehouses } from '../data/seed'
import { formatDate, formatINR, formatKg } from '../utils/format'

const typeMeta: Record<RecordType, { label: string; fg: string; icon: React.ReactNode }> = {
  purchase: { label: 'Purchase', fg: '#2F6FEB', icon: <ShoppingCartOutlined /> },
  production: { label: 'Production', fg: '#3a3f47', icon: <ExperimentOutlined /> },
  sale: { label: 'Sale', fg: '#D82E54', icon: <ShopOutlined /> },
}

export default function Records() {
  const all = useMemo(() => allRecords(), [])
  const [type, setType] = useState<string>('all')
  const [loc, setLoc] = useState<string>()
  const [q, setQ] = useState('')
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  const rows = all
    .filter((r) => type === 'all' || r.type === type)
    .filter((r) => !loc || r.location.includes(loc))
    .filter((r) => !range?.[0] || !range?.[1] || (r.date >= range[0].format('YYYY-MM-DD') && r.date <= range[1].format('YYYY-MM-DD')))
    .filter((r) => !q || `${r.id} ${r.party} ${r.item} ${r.location}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="page">
      <PageHeader
        title="All records"
        subtitle="Every purchase, production entry and sale in one place — each with its own reference number."
        extra={
          <Button size="large" icon={<DownloadOutlined />}>
            Export to Excel
          </Button>
        }
      />
      <div className="surface table-card">
        <div style={{ display: 'flex', gap: 10, padding: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Segmented
            value={type}
            onChange={(v) => setType(String(v))}
            options={[
              { value: 'all', label: `All (${all.length})` },
              { value: 'purchase', label: 'Purchases' },
              { value: 'production', label: 'Production' },
              { value: 'sale', label: 'Sales' },
            ]}
          />
          <Input prefix={<SearchOutlined className="faint" />} placeholder="Search ID, supplier, buyer or location" style={{ width: 300 }} allowClear value={q} onChange={(e) => setQ(e.target.value)} />
          <Select
            allowClear
            placeholder="All locations"
            style={{ width: 180 }}
            value={loc}
            onChange={setLoc}
            options={[...warehouses, ...factories].map((l) => ({ value: l.name, label: l.name }))}
          />
          <DatePicker.RangePicker format="DD MMM" value={range} onChange={(v) => setRange(v)} />
          <div style={{ flex: 1 }} />
          <span className="faint" style={{ fontSize: 13 }}>
            {rows.length} records
          </span>
        </div>
        <Table<RecordRow>
          scroll={{ x: 'max-content' }}
          rowKey="key"
          dataSource={rows}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          columns={[
            {
              title: 'Reference',
              dataIndex: 'id',
              render: (v, r: RecordRow) => (
                <div>
                  <span className="id-link">{v}</span>
                  <div style={{ fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ color: typeMeta[r.type].fg, fontWeight: 700 }}>
                      {typeMeta[r.type].icon} {typeMeta[r.type].label}
                    </span>
                    <span className="faint">· {formatDate(r.date)}</span>
                  </div>
                </div>
              ),
            },
            {
              title: 'Where · what',
              key: 'where',
              width: 230,
              ellipsis: { showTitle: false },
              render: (_, r) => (
                <Tooltip title={`${r.location} · ${r.item}`} placement="topLeft">
                  <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.location}</div>
                  <div className="faint" style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.item}
                  </div>
                </Tooltip>
              ),
            },
            { title: 'Quantity', dataIndex: 'qtyKg', align: 'right', render: (v) => <span className="num">{formatKg(v)}</span> },
            { title: 'Value', dataIndex: 'value', align: 'right', render: (v) => (v === null ? <span className="faint">—</span> : <span className="num strong">{formatINR(v)}</span>) },
            {
              title: 'Supplier / buyer',
              key: 'party',
              width: 190,
              ellipsis: { showTitle: false },
              render: (_, r) => (
<Tooltip title={r.party !== '—' ? r.party : undefined} placement="topLeft">
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.party}</div>
                </Tooltip>
              ),
            },
            { title: 'Status', dataIndex: 'status', fixed: 'right', render: (s) => <StatusTag status={s} /> },
          ]}
        />
      </div>
    </div>
  )
}
