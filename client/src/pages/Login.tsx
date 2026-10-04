import { useNavigate } from 'react-router-dom'
import { Avatar, Button, Checkbox, Divider, Form, Input } from 'antd'
import { ArrowRightOutlined, LockOutlined, MailOutlined, SafetyCertificateFilled } from '@ant-design/icons'
import logo from '../assets/michy-logo.png'
import { useApp } from '../context/AppContext'
import { MichyMark } from '../components/ui'
import { users } from '../data/seed'
import type { Role } from '../data/types'

const demoAccounts: { role: Role; label: string; blurb: string; color: string }[] = [
  { role: 'ceo', label: 'CEO', blurb: 'Company-wide dashboard and reports', color: '#191919' },
  { role: 'admin', label: 'Admin', blurb: 'Full access, users and settings', color: '#D82E54' },
  { role: 'operator', label: 'Operator', blurb: 'Record purchases, production and sales', color: '#2F6FEB' },
]

const flow = ['Purchase', 'Warehouse', 'Factory', 'Rubber · Steel', 'Sales']

export default function Login() {
  const { login } = useApp()
  const navigate = useNavigate()
  const enter = (role: Role) => {
    login(role)
    navigate(role === 'ceo' ? '/welcome' : '/')
  }

  return (
    <div className="login">
      <div className="login-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <MichyMark size={44} ink="#fff" />
          <div>
            <div style={{ fontWeight: 800, letterSpacing: '0.14em', fontSize: 17 }}>
              <span style={{ color: '#D82E54' }}>MICHY</span> RUBBERS
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, fontWeight: 600 }}>Operations platform</div>
          </div>
        </div>

        <div style={{ position: 'relative', maxWidth: 600 }}>
          <div style={{ color: '#D82E54', fontWeight: 800, letterSpacing: '0.12em', fontSize: 12, marginBottom: 14 }}>
            CREATE A BETTER FUTURE BY MINIMIZING WASTE
          </div>
          <h1 style={{ color: '#fff', fontSize: 40, lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Every kilo of tyre,
            <br />
            from purchase to sale.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, lineHeight: 1.6, marginTop: 18 }}>
            See what was bought, what's in each warehouse, what each factory produced and what was sold — all in one place.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 36 }}>
            {flow.map((f, i) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: i === 0 || i === flow.length - 1 ? 'rgba(216,46,84,0.18)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${i === 0 || i === flow.length - 1 ? 'rgba(216,46,84,0.45)' : 'rgba(255,255,255,0.1)'}`,
                    fontWeight: 700,
                    fontSize: 12.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f}
                </div>
                {i < flow.length - 1 && <ArrowRightOutlined style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12.5, position: 'relative', display: 'flex', gap: 8, alignItems: 'center' }}>
          <SafetyCertificateFilled /> Secure sign-in · Data stays within Michy Rubbers
        </div>
      </div>

      <div className="login-form">
        <div style={{ width: 420 }}>
          <img src={logo} alt="Michy Rubbers" style={{ height: 64, marginBottom: 28, marginLeft: -6 }} />
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Welcome back</h2>
          <p className="muted" style={{ marginTop: 6, marginBottom: 28, fontSize: 15 }}>
            Sign in with your work email to continue.
          </p>

          <Form layout="vertical" size="large" requiredMark={false} onFinish={() => enter('admin')}>
            <Form.Item label="Work email" name="email">
              <Input prefix={<MailOutlined className="faint" />} placeholder="name@michy.in" />
            </Form.Item>
            <Form.Item label="Password" name="password">
              <Input.Password prefix={<LockOutlined className="faint" />} placeholder="Enter your password" />
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, marginTop: -4 }}>
              <Checkbox defaultChecked>Keep me signed in</Checkbox>
              <a style={{ fontWeight: 700 }}>Forgot password?</a>
            </div>
            <Button type="primary" htmlType="submit" block size="large" style={{ height: 50, fontSize: 16 }}>
              Sign in
            </Button>
          </Form>

          <Divider plain style={{ margin: '28px 0 18px' }}>
            <span className="faint" style={{ fontSize: 13, fontWeight: 600 }}>
              or try a demo account
            </span>
          </Divider>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {demoAccounts.map((d) => {
              const u = users.find((x) => x.role === d.role)!
              return (
                <div key={d.role} className="demo-card" onClick={() => enter(d.role)}>
                  <Avatar size={40} style={{ background: d.color, fontWeight: 700 }}>
                    {u.initials}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>
                      {d.label} <span className="faint" style={{ fontWeight: 600, fontSize: 13 }}>· {u.name}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {d.blurb}
                    </div>
                  </div>
                  <ArrowRightOutlined className="faint" />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
