import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, DatePicker, Form, Input, InputNumber, Select } from 'antd'
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { PageHeader } from '../../components/ui'
import DocumentIntake, { type IntakeStep } from '../../components/DocumentIntake'
import SavedResult from '../../components/SavedResult'
import type { ReviewResult } from '../../components/ExtractionReview'
import { docForQueued, samplePurchaseDoc } from '../../data/extraction'
import { materials, purchases, suppliers, TODAY, warehouses } from '../../data/seed'
import { materialName, rawStockLine, supplierById, warehouseById } from '../../data/selectors'
import { formatDate, formatINR, formatKg } from '../../utils/format'
import type { MaterialId } from '../../data/types'

function ManualPurchaseForm({ onSaved, back }: { onSaved: (r: ReviewResult) => void; back: () => void }) {
  const [form] = Form.useForm()
  const qty = Form.useWatch('qtyKg', form) ?? 0
  const rate = Form.useWatch('rate', form) ?? 0
  const wh = Form.useWatch('warehouseId', form)
  const mat = Form.useWatch('material', form) as MaterialId | undefined
  const whObj = wh ? warehouseById(wh) : null
  const stockNow = wh && mat ? rawStockLine(wh, mat).current : null

  return (
    <div className="grid fade-in" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
      <Form
        form={form}
        layout="vertical"
        size="large"
        requiredMark="optional"
        initialValues={{ date: dayjs(TODAY) }}
        onFinish={(v) =>
          onSaved({
            partyId: v.supplierId,
            invoiceNo: v.invoiceNo,
            date: v.date.format('YYYY-MM-DD'),
            item: v.material,
            qtyKg: v.qtyKg,
            rate: v.rate,
            total: v.qtyKg * v.rate,
            locationId: v.warehouseId,
          })
        }
      >
        <div className="surface" style={{ padding: 24 }}>
          <div className="strong" style={{ fontSize: 16, marginBottom: 16 }}>
            Bill details
          </div>
          <div className="grid grid-2" style={{ columnGap: 16, rowGap: 0 }}>
            <Form.Item label="Supplier" name="supplierId" rules={[{ required: true, message: 'Choose the supplier' }]} extra="Not in the list? An admin can add new suppliers in Settings.">
              <Select placeholder="Choose supplier" showSearch={{ optionFilterProp: 'label' }} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
            </Form.Item>
            <Form.Item label="Invoice / reference number" name="invoiceNo" rules={[{ required: true, message: 'Enter the bill number' }]} extra="Printed at the top of the bill">
              <Input placeholder="e.g. SBT/26-27/0421" />
            </Form.Item>
            <Form.Item label="Purchase date" name="date" rules={[{ required: true }]}>
              <DatePicker format="DD MMM YYYY" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Receiving warehouse" name="warehouseId" rules={[{ required: true, message: 'Choose the warehouse' }]} extra="Where the lorry was unloaded">
              <Select placeholder="Choose warehouse" options={warehouses.map((w) => ({ value: w.id, label: `${w.name} · ${w.city}` }))} />
            </Form.Item>
          </div>
        </div>

        <div className="surface" style={{ padding: 24, marginTop: 16 }}>
          <div className="strong" style={{ fontSize: 16, marginBottom: 16 }}>
            Material and price
          </div>
          <Form.Item label="Tyre / raw material type" name="material" rules={[{ required: true, message: 'Choose the tyre type' }]} extra="Each type is kept separately in stock">
            <Select
              placeholder="Choose type"
              options={materials
                .filter((m) => !whObj || whObj.materials.includes(m.id))
                .map((m) => ({ value: m.id, label: `${m.name} — ${m.description}` }))}
            />
          </Form.Item>
          <div className="grid grid-2" style={{ columnGap: 16, rowGap: 0 }}>
            <Form.Item label="Quantity" name="qtyKg" rules={[{ required: true, message: 'Enter the weight' }]} extra="Weight in kg. For tonnes, multiply by 1,000.">
              <InputNumber<number> style={{ width: '100%' }} min={1} suffix="kg" placeholder="e.g. 8,460" formatter={(v) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => Number((v ?? '').replace(/,/g, ''))} />
            </Form.Item>
            <Form.Item label="Rate per kg" name="rate" rules={[{ required: true, message: 'Enter the rate' }]} extra="Price before GST">
              <InputNumber style={{ width: '100%' }} min={0} step={0.1} precision={2} prefix="₹" suffix="/kg" placeholder="e.g. 14.20" />
            </Form.Item>
          </div>
          <Form.Item label="Attach bill (optional)" name="file" style={{ marginBottom: 0 }}>
            <Input type="file" accept=".pdf,.jpg,.png" style={{ paddingTop: 8 }} />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <Button size="large" icon={<ArrowLeftOutlined />} onClick={back}>
            Back
          </Button>
          <Button size="large" type="primary" htmlType="submit" icon={<CheckOutlined />} style={{ minWidth: 220 }}>
            Save purchase
          </Button>
        </div>
      </Form>

      <div className="surface" style={{ padding: 24, position: 'sticky', top: 92 }}>
        <div className="strong" style={{ fontSize: 16 }}>
          Summary
        </div>
        <div className="faint" style={{ fontSize: 13, marginBottom: 12 }}>
          Updates as you type
        </div>
        <div className="summary-line">
          <span className="muted">Quantity</span>
          <b className="num">{formatKg(qty)}</b>
        </div>
        <div className="summary-line">
          <span className="muted">Rate</span>
          <b className="num">₹{Number(rate).toFixed(2)}/kg</b>
        </div>
        <div className="summary-line" style={{ fontSize: 17 }}>
          <span className="strong">Total purchase cost</span>
          <b className="num strong">{formatINR(qty * rate)}</b>
        </div>
        <div style={{ background: '#f7f8fa', borderRadius: 12, padding: 14, marginTop: 14 }}>
          <div className="faint" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Stock after saving
          </div>
          {stockNow !== null ? (
            <div style={{ marginTop: 6 }}>
              <div className="num strong" style={{ fontSize: 20 }}>
                {formatKg(stockNow + qty)}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                {materialName(mat!)} at {whObj!.name} · now {formatKg(stockNow)}
              </div>
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
              Choose the warehouse and tyre type to see the new stock.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NewPurchase() {
  const navigate = useNavigate()
  const { id } = useParams()
  const queued = id ? purchases.find((p) => p.id === id && p.status === 'review') : undefined
  const [step, setStep] = useState<IntakeStep>(queued ? 'review' : 'choose')
  const nextId = `PUR-2026-0${Number(purchases[purchases.length - 1].id.slice(-3)) + 1}`

  return (
    <div className="page">
      {step !== 'done' && (
        <PageHeader
          eyebrow={queued ? `Waiting for review · ${queued.id}` : 'Purchases'}
          title={step === 'review' ? 'Check the bill details' : 'Record a purchase'}
          subtitle={
            step === 'review'
              ? 'Compare each value with the bill on the left. Values we are unsure of are marked in amber.'
              : 'Add a raw-material purchase. It will be added to the stock of the warehouse that received it.'
          }
          extra={
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchases')}>
              Back to purchases
            </Button>
          }
        />
      )}
      <DocumentIntake
        kind="purchase"
        sampleDoc={samplePurchaseDoc}
        initialDoc={queued ? docForQueued(queued) : undefined}
        onStepChange={setStep}
        onDiscard={() => navigate('/purchases')}
        renderManual={(onSaved, back) => <ManualPurchaseForm onSaved={onSaved} back={back} />}
        renderDone={(r, again) => {
          const wh = warehouseById(r.locationId)
          const mat = r.item as MaterialId
          const now = rawStockLine(r.locationId, mat).current
          return (
            <SavedResult
              title="Purchase saved"
              subtitle={
                <>
                  {formatKg(r.qtyKg)} of {materialName(mat).toLowerCase()} added to <b>{wh.name}</b>.
                </>
              }
              refId={queued?.id ?? nextId}
              lines={[
                ['Supplier', supplierById(r.partyId)?.name ?? '—'],
                ['Invoice', `${r.invoiceNo} · ${formatDate(r.date)}`],
                ['Quantity × rate', `${formatKg(r.qtyKg)} × ₹${r.rate.toFixed(2)}`],
                ['Purchase cost (before GST)', formatINR(r.qtyKg * r.rate)],
              ]}
              effects={[
                <>
                  {wh.name} · {materialName(mat)}: {formatKg(now)} → <b>{formatKg(now + r.qtyKg)}</b>
                </>,
                <>Purchase spend increased by {formatINR(r.qtyKg * r.rate)}</>,
                <>Original bill stored with the record for future reference</>,
              ]}
              actions={[
                { label: 'Record another purchase', onClick: again, primary: true },
                { label: `View ${wh.name}`, onClick: () => navigate(`/warehouses/${wh.id}`) },
                { label: 'All purchases', onClick: () => navigate('/purchases') },
              ]}
            />
          )
        }}
      />
    </div>
  )
}
