import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Button, DatePicker, Drawer, Input, Select, Table, Tabs } from 'antd'
import { DownloadOutlined, PlusOutlined, SearchOutlined, RightOutlined, EyeOutlined, ClockCircleFilled } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { can, useApp } from '../../context/AppContext'
import { useScope } from '../../context/useScope'
import { MaterialTag, PageHeader, Qty, SourceTag, StatusTag } from '../../components/ui'
import InvoiceDocument from '../../components/InvoiceDocument'
import { docForQueued } from '../../data/extraction'
import { materials, purchases, suppliers } from '../../data/seed'
import { confirmedPurchases, purchaseValue, reviewPurchases, supplierById, warehouseById, materialName } from '../../data/selectors'
import { formatDate, formatINR, formatINRShort, formatKg, formatRate, formatTonnes } from '../../utils/format'
import type { Purchase } from '../../data/types'

export default function PurchasesList() {
  const navigate = useNavigate()
  const { role } = useApp()
  const perms = can(role)
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'review' ? 'review' : 'all'
  const [q, setQ] = useState('')
  const [wh, setWh] = useState<string>()
  const [mat, setMat] = useState<string>()
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [open, setOpen] = useState<Purchase | null>(null)

  const scope = useScope()
  // Operators only see bills for the warehouses assigned to them.
  const visible = purchases.filter((p) => scope.hasWarehouse(p.warehouseId))
  const myConfirmed = confirmedPurchases.filter((p) => scope.hasWarehouse(p.warehouseId))
  const myReview = reviewPurchases.filter((p) => scope.hasWarehouse(p.warehouseId))

  const rows = [...visible]
    .reverse()
    .filter((p) => (tab === 'review' ? p.status === 'review' : true))
    .filter((p) => !wh || p.warehouseId === wh)
    .filter((p) => !mat || p.material === mat)
    .filter((p) => !range?.[0] || !range?.[1] || (p.date >= range[0].format('YYYY-MM-DD') && p.date <= range[1].format('YYYY-MM-DD')))
    .filter((p) => {
      if (!q) return true
      const s = `${p.id} ${p.invoiceNo} ${supplierById(p.supplierId).name}`.toLowerCase()
      return s.includes(q.toLowerCase())
    })

  const kg = myConfirmed.reduce((s, p) => s + p.qtyKg, 0)
  const spend = myConfirmed.reduce((s, p) => s + purchaseValue(p), 0)

  const columns: ColumnsType<Purchase> = [
    {
      title: 'Purchase',
      key: 'id',
      render: (_, p) => (
        <div>
          <a className="id-link">{p.id}</a>
          <div className="faint" style={{ fontSize: 12.5 }}>
            {formatDate(p.date)}
          </div>
        </div>
      ),
    },
    {
      title: 'Supplier',
      key: 'supplier',
      render: (_, p) => (
        <div>
          <div style={{ fontWeight: 700 }}>{supplierById(p.supplierId).name}</div>
          <div className="faint" style={{ fontSize: 12.5 }}>
            Bill {p.invoiceNo}
          </div>
        </div>
      ),
    },
    {
      title: 'Tyre type · warehouse',
      key: 'what',
      render: (_, p) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
          <MaterialTag id={p.material} />
          <span className="faint" style={{ fontSize: 12.5 }}>
            into {warehouseById(p.warehouseId).name}
          </span>
        </div>
      ),
    },
    { title: 'Quantity', key: 'qty', align: 'right', sorter: (a, b) => a.qtyKg - b.qtyKg, render: (_, p) => <Qty kg={p.qtyKg} block /> },
    {
      title: 'Total cost',
      key: 'total',
      align: 'right',
      sorter: (a, b) => purchaseValue(a) - purchaseValue(b),
      render: (_, p) => (
        <div className="num">
          <div style={{ fontWeight: 800 }}>{formatINR(purchaseValue(p))}</div>
          <div className="faint" style={{ fontSize: 12.5 }}>
            {formatRate(p.rate)}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      fixed: 'right',
      render: (_, p) =>
        p.status === 'review' && perms.enterData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
            <StatusTag status={p.status} />
            <Button type="primary" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/purchases/review/${p.id}`) }}>
              Check now
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
            <StatusTag status={p.status} />
            <SourceTag source={p.source} />
          </div>
        ),
    },
  ]

  return (
    <div className="page">
      <PageHeader
        title="Purchases"
        subtitle="Every raw-material bill, and the warehouse that received it."
        extra={
          <>
            <Button icon={<DownloadOutlined />} size="large">
              Export
            </Button>
            {perms.enterData && (
              <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => navigate('/purchases/new')}>
                Record a purchase
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        {[
          ['Bills this year', `${myConfirmed.length}`, 'confirmed purchases'],
          ['Raw material bought', formatTonnes(kg), formatKg(kg)],
          ['Total spent', formatINRShort(spend), 'before GST'],
          ['Waiting for review', `${myReview.length} ${myReview.length === 1 ? 'bill' : 'bills'}`, 'not in stock yet'],
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

      {myReview.length > 0 && tab === 'all' && perms.enterData && (
        <div className="surface fade-in" style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, borderColor: '#f3d9a4', background: '#fffbf2' }}>
          <span className="kpi-icon" style={{ background: '#fff0d1', color: '#d98a0b', width: 38, height: 38 }}>
            <ClockCircleFilled />
          </span>
          <div style={{ flex: 1 }}>
            <div className="strong">
              {myReview.length === 1 ? '1 uploaded bill is' : `${myReview.length} uploaded bills are`} waiting for someone to check
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              They are not counted in stock or spend until confirmed.
            </div>
          </div>
          <Button onClick={() => setParams({ tab: 'review' })}>
            Review now <RightOutlined />
          </Button>
        </div>
      )}

      <div className="surface table-card">
        <div style={{ padding: '4px 20px 0' }}>
          <Tabs
            activeKey={tab}
            onChange={(k) => setParams(k === 'review' ? { tab: 'review' } : {})}
            items={[
              { key: 'all', label: `All purchases (${visible.length})` },
              {
                key: 'review',
                label: (
                  <span>
                    Needs review <Badge count={myReview.length} color="#d98a0b" style={{ marginLeft: 4 }} />
                  </span>
                ),
              },
            ]}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '4px 20px 16px', flexWrap: 'wrap' }}>
          <Input prefix={<SearchOutlined className="faint" />} placeholder="Search supplier, bill number or ID" style={{ width: 300 }} allowClear value={q} onChange={(e) => setQ(e.target.value)} />
          <Select allowClear placeholder="All warehouses" style={{ width: 180 }} value={wh} onChange={setWh} options={scope.warehouses.map((w) => ({ value: w.id, label: w.name }))} />
          <Select allowClear placeholder="All tyre types" style={{ width: 180 }} value={mat} onChange={setMat} options={materials.map((m) => ({ value: m.id, label: m.name }))} />
          <DatePicker.RangePicker format="DD MMM" value={range} onChange={(v) => setRange(v)} />
          <div style={{ flex: 1 }} />
          <span className="faint" style={{ alignSelf: 'center', fontSize: 13 }}>
            {rows.length} shown · {formatTonnes(rows.reduce((s, r) => s + r.qtyKg, 0))} · {formatINRShort(rows.reduce((s, r) => s + purchaseValue(r), 0))}
          </span>
        </div>
        <Table
          scroll={{ x: 'max-content' }}
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          onRow={(p) => ({ onClick: () => (p.status === 'review' && perms.enterData ? navigate(`/purchases/review/${p.id}`) : setOpen(p)), style: { cursor: 'pointer' } })}
        />
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)} size={620} title={open && <span>{open.id}</span>} extra={open && <StatusTag status={open.status} />} destroyOnHidden>
        {open && (
          <div>
            <div className="num strong" style={{ fontSize: 28 }}>
              {formatINR(purchaseValue(open))}
            </div>
            <div className="muted">
              {formatKg(open.qtyKg)} of {materialName(open.material).toLowerCase()} at {formatRate(open.rate)}
            </div>
            <div style={{ background: '#f7f8fa', borderRadius: 12, padding: '4px 16px', marginTop: 18 }}>
              {(
                [
                  ['Purchase date', formatDate(open.date)],
                  ['Supplier', `${supplierById(open.supplierId).name} · ${supplierById(open.supplierId).city}`],
                  ['Supplier GSTIN', suppliers.find((s) => s.id === open.supplierId)!.gstin],
                  ['Invoice number', open.invoiceNo],
                  ['Tyre type', materialName(open.material)],
                  ['Received at', `${warehouseById(open.warehouseId).name} · ${warehouseById(open.warehouseId).city}`],
                  ['Quantity', `${formatKg(open.qtyKg)} (${formatTonnes(open.qtyKg)})`],
                  ['Rate', formatRate(open.rate)],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div className="summary-line" key={k}>
                  <span className="muted">{k}</span>
                  <b className="num">{v}</b>
                </div>
              ))}
            </div>

            <div className="strong" style={{ margin: '22px 0 10px', display: 'flex', justifyContent: 'space-between' }}>
              Original bill
              <Button size="small" icon={<EyeOutlined />}>
                Open full size
              </Button>
            </div>
            <div style={{ background: '#e9ebef', borderRadius: 12, padding: 16, height: 260, overflow: 'hidden', position: 'relative' }}>
              <div style={{ transform: 'scale(0.62)', transformOrigin: 'top left', width: '161%' }}>
                <InvoiceDocument doc={docForQueued(open)} />
              </div>
            </div>

          </div>
        )}
      </Drawer>
    </div>
  )
}
