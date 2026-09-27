import { purchases, sales, suppliers, buyers } from './seed'
import type { MaterialId, OutputId, Purchase } from './types'

/**
 * What the (future) AI reader returns for one bill. In the real system this comes from
 * LLM vision extraction + the PDF text layer + the GST e-invoice QR code, then plain-code checks.
 * Here it is mock data so the review screen can be demonstrated.
 */
export interface ExtractedDoc {
  kind: 'purchase' | 'sale'
  /** Set when this bill is already in the review queue, so it is not flagged as a duplicate of itself. */
  recordId?: string
  fileName: string
  pages: number
  party: { name: string; gstin: string; address: string; matchedId?: string }
  invoiceNo: string
  date: string
  lineDescription: string
  hsn: string
  qtyOnBill: number
  unitOnBill: 'MT' | 'KG'
  rateOnBill: number
  lineAmount: number
  taxLabel: string
  cgst: number
  sgst: number
  roundOff: number
  totalRead: number
  vehicleNo: string
  eInvoiceQr: boolean
  mappedMaterial?: MaterialId
  mappedProduct?: OutputId
  suggestedLocation: string
  confidence: Partial<Record<DocField, number>>
}

export type DocField = 'party' | 'invoiceNo' | 'date' | 'item' | 'qty' | 'rate' | 'amount' | 'tax' | 'total' | 'location'

export const michyDetails = {
  name: 'Michy Rubbers',
  gstin: '33AAXFM5521R1Z3',
  address: 'SIPCOT Industrial Estate, Gummidipoondi, Tiruvallur – 601201',
}

const gst = (amount: number) => Math.round(amount * 0.025 * 100) / 100

/** A fresh upload used in the demo. The AI misread one digit of the total so the safety checks can be shown. */
export const samplePurchaseDoc: ExtractedDoc = (() => {
  const lineAmount = 8.46 * 14200
  const tax = gst(lineAmount)
  const exact = lineAmount + tax * 2
  const rounded = Math.round(exact)
  return {
    kind: 'purchase',
    fileName: 'SBT-invoice-1418.pdf',
    pages: 1,
    party: { name: 'Sri Balaji Tyre Traders', gstin: '33AAKFS4821M1Z6', address: 'No. 14, GNT Road, Madhavaram, Chennai – 600060', matchedId: 'S1' },
    invoiceNo: 'SBT/26-27/1418',
    date: '2026-09-26',
    lineDescription: 'TBR Scrap Tyres – Cut Pieces',
    hsn: '40040000',
    qtyOnBill: 8.46,
    unitOnBill: 'MT',
    rateOnBill: 14200,
    lineAmount,
    taxLabel: 'CGST 2.5% + SGST 2.5%',
    cgst: tax,
    sgst: tax,
    roundOff: +(rounded - exact).toFixed(2),
    totalRead: 126193, // real total on the bill is ₹1,26,139 — AI swapped two digits
    vehicleNo: 'TN 18 AK 4471',
    eInvoiceQr: false,
    mappedMaterial: 'truck',
    suggestedLocation: 'WA',
    confidence: { party: 99, invoiceNo: 98, date: 97, item: 93, qty: 96, rate: 95, amount: 97, tax: 96, total: 71, location: 0 },
  }
})()

export const correctTotal = (doc: ExtractedDoc) => Math.round(doc.lineAmount + doc.cgst + doc.sgst)

/** Build the extracted view for a bill already waiting in the review queue. */
export const docForQueued = (p: Purchase): ExtractedDoc => {
  const s = suppliers.find((x) => x.id === p.supplierId)!
  const lineAmount = Math.round(p.qtyKg * p.rate * 100) / 100
  const tax = gst(lineAmount)
  const exact = lineAmount + tax * 2
  const handwritten = p.supplierId === 'S4'
  return {
    kind: 'purchase',
    recordId: p.id,
    fileName: `${p.invoiceNo.replace(/\//g, '-')}.pdf`,
    pages: 1,
    party: { name: s.name, gstin: s.gstin, address: `${s.city}, Tamil Nadu`, matchedId: s.id },
    invoiceNo: p.invoiceNo,
    date: p.date,
    lineDescription: p.material === 'car' ? 'PCR Car Tyre Scrap (Whole)' : 'Truck Tyre Scrap – Bead Cut',
    hsn: '40040000',
    qtyOnBill: p.qtyKg,
    unitOnBill: 'KG',
    rateOnBill: p.rate,
    lineAmount,
    taxLabel: 'CGST 2.5% + SGST 2.5%',
    cgst: tax,
    sgst: tax,
    roundOff: +(Math.round(exact) - exact).toFixed(2),
    totalRead: Math.round(exact),
    vehicleNo: handwritten ? 'TN 23 BZ 9012' : 'TN 30 AX 2268',
    eInvoiceQr: !handwritten,
    mappedMaterial: p.material,
    suggestedLocation: p.warehouseId,
    confidence: { party: 99, invoiceNo: 97, date: 98, item: 94, qty: handwritten ? 82 : 98, rate: handwritten ? 78 : 97, amount: 97, tax: 98, total: 97, location: 0 },
  }
}

export const sampleSaleDoc: ExtractedDoc = (() => {
  const lineAmount = 4250 * 31.2
  const tax = gst(lineAmount)
  const exact = lineAmount + tax * 2
  const b = buyers.find((x) => x.id === 'B1')!
  return {
    kind: 'sale',
    fileName: 'MR-A-invoice-0428.pdf',
    pages: 1,
    party: { name: b.name, gstin: b.gstin, address: 'Plot 22, Ambattur Industrial Estate, Chennai – 600058', matchedId: b.id },
    invoiceNo: 'MR/A/26-27/1428',
    date: '2026-09-26',
    lineDescription: 'Crumb Rubber – 30 Mesh (Black)',
    hsn: '40040000',
    qtyOnBill: 4250,
    unitOnBill: 'KG',
    rateOnBill: 31.2,
    lineAmount,
    taxLabel: 'CGST 2.5% + SGST 2.5%',
    cgst: tax,
    sgst: tax,
    roundOff: +(Math.round(exact) - exact).toFixed(2),
    totalRead: Math.round(exact),
    vehicleNo: 'TN 05 CK 7719',
    eInvoiceQr: true,
    mappedProduct: 'rubber',
    suggestedLocation: 'FA',
    confidence: { party: 99, invoiceNo: 99, date: 99, item: 95, qty: 98, rate: 97, amount: 98, tax: 98, total: 98, location: 0 },
  }
})()

const sameNo = (a: string, b: string) => a.trim().toUpperCase() === b.trim().toUpperCase()

export const isDuplicateInvoice = (kind: 'purchase' | 'sale', partyId: string | undefined, invoiceNo: string, ignoreId?: string) =>
  kind === 'purchase'
    ? purchases.some((p) => p.id !== ignoreId && p.supplierId === partyId && sameNo(p.invoiceNo, invoiceNo))
    : sales.some((s) => s.id !== ignoreId && sameNo(s.invoiceNo, invoiceNo))

/** GSTIN: 2-digit state code, 10-char PAN, entity no., 'Z', check char. */
export const gstinLooksValid = (g: string) => /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g.trim().toUpperCase())
