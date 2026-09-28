import { useMemo, useState, type ReactNode } from 'react'
import { Alert, Button, DatePicker, Input, InputNumber, Progress, Select, Tag, Tooltip } from 'antd'
import {
  CheckOutlined,
  ExclamationOutlined,
  FilePdfFilled,
  LockFilled,
  SafetyCertificateFilled,
  ThunderboltFilled,
  ZoomInOutlined,
  ZoomOutOutlined,
  DeleteOutlined,
  QrcodeOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import InvoiceDocument from './InvoiceDocument'
import { XField } from './ReviewField'
import { correctTotal, gstinLooksValid, isDuplicateInvoice, type DocField, type ExtractedDoc } from '../data/extraction'
import { buyers, factories, materials, outputs, suppliers, TODAY, warehouses } from '../data/seed'
import { outputStockLine, rawStockLine } from '../data/selectors'
import { formatINR, formatKg } from '../utils/format'
import type { MaterialId, OutputId } from '../data/types'

export interface ReviewResult {
  partyId: string
  invoiceNo: string
  date: string
  item: string
  qtyKg: number
  rate: number
  total: number
  locationId: string
}

type VerifyKey = 'qty' | 'rate' | 'total' | 'location'

export default function ExtractionReview({
  doc,
  onConfirm,
  onDiscard,
}: {
  doc: ExtractedDoc
  onConfirm: (r: ReviewResult) => void
  onDiscard: () => void
}) {
  const isPurchase = doc.kind === 'purchase'
  const perKg = doc.unitOnBill === 'MT'
  const [active, setActive] = useState<DocField | null>(null)
  const [zoom, setZoom] = useState(1)
  const [partyId, setPartyId] = useState(doc.party.matchedId ?? '')
  const [invoiceNo, setInvoiceNo] = useState(doc.invoiceNo)
  const [date, setDate] = useState(doc.date)
  const [item, setItem] = useState<string>((isPurchase ? doc.mappedMaterial : doc.mappedProduct) ?? '')
  const [qtyKg, setQtyKg] = useState(perKg ? Math.round(doc.qtyOnBill * 1000) : doc.qtyOnBill)
  const [rate, setRate] = useState(perKg ? +(doc.rateOnBill / 1000).toFixed(2) : doc.rateOnBill)
  const [total, setTotal] = useState(doc.totalRead)
  const [locationId, setLocationId] = useState<string>('')
  const [verified, setVerified] = useState<Record<VerifyKey, boolean>>({ qty: false, rate: false, total: false, location: false })

  const parties = isPurchase ? suppliers : buyers
  const party = parties.find((p) => p.id === partyId)
  const tax = doc.cgst + doc.sgst
  const amount = qtyKg * rate
  const expectedTotal = Math.round(amount + tax)

  const setV = (k: VerifyKey) => (v: boolean) => setVerified((s) => ({ ...s, [k]: v }))

  const checks = useMemo(() => {
    const list: { key: string; ok: boolean; title: string; detail: ReactNode; field?: DocField; fix?: { label: string; run: () => void } }[] = []
    list.push({
      key: 'math',
      ok: Math.abs(amount - doc.lineAmount) <= 1,
      title: 'Quantity × rate matches the bill amount',
      detail: `${formatKg(qtyKg)} × ₹${rate.toFixed(2)} = ${formatINR(amount, true)} · bill shows ${formatINR(doc.lineAmount, true)}`,
      field: 'amount',
    })
    list.push({
      key: 'total',
      ok: Math.abs(total - expectedTotal) <= 1,
      title: 'Amount + GST matches the invoice total',
      detail:
        Math.abs(total - expectedTotal) <= 1 ? (
          `${formatINR(amount)} + ${formatINR(tax, true)} GST = ${formatINR(expectedTotal)}`
        ) : (
          <>
            Read as <b>{formatINR(total)}</b>, but amount + GST adds up to <b>{formatINR(expectedTotal)}</b> — a difference of{' '}
            {formatINR(Math.abs(total - expectedTotal))}. Look at the total on the bill.
          </>
        ),
      field: 'total',
      fix: Math.abs(total - expectedTotal) > 1 ? { label: `Use ${formatINR(expectedTotal)}`, run: () => setTotal(correctTotal(doc)) } : undefined,
    })
    list.push({
      key: 'gstin',
      ok: gstinLooksValid(doc.party.gstin) && !!party && party.gstin === doc.party.gstin,
      title: `${isPurchase ? 'Supplier' : 'Buyer'} recognised by GST number`,
      detail: party ? `${doc.party.gstin} belongs to ${party.name} in your ${isPurchase ? 'supplier' : 'buyer'} list` : 'Choose who this bill is from',
      field: 'party',
    })
    const dup = isDuplicateInvoice(doc.kind, partyId, invoiceNo, doc.recordId)
    list.push({
      key: 'dup',
      ok: !dup,
      title: 'Not entered before',
      detail: dup ? `Invoice ${invoiceNo} is already in the system — this may be a duplicate.` : `No earlier bill numbered ${invoiceNo}${isPurchase && party ? ` from ${party.name}` : ''}`,
      field: 'invoiceNo',
    })
    const daysOld = dayjs(TODAY).diff(dayjs(date), 'day')
    list.push({
      key: 'date',
      ok: daysOld >= 0 && daysOld <= 60,
      title: 'Bill date looks right',
      detail: daysOld < 0 ? 'The date is in the future.' : daysOld > 60 ? `This bill is ${daysOld} days old.` : `${dayjs(date).format('D MMM YYYY')} · ${daysOld === 0 ? 'today' : `${daysOld} day${daysOld > 1 ? 's' : ''} ago`}`,
      field: 'date',
    })
    list.push({
      key: 'unit',
      ok: true,
      title: perKg ? 'Tonnes converted to kg' : 'Weight is already in kg',
      detail: perKg ? `Bill says ${doc.qtyOnBill.toFixed(3)} MT = ${formatKg(Math.round(doc.qtyOnBill * 1000))}` : `Bill says ${formatKg(doc.qtyOnBill)}`,
      field: 'qty',
    })
    list.push({
      key: 'item',
      ok: !!item,
      title: isPurchase ? 'Tyre type recognised' : 'Product recognised',
      detail: item
        ? `"${doc.lineDescription}" → ${isPurchase ? materials.find((m) => m.id === item)?.name : outputs.find((o) => o.id === item)?.name}`
        : 'Choose the type',
      field: 'item',
    })
    if (doc.eInvoiceQr) {
      list.push({ key: 'qr', ok: true, title: 'e-Invoice QR code matches', detail: 'GST number, invoice number, date and total confirmed from the signed QR code', field: 'invoiceNo' })
    }
    if (!isPurchase && locationId && item) {
      const avail = outputStockLine(locationId, item as OutputId).current
      list.push({
        key: 'stock',
        ok: qtyKg <= avail,
        title: 'Enough stock to sell',
        detail: `${factories.find((f) => f.id === locationId)?.name} has ${formatKg(avail)} of ${outputs.find((o) => o.id === item)?.name.toLowerCase()} available`,
        field: 'qty',
      })
    }
    return list
  }, [amount, doc, qtyKg, rate, total, expectedTotal, tax, party, partyId, invoiceNo, date, item, perKg, isPurchase, locationId])

  const issues = checks.filter((c) => !c.ok)
  const verifiedCount = Object.values(verified).filter(Boolean).length
  const readyToSave = issues.length === 0 && verifiedCount === 4 && !!locationId
  const warnFields = issues.map((c) => c.field).filter(Boolean) as DocField[]
  const progress = Math.round(((checks.length - issues.length) / checks.length) * 50 + (verifiedCount / 4) * 50)

  const result = (): ReviewResult => ({ partyId, invoiceNo, date, item, qtyKg, rate, total, locationId })

  const locations = isPurchase ? warehouses : factories
  const stockNow = locationId && item ? (isPurchase ? rawStockLine(locationId, item as MaterialId).current : outputStockLine(locationId, item as OutputId).current) : null

  return (
    <div className="grid fade-in" style={{ gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
      {/* ---------- Left: the bill ---------- */}
      <div style={{ position: 'sticky', top: 92 }}>
        <div className="surface" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #eceef2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FilePdfFilled style={{ color: '#D82E54', fontSize: 20 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 13.5 }}>{doc.fileName}</div>
                <div className="faint" style={{ fontSize: 12 }}>
                  Page 1 of {doc.pages} · click any field on the right to see where it was read
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Button type="text" icon={<ZoomOutOutlined />} onClick={() => setZoom((z) => Math.max(0.8, z - 0.1))} />
              <Button type="text" icon={<ZoomInOutlined />} onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))} />
            </div>
          </div>
          <div style={{ background: '#e9ebef', padding: 24, maxHeight: 'calc(100vh - 190px)', overflow: 'auto' }}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform .2s' }}>
              <InvoiceDocument doc={doc} active={active} warn={warnFields} />
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Right: what we read ---------- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="surface" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="kpi-icon" style={{ background: '#f4efff', color: '#6941c6', width: 40, height: 40, fontSize: 18 }}>
              <ThunderboltFilled />
            </span>
            <div style={{ flex: 1 }}>
              <div className="strong" style={{ fontSize: 16 }}>
                We read this bill for you
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                Please compare the highlighted values with the bill before saving.
              </div>
            </div>
            <Progress type="circle" percent={progress} size={48} strokeColor={readyToSave ? '#1f9d6b' : '#D82E54'} format={() => <span style={{ fontSize: 12, fontWeight: 800 }}>{progress}%</span>} />
          </div>
          <Alert
            style={{ marginTop: 14, borderRadius: 10 }}
            type="info"
            showIcon
            icon={<LockFilled />}
            title={<span style={{ fontWeight: 700 }}>Nothing is saved until you confirm.</span>}
            description={isPurchase ? 'Stock and purchase totals change only after you press "Confirm & add to stock".' : 'Output stock and sales totals change only after you press "Confirm sale".'}
          />
        </div>

        {/* Checks */}
        <div className="surface" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div className="strong" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafetyCertificateFilled style={{ color: issues.length ? '#d98a0b' : '#1f9d6b' }} /> Automatic checks
            </div>
            {issues.length ? (
              <Tag color="warning" style={{ fontWeight: 700, marginInlineEnd: 0 }}>
                {issues.length} to fix
              </Tag>
            ) : (
              <Tag color="success" style={{ fontWeight: 700, marginInlineEnd: 0 }}>
                All {checks.length} passed
              </Tag>
            )}
          </div>
          {[...issues, ...checks.filter((c) => c.ok)].map((c) => (
            <div key={c.key} className="check-row" onClick={() => c.field && setActive(c.field)} style={{ cursor: c.field ? 'pointer' : undefined }}>
              <span className={`check-icon ${c.ok ? 'ok' : 'warn'}`}>{c.ok ? <CheckOutlined /> : <ExclamationOutlined />}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: c.ok ? '#1f2329' : '#8a5300', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {c.key === 'qr' && <QrcodeOutlined />}
                  {c.title}
                </div>
                <div className="muted num" style={{ fontSize: 12.5 }}>
                  {c.detail}
                </div>
                {c.fix && (
                  <Button size="small" type="primary" ghost style={{ marginTop: 8 }} onClick={(e) => { e.stopPropagation(); c.fix!.run() }}>
                    {c.fix.label}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Who & when */}
        <div className="surface" style={{ padding: 20 }}>
          <div className="strong" style={{ fontSize: 15, marginBottom: 12 }}>
            1. Who and when
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <XField field="party" label={isPurchase ? 'Supplier' : 'Buyer'} active={active} onFocus={setActive} confidence={doc.confidence.party} note={`Read from bill: ${doc.party.name} · GSTIN ${doc.party.gstin}`}>
              <Select value={partyId || undefined} onChange={setPartyId} style={{ width: '100%' }} options={parties.map((p) => ({ value: p.id, label: p.name }))} placeholder="Choose" showSearch={{ optionFilterProp: 'label' }} />
            </XField>
            <div className="grid grid-2" style={{ gap: 12 }}>
              <XField field="invoiceNo" label="Invoice number" active={active} onFocus={setActive} confidence={doc.confidence.invoiceNo}>
                <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
              </XField>
              <XField field="date" label="Invoice date" active={active} onFocus={setActive} confidence={doc.confidence.date}>
                <DatePicker value={dayjs(date)} onChange={(d) => d && setDate(d.format('YYYY-MM-DD'))} format="DD MMM YYYY" style={{ width: '100%' }} allowClear={false} />
              </XField>
            </div>
          </div>
        </div>

        {/* What & how much */}
        <div className="surface" style={{ padding: 20 }}>
          <div className="strong" style={{ fontSize: 15, marginBottom: 12 }}>
            2. What and how much
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <XField field="item" label={isPurchase ? 'Tyre / raw material type' : 'Product sold'} active={active} onFocus={setActive} confidence={doc.confidence.item} note={`Bill says: "${doc.lineDescription}"`}>
              <Select<string>
                value={item || undefined}
                onChange={setItem}
                style={{ width: '100%' }}
                options={isPurchase ? materials.map((m) => ({ value: m.id as string, label: m.name })) : outputs.map((o) => ({ value: o.id as string, label: `${o.name} — ${o.description}` }))}
              />
            </XField>
            <div className="grid grid-2" style={{ gap: 12 }}>
              <XField
                field="qty"
                label="Quantity (kg)"
                active={active}
                onFocus={setActive}
                confidence={doc.confidence.qty}
                note={perKg ? `Bill says ${doc.qtyOnBill.toFixed(3)} MT → converted to kg` : undefined}
                verify={{ checked: verified.qty, onChange: setV('qty') }}
              >
                <InputNumber value={qtyKg} onChange={(v) => setQtyKg(v ?? 0)} style={{ width: '100%' }} suffix="kg" min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => Number((v ?? '').replace(/,/g, ''))} />
              </XField>
              <XField
                field="rate"
                label="Rate per kg"
                active={active}
                onFocus={setActive}
                confidence={doc.confidence.rate}
                note={perKg ? `Bill says ₹${doc.rateOnBill.toLocaleString('en-IN')} per MT` : undefined}
                verify={{ checked: verified.rate, onChange: setV('rate') }}
              >
                <InputNumber value={rate} onChange={(v) => setRate(v ?? 0)} style={{ width: '100%' }} prefix="₹" suffix="/kg" min={0} step={0.1} precision={2} />
              </XField>
            </div>
            <div className="grid grid-2" style={{ gap: 12 }}>
              <XField field="amount" label="Amount before tax" active={active} onFocus={setActive} note="Worked out automatically from quantity × rate">
                <div className="num strong" style={{ fontSize: 18, padding: '6px 0' }}>
                  {formatINR(amount, true)}
                </div>
              </XField>
              <XField field="tax" label="GST on the bill" active={active} onFocus={setActive} confidence={doc.confidence.tax} note={doc.taxLabel}>
                <div className="num strong" style={{ fontSize: 18, padding: '6px 0' }}>
                  {formatINR(tax, true)}
                </div>
              </XField>
            </div>
            <XField
              field="total"
              label="Invoice total"
              active={active}
              onFocus={setActive}
              confidence={doc.confidence.total}
              warn={issues.some((i) => i.key === 'total')}
              verify={{ checked: verified.total, onChange: setV('total') }}
            >
              <InputNumber value={total} onChange={(v) => setTotal(v ?? 0)} style={{ width: '100%' }} prefix="₹" min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => Number((v ?? '').replace(/,/g, ''))} />
            </XField>
          </div>
        </div>

        {/* Where */}
        <div className="surface" style={{ padding: 20 }}>
          <div className="strong" style={{ fontSize: 15, marginBottom: 12 }}>
            3. {isPurchase ? 'Where did it arrive?' : 'Which factory sold it?'}
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <XField
              field="location"
              label={isPurchase ? 'Receiving warehouse' : 'Factory'}
              active={active}
              onFocus={setActive}
              warn={!locationId}
              note={
                stockNow !== null
                  ? isPurchase
                    ? `Stock now ${formatKg(stockNow)} → after this purchase ${formatKg(stockNow + qtyKg)}`
                    : `Available now ${formatKg(stockNow)} → after this sale ${formatKg(stockNow - qtyKg)}`
                  : 'Not printed on the bill — please choose'
              }
              verify={{ checked: verified.location, onChange: setV('location') }}
            >
              <Select
                value={locationId || undefined}
                onChange={setLocationId}
                placeholder={isPurchase ? 'Choose the warehouse that received the lorry' : 'Choose the factory'}
                style={{ width: '100%' }}
                options={locations.map((l) => ({
                  value: l.id,
                  label: `${l.name} · ${l.city}${l.id === doc.suggestedLocation ? '  (usual for this ' + (isPurchase ? 'supplier' : 'buyer') + ')' : ''}`,
                }))}
              />
            </XField>
          </div>
        </div>
      </div>

      {/* ---------- Sticky action bar ---------- */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          gridColumn: '1 / -1',
          margin: '0 -32px -48px',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid #e8eaee',
          padding: '14px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 30,
          boxShadow: '0 -8px 24px rgba(16,24,40,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
            <span className={`check-icon ${issues.length ? 'warn' : 'ok'}`}>{issues.length ? <ExclamationOutlined /> : <CheckOutlined />}</span>
            {issues.length ? `${issues.length} check${issues.length > 1 ? 's' : ''} to fix` : 'All checks passed'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
            <span className={`check-icon ${verifiedCount === 4 ? 'ok' : 'warn'}`}>{verifiedCount === 4 ? <CheckOutlined /> : verifiedCount}</span>
            {verifiedCount} of 4 key values checked by you
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button size="large" icon={<DeleteOutlined />} onClick={onDiscard}>
            Discard
          </Button>
          <Tooltip title={readyToSave ? '' : 'Fix the checks and tick the 4 key values to continue'}>
            <Button type="primary" size="large" icon={<CheckOutlined />} disabled={!readyToSave} onClick={() => onConfirm(result())} style={{ minWidth: 220 }}>
              {isPurchase ? 'Confirm & add to stock' : 'Confirm sale'}
            </Button>
          </Tooltip>
        </div>
      </div>

    </div>
  )
}
