import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import { AppstoreOutlined, BuildOutlined, InboxOutlined, LogoutOutlined, RightOutlined } from '@ant-design/icons'
import logo from '../assets/michy-logo.png'
import { useApp } from '../context/AppContext'
import { factories, warehouses } from '../data/seed'
import { factoryById, warehouseById } from '../data/selectors'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function Section({ icon, tone, title, description, children }: { icon: ReactNode; tone: 'wh' | 'fa'; title: string; description: string; children: ReactNode }) {
  return (
    <section className="welcome-section">
      <div className="welcome-section-head">
        <div className={`loc-badge ${tone}`}>{icon}</div>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="grid grid-3">{children}</div>
    </section>
  )
}

function SiteCard({ code, tone, name, detail, to }: { code: string; tone: 'wh' | 'fa'; name: string; detail: string; to: string }) {
  const navigate = useNavigate()
  return (
    <div className="surface loc-card fade-in" onClick={() => navigate(to)} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div className={`loc-badge ${tone}`}>{code}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="strong" style={{ fontSize: 16 }}>
          {name}
        </div>
        <div className="faint" style={{ fontSize: 13 }}>
          {detail}
        </div>
      </div>
      <RightOutlined className="faint" />
    </div>
  )
}

/** First screen the CEO sees after signing in: one card per site, each opening that site's detail page. */
export default function CeoWelcome() {
  const { user, logout } = useApp()
  const navigate = useNavigate()

  return (
    <div className="welcome">
      <header className="welcome-top">
        <img src={logo} alt="Michy Rubbers" style={{ height: 44 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <Button size="large" icon={<AppstoreOutlined />} onClick={() => navigate('/')}>
            Go to dashboard
          </Button>
          <Button
            size="large"
            icon={<LogoutOutlined />}
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            Sign out
          </Button>
        </div>
      </header>

      <div className="welcome-body">
        <div className="welcome-hero fade-in">
          <div>
            <div className="eyebrow">Michy Rubbers · Company overview</div>
            <h1>
              {greeting()}, {user?.name.split(' ')[0]}
            </h1>
            <p>
              Here are all {warehouses.length} warehouses and {factories.length} factories at a glance. Choose any one to open its full details — stock, entries and
              history. The menu on the left of that page takes you anywhere else in the app.
            </p>
          </div>
        </div>

        <Section
          icon={<InboxOutlined />}
          tone="wh"
          title="Warehouses"
          description="Raw tyre material bought from suppliers and held at each warehouse until it goes to a factory."
        >
          {warehouses.map((w) => (
            <SiteCard key={w.id} code={w.code} tone="wh" name={w.name} to={`/warehouses/${w.id}`} detail={`${w.city} · supplies ${w.supplies.map((f) => factoryById(f).name).join(', ')}`} />
          ))}
        </Section>

        <Section
          icon={<BuildOutlined />}
          tone="fa"
          title="Factories"
          description="What each factory processed and the rubber, steel and other output it has ready to sell."
        >
          {factories.map((f) => (
            <SiteCard key={f.id} code={f.code} tone="fa" name={f.name} to={`/factories/${f.id}`} detail={`${f.city} · gets material from ${f.suppliedBy.map((w) => warehouseById(w).name).join(', ')}`} />
          ))}
        </Section>
      </div>
    </div>
  )
}
