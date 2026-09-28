import { useNavigate } from 'react-router-dom'
import { Button, DatePicker, Form, Input, InputNumber, Select } from 'antd'
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useState } from 'react'
import { PageHeader } from '../../components/ui'
import { useScope } from '../../context/useScope'
import DocumentIntake, { type IntakeStep } from '../../components/DocumentIntake'
import SavedResult from '../../components/SavedResult'
import type { ReviewResult } from '../../components/ExtractionReview'
import { sampleSaleDoc } from '../../data/extraction'
import { buyers, outputs, sales, TODAY } from '../../data/seed'
import { buyerById, factoryById, outputName, outputStockLine } from '../../data/selectors'
import { formatDate, formatINR, formatKg } from '../../utils/format'
import type { OutputId } from '../../data/types'

function ManualSaleForm({ onSaved, back }: { onSaved: (r: ReviewResult) => void; back: () => void }) {
  const { factories } = useScope()
  const [form] = Form.useForm()
  const qty = Form.useWatch('qtyKg', form) ?? 0
  const rate = Form.useWatch('rate', form) ?? 0
  const fid = Form.useWatch('factoryId', form)
  const product = Form.useWatch('product', form) as OutputId | undefined
  const available = fid && product ? outputStockLine(fid, product).current : null
  const over = available !== null && qty > available

  return (
    <div className="grid fade-in" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
      <Form
        form={form}
        layout="vertical"
        size="large"
        requiredMark="optional"
        initialValues={{ date: dayjs(TODAY) }}
        onFinish={(v) =>
          onSaved({ partyId: v.buyerId, invoiceNo: v.invoiceNo, date: v.date.format('YYYY-MM-DD'), item: v.product, qtyKg: v.qtyKg, rate: v.rate, total: v.qtyKg * v.rate, locationId: v.factoryId })
        }
      >
        <div className="surface" style={{ padding: 24 }}>
          <div className="strong" style={{ fontSize: 16, marginBottom: 16 }}>
            Sale details
          </div>
          <div className="grid grid-2" style={{ columnGap: 16, rowGap: 0 }}>
            <Form.Item label="Buyer" name="buyerId" rules={[{ required: true, message: 'Choose the buyer' }]}>
              <Select placeholder="Choose buyer" showSearch={{ optionFilterProp: 'label' }} options={buyers.map((b) => ({ value: b.id, label: b.name }))} />
            </Form.Item>
            <Form.Item label="Invoice / reference number" name="invoiceNo" rules={[{ required: true, message: 'Enter the invoice number' }]}>
              <Input placeholder="e.g. MR/A/26-27/0429" />
            </Form.Item>
            <Form.Item label="Sale date" name="date" rules={[{ required: true }]}>
              <DatePicker format="DD MMM YYYY" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Factory" name="factoryId" rules={[{ required: true, message: 'Choose the factory' }]} extra="The factory the material was dispatched from">
              <Select placeholder="Choose factory" options={factories.map((f) => ({ value: f.id, label: `${f.name} · ${f.city}` }))} />
            </Form.Item>
          </div>
        </div>
        <div className="surface" style={{ padding: 24, marginTop: 16 }}>
          <div className="strong" style={{ fontSize: 16, marginBottom: 16 }}>
            Product and price
          </div>
          <Form.Item label="Product" name="product" rules={[{ required: true, message: 'Choose the product' }]}>
            <Select placeholder="Choose product" options={outputs.map((o) => ({ value: o.id, label: `${o.name} — ${o.description}` }))} />
          </Form.Item>
          <div className="grid grid-2" style={{ columnGap: 16, rowGap: 0 }}>
            <Form.Item
              label="Quantity"
              name="qtyKg"
              rules={[{ required: true, message: 'Enter the weight' }]}
              validateStatus={over ? 'error' : undefined}
              help={over ? `Only ${formatKg(available!)} available at this factory` : undefined}
            >
              <InputNumber<number> style={{ width: '100%' }} min={1} suffix="kg" placeholder="e.g. 4,250" formatter={(v) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => Number((v ?? '').replace(/,/g, ''))} />
            </Form.Item>
            <Form.Item label="Selling rate per kg" name="rate" rules={[{ required: true, message: 'Enter the rate' }]} extra="Price before GST">
              <InputNumber style={{ width: '100%' }} min={0} step={0.1} precision={2} prefix="₹" suffix="/kg" placeholder="e.g. 31.20" />
            </Form.Item>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <Button size="large" icon={<ArrowLeftOutlined />} onClick={back}>
            Back
          </Button>
          <Button size="large" type="primary" htmlType="submit" icon={<CheckOutlined />} disabled={over} style={{ minWidth: 220 }}>
            Save sale
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
          <span className="strong">Total sale value</span>
          <b className="num strong">{formatINR(qty * rate)}</b>
        </div>
        <div style={{ background: '#f7f8fa', borderRadius: 12, padding: 14, marginTop: 14 }}>
          <div className="faint" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Available to sell
          </div>
          {available !== null ? (
            <div style={{ marginTop: 6 }}>
              <div className="num strong" style={{ fontSize: 20, color: over ? '#D4380D' : undefined }}>
                {formatKg(available)}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                {outputName(product!)} at {factoryById(fid).name} · after this sale {formatKg(available - qty)}
              </div>
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
              Choose the factory and product to see what's available.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NewSale() {
  const navigate = useNavigate()
  const [step, setStep] = useState<IntakeStep>('choose')
  const nextId = `SAL-2026-0${Number(sales[sales.length - 1].id.slice(-3)) + 1}`

  return (
    <div className="page">
      {step !== 'done' && (
        <PageHeader
          eyebrow="Sales"
          title={step === 'review' ? 'Check the invoice details' : 'Record a sale'}
          subtitle={
            step === 'review'
              ? 'Compare each value with the invoice on the left before confirming.'
              : 'Add a sale of rubber, steel or other output. It will be taken out of that factory’s stock.'
          }
          extra={
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sales')}>
              Back to sales
            </Button>
          }
        />
      )}
      <DocumentIntake
        kind="sale"
        sampleDoc={sampleSaleDoc}
        onStepChange={setStep}
        onDiscard={() => navigate('/sales')}
        renderManual={(onSaved, back) => <ManualSaleForm onSaved={onSaved} back={back} />}
        renderDone={(r, again) => {
          const f = factoryById(r.locationId)
          const product = r.item as OutputId
          const now = outputStockLine(f.id, product).current
          return (
            <SavedResult
              title="Sale saved"
              subtitle={
                <>
                  {formatKg(r.qtyKg)} of {outputName(product).toLowerCase()} sold from <b>{f.name}</b>.
                </>
              }
              refId={nextId}
              lines={[
                ['Buyer', buyerById(r.partyId)?.name ?? '—'],
                ['Invoice', `${r.invoiceNo} · ${formatDate(r.date)}`],
                ['Quantity × rate', `${formatKg(r.qtyKg)} × ₹${r.rate.toFixed(2)}`],
                ['Sale value (before GST)', formatINR(r.qtyKg * r.rate)],
              ]}
              effects={[
                <>
                  {f.name} · {outputName(product)}: {formatKg(now)} → <b>{formatKg(now - r.qtyKg)}</b>
                </>,
                <>Sales revenue increased by {formatINR(r.qtyKg * r.rate)}</>,
                <>Invoice stored with the record for future reference</>,
              ]}
              actions={[
                { label: 'Record another sale', onClick: again, primary: true },
                { label: `View ${f.name}`, onClick: () => navigate(`/factories/${f.id}`) },
                { label: 'All sales', onClick: () => navigate('/sales') },
              ]}
            />
          )
        }}
      />
    </div>
  )
}
