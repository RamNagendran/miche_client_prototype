import dayjs from 'dayjs'

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const inr2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** ₹12,45,000 */
export const formatINR = (value: number, decimals = false) =>
  `₹${(decimals ? inr2 : inr).format(Math.round(value * (decimals ? 100 : 1)) / (decimals ? 100 : 1))}`

/** ₹12.45 L / ₹1.24 Cr for headline numbers */
export const formatINRShort = (value: number) => {
  const abs = Math.abs(value)
  const sign = value < 0 ? '−' : ''
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)} L`
  return `${sign}${formatINR(abs)}`
}

/** 12,400 kg */
export const formatKg = (kg: number) => `${inr.format(Math.round(kg))} kg`

export const formatNumber = (n: number) => inr.format(Math.round(n))

/** 12.4 t */
export const formatTonnes = (kg: number) => {
  const t = kg / 1000
  return `${t >= 100 ? t.toFixed(0) : t.toFixed(1)} t`
}

export const formatPercent = (value: number, digits = 1) => `${value.toFixed(digits)}%`

export const formatDate = (iso: string) => dayjs(iso).format('DD MMM YYYY')
export const formatDateShort = (iso: string) => dayjs(iso).format('DD MMM')
export const formatRate = (rate: number) => `₹${rate.toFixed(2)}/kg`
