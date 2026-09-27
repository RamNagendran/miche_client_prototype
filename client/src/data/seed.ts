import dayjs from 'dayjs'
import type {
  Factory,
  Material,
  MaterialId,
  OutputId,
  OutputProduct,
  Party,
  Production,
  Purchase,
  Sale,
  User,
  Warehouse,
} from './types'

/* ------------------------------------------------------------------ */
/* Master data                                                         */
/* ------------------------------------------------------------------ */

export const TODAY = '2026-09-27'
export const FY_START = '2026-04-01'

export const materials: Material[] = [
  { id: 'truck', name: 'Truck tyres', short: 'Truck', description: 'TBR / bus & truck scrap tyres, whole or cut', lowStockKg: 8000 },
  { id: 'car', name: 'Car tyres', short: 'Car', description: 'PCR / passenger car scrap tyres', lowStockKg: 8000 },
  { id: 'twowheeler', name: 'Two-wheeler tyres', short: '2-Wheeler', description: 'Bike & scooter scrap tyres', lowStockKg: 5000 },
  { id: 'otr', name: 'OTR tyres', short: 'OTR', description: 'Off-the-road / earthmover tyres', lowStockKg: 6000 },
]

export const outputs: OutputProduct[] = [
  { id: 'rubber', name: 'Rubber', description: 'Crumb rubber / rubber granules', active: true },
  { id: 'steel', name: 'Steel', description: 'Recovered tyre steel wire', active: true },
  { id: 'other', name: 'Other', description: 'Fabric / fluff and other by-products', active: true },
]

export const warehouses: Warehouse[] = [
  { id: 'WA', code: 'A', name: 'Warehouse A', city: 'Gummidipoondi', supplies: ['FA', 'FB'], manager: 'Suresh Murugan', materials: ['truck', 'car'] },
  { id: 'WB', code: 'B', name: 'Warehouse B', city: 'Sriperumbudur', supplies: ['FB'], manager: 'Divya Krishnan', materials: ['truck', 'car', 'twowheeler'] },
  { id: 'WC', code: 'C', name: 'Warehouse C', city: 'Hosur', supplies: ['FC'], manager: 'Divya Krishnan', materials: ['truck', 'otr'] },
]

export const factories: Factory[] = [
  { id: 'FA', code: 'A', name: 'Factory A', city: 'Gummidipoondi', suppliedBy: ['WA'], manager: 'Suresh Murugan' },
  { id: 'FB', code: 'B', name: 'Factory B', city: 'Sriperumbudur', suppliedBy: ['WA', 'WB'], manager: 'Divya Krishnan' },
  { id: 'FC', code: 'C', name: 'Factory C', city: 'Hosur', suppliedBy: ['WC'], manager: 'Divya Krishnan' },
]

export const suppliers: Party[] = [
  { id: 'S1', name: 'Sri Balaji Tyre Traders', city: 'Chennai', gstin: '33AAKFS4821M1Z6', contact: 'R. Venkatesh', phone: '+91 98401 22871' },
  { id: 'S2', name: 'Kaveri Scrap Suppliers', city: 'Salem', gstin: '33ABDFK7719Q1Z2', contact: 'M. Anand', phone: '+91 94433 51902' },
  { id: 'S3', name: 'National Tyre Retreads', city: 'Bengaluru', gstin: '29AAECN3362H1ZP', contact: 'Imran Pasha', phone: '+91 98450 77310' },
  { id: 'S4', name: 'Coimbatore Rubber Scrap Co.', city: 'Coimbatore', gstin: '33AAHFC9051B1ZK', contact: 'S. Prakash', phone: '+91 99944 18263' },
  { id: 'S5', name: 'Maruthi Waste Recyclers', city: 'Vellore', gstin: '33AASFM2684D1Z9', contact: 'K. Lakshmi', phone: '+91 97877 40116' },
  { id: 'S6', name: 'Annai Enterprises', city: 'Tiruvallur', gstin: '33BBVPA6173E1ZQ', contact: 'P. Selvam', phone: '+91 90030 66524' },
]

export const buyers: Party[] = [
  { id: 'B1', name: 'Apex Rubber Mouldings', city: 'Chennai', gstin: '33AAGCA5520L1ZT', contact: 'Nitin Shah', phone: '+91 98844 30917' },
  { id: 'B2', name: 'Sai Shot Blasting Works', city: 'Coimbatore', gstin: '33ACJFS8843N1Z4', contact: 'G. Saravanan', phone: '+91 94430 28715' },
  { id: 'B3', name: 'GreenTrack Surfaces Pvt Ltd', city: 'Bengaluru', gstin: '29AAHCG7412K1ZE', contact: 'Meera Rao', phone: '+91 99005 61234' },
  { id: 'B4', name: 'Vishnu Steel Re-rollers', city: 'Gummidipoondi', gstin: '33AADFV1938C1ZM', contact: 'V. Ramesh', phone: '+91 98410 72093' },
  { id: 'B5', name: 'Om Sakthi Rubber Products', city: 'Madurai', gstin: '33AAQFO4467G1Z1', contact: 'T. Murali', phone: '+91 97890 15578' },
  { id: 'B6', name: 'Indus Rubber Compounds', city: 'Hyderabad', gstin: '36AAFCI2296P1ZX', contact: 'Arjun Reddy', phone: '+91 90000 48821' },
]

export const users: User[] = [
  { id: 'U1', name: 'Karthik Raman', email: 'karthik@michy.in', role: 'ceo', title: 'Chief Executive Officer', access: 'All locations · view only', lastActive: 'Today, 9:12 AM', initials: 'KR' },
  { id: 'U2', name: 'Priya Sundar', email: 'priya@michy.in', role: 'admin', title: 'Operations Admin', access: 'All locations · full access', lastActive: 'Today, 10:40 AM', initials: 'PS' },
  { id: 'U3', name: 'Suresh Murugan', email: 'suresh@michy.in', role: 'operator', title: 'Site Supervisor', access: 'Warehouse A · Factory A', lastActive: 'Today, 11:05 AM', initials: 'SM' },
  { id: 'U4', name: 'Divya Krishnan', email: 'divya@michy.in', role: 'operator', title: 'Site Supervisor', access: 'Warehouses B, C · Factories B, C', lastActive: 'Yesterday, 6:20 PM', initials: 'DK' },
]

/* ------------------------------------------------------------------ */
/* Opening balances (1 Apr 2026)                                       */
/* ------------------------------------------------------------------ */

export const openingRaw: Record<string, Partial<Record<MaterialId, number>>> = {
  WA: { truck: 6000, car: 3200 },
  WB: { truck: 4200, car: 2600, twowheeler: 1800 },
  WC: { truck: 5400, otr: 3500 },
}

export const openingOutput: Record<string, Record<OutputId, number>> = {
  FA: { rubber: 9800, steel: 3600, other: 900 },
  FB: { rubber: 8200, steel: 3000, other: 800 },
  FC: { rubber: 8900, steel: 3300, other: 700 },
}

/* ------------------------------------------------------------------ */
/* Transaction simulation — deterministic so every screen agrees       */
/* ------------------------------------------------------------------ */

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const baseBuyRate: Record<MaterialId, number> = { truck: 14.2, car: 11.4, twowheeler: 9.2, otr: 15.6 }
const baseSellRate: Record<OutputId, number> = { rubber: 29.5, steel: 22.5, other: 6.5 }
const yields: Record<MaterialId, Record<OutputId, number>> = {
  truck: { rubber: 0.64, steel: 0.27, other: 0.04 },
  car: { rubber: 0.61, steel: 0.15, other: 0.13 },
  twowheeler: { rubber: 0.67, steel: 0.09, other: 0.11 },
  otr: { rubber: 0.7, steel: 0.18, other: 0.05 },
}
const supplierPrefix: Record<string, string> = { S1: 'SBT', S2: 'KSS', S3: 'NTR', S4: 'CRS', S5: 'MWR', S6: 'AE' }

const operatorFor = (locationId: string) => (locationId.endsWith('A') ? 'Suresh Murugan' : 'Divya Krishnan')
const round = (n: number, step: number) => Math.round(n / step) * step

function simulate() {
  const r = rng(20260401)
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)]
  const raw: Record<string, Record<string, number>> = JSON.parse(JSON.stringify(openingRaw))
  const out: Record<string, Record<OutputId, number>> = JSON.parse(JSON.stringify(openingOutput))

  const purchases: Purchase[] = []
  const production: Production[] = []
  const sales: Sale[] = []

  let pSeq = 118
  let prSeq = 204
  let sSeq = 311
  let factoryTurn = 0
  let saleTurn = 0

  let workDay = 0
  const start = dayjs(FY_START)
  const end = dayjs(TODAY).subtract(1, 'day')
  for (let d = start; !d.isAfter(end); d = d.add(1, 'day')) {
    if (d.day() === 0) continue // Sunday
    const date = d.format('YYYY-MM-DD')
    const monthIdx = d.diff(start, 'month')
    workDay++

    // Purchases: a lorry-load roughly every third working day
    if (workDay % 3 === 1 || r() < 0.06) {
      // Buyers usually re-order whatever is running lowest; sometimes they buy opportunistically.
      const slots = warehouses.flatMap((w) => w.materials.map((m) => ({ wh: w, material: m, kg: raw[w.id][m] ?? 0 })))
      const slot = r() < 0.65 ? slots.sort((a, b) => a.kg - b.kg)[0] : pick(slots)
      const { wh, material } = slot
      const supplierId = pick(suppliers).id
      const qtyKg = round(7600 + r() * 5600, 10)
      const rate = +(baseBuyRate[material] * (0.96 + r() * 0.08) * (1 + monthIdx * 0.006)).toFixed(2)
      raw[wh.id][material] = (raw[wh.id][material] ?? 0) + qtyKg
      purchases.push({
        id: `PUR-2026-0${pSeq++}`,
        date,
        supplierId,
        material,
        warehouseId: wh.id,
        qtyKg,
        rate,
        invoiceNo: `${supplierPrefix[supplierId]}/26-27/${String(Math.floor(100 + r() * 800)).padStart(4, '0')}`,
        status: 'confirmed',
        source: r() < 0.72 ? 'ai' : 'manual',
        enteredBy: operatorFor(wh.id),
        confirmedBy: operatorFor(wh.id),
      })
    }

    // Production: one factory per working day on most days
    if (r() < 0.62) {
      const f = factories[factoryTurn++ % factories.length]
      const options = f.suppliedBy.flatMap((wid) =>
        Object.entries(raw[wid]).map(([m, kg]) => ({ wid, material: m as MaterialId, kg })),
      )
      const best = options.sort((a, b) => b.kg - a.kg)[0]
      if (best && best.kg > 2500) {
        const inputKg = round(Math.min(best.kg * 0.55, 3800 + r() * 4200), 50)
        const y = yields[best.material]
        const jitter = () => 0.97 + r() * 0.05
        const o = {
          rubber: round(inputKg * y.rubber * jitter(), 10),
          steel: round(inputKg * y.steel * jitter(), 10),
          other: round(inputKg * y.other * jitter(), 10),
        }
        raw[best.wid][best.material] -= inputKg
        out[f.id].rubber += o.rubber
        out[f.id].steel += o.steel
        out[f.id].other += o.other
        production.push({
          id: `PRD-2026-0${prSeq++}`,
          date,
          factoryId: f.id,
          warehouseId: best.wid,
          material: best.material,
          inputKg,
          outputs: o,
          enteredBy: operatorFor(f.id),
        })
      }
    }

    // Sales: roughly every 2-3 working days
    if (r() < 0.68) {
      const f = factories[saleTurn++ % factories.length]
      // Sell what is on hand: products are chosen in proportion to the stock available.
      const stockTotal = out[f.id].rubber + out[f.id].steel + out[f.id].other
      const roll = r() * stockTotal
      const product: OutputId =
        roll < out[f.id].rubber ? 'rubber' : roll < out[f.id].rubber + out[f.id].steel ? 'steel' : 'other'
      const available = out[f.id][product]
      const minLot = product === 'rubber' ? 2000 : product === 'steel' ? 1000 : 400
      if (available > minLot * 1.5) {
        const qtyKg = round(Math.min(available * 0.8, minLot + r() * (product === 'rubber' ? 6500 : product === 'steel' ? 3800 : 2400)), 10)
        const buyerPool = product === 'steel' ? ['B2', 'B4', 'B6'] : ['B1', 'B3', 'B5', 'B6']
        const buyerId = pick(buyerPool)
        const rate = +(baseSellRate[product] * (0.95 + r() * 0.1) * (1 + monthIdx * 0.004)).toFixed(2)
        out[f.id][product] -= qtyKg
        sales.push({
          id: `SAL-2026-0${sSeq++}`,
          date,
          buyerId,
          factoryId: f.id,
          product,
          qtyKg,
          rate,
          invoiceNo: `MR/${f.code}/26-27/${String(sSeq + 90).padStart(4, '0')}`,
          status: 'confirmed',
          source: r() < 0.55 ? 'ai' : 'manual',
          enteredBy: operatorFor(f.id),
          confirmedBy: operatorFor(f.id),
        })
      }
    }
  }

  // Two bills uploaded this week are still waiting for someone to check them — they are NOT in stock yet.
  purchases.push(
    { id: `PUR-2026-0${pSeq++}`, date: '2026-09-25', supplierId: 'S4', material: 'car', warehouseId: 'WA', qtyKg: 9240, rate: 11.85, invoiceNo: 'CRS/26-27/0772', status: 'review', source: 'ai', enteredBy: 'Suresh Murugan' },
    { id: `PUR-2026-0${pSeq}`, date: '2026-09-26', supplierId: 'S2', material: 'truck', warehouseId: 'WC', qtyKg: 12680, rate: 14.6, invoiceNo: 'KSS/26-27/0815', status: 'review', source: 'ai', enteredBy: 'Divya Krishnan' },
  )

  return { purchases, production, sales }
}

const sim = simulate()
export const purchases = sim.purchases
export const production = sim.production
export const sales = sim.sales
