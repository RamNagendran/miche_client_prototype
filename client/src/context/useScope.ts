import { useApp } from './AppContext'
import { factories, warehouses } from '../data/seed'

/**
 * The warehouses and factories the signed-in person may see and record for.
 * CEO and Admin see every location; an operator only sees the sites assigned to them in Settings.
 */
export function useScope() {
  const { user, role } = useApp()
  const allowed = new Set(user?.locations ?? [])
  const everything = role !== 'operator'
  const hasWarehouse = (id: string) => everything || allowed.has(id)
  const hasFactory = (id: string) => everything || allowed.has(id)
  return {
    everything,
    warehouses: warehouses.filter((w) => hasWarehouse(w.id)),
    factories: factories.filter((f) => hasFactory(f.id)),
    hasWarehouse,
    hasFactory,
  }
}
