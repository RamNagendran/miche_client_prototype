import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import dayjs from 'dayjs'
import { michyDetails, type DocField, type ExtractedDoc } from '../data/extraction'
import { formatINR } from '../utils/format'

function FakeQr() {
  // Deterministic pattern that reads as a QR code at a glance.
  const cells: ReactNode[] = []
  const n = 21
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)
      const ring = finder && (x % 14 === 0 || x % 14 === 6 || y % 14 === 0 || y % 14 === 6 || (x % 14 >= 2 && x % 14 <= 4 && y % 14 >= 2 && y % 14 <= 4))
      const on = finder ? ring : ((x * 7 + y * 13 + x * y) % 5) < 2
      if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />)
    }
  return (
    <svg viewBox="0 0 21 21" width={72} height={72} style={{ display: 'block' }}>
      <g fill="#222">{cells}</g>
    </svg>
  )
}

const HighlightCtx = createContext<{ active?: DocField | null; warn: DocField[] }>({ warn: [] })

/** A region of the bill that one extracted field was read from. */
function H({ f, children, block }: { f: DocField; children: ReactNode; block?: boolean }) {
  const { active, warn } = useContext(HighlightCtx)
  return (
    <span
      data-field={f}
      className={`hl ${active === f ? 'active' : ''} ${warn.includes(f) ? 'warn' : ''}`}
      style={{ display: block ? 'block' : 'inline-block', padding: '0 3px', margin: '0 -3px' }}
    >
      {children}
    </span>
  )
}

export default function InvoiceDocument({
  doc,
  active,
  warn = [],
  scanning,
}: {
  doc: ExtractedDoc
  active?: DocField | null
  warn?: DocField[]
  scanning?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || !ref.current) return
    const el = ref.current.querySelector(`[data-field="${active}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [active])

  const seller = doc.kind === 'purchase' ? doc.party : michyDetails
  const buyer = doc.kind === 'purchase' ? michyDetails : doc.party
  const unitLabel = doc.unitOnBill === 'MT' ? 'MT' : 'Kg'
  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <HighlightCtx.Provider value={{ active, warn }}>
    <div ref={ref} className="invoice">
      {scanning && <div className="scan-line" />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #333', paddingBottom: 12 }}>
        <div>
          <H f={doc.kind === 'purchase' ? 'party' : 'invoiceNo'} block>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', letterSpacing: '0.02em' }}>{seller.name.toUpperCase()}</div>
            <div style={{ color: '#666', maxWidth: 260 }}>{seller.address}</div>
            <div style={{ color: '#444' }}>GSTIN: {seller.gstin}</div>
          </H>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.1em' }}>TAX INVOICE</div>
          <div style={{ color: '#888', fontSize: 10.5 }}>Original for recipient</div>
          {doc.eInvoiceQr && (
            <div style={{ marginTop: 6, display: 'inline-block', padding: 3, border: '1px solid #ddd' }}>
              <FakeQr />
              <div style={{ fontSize: 8.5, color: '#888', textAlign: 'center' }}>e-Invoice IRN</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
        <div>
          <div style={{ fontWeight: 700, color: '#888', fontSize: 10.5, letterSpacing: '0.06em' }}>BILL TO</div>
          <H f={doc.kind === 'sale' ? 'party' : 'location'} block>
            <div style={{ fontWeight: 700 }}>{buyer.name}</div>
            <div style={{ color: '#666' }}>{buyer.address}</div>
            <div style={{ color: '#444' }}>GSTIN: {buyer.gstin}</div>
          </H>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 10, rowGap: 3, alignContent: 'start' }}>
          <span style={{ color: '#888' }}>Invoice No.</span>
          <span style={{ fontWeight: 700 }}>
            <H f="invoiceNo">{doc.invoiceNo}</H>
          </span>
          <span style={{ color: '#888' }}>Invoice Date</span>
          <span style={{ fontWeight: 700 }}>
            <H f="date">{dayjs(doc.date).format('DD/MM/YYYY')}</H>
          </span>
          <span style={{ color: '#888' }}>Vehicle No.</span>
          <span>{doc.vehicleNo}</span>
          <span style={{ color: '#888' }}>Place of supply</span>
          <span>Tamil Nadu (33)</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: 28 }}>#</th>
            <th>Description of goods</th>
            <th>HSN</th>
            <th className="r">Qty</th>
            <th className="r">Rate</th>
            <th className="r">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>
              <H f="item">{doc.lineDescription}</H>
            </td>
            <td>{doc.hsn}</td>
            <td className="r">
              <H f="qty">
                {doc.unitOnBill === 'MT' ? doc.qtyOnBill.toFixed(3) : doc.qtyOnBill.toLocaleString('en-IN')} {unitLabel}
              </H>
            </td>
            <td className="r">
              <H f="rate">
                {fmt(doc.rateOnBill)}/{unitLabel}
              </H>
            </td>
            <td className="r">
              <H f="amount">{fmt(doc.lineAmount)}</H>
            </td>
          </tr>
          <tr>
            <td colSpan={6} style={{ height: 70, borderBottom: 'none' }} />
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, gap: 24 }}>
        <div style={{ color: '#666', fontSize: 11, maxWidth: 250 }}>
          <div style={{ fontWeight: 700, color: '#444' }}>Bank details</div>
          Indian Bank · A/c 6045 2231 889 · IFSC IDIB000G041
          <div style={{ marginTop: 10, fontStyle: 'italic' }}>Goods once sold will not be taken back. Subject to Chennai jurisdiction.</div>
        </div>
        <div style={{ minWidth: 230 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span style={{ color: '#666' }}>Taxable value</span>
            <span>{fmt(doc.lineAmount)}</span>
          </div>
          <H f="tax" block>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
              <span style={{ color: '#666' }}>CGST @ 2.5%</span>
              <span>{fmt(doc.cgst)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
              <span style={{ color: '#666' }}>SGST @ 2.5%</span>
              <span>{fmt(doc.sgst)}</span>
            </div>
          </H>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span style={{ color: '#666' }}>Round off</span>
            <span>{fmt(doc.roundOff)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '2px solid #333', marginTop: 4, fontWeight: 800, fontSize: 13.5 }}>
            <span>TOTAL</span>
            <H f="total">
              {/* The printed total is correct; only the AI reading of it may be wrong. */}
              {formatINR(Math.round(doc.lineAmount + doc.cgst + doc.sgst))}.00
            </H>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 30 }}>
        <div style={{ color: '#999', fontSize: 10.5 }}>This is a computer generated invoice.</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'cursive', fontSize: 18, color: '#2a4a8a', transform: 'rotate(-4deg)' }}>{seller.name.split(' ')[0]}</div>
          <div style={{ borderTop: '1px solid #999', paddingTop: 2, fontSize: 10.5, color: '#666' }}>Authorised signatory</div>
        </div>
      </div>
    </div>
    </HighlightCtx.Provider>
  )
}
