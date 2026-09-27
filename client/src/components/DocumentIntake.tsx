import { useEffect, useState, type ReactNode } from 'react'
import { Button, Steps, Upload } from 'antd'
import {
  CheckCircleFilled,
  CloudUploadOutlined,
  EditOutlined,
  FilePdfOutlined,
  LoadingOutlined,
  ThunderboltFilled,
  CameraOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import InvoiceDocument from './InvoiceDocument'
import ExtractionReview, { type ReviewResult } from './ExtractionReview'
import type { ExtractedDoc } from '../data/extraction'

export type IntakeStep = 'choose' | 'upload' | 'reading' | 'review' | 'manual' | 'done'

const readingStages = ['Opening the PDF', 'Reading the text and numbers', 'Finding supplier, quantity, rate and totals', 'Running safety checks']

function Reading({ doc, onDone }: { doc: ExtractedDoc; onDone: () => void }) {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    if (stage >= readingStages.length) {
      const t = setTimeout(onDone, 450)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setStage((s) => s + 1), 850)
    return () => clearTimeout(t)
  }, [stage, onDone])

  return (
    <div className="grid fade-in" style={{ gridTemplateColumns: '1.05fr 1fr', gap: 24, alignItems: 'center' }}>
      <div style={{ background: '#e9ebef', padding: 24, borderRadius: 14, position: 'relative', overflow: 'hidden', maxHeight: 620 }}>
        <InvoiceDocument doc={doc} scanning />
      </div>
      <div className="surface" style={{ padding: 32 }}>
        <span className="kpi-icon" style={{ background: '#f4efff', color: '#6941c6', width: 54, height: 54, fontSize: 24, borderRadius: 14 }}>
          <ThunderboltFilled />
        </span>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '18px 0 6px' }}>Reading your bill…</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 24 }}>
          This usually takes a few seconds. You'll check everything before it's saved.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {readingStages.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: i > stage ? 0.4 : 1, transition: 'opacity .3s' }}>
              {i < stage ? (
                <CheckCircleFilled style={{ color: '#1f9d6b', fontSize: 20 }} />
              ) : i === stage ? (
                <LoadingOutlined style={{ color: '#D82E54', fontSize: 20 }} />
              ) : (
                <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #d5d9e0', display: 'inline-block' }} />
              )}
              <span style={{ fontWeight: 700, fontSize: 14.5 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DocumentIntake({
  kind,
  sampleDoc,
  initialDoc,
  renderManual,
  renderDone,
  onStepChange,
  onDiscard,
}: {
  kind: 'purchase' | 'sale'
  sampleDoc: ExtractedDoc
  initialDoc?: ExtractedDoc
  renderManual: (onSaved: (r: ReviewResult) => void, back: () => void) => ReactNode
  renderDone: (r: ReviewResult, again: () => void) => ReactNode
  onStepChange?: (s: IntakeStep) => void
  onDiscard: () => void
}) {
  const [step, setStepRaw] = useState<IntakeStep>(initialDoc ? 'review' : 'choose')
  const [doc, setDoc] = useState<ExtractedDoc>(initialDoc ?? sampleDoc)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const setStep = (s: IntakeStep) => {
    setStepRaw(s)
    onStepChange?.(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const label = kind === 'purchase' ? 'purchase bill' : 'sales invoice'

  const current = step === 'choose' || step === 'upload' || step === 'manual' ? 0 : step === 'reading' || step === 'review' ? 1 : 2

  return (
    <div>
      {step !== 'done' && (
        <div className="surface" style={{ padding: '16px 24px', marginBottom: 20 }}>
          <Steps
            current={current}
            size="small"
            items={[
              { title: step === 'manual' ? 'Type in details' : `Add the ${label}` },
              { title: 'Check what we read', content: 'Nothing saved yet' },
              { title: 'Saved', content: kind === 'purchase' ? 'Stock updated' : 'Stock & sales updated' },
            ]}
          />
        </div>
      )}

      {step === 'choose' && (
        <div className="fade-in">
          <div className="grid grid-2" style={{ gap: 20 }}>
            <div className="choice" onClick={() => setStep('upload')}>
              <span className="pill" style={{ position: 'absolute', top: 20, right: 20, background: '#e8f6ef', color: '#1f9d6b' }}>
                Recommended · fastest
              </span>
              <div className="choice-icon" style={{ background: '#fdeef2', color: '#D82E54' }}>
                <CloudUploadOutlined />
              </div>
              <h3>Upload the {label}</h3>
              <p>Upload a PDF or a clear photo. We read the {kind === 'purchase' ? 'supplier' : 'buyer'}, quantity, rate and totals for you, check the maths, and you confirm.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <span className="pill">
                  <FilePdfOutlined /> PDF
                </span>
                <span className="pill">
                  <CameraOutlined /> Photo / scan
                </span>
                <span className="pill">Any bill format</span>
              </div>
            </div>
            <div className="choice" onClick={() => setStep('manual')}>
              <div className="choice-icon" style={{ background: '#eef4fb', color: '#2F6FEB' }}>
                <EditOutlined />
              </div>
              <h3>Type in the details</h3>
              <p>No bill yet, or a handwritten slip? Fill a short form. The total is worked out for you as you type.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <span className="pill">About 1 minute</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'upload' && (
        <div className="fade-in" style={{ maxWidth: 820, margin: '0 auto' }}>
          <div className="dropzone">
            <Upload.Dragger
              accept=".pdf,.jpg,.jpeg,.png"
              showUploadList={false}
              beforeUpload={() => {
                setDoc(sampleDoc)
                setStep('reading')
                return false
              }}
              style={{ padding: '44px 20px' }}
            >
              <div style={{ fontSize: 44, color: '#D82E54' }}>
                <CloudUploadOutlined />
              </div>
              <div style={{ fontSize: 19, fontWeight: 800, marginTop: 10, color: '#191919' }}>Drop the {label} here</div>
              <div className="muted" style={{ marginTop: 6, fontSize: 14.5 }}>
                or <a style={{ fontWeight: 700 }}>choose a file</a> from your computer · PDF, JPG or PNG up to 20 MB
              </div>
            </Upload.Dragger>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
            <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => setStep('choose')}>
              Back
            </Button>
            <Button
              onClick={() => {
                setDoc(sampleDoc)
                setStep('reading')
              }}
            >
              No bill handy? Try a sample {label}
            </Button>
          </div>
          <div className="grid grid-3" style={{ marginTop: 28 }}>
            {[
              ['Works with any format', 'Different suppliers, different layouts — no setup needed.'],
              ['Checks the maths', 'Quantity × rate, GST and totals are re-calculated every time.'],
              ['You stay in control', 'Nothing is saved until a person confirms it.'],
            ].map(([t, d]) => (
              <div key={t} style={{ display: 'flex', gap: 10 }}>
                <CheckCircleFilled style={{ color: '#1f9d6b', marginTop: 3 }} />
                <div>
                  <div style={{ fontWeight: 800 }}>{t}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {d}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'reading' && <Reading doc={doc} onDone={() => setStep('review')} />}

      {step === 'review' && (
        <ExtractionReview
          doc={doc}
          onDiscard={onDiscard}
          onConfirm={(r) => {
            setResult(r)
            setStep('done')
          }}
        />
      )}

      {step === 'manual' &&
        renderManual(
          (r) => {
            setResult(r)
            setStep('done')
          },
          () => setStep('choose'),
        )}

      {step === 'done' && result && renderDone(result, () => setStep('choose'))}
    </div>
  )
}
