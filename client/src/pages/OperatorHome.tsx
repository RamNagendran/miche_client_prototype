import { useNavigate } from 'react-router-dom'
import { Button, Table, Tag } from 'antd'
import { ExperimentOutlined, ShopOutlined, ShoppingCartOutlined, ArrowRightOutlined, ClockCircleFilled, FileTextFilled } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useApp } from '../context/AppContext'
import { PageHeader, SectionTitle, StatusTag } from '../components/ui'
import { WarehouseCard } from '../components/LocationCards'
import { allRecords, reviewPurchases, supplierById, warehouseById, outputStockLine } from '../data/selectors'
import { TODAY } from '../data/seed'
import { formatDate, formatDateShort, formatKg } from '../utils/format'

const tiles = [
  { to: '/purchases/new', title: 'Record a purchase', text: 'Upload the bill or type it in', icon: <ShoppingCartOutlined />, bg: 'linear-gradient(135deg, #D82E54 0%, #B8213F 100%)' },
  { to: '/production/new', title: 'Record production', text: 'What went in, what came out', icon: <ExperimentOutlined />, bg: 'linear-gradient(135deg, #2a2a31 0%, #191919 100%)' },
  { to: '/sales/new', title: 'Record a sale', text: 'Rubber, steel or other output', icon: <ShopOutlined />, bg: 'linear-gradient(135deg, #2F6FEB 0%, #1f55c4 100%)' },
]

export default function OperatorHome() {
  const { user } = useApp()
  const navigate = useNavigate()
  const mine = allRecords().filter((r) => r.enteredBy === user?.name).slice(0, 6)
  const myQueue = reviewPurchases.filter((p) => p.enteredBy === user?.name)
  const hour = dayjs().hour()

  return (
    <div className="page">
      <PageHeader
        eyebrow={dayjs(TODAY).format('dddd, D MMMM YYYY')}
        title={`${hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'}, ${user?.name.split(' ')[0]}`}
        subtitle={`What would you like to do? You're working on ${user?.access}.`}
      />

      <div className="grid grid-3">
        {tiles.map((t) => (
          <div key={t.to} className="task-tile fade-in" style={{ background: t.bg }} onClick={() => navigate(t.to)}>
            <div className="tile-icon">{t.icon}</div>
            <div>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
            </div>
            <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
              Start <ArrowRightOutlined />
            </div>
          </div>
        ))}
      </div>

      {myQueue.length > 0 && (
        <>
          <SectionTitle title="Waiting for you to check" hint="Uploaded bills are not in stock until confirmed" />
          <div className="grid grid-2">
            {myQueue.map((p) => (
              <div key={p.id} className="surface" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14, borderColor: '#f3d9a4', background: '#fffbf2' }}>
                <span className="kpi-icon" style={{ width: 44, height: 44, background: '#fff0d1', color: '#d98a0b', fontSize: 20 }}>
                  <FileTextFilled />
                </span>
                <div style={{ flex: 1 }}>
                  <div className="strong">{supplierById(p.supplierId).name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    Bill {p.invoiceNo} · uploaded {formatDate(p.date)} · for {warehouseById(p.warehouseId).name}
                  </div>
                </div>
                <Button type="primary" onClick={() => navigate(`/purchases/review/${p.id}`)}>
                  Check now
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', marginTop: 8 }}>
        <div>
          <SectionTitle title="My recent entries" />
          <div className="surface table-card">
            <Table
              scroll={{ x: 'max-content' }}
              rowKey="key"
              pagination={false}
              dataSource={mine}
              columns={[
                {
                  title: 'Entry',
                  render: (_, r) => (
                    <div>
                      <span className="id-link">{r.id}</span>
                      <div className="faint" style={{ fontSize: 12.5 }}>
                        {formatDateShort(r.date)}
                      </div>
                    </div>
                  ),
                },
                { title: 'Type', dataIndex: 'type', render: (t) => <Tag style={{ fontWeight: 700, textTransform: 'capitalize' }}>{t}</Tag> },
                { title: 'What', dataIndex: 'item' },
                { title: 'Quantity', dataIndex: 'qtyKg', align: 'right', render: (v) => <span className="num strong">{formatKg(v)}</span> },
                { title: 'Status', dataIndex: 'status', render: (s) => <StatusTag status={s} /> },
              ]}
            />
          </div>
        </div>
        <div>
          <SectionTitle title="My sites" hint="stock right now" />
          <div style={{ display: 'grid', gap: 16 }}>
            <WarehouseCard id={user?.id === 'U3' ? 'WA' : 'WB'} />
            <div className="surface" style={{ padding: 18 }}>
              <div className="strong" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClockCircleFilled style={{ color: '#D82E54' }} /> {user?.id === 'U3' ? 'Factory A' : 'Factory B'} · ready to sell
              </div>
              {(['rubber', 'steel', 'other'] as const).map((o) => (
                <div className="mat-row" key={o}>
                  <span style={{ textTransform: 'capitalize' }}>{o}</span>
                  <b className="num">{formatKg(outputStockLine(user?.id === 'U3' ? 'FA' : 'FB', o).current)}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
