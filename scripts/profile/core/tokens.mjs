// Design tokens, lifted from jose-rodriguez.dev so the profile and the portfolio read as one brand.

export const W = 860 // GitHub's README column is ~830–846px: panels render close to 1:1

export const C = {
  page: '#0d1117', // GitHub dark page, behind the panels
  bg: '#020817', // portfolio background (hsl 222 84% 5%)
  surface: '#070f20',
  surface2: '#0c1629',
  surface3: '#121e36',
  border: '#1e293b', // portfolio --border
  borderHi: '#2a3a57',
  guide: '#16233b',
  text: '#f8fafc',
  text2: '#cbd5e1',
  muted: '#94a3b8', // portfolio --muted-foreground
  faint: '#7686a0', // never darker than this for text
  blue: '#5593f7', // portfolio gradient start
  violet: '#a85dee', // portfolio gradient end
  cyan: '#00dcf5', // portfolio --vivid
  green: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
}

// Light-mode inks for the transparent section headers.
export const LIGHT = {
  text: '#0f172a',
  muted: '#475569',
  faint: '#64748b',
  border: '#cbd5e1',
  blue: '#2563eb',
  violet: '#7c3aed',
  cyan: '#0891b2',
}

export const GRAD = {
  brand: [C.blue, C.violet], // headline gradient (135deg on the portfolio)
  action: [C.blue, C.cyan], // primary button gradient
  ai: [C.blue, C.cyan, C.violet],
}

// Contribution heat scale: empty → blue → violet → cyan peak.
export const HEAT = ['#0f1a2e', '#1d3a74', '#3567c9', '#5593f7', '#a85dee', '#00dcf5']

export const PAD = 32
export const RADIUS = 18
