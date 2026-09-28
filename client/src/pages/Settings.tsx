import { useState } from 'react'
import { App, Avatar, Button, Form, Input, Modal, Select, Switch, Table, Tabs, Tag } from 'antd'
import { CheckOutlined, CloseOutlined, PlusOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { PageHeader } from '../components/ui'
import { buyers, factories, materials, outputs, suppliers, users, warehouses } from '../data/seed'
import { factoryById, warehouseById } from '../data/selectors'
import { seriesColors } from '../theme/theme'
import type { Role } from '../data/types'

const roleTag: Record<Role, { label: string; color: string }> = {
  ceo: { label: 'CEO', color: '#191919' },
  admin: { label: 'Admin', color: '#D82E54' },
  operator: { label: 'Operator', color: '#2F6FEB' },
}

const permissions: [string, boolean, boolean, boolean][] = [
  ['See the dashboard and company totals', true, true, false],
  ['See warehouse and factory stock', true, true, true],
  ['Record purchases, production and sales', false, true, true],
  ['Check and confirm uploaded bills', false, true, true],
  ['Edit or cancel a saved record', false, true, false],
  ['See finance and download reports', true, true, false],
  ['Manage users, locations and master lists', false, true, false],
]

const tick = (v: boolean) => (v ? <CheckOutlined style={{ color: '#1f9d6b', fontSize: 16 }} /> : <CloseOutlined style={{ color: '#c4c8cf' }} />)

export default function Settings() {
  const [invite, setInvite] = useState(false)
  const { message } = App.useApp()

  const partyTable = (rows: typeof suppliers) => (
    <Table
      scroll={{ x: 'max-content' }}
      rowKey="id"
      pagination={false}
      dataSource={rows}
      columns={[
        { title: 'Name', dataIndex: 'name', render: (v) => <b>{v}</b> },
        { title: 'City', dataIndex: 'city' },
        { title: 'GSTIN', dataIndex: 'gstin', render: (v) => <span className="num">{v}</span> },
        { title: 'Contact', dataIndex: 'contact' },
        { title: 'Phone', dataIndex: 'phone', render: (v) => <span className="num muted">{v}</span> },
        { key: 'a', render: () => <Button type="link">Edit</Button> },
      ]}
    />
  )

  return (
    <div className="page">
      <PageHeader title="Settings" subtitle="Users, locations and the lists everyone picks from." />
      <div className="surface" style={{ padding: '4px 24px 24px' }}>
        <Tabs
          items={[
            {
              key: 'users',
              label: 'Users & access',
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div className="muted">
                      {users.length} people have access. You can add more at any time.
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setInvite(true)}>
                      Invite a person
                    </Button>
                  </div>
                  <Table
                    scroll={{ x: 'max-content' }}
                    rowKey="id"
                    pagination={false}
                    dataSource={users}
                    columns={[
                      {
                        title: 'Person',
                        render: (_, u) => (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar style={{ background: roleTag[u.role].color, fontWeight: 700 }}>{u.initials}</Avatar>
                            <span>
                              <div style={{ fontWeight: 700 }}>{u.name}</div>
                              <div className="faint" style={{ fontSize: 12.5 }}>
                                {u.email}
                              </div>
                            </span>
                          </span>
                        ),
                      },
                      { title: 'Job title', dataIndex: 'title' },
                      {
                        title: 'Role',
                        dataIndex: 'role',
                        render: (r: Role) => (
                          <Tag color={roleTag[r].color} style={{ fontWeight: 700 }}>
                            {roleTag[r].label}
                          </Tag>
                        ),
                      },
                      { title: 'Can work on', dataIndex: 'access' },
                      { key: 'on', title: 'Active', render: () => <Switch defaultChecked size="small" /> },
                    ]}
                  />
                  <div className="strong" style={{ fontSize: 16, margin: '28px 0 12px' }}>
                    What each role can do
                  </div>
                  <Table
                    scroll={{ x: 'max-content' }}
                    rowKey={(r) => r[0]}
                    pagination={false}
                    dataSource={permissions}
                    columns={[
                      { title: 'Action', render: (_, r) => r[0] },
                      { title: 'CEO', align: 'center', width: 120, render: (_, r) => tick(r[1]) },
                      { title: 'Admin', align: 'center', width: 120, render: (_, r) => tick(r[2]) },
                      { title: 'Operator', align: 'center', width: 120, render: (_, r) => tick(r[3]) },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'locations',
              label: 'Warehouses & factories',
              children: (
                <div className="grid grid-2" style={{ gap: 20 }}>
                  {[
                    { title: 'Warehouses', rows: warehouses.map((w) => ({ id: w.id, code: w.code, name: w.name, city: w.city, manager: w.manager, links: w.supplies.map((f) => factoryById(f).name), cls: 'wh' })) },
                    { title: 'Factories', rows: factories.map((f) => ({ id: f.id, code: f.code, name: f.name, city: f.city, manager: f.manager, links: f.suppliedBy.map((w) => warehouseById(w).name), cls: 'fa' })) },
                  ].map((g) => (
                    <div key={g.title}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div className="strong" style={{ fontSize: 16 }}>
                          {g.title}
                        </div>
                        <Button icon={<PlusOutlined />}>Add</Button>
                      </div>
                      {g.rows.map((r) => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, border: '1px solid #e8eaee', borderRadius: 12, marginBottom: 10 }}>
                          <span className={`loc-badge ${r.cls}`}>{r.code}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800 }}>
                              {r.name} <span className="faint" style={{ fontWeight: 600 }}>· {r.city}</span>
                            </div>
                            <div className="muted" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                              {g.title === 'Warehouses' ? 'Supplies' : 'Supplied by'} <ArrowRightOutlined style={{ fontSize: 10 }} /> {r.links.join(', ')}
                            </div>
                          </div>
                          <span className="faint" style={{ fontSize: 13 }}>
                            {r.manager}
                          </span>
                          <Button type="link">Edit</Button>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="info-banner" style={{ gridColumn: '1 / -1' }}>
                    Each warehouse and factory keeps its own stock. Totals across locations are simple sums.
                  </div>
                </div>
              ),
            },
            {
              key: 'materials',
              label: 'Tyre types & outputs',
              children: (
                <div className="grid grid-2" style={{ gap: 20 }}>
                  <div>
                    <div className="strong" style={{ fontSize: 16, marginBottom: 12 }}>
                      Raw material (tyre) types
                    </div>
                    <Table
                      scroll={{ x: 'max-content' }}
                      rowKey="id"
                      pagination={false}
                      dataSource={materials}
                      columns={[
                        { title: 'Type', render: (_, m) => <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}><span className="legend-dot" style={{ background: seriesColors[m.id] }} />{m.name}</span> },
                        { title: 'Description', dataIndex: 'description', render: (v) => <span className="muted">{v}</span> },
                      ]}
                    />
                  </div>
                  <div>
                    <div className="strong" style={{ fontSize: 16, marginBottom: 12 }}>
                      Output products
                    </div>
                    <Table
                      scroll={{ x: 'max-content' }}
                      rowKey="id"
                      pagination={false}
                      dataSource={outputs}
                      columns={[
                        { title: 'Product', render: (_, o) => <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}><span className="legend-dot" style={{ background: seriesColors[o.id] }} />{o.name}</span> },
                        { title: 'Description', dataIndex: 'description', render: (v) => <span className="muted">{v}</span> },
                        { title: 'In use', render: () => <Switch defaultChecked size="small" /> },
                      ]}
                    />
                    <Button icon={<PlusOutlined />} style={{ marginTop: 12 }}>
                      Add an output (e.g. pyrolysis oil)
                    </Button>
                  </div>
                </div>
              ),
            },
            { key: 'suppliers', label: `Suppliers (${suppliers.length})`, children: partyTable(suppliers) },
            { key: 'buyers', label: `Buyers (${buyers.length})`, children: partyTable(buyers) },
          ]}
        />
      </div>

      <Modal
        open={invite}
        title="Invite a person"
        okText="Send invite"
        onCancel={() => setInvite(false)}
        onOk={() => {
          setInvite(false)
          message.success('Invite sent. They will get an email to set a password.')
        }}
      >
        <Form layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item label="Full name">
            <Input placeholder="e.g. Anitha Raj" />
          </Form.Item>
          <Form.Item label="Work email">
            <Input placeholder="name@michy.in" />
          </Form.Item>
          <Form.Item label="Role" extra="Operators only see the locations you choose below.">
            <Select defaultValue="operator" options={[{ value: 'operator', label: 'Operator — records daily entries' }, { value: 'admin', label: 'Admin — full access' }, { value: 'ceo', label: 'CEO — dashboards and reports' }]} />
          </Form.Item>
          <Form.Item label="Locations">
            <Select mode="multiple" placeholder="Choose warehouses and factories" options={[...warehouses, ...factories].map((l) => ({ value: l.id, label: l.name }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
