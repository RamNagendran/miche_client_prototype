import dayjs from 'dayjs'
import {
  buyers,
  factories,
  FY_START,
  materials,
  openingOutput,
  openingRaw,
  outputs,
  production,
  purchases,
  sales,
  suppliers,
  TODAY,
  users,
  warehouses,
} from './seed'
import type { MaterialId, OutputId, Production, Purchase, Sale } from './types'

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

export const materialName = (id: MaterialId) => materials.find((m) => m.id === id)!.name
export const outputName = (id: OutputId) => outputs.find((o) => o.id === id)!.name
export const warehouseById = (id: string) => warehouses.find((w) => w.id === id)!
export const factoryById = (id: string) => factories.find((f) => f.id === id)!
export const supplierById = (id: string) => suppliers.find((s) => s.id === id)!
export const buyerById = (id: string) => buyers.find((b) => b.id === id)!
export const userByRole = (role: string) => users.find((u) => u.role === role)!

/* ------------------------------------------------------------------ */
/* Periods                                                             */
/* ------------------------------------------------------------------ */

export type Period = 'month' | 'quarter' | 'fy'

export const periodLabels: Record<Period, string> = {
  month: 'This month',
  quarter: 'This quarter',
  fy: 'This financial year',
}

export const periodRange = (period: Period): [string, string] => {
  const today = dayjs(TODAY)
  if (period === 'month') return [today.startOf('month').format('YYYY-MM-DD'), TODAY]
  if (period === 'quarter') return ['2026-07-01', TODAY]
  return [FY_START, TODAY]
}

export const periodSubtitle = (period: Period) => {
  const [from, to] = periodRange(period)
  return `${dayjs(from).format('D MMM')} – ${dayjs(to).format('D MMM YYYY')}`
}

const inRange = (date: string, [from, to]: [string, string]) => date >= from && date <= to

/** The same length of time immediately before the chosen period — used for "vs last period". */
const previousRange = (period: Period): [string, string] => {
  if (period === 'month') return ['2026-08-01', '2026-08-27']
  return ['2026-04-01', '2026-06-27']
}

/* ------------------------------------------------------------------ */
/* Transactions                                                        */
/* ------------------------------------------------------------------ */

export const confirmedPurchases = purchases.filter((p) => p.status === 'confirmed')
export const reviewPurchases = purchases.filter((p) => p.status === 'review')
export const confirmedSales = sales.filter((s) => s.status === 'confirmed')

export const purchaseValue = (p: Purchase) => p.qtyKg * p.rate
export const saleValue = (s: Sale) => s.qtyKg * s.rate
export const productionOutputKg = (p: Production) => p.outputs.rubber + p.outputs.steel + p.outputs.other
export const productionYield = (p: Production) => (productionOutputKg(p) / p.inputKg) * 100

/* ------------------------------------------------------------------ */
/* Warehouse (raw material) stock — always "as of today"               */
/* ------------------------------------------------------------------ */

export interface StockLine {
  opening: number
  in: number
  out: number
  current: number
}

export const rawStockLine = (warehouseId: string, material: MaterialId): StockLine => {
  const opening = openingRaw[warehouseId]?.[material] ?? 0
  const inKg = confirmedPurchases
    .filter((p) => p.warehouseId === warehouseId && p.material === material)
    .reduce((s, p) => s + p.qtyKg, 0)
  const outKg = production
    .filter((p) => p.warehouseId === warehouseId && p.material === material)
    .reduce((s, p) => s + p.inputKg, 0)
  return { opening, in: inKg, out: outKg, current: opening + inKg - outKg }
}

export const warehouseStock = (warehouseId: string) => {
  const wh = warehouseById(warehouseId)
  const lines = wh.materials.map((m) => ({ material: m, ...rawStockLine(warehouseId, m) }))
  const total = lines.reduce(
    (acc, l) => ({ opening: acc.opening + l.opening, in: acc.in + l.in, out: acc.out + l.out, current: acc.current + l.current }),
    { opening: 0, in: 0, out: 0, current: 0 },
  )
  const low = lines.filter((l) => l.current < materials.find((m) => m.id === l.material)!.lowStockKg)
  return { warehouse: wh, lines, total, low }
}

export const allWarehouseStock = () => warehouses.map((w) => warehouseStock(w.id))

export const companyRawTotal = () => allWarehouseStock().reduce((s, w) => s + w.total.current, 0)

export const companyRawByMaterial = () =>
  materials.map((m) => ({
    material: m.id,
    current: warehouses.reduce((s, w) => s + (w.materials.includes(m.id) ? rawStockLine(w.id, m.id).current : 0), 0),
  }))

export const lowStockAlerts = () =>
  allWarehouseStock().flatMap((w) => w.low.map((l) => ({ warehouse: w.warehouse, material: l.material, current: l.current })))

/* ------------------------------------------------------------------ */
/* Factory output stock — always "as of today"                         */
/* ------------------------------------------------------------------ */

export const outputStockLine = (factoryId: string, product: OutputId): StockLine => {
  const opening = openingOutput[factoryId][product]
  const produced = production.filter((p) => p.factoryId === factoryId).reduce((s, p) => s + p.outputs[product], 0)
  const sold = confirmedSales
    .filter((s) => s.factoryId === factoryId && s.product === product)
    .reduce((s, x) => s + x.qtyKg, 0)
  return { opening, in: produced, out: sold, current: opening + produced - sold }
}

export const factoryOutputStock = (factoryId: string) => {
  const lines = outputs.map((o) => ({ product: o.id, ...outputStockLine(factoryId, o.id) }))
  const total = lines.reduce((s, l) => s + l.current, 0)
  return { factory: factoryById(factoryId), lines, total }
}

export const companyOutputStock = () =>
  outputs.map((o) => ({
    product: o.id,
    ...factories.reduce(
      (acc, f) => {
        const l = outputStockLine(f.id, o.id)
        return { opening: acc.opening + l.opening, in: acc.in + l.in, out: acc.out + l.out, current: acc.current + l.current }
      },
      { opening: 0, in: 0, out: 0, current: 0 },
    ),
  }))

/* ------------------------------------------------------------------ */
/* Period totals (flows)                                               */
/* ------------------------------------------------------------------ */

const totalsForRange = (range: [string, string]) => {
  const ps = confirmedPurchases.filter((p) => inRange(p.date, range))
  const pr = production.filter((p) => inRange(p.date, range))
  const ss = confirmedSales.filter((s) => inRange(s.date, range))
  const purchaseSpend = ps.reduce((s, p) => s + purchaseValue(p), 0)
  const salesRevenue = ss.reduce((s, x) => s + saleValue(x), 0)
  const produced = {
    rubber: pr.reduce((s, p) => s + p.outputs.rubber, 0),
    steel: pr.reduce((s, p) => s + p.outputs.steel, 0),
    other: pr.reduce((s, p) => s + p.outputs.other, 0),
  }
  const soldByProduct = (id: OutputId) => ss.filter((s) => s.product === id)
  return {
    purchaseCount: ps.length,
    purchaseKg: ps.reduce((s, p) => s + p.qtyKg, 0),
    purchaseSpend,
    consumedKg: pr.reduce((s, p) => s + p.inputKg, 0),
    productionCount: pr.length,
    produced,
    producedKg: produced.rubber + produced.steel + produced.other,
    salesCount: ss.length,
    salesKg: ss.reduce((s, x) => s + x.qtyKg, 0),
    salesRevenue,
    salesByProduct: outputs.map((o) => ({
      product: o.id,
      kg: soldByProduct(o.id).reduce((s, x) => s + x.qtyKg, 0),
      value: soldByProduct(o.id).reduce((s, x) => s + saleValue(x), 0),
    })),
    margin: salesRevenue - purchaseSpend,
    marginPct: salesRevenue ? ((salesRevenue - purchaseSpend) / salesRevenue) * 100 : 0,
  }
}

export const periodTotals = (period: Period) => totalsForRange(periodRange(period))
export const previousTotals = (period: Period) => totalsForRange(previousRange(period))

export const changePct = (now: number, before: number) => (before ? ((now - before) / Math.abs(before)) * 100 : 0)

export const factoryTotals = (factoryId: string, period: Period) => {
  const range = periodRange(period)
  const pr = production.filter((p) => p.factoryId === factoryId && inRange(p.date, range))
  const ss = confirmedSales.filter((s) => s.factoryId === factoryId && inRange(s.date, range))
  const consumed = pr.reduce((s, p) => s + p.inputKg, 0)
  const rubber = pr.reduce((s, p) => s + p.outputs.rubber, 0)
  const steel = pr.reduce((s, p) => s + p.outputs.steel, 0)
  const other = pr.reduce((s, p) => s + p.outputs.other, 0)
  return {
    runs: pr.length,
    consumed,
    rubber,
    steel,
    other,
    yieldPct: consumed ? ((rubber + steel + other) / consumed) * 100 : 0,
    salesRevenue: ss.reduce((s, x) => s + saleValue(x), 0),
    salesKg: ss.reduce((s, x) => s + x.qtyKg, 0),
  }
}

export const warehouseTotals = (warehouseId: string, period: Period) => {
  const range = periodRange(period)
  const ps = confirmedPurchases.filter((p) => p.warehouseId === warehouseId && inRange(p.date, range))
  const pr = production.filter((p) => p.warehouseId === warehouseId && inRange(p.date, range))
  return {
    purchasedKg: ps.reduce((s, p) => s + p.qtyKg, 0),
    purchaseSpend: ps.reduce((s, p) => s + purchaseValue(p), 0),
    consumedKg: pr.reduce((s, p) => s + p.inputKg, 0),
  }
}

/* ------------------------------------------------------------------ */
/* Monthly series for charts                                           */
/* ------------------------------------------------------------------ */

export const months = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']

export const monthlySeries = () =>
  months.map((m) => {
    const ps = confirmedPurchases.filter((p) => p.date.startsWith(m))
    const ss = confirmedSales.filter((s) => s.date.startsWith(m))
    const pr = production.filter((p) => p.date.startsWith(m))
    const purchase = ps.reduce((s, p) => s + purchaseValue(p), 0)
    const salesV = ss.reduce((s, x) => s + saleValue(x), 0)
    return {
      month: dayjs(`${m}-01`).format('MMM'),
      purchase,
      sales: salesV,
      margin: salesV - purchase,
      purchaseKg: ps.reduce((s, p) => s + p.qtyKg, 0),
      consumedKg: pr.reduce((s, p) => s + p.inputKg, 0),
      rubber: pr.reduce((s, p) => s + p.outputs.rubber, 0),
      steel: pr.reduce((s, p) => s + p.outputs.steel, 0),
      other: pr.reduce((s, p) => s + p.outputs.other, 0),
      salesKg: ss.reduce((s, x) => s + x.qtyKg, 0),
    }
  })

/* ------------------------------------------------------------------ */
/* Ledgers                                                             */
/* ------------------------------------------------------------------ */

export interface LedgerRow {
  key: string
  date: string
  ref: string
  kind: 'opening' | 'in' | 'out'
  description: string
  material: string
  inKg: number
  outKg: number
  balance: number
}

export const warehouseLedger = (warehouseId: string, material: MaterialId): LedgerRow[] => {
  const opening = openingRaw[warehouseId]?.[material] ?? 0
  const moves = [
    ...confirmedPurchases
      .filter((p) => p.warehouseId === warehouseId && p.material === material)
      .map((p) => ({ date: p.date, ref: p.id, kind: 'in' as const, description: `Purchased from ${supplierById(p.supplierId).name}`, kg: p.qtyKg })),
    ...production
      .filter((p) => p.warehouseId === warehouseId && p.material === material)
      .map((p) => ({ date: p.date, ref: p.id, kind: 'out' as const, description: `Sent to ${factoryById(p.factoryId).name}`, kg: p.inputKg })),
  ].sort((a, b) => (a.date === b.date ? (a.kind === 'in' ? -1 : 1) : a.date.localeCompare(b.date)))

  let balance = opening
  const rows: LedgerRow[] = [
    { key: 'open', date: FY_START, ref: '—', kind: 'opening', description: 'Opening stock', material: materialName(material), inKg: 0, outKg: 0, balance },
  ]
  moves.forEach((m) => {
    balance += m.kind === 'in' ? m.kg : -m.kg
    rows.push({
      key: m.ref,
      date: m.date,
      ref: m.ref,
      kind: m.kind,
      description: m.description,
      material: materialName(material),
      inKg: m.kind === 'in' ? m.kg : 0,
      outKg: m.kind === 'out' ? m.kg : 0,
      balance,
    })
  })
  return rows.reverse()
}

export type RecordType = 'purchase' | 'production' | 'sale'

export interface RecordRow {
  key: string
  id: string
  date: string
  type: RecordType
  location: string
  item: string
  qtyKg: number
  value: number | null
  party: string
  enteredBy: string
  status: 'confirmed' | 'review'
}

export const allRecords = (): RecordRow[] =>
  [
    ...purchases.map<RecordRow>((p) => ({
      key: p.id,
      id: p.id,
      date: p.date,
      type: 'purchase',
      location: warehouseById(p.warehouseId).name,
      item: materialName(p.material),
      qtyKg: p.qtyKg,
      value: purchaseValue(p),
      party: supplierById(p.supplierId).name,
      enteredBy: p.enteredBy,
      status: p.status,
    })),
    ...production.map<RecordRow>((p) => ({
      key: p.id,
      id: p.id,
      date: p.date,
      type: 'production',
      location: `${warehouseById(p.warehouseId).name} → ${factoryById(p.factoryId).name}`,
      item: `${materialName(p.material)} → Rubber, Steel${p.outputs.other ? ', Other' : ''}`,
      qtyKg: p.inputKg,
      value: null,
      party: '—',
      enteredBy: p.enteredBy,
      status: 'confirmed',
    })),
    ...sales.map<RecordRow>((s) => ({
      key: s.id,
      id: s.id,
      date: s.date,
      type: 'sale',
      location: factoryById(s.factoryId).name,
      item: outputName(s.product),
      qtyKg: s.qtyKg,
      value: saleValue(s),
      party: buyerById(s.buyerId).name,
      enteredBy: s.enteredBy,
      status: s.status,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
