import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Role, User } from '../data/types'
import type { Period } from '../data/selectors'
import { users } from '../data/seed'

interface AppState {
  user: User | null
  role: Role | null
  period: Period
  login: (role: Role) => void
  logout: () => void
  setPeriod: (p: Period) => void
}

const AppContext = createContext<AppState | null>(null)

const isRole = (r: string | null): r is Role => r === 'ceo' || r === 'admin' || r === 'operator'

const readStoredRole = (): Role | null => {
  // Demo shortcut: ?as=ceo | admin | operator opens the app directly as that role.
  const fromUrl = new URLSearchParams(window.location.search).get('as')
  if (isRole(fromUrl)) return fromUrl
  try {
    const r = sessionStorage.getItem('michy-role')
    return isRole(r) ? r : null
  } catch {
    return null
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(readStoredRole)
  const [period, setPeriod] = useState<Period>('fy')

  const value = useMemo<AppState>(
    () => ({
      role,
      user: role ? users.find((u) => u.role === role)! : null,
      period,
      setPeriod,
      login: (r) => {
        setRole(r)
        try {
          sessionStorage.setItem('michy-role', r)
        } catch {
          /* prototype only */
        }
      },
      logout: () => {
        setRole(null)
        try {
          sessionStorage.removeItem('michy-role')
        } catch {
          /* prototype only */
        }
      },
    }),
    [role, period],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

/** What each role is allowed to do in the prototype. */
// eslint-disable-next-line react-refresh/only-export-components
export const can = (role: Role | null) => ({
  enterData: role === 'admin' || role === 'operator',
  viewFinance: role === 'admin' || role === 'ceo',
  manageSettings: role === 'admin',
  viewRecords: role === 'admin' || role === 'ceo',
  edit: role === 'admin',
})
