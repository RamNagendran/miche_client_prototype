import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, DatePicker, Input, InputNumber, Steps } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, CheckOutlined, CheckCircleFilled } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { PageHeader } from '../../components/ui'
import SavedResult from '../../components/SavedResult'
import { factories, production, TODAY } from '../../data/seed'
import { factoryById, materialName, outputStockLine, rawStockLine, warehouseById } from '../../data/selectors'
import { seriesColors } from '../../theme/theme'
import { formatDate, formatKg } from '../../utils/format'
import type { MaterialId, OutputId } from '../../data/types'

const kgInput = {
  formatter: (v: number | string | undefined) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
  parser: (v: string | undefined) => Number((v ?? '').replace(/,/g, '')),
}

export default function NewProduction() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [factoryId, setFactoryId] = useState<string>()
  const [date, setDate] = useState<Dayjs>(dayjs(TODAY))
  const [source, setSource] = useState<{ wid: string; material: MaterialId }>()
  const [inputKg, setInputKg] = useState<number | null>(null)
  const [out, setOut] = useState<Record<OutputId, number | null>>({ rubber: null, steel: null, other: null })
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  const factory = factoryId ? factoryById(factoryId) : undefined
  const available = source ? rawStockLine(source.wid, source.material).current : 0
  const input = inputKg ?? 0
  const outTotal = (out.rubber ?? 0) + (out.steel ?? 0) + (out.other ?? 0)
  const overInput = outTotal > input
  const overStock = input > available
  const nextId = `PRD-2026-0${Number(production[production.length - 1].id.slice(-3)) + 1}`

  const canNext = [!!factoryId, !!source && input > 0 && !overStock, (out.rubber ?? 0) > 0 && !overInput, true][step]

  const go = (n: number) => {
    setStep(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (saved && factory && source) {
    return (
      <div className="page">
        <SavedResult
          title="Production saved"
          subtitle={
            <>
              {factory.name} used {formatKg(input)} of {materialName(source.material).toLowerCase()} on {formatDate(date.format('YYYY-MM-DD'))}.
            </>
          }
          refId={nextId}
          lines={[
            ['Raw material used', `${formatKg(input)} · ${materialName(source.material)} from ${warehouseById(source.wid).name}`],
            ['Rubber produced', formatKg(out.rubber ?? 0)],
            ['Steel produced', formatKg(out.steel ?? 0)],
            ...((out.other ?? 0) > 0 ? ([['Other produced', formatKg(out.other ?? 0)]] as [string, string][]) : []),
            ['Total output', formatKg(outTotal)],
          ]}
          effects={[
            <>
              {warehouseById(source.wid).name} · {materialName(source.material)}: {formatKg(available)} → <b>{formatKg(available - input)}</b>
            </>,
            <>
              {factory.name} rubber stock: {formatKg(outputStockLine(factory.id, 'rubber').current)} → <b>{formatKg(outputStockLine(factory.id, 'rubber').current + (out.rubber ?? 0))}</b>
            </>,
            <>
              {factory.name} steel stock: {formatKg(outputStockLine(factory.id, 'steel').current)} → <b>{formatKg(outputStockLine(factory.id, 'steel').current + (out.steel ?? 0))}</b>
            </>,
          ]}
          actions={[
            {
              label: 'Record another',
              primary: true,
              onClick: () => {
                setSaved(false)
                setStep(0)
                setSource(undefined)
                setInputKg(null)
                setOut({ rubber: null, steel: null, other: null })
              },
            },
            { label: `View ${factory.name}`, onClick: () => navigate(`/factories/${factory.id}`) },
            { label: 'All production', onClick: () => navigate('/production') },
          ]}
        />
      </div>
    )
  }

  return (
    <div className="page" style={{ maxWidth: 1080 }}>
      <PageHeader
        eyebrow="Production"
        title="Record production"
        subtitle="Enter what went into the factory and what came out. Takes about a minute."
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/production')}>
            Back to production
          </Button>
        }
      />

      <div className="surface" style={{ padding: '16px 24px', marginBottom: 20 }}>
        <Steps
          current={step}
          size="small"
          items={[
            { title: 'Factory & date', content: factory?.name },
            { title: 'Raw material used', content: source && input ? formatKg(input) : undefined },
            { title: 'What was produced', content: outTotal ? formatKg(outTotal) : undefined },
            { title: 'Check & save' },
          ]}
        />
      </div>

      <div className="surface fade-in" key={step} style={{ padding: 28 }}>
        {step === 0 && (
          <>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>Which factory?</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Choose the factory where the tyres were processed.
            </p>
            <div className="grid grid-3" style={{ marginTop: 16 }}>
              {factories.map((f) => (
                <div
                  key={f.id}
                  className="choice"
                  style={{ padding: 20, borderColor: factoryId === f.id ? '#D82E54' : undefined, background: factoryId === f.id ? '#fffafb' : undefined }}
                  onClick={() => {
                    setFactoryId(f.id)
                    setSource(undefined)
                  }}
                >
                  {factoryId === f.id && <CheckCircleFilled style={{ position: 'absolute', top: 16, right: 16, color: '#D82E54', fontSize: 20 }} />}
                  <div className="loc-badge fa" style={{ marginBottom: 14 }}>
                    {f.code}
                  </div>
                  <h3 style={{ fontSize: 16 }}>{f.name}</h3>
                  <p style={{ fontSize: 13 }}>
                    {f.city} · gets material from {f.suppliedBy.map((w) => warehouseById(w).name).join(', ')}
                  </p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, maxWidth: 320 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Production date</div>
              <DatePicker value={date} onChange={(d) => d && setDate(d)} format="DD MMM YYYY" size="large" style={{ width: '100%' }} allowClear={false} />
            </div>
          </>
        )}

        {step === 1 && factory && (
          <>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>What raw material went in?</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Pick the warehouse and tyre type it came from. This amount will be taken out of that warehouse's stock.
            </p>
            {factory.suppliedBy.map((wid) => {
              const w = warehouseById(wid)
              return (
                <div key={wid} style={{ marginTop: 18 }}>
                  <div className="faint" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                    From {w.name} · {w.city}
                  </div>
                  <div className="grid grid-3">
                    {w.materials.map((m) => {
                      const avail = rawStockLine(wid, m).current
                      const sel = source?.wid === wid && source.material === m
                      return (
                        <div
                          key={m}
                          className="choice"
                          style={{ padding: 18, borderColor: sel ? '#D82E54' : undefined, background: sel ? '#fffafb' : undefined }}
                          onClick={() => setSource({ wid, material: m })}
                        >
                          {sel && <CheckCircleFilled style={{ position: 'absolute', top: 14, right: 14, color: '#D82E54', fontSize: 18 }} />}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                            <span className="legend-dot" style={{ background: seriesColors[m] }} />
                            {materialName(m)}
                          </div>
                          <div className="num strong" style={{ fontSize: 20, marginTop: 8 }}>
                            {formatKg(avail)}
                          </div>
                          <div className="faint" style={{ fontSize: 12.5 }}>
                            available
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {source && (
              <div className="fade-in" style={{ marginTop: 26, display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'end' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Quantity used</div>
                  <InputNumber<number>
                    size="large"
                    value={inputKg}
                    onChange={setInputKg}
                    style={{ width: '100%' }}
                    suffix="kg"
                    min={0}
                    placeholder="e.g. 5,000"
                    status={overStock ? 'error' : undefined}
                    {...kgInput}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span className="muted">
                      Using <b>{formatKg(input)}</b> of {formatKg(available)} available
                    </span>
                    <span className="muted">Left after: {formatKg(Math.max(available - input, 0))}</span>
                  </div>
                  <div style={{ height: 12, borderRadius: 99, background: '#eef0f3', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (input / (available || 1)) * 100)}%`, height: '100%', background: overStock ? '#D4380D' : seriesColors[source.material], transition: 'width .3s' }} />
                  </div>
                </div>
              </div>
            )}
            {overStock && (
              <Alert
                type="error"
                showIcon
                style={{ marginTop: 16 }}
                title={`Only ${formatKg(available)} of ${materialName(source!.material).toLowerCase()} is in ${warehouseById(source!.wid).name}.`}
                description="Check the weight, or record the missing purchase first."
              />
            )}
          </>
        )}

        {step === 2 && source && (
          <>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>What came out?</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              From {formatKg(input)} of {materialName(source.material).toLowerCase()}. Each output is kept as its own stock.
            </p>
            <div className="grid grid-3" style={{ marginTop: 18 }}>
              {(['rubber', 'steel', 'other'] as OutputId[]).map((o) => (
                <div key={o} style={{ border: '1.5px solid #e8eaee', borderRadius: 14, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15 }}>
                    <span className="legend-dot" style={{ background: seriesColors[o] }} />
                    {o === 'rubber' ? 'Rubber' : o === 'steel' ? 'Steel' : 'Other'}
                    {o === 'other' && <span className="faint" style={{ fontWeight: 600, fontSize: 12.5 }}>(optional)</span>}
                  </div>
                  <InputNumber<number>
                    size="large"
                    value={out[o]}
                    onChange={(v) => setOut((s) => ({ ...s, [o]: v }))}
                    style={{ width: '100%', marginTop: 10 }}
                    suffix="kg"
                    min={0}
                    placeholder="0"
                    {...kgInput}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 26 }}>
              <div className="summary-line" style={{ fontSize: 15, background: '#f7f8fa', borderRadius: 12, padding: '14px 18px' }}>
                <span style={{ fontWeight: 800 }}>Total output</span>
                <span className="num strong">{formatKg(outTotal)}</span>
              </div>
              {overInput && (
                <Alert
                  type="error"
                  showIcon
                  style={{ marginTop: 14 }}
                  title="The outputs add up to more than the input."
                  description={`${formatKg(outTotal)} came out but only ${formatKg(input)} went in. Please check the weights.`}
                />
              )}
            </div>
          </>
        )}

        {step === 3 && factory && source && (
          <>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>Check and save</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Here's what will change when you save.
            </p>
            <div className="grid grid-2" style={{ marginTop: 16, gap: 20 }}>
              <div style={{ background: '#f7f8fa', borderRadius: 14, padding: '6px 18px' }}>
                {(
                  [
                    ['Factory', factory.name],
                    ['Date', formatDate(date.format('YYYY-MM-DD'))],
                    ['Raw material', `${materialName(source.material)} from ${warehouseById(source.wid).name}`],
                    ['Quantity used', formatKg(input)],
                    ['Rubber', formatKg(out.rubber ?? 0)],
                    ['Steel', formatKg(out.steel ?? 0)],
                    ['Other', formatKg(out.other ?? 0)],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div className="summary-line" key={k}>
                    <span className="muted">{k}</span>
                    <b className="num">{v}</b>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ border: '1.5px solid #f5c8d3', background: '#fff7f9', borderRadius: 14, padding: 16 }}>
                  <div style={{ fontWeight: 800, color: '#b8213f' }}>Taken out of stock</div>
                  <div style={{ marginTop: 6 }}>
                    {warehouseById(source.wid).name} · {materialName(source.material)}
                  </div>
                  <div className="num strong" style={{ fontSize: 18 }}>
                    {formatKg(available)} → {formatKg(available - input)}
                  </div>
                </div>
                <div style={{ border: '1.5px solid #bfe5d3', background: '#f3fbf7', borderRadius: 14, padding: 16, marginTop: 12 }}>
                  <div style={{ fontWeight: 800, color: '#137a52' }}>Added to {factory.name} output stock</div>
                  {(['rubber', 'steel', 'other'] as OutputId[])
                    .filter((o) => (out[o] ?? 0) > 0)
                    .map((o) => (
                      <div key={o} className="num" style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{o === 'rubber' ? 'Rubber' : o === 'steel' ? 'Steel' : 'Other'}</span>
                        <b>
                          {formatKg(outputStockLine(factory.id, o).current)} → {formatKg(outputStockLine(factory.id, o).current + (out[o] ?? 0))}
                        </b>
                      </div>
                    ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Notes (optional)</div>
                  <Input.TextArea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Night shift, machine 2" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <Button size="large" icon={<ArrowLeftOutlined />} disabled={step === 0} onClick={() => go(step - 1)}>
          Back
        </Button>
        {step < 3 ? (
          <Button size="large" type="primary" disabled={!canNext} onClick={() => go(step + 1)} style={{ minWidth: 180 }}>
            Continue <ArrowRightOutlined />
          </Button>
        ) : (
          <Button size="large" type="primary" icon={<CheckOutlined />} onClick={() => setSaved(true)} style={{ minWidth: 200 }}>
            Save production
          </Button>
        )}
      </div>
    </div>
  )
}
