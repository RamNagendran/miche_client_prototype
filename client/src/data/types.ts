export type Role = 'ceo' | 'admin' | 'operator'

export type MaterialId = 'truck' | 'car' | 'twowheeler' | 'otr'
export type OutputId = 'rubber' | 'steel' | 'other'

export interface Material {
  id: MaterialId
  name: string
  short: string
  description: string
}

export interface OutputProduct {
  id: OutputId
  name: string
  description: string
  active: boolean
}

export interface Warehouse {
  id: string
  code: string
  name: string
  city: string
  supplies: string[]
  manager: string
  materials: MaterialId[]
}

export interface Factory {
  id: string
  code: string
  name: string
  city: string
  suppliedBy: string[]
  manager: string
}

export interface Party {
  id: string
  name: string
  city: string
  gstin: string
  contact: string
  phone: string
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  title: string
  access: string
  /** Warehouses and factories this person works on. */
  locations: string[]
  initials: string
}

export type EntrySource = 'ai' | 'manual'
export type EntryStatus = 'confirmed' | 'review'

export interface Purchase {
  id: string
  date: string
  supplierId: string
  material: MaterialId
  warehouseId: string
  qtyKg: number
  rate: number
  invoiceNo: string
  status: EntryStatus
  source: EntrySource
}

export interface Production {
  id: string
  date: string
  factoryId: string
  warehouseId: string
  material: MaterialId
  inputKg: number
  outputs: Record<OutputId, number>
}

export interface Sale {
  id: string
  date: string
  buyerId: string
  factoryId: string
  product: OutputId
  qtyKg: number
  rate: number
  invoiceNo: string
  status: EntryStatus
  source: EntrySource
}
