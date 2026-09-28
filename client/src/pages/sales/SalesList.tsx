import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, DatePicker, Drawer, Input, Segmented, Select, Table } from 'antd'
import { DownloadOutlined, PlusOutlined, SearchOutlined, FilePdfFilled } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { can, useApp } from '../../context/AppContext'
import { PageHeader, ProductTag, Qty, SourceTag, StatusTag } from '../../components/ui'
import { buyers, factories, outputs, sales } from '../../data/seed'
import { buyerById, confirmedSales, factoryById, outputName, saleValue } from '../../data/selectors'
import { seriesColors } from '../../theme/theme'
import { formatDate, formatINR, formatINRShort, formatKg, formatRate, formatTonnes } from '../../utils/format'
import type { Sale } from '../../data/types'

export default function SalesList() {
  const navigate = useNavigate()
  const { role } = useApp()
  const [product, setProduct] = useState<string>('all')
  const [factory, setFactory] = useState<string>()
  const [buyer, setBuyer] = useState<string>()
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<Sale | null>(null)

  const rows = useMemo(
    () =>
      [...sales]
        .reverse()
        .filter((s) => product === 'all' || s.product === product)
        .filter((s) => !factory || s.factoryId === factory)
        .filter((s) => !buyer || s.buyerId === buyer)
        .filter((s) => !range?.[0] || !range?.[1] || (s.date >= range[0].format('YYYY-MM-DD') && s.date <= range[1].format('YYYY-MM-DD')))
        .filter((s) => !q || `${s.id} ${s.invoiceNo} ${buyerById(s.buyerId).name}`.toLowerCase().includes(q.toLowerCase())),
    [product, factory, buyer, range, q],
  )

  const byProduct = outputs.map((o) => {
    const list = confirmedSales.filter((s) => s.product === o.id)
    return { id: o.id, kg: list.reduce((s, x) => s + x.qtyKg, 0), value: list.reduce((s, x) => s + saleValue(x), 0) }
  })
  const totalValue = byProduct.reduce((s, p) => s + p.value, 0)

  const columns: ColumnsType<Sale> = [
    { title: 'Sale', key: 'id', render: (_, s) => <div><span className="id-link">{s.id}</span><div className="faint" style={{ fontSize: 12.5 }}>{formatDate(s.date)}</div></div> },
    { title: 'Buyer', key: 'b', render: (_, s) => <div><div style={{ fontWeight: 700 }}>{buyerById(s.buyerId).name}</div><div className="faint" style={{ fontSize: 12.5 }}>Invoice {s.invoiceNo}</div></div> },
    { title: 'Product', key: 'p', render: (_, s) => <ProductTag id={s.product} /> },
    { title: 'From', key: 'f', render: (_, s) => factoryById(s.factoryId).name },
    { title: 'Quantity', key: 'q', align: 'right', sorter: (a, b) => a.qtyKg - b.qtyKg, render: (_, s) => <Qty kg={s.qtyKg} block /> },
    { title: 'Sale value', key: 'v', align: 'right', sorter: (a, b) => saleValue(a) - saleValue(b), render: (_, s) => <div className="num"><div style={{ fontWeight: 800 }}>{formatINR(saleValue(s))}</div><div className="faint" style={{ fontSize: 12.5 }}>{formatRate(s.rate)}</div></div> },
    { title: 'Status', key: 's', fixed: 'right', render: (_, s) => <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}><StatusTag status={s.status} /><SourceTag source={s.source} /></div> },
  ]

  return (
    <div className="page">
      <PageHeader
        title="Sales"
        subtitle="Every sale of rubber, steel and other output, and the factory it came from."
        extra={
          <>
            <Button icon={<DownloadOutlined />} size="large">
              Export
            </Button>
            {can(role).enterData && (
              <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => navigate('/sales/new')}>
                Record a sale
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="surface" style={{ padding: '16px 20px' }}>
          <div className="muted" style={{ fontWeight: 700, fontSize: 13 }}>
            Total sales this year
          </div>
          <div className="num strong" style={{ fontSize: 22, marginTop: 4 }}>
            {formatINRShort(totalValue)}
          </div>
          <div className="faint" style={{ fontSize: 12.5 }}>
            {confirmedSales.length} invoices · before GST
          </div>
        </div>
        {byProduct.map((p) => (
          <div key={p.id} className="surface" style={{ padding: '16px 20px' }}>
            <div className="muted" style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="legend-dot" style={{ background: seriesColors[p.id] }} />
              {outputName(p.id)} sold
            </div>
            <div className="num strong" style={{ fontSize: 22, marginTop: 4 }}>
              {formatINRShort(p.value)}
            </div>
            <div className="faint" style={{ fontSize: 12.5 }}>
              {formatTonnes(p.kg)} sold
            </div>
          </div>
        ))}
      </div>

      <div className="surface table-card">
        <div style={{ display: 'flex', gap: 10, padding: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Segmented value={product} onChange={(v) => setProduct(String(v))} options={[{ value: 'all', label: 'All products' }, ...outputs.map((o) => ({ value: o.id, label: o.name }))]} />
          <Input prefix={<SearchOutlined className="faint" />} placeholder="Search buyer, invoice or ID" style={{ width: 260 }} allowClear value={q} onChange={(e) => setQ(e.target.value)} />
          <Select allowClear placeholder="All factories" style={{ width: 160 }} value={factory} onChange={setFactory} options={factories.map((f) => ({ value: f.id, label: f.name }))} />
          <Select allowClear placeholder="All buyers" style={{ width: 200 }} value={buyer} onChange={setBuyer} options={buyers.map((b) => ({ value: b.id, label: b.name }))} />
          <DatePicker.RangePicker format="DD MMM" value={range} onChange={(v) => setRange(v)} />
        </div>
        <Table scroll={{ x: 'max-content' }} rowKey="id" columns={columns} dataSource={rows} pagination={{ pageSize: 10, showSizeChanger: false }} onRow={(s) => ({ onClick: () => setOpen(s), style: { cursor: 'pointer' } })} />
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)} size={560} title={open?.id} extra={open && <StatusTag status={open.status} />} destroyOnHidden>
        {open && (
          <div>
            <div className="num strong" style={{ fontSize: 28 }}>
              {formatINR(saleValue(open))}
            </div>
            <div className="muted">
              {formatKg(open.qtyKg)} of {outputName(open.product).toLowerCase()} at {formatRate(open.rate)}
            </div>
            <div style={{ background: '#f7f8fa', borderRadius: 12, padding: '4px 16px', marginTop: 18 }}>
              {(
                [
                  ['Sale date', formatDate(open.date)],
                  ['Buyer', `${buyerById(open.buyerId).name} · ${buyerById(open.buyerId).city}`],
                  ['Buyer GSTIN', buyerById(open.buyerId).gstin],
                  ['Invoice number', open.invoiceNo],
                  ['Product', outputName(open.product)],
                  ['Dispatched from', factoryById(open.factoryId).name],
                  ['Quantity', `${formatKg(open.qtyKg)} (${formatTonnes(open.qtyKg)})`],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div className="summary-line" key={k}>
                  <span className="muted">{k}</span>
                  <b className="num">{v}</b>
                </div>
              ))}
            </div>
            <Button block size="large" icon={<FilePdfFilled style={{ color: '#D82E54' }} />} style={{ marginTop: 16 }}>
              Open invoice PDF
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  )
}
