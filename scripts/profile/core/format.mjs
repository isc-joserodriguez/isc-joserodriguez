// Copy helpers: numbers, plurals and dates in the profile's timezone.

export const TZ = 'America/Mazatlan' // Tepic, Nayarit: Pacific zone, UTC−7 all year
export const MINUS = '−'

export const int = (v) => (Number.isFinite(v) ? Math.round(v).toLocaleString('en-US') : '—')

// 1234 → "1.2K", 12696 → "12.7K", 123456 → "123K", 999 → "999".
export function compact(v) {
  if (!Number.isFinite(v)) return '—'
  const abs = Math.abs(v)
  if (abs < 1000) return String(Math.round(v))
  if (abs < 100_000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}K`
  if (abs < 1_000_000) return `${Math.round(v / 1000)}K`
  return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
}

export const plural = (count, one, many = `${one}s`) => (count === 1 ? one : many)
export const quantity = (count, one, many) => `${int(count)} ${plural(count, one, many)}`

// +12% / −8%; null when it rounds to zero or is unknown.
export function signedPercent(ratio) {
  if (!Number.isFinite(ratio)) return null
  const p = Math.round(ratio * 100)
  if (p === 0) return null
  return `${p > 0 ? '+' : MINUS}${Math.abs(p).toLocaleString('en-US')}%`
}

const parse = (d) => (d instanceof Date ? d : new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00Z` : d))

export function dateIn(d, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!d) return '—'
  const date = parse(d)
  if (Number.isNaN(date.getTime())) return '—'
  // Plain YYYY-MM-DD dates are calendar days already: format them in UTC so they never shift.
  const timeZone = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? 'UTC' : TZ
  return new Intl.DateTimeFormat('en-US', { timeZone, ...opts }).format(date)
}

export const monthShort = (d) => dateIn(d, { month: 'short' })
export const monthYear = (d) => dateIn(d, { month: 'short', year: 'numeric' })

export function dateRange(a, b) {
  if (!a || !b) return '—'
  if (a === b) return dateIn(a)
  const ya = parse(a).getUTCFullYear()
  const yb = parse(b).getUTCFullYear()
  return ya === yb ? `${dateIn(a, { month: 'short', day: 'numeric' })} – ${dateIn(b)}` : `${dateIn(a)} – ${dateIn(b)}`
}

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
