import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Dropdown, Layout, Menu, Popover, Segmented, Tooltip, type MenuProps } from 'antd'
import {
  AppstoreOutlined,
  BankOutlined,
  BellOutlined,
  BuildOutlined,
  CheckOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  InboxOutlined,
  LineChartOutlined,
  LogoutOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  SwapOutlined,
  FileTextFilled,
} from '@ant-design/icons'
import { can, useApp } from '../context/AppContext'
import { useScope } from '../context/useScope'
import { MichyMark } from '../components/ui'
import { users } from '../data/seed'
import { periodLabels, periodSubtitle, reviewPurchases, type Period } from '../data/selectors'
import type { Role } from '../data/types'

const { Sider, Header, Content } = Layout

const roleLabel: Record<Role, string> = { ceo: 'CEO', admin: 'Admin', operator: 'Operator' }

const titles: [string, string][] = [
  ['/purchases/new', 'New purchase'],
  ['/purchases/review', 'Check bill details'],
  ['/purchases', 'Purchases'],
  ['/warehouses', 'Warehouses'],
  ['/production/new', 'Record production'],
  ['/production', 'Production'],
  ['/output-stock', 'Output stock'],
  ['/factories', 'Output stock'],
  ['/sales/new', 'New sale'],
  ['/sales/review', 'Check bill details'],
  ['/sales', 'Sales'],
  ['/finance', 'Finance'],
  ['/records', 'All records'],
  ['/settings', 'Settings'],
]

export default function AppLayout() {
  const { user, role, login, logout, period, setPeriod } = useApp()
  const perms = can(role)
  const { hasWarehouse } = useScope()
  const myReview = reviewPurchases.filter((p) => hasWarehouse(p.warehouseId))
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const selectedKey = useMemo(() => {
    if (pathname === '/') return '/'
    if (pathname.startsWith('/factories')) return '/output-stock'
    return '/' + pathname.split('/')[1]
  }, [pathname])

  const title = titles.find(([p]) => pathname.startsWith(p))?.[1] ?? (role === 'operator' ? 'Home' : 'Dashboard')

  const menuItems: MenuProps['items'] = [
    { key: '/', icon: <AppstoreOutlined />, label: role === 'operator' ? 'Home' : 'Dashboard' },
    {
      type: 'group',
      label: collapsed ? null : 'Daily work',
      children: [
        { key: '/purchases', icon: <ShoppingCartOutlined />, label: 'Purchases' },
        { key: '/production', icon: <ExperimentOutlined />, label: 'Production' },
        { key: '/sales', icon: <ShopOutlined />, label: 'Sales' },
      ],
    },
    {
      type: 'group',
      label: collapsed ? null : 'Stock',
      children: [
        { key: '/warehouses', icon: <InboxOutlined />, label: 'Warehouses' },
        { key: '/output-stock', icon: <BuildOutlined />, label: 'Output stock' },
      ],
    },
    ...(perms.viewFinance || perms.viewRecords
      ? [
          {
            type: 'group' as const,
            label: collapsed ? null : 'Reports',
            children: [
              ...(perms.viewFinance ? [{ key: '/finance', icon: <LineChartOutlined />, label: 'Finance' }] : []),
              ...(perms.viewRecords ? [{ key: '/records', icon: <DatabaseOutlined />, label: 'All records' }] : []),
            ],
          },
        ]
      : []),
    ...(perms.manageSettings ? [{ key: '/settings', icon: <SettingOutlined />, label: 'Settings' }] : []),
  ]

  const notifications = (
    <div style={{ width: 340 }}>
      <div style={{ fontWeight: 800, fontSize: 15, padding: '4px 4px 10px' }}>Notifications</div>
      {myReview.length > 0 ? (
        <div className="qa-row" onClick={() => navigate('/purchases?tab=review')}>
          <span className="kpi-icon" style={{ background: '#f4efff', color: '#6941c6' }}>
            <FileTextFilled />
          </span>
          <div style={{ flex: 1 }}>
            <div className="strong" style={{ fontSize: 13.5 }}>
              {myReview.length} purchase {myReview.length === 1 ? 'bill' : 'bills'} waiting for review
            </div>
            <div className="faint" style={{ fontSize: 12.5 }}>
              Not added to stock until someone confirms
            </div>
          </div>
        </div>
      ) : (
        <div className="faint" style={{ padding: '8px 4px 4px', fontSize: 13.5 }}>
          Nothing needs your attention right now.
        </div>
      )}
    </div>
  )

  const userMenu: MenuProps = {
    items: [
      {
        key: 'hdr',
        type: 'group',
        label: 'View the app as (demo)',
        children: users
          .filter((u) => u.role !== 'operator' || u.id === 'U3')
          .map((u) => ({
            key: u.role,
            icon: role === u.role ? <CheckOutlined style={{ color: '#D82E54' }} /> : <SwapOutlined style={{ opacity: 0.4 }} />,
            label: (
              <div style={{ lineHeight: 1.3, padding: '2px 0' }}>
                <div style={{ fontWeight: 700 }}>{roleLabel[u.role]}</div>
                <div className="faint" style={{ fontSize: 12 }}>
                  {u.name}
                </div>
              </div>
            ),
          })),
      },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') {
        logout()
        navigate('/login')
      } else {
        login(key as Role)
        navigate('/')
      }
    },
  }

  const newEntry: MenuProps = {
    items: [
      { key: '/purchases/new', icon: <ShoppingCartOutlined />, label: 'Record a purchase' },
      { key: '/production/new', icon: <ExperimentOutlined />, label: 'Record production' },
      { key: '/sales/new', icon: <ShopOutlined />, label: 'Record a sale' },
    ],
    onClick: ({ key }) => navigate(key),
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={256}
        collapsedWidth={80}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}
      >
        <div className="sider-logo" onClick={() => setCollapsed((c) => !c)} style={{ cursor: 'pointer', justifyContent: collapsed ? 'center' : undefined, padding: collapsed ? 0 : undefined }}>
          <MichyMark size={34} ink="#ffffff" />
          {!collapsed && (
            <div>
              <div className="wordmark">
                <span>MICHY</span> RUBBERS
              </div>
              <div className="tag">Operations</div>
            </div>
          )}
        </div>
        <div className="sider-menu">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ borderInlineEnd: 'none', marginTop: 12 }}
          />
        </div>
        {!collapsed && (
          <div className="sider-footer">
            <div className="sider-help">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 700, marginBottom: 4 }}>
                <QuestionCircleOutlined /> Need help?
              </div>
              Call the Michy support desk or watch the 3-minute guide.
            </div>
          </div>
        )}
      </Sider>

      <Layout>
        <Header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div className="topbar-title">{title}</div>
            {role !== 'operator' && (pathname === '/' || pathname.startsWith('/finance') || pathname.startsWith('/warehouses') || pathname.startsWith('/output-stock') || pathname.startsWith('/factories')) && (
              <Tooltip title={periodSubtitle(period)} placement="bottom">
                <Segmented<Period>
                  value={period}
                  onChange={setPeriod}
                  options={(['month', 'quarter', 'fy'] as Period[]).map((p) => ({ value: p, label: periodLabels[p] }))}
                />
              </Tooltip>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {perms.enterData && (
              <Dropdown menu={newEntry} placement="bottomRight">
                <Button type="primary" icon={<PlusOutlined />} size="large">
                  New entry
                </Button>
              </Dropdown>
            )}
            <Tooltip title="Search records">
              <Button shape="circle" size="large" icon={<FileSearchOutlined />} onClick={() => navigate(perms.viewRecords ? '/records' : '/purchases')} />
            </Tooltip>
            <Popover content={notifications} trigger="click" placement="bottomRight">
              <Badge count={myReview.length} size="small" offset={[-4, 4]}>
                <Button shape="circle" size="large" icon={<BellOutlined />} />
              </Badge>
            </Popover>
            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
              <div className="user-chip">
                <Avatar style={{ background: role === 'ceo' ? '#191919' : role === 'admin' ? '#D82E54' : '#2F6FEB', fontWeight: 700 }}>{user?.initials}</Avatar>
                <div style={{ lineHeight: 1.25 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5 }}>{user?.name}</div>
                  <div className="faint" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <BankOutlined /> {role && roleLabel[role]} · {user?.access.split(' · ')[0]}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
