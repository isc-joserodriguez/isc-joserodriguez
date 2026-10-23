// Minimal SVG document builder: markup helpers, per-document CSS/defs registry, and text that
// records its glyphs so fonts.mjs can embed exactly the characters each SVG draws.

import { fontFaceCss, measure } from './fonts.mjs'

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Round coordinates so output stays small and byte-stable.
export const n = (x) => {
  const v = Math.round(Number(x) * 100) / 100
  return Object.is(v, -0) ? 0 : v
}

const NUMERIC_ATTRS = /^(x|y|x1|x2|y1|y2|cx|cy|r|rx|ry|width|height|stroke-width|opacity|fill-opacity|stroke-opacity|offset|font-size|stop-opacity)$/

// h('rect', { x: 1 }, ...children): children are raw markup (escape text yourself, or use txt()).
export function h(tag, attrs = {}, ...children) {
  let a = ''
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue
    const val = typeof v === 'number' && NUMERIC_ATTRS.test(k) ? n(v) : v
    a += ` ${k}="${esc(val)}"`
  }
  const inner = children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false && c !== '').join('')
  return inner ? `<${tag}${a}>${inner}</${tag}>` : `<${tag}${a}/>`
}

export const g = (attrs, ...children) => h('g', attrs, ...children)

export function createDoc({ width, height, title, desc }) {
  const css = new Map()
  const defs = []
  const usage = new Map()
  let ids = 0
  const doc = {
    width,
    height,
    uid: (prefix = 'u') => `${prefix}${(++ids).toString(36)}`,
    css: (key, rule) => {
      if (!css.has(key)) css.set(key, rule)
    },
    defs: (markup) => defs.push(markup),
    use: (face, text) => {
      if (!usage.has(face)) usage.set(face, new Set())
      const set = usage.get(face)
      for (const ch of String(text)) set.add(ch)
    },
    async render(body) {
      const fonts = await fontFaceCss(usage)
      const style =
        fonts +
        [...css.values()].join('') +
        // Ambient motion is decoration: honour the visitor's reduced-motion setting.
        '@media (prefers-reduced-motion:reduce){*{animation:none!important}}'
      return (
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc" fill="none">` +
        `<title id="title">${esc(title)}</title><desc id="desc">${esc(desc)}</desc>` +
        `<defs><style>${style}</style>${defs.join('')}</defs>` +
        body +
        '</svg>\n'
      )
    },
  }
  return doc
}

// Text in one face. Returns markup; `width` of the run is available through measure().
export function txt(doc, { x, y, text, face = 'sans', size = 14, fill, anchor, tracking = 0, tnum = false, opacity, cls, style, ...rest }) {
  const str = String(text)
  doc.use(face, str)
  const styles = []
  if (tnum) styles.push('font-variant-numeric:tabular-nums')
  if (style) styles.push(style)
  return h(
    'text',
    {
      x,
      y,
      class: cls ? `f-${face} ${cls}` : `f-${face}`,
      'font-size': size,
      fill,
      'text-anchor': anchor,
      'letter-spacing': tracking ? `${n(tracking)}em` : undefined,
      opacity,
      style: styles.length ? styles.join(';') : undefined,
      // SVG collapses leading/trailing/double spaces; keep them when the layout measured them.
      'xml:space': /^\s|\s$|\s\s/.test(str) ? 'preserve' : undefined,
      ...rest,
    },
    esc(str),
  )
}

// One line mixing faces/colours: parts = [{ text, face, fill, size? }]. Anchors handled by
// measuring the whole run, so `anchor: 'middle'` centres the combined line.
export function rich(doc, { x, y, parts, size = 14, anchor = 'start', tracking = 0, tnum = false }) {
  const total = parts.reduce((w, p) => w + measure(p.text, p.face ?? 'sans', p.size ?? size, { tracking, tnum }), 0)
  let cx = anchor === 'middle' ? x - total / 2 : anchor === 'end' ? x - total : x
  const out = []
  for (const p of parts) {
    const face = p.face ?? 'sans'
    const s = p.size ?? size
    out.push(txt(doc, { x: cx, y, text: p.text, face, size: s, fill: p.fill, tracking, tnum }))
    cx += measure(p.text, face, s, { tracking, tnum })
  }
  return { markup: out.join(''), width: total }
}

export function linearGradient(doc, { id, stops, x1 = 0, y1 = 0, x2 = 1, y2 = 0, units }) {
  const gid = id ?? doc.uid('lg')
  doc.defs(
    h(
      'linearGradient',
      { id: gid, x1, y1, x2, y2, gradientUnits: units },
      stops.map(([offset, color, opacity]) => h('stop', { offset, 'stop-color': color, 'stop-opacity': opacity })),
    ),
  )
  return gid
}

export function radialGradient(doc, { id, stops, cx = 0.5, cy = 0.5, r = 0.5, fx, fy, units }) {
  const gid = id ?? doc.uid('rg')
  doc.defs(
    h(
      'radialGradient',
      { id: gid, cx, cy, r, fx, fy, gradientUnits: units },
      stops.map(([offset, color, opacity]) => h('stop', { offset, 'stop-color': color, 'stop-opacity': opacity })),
    ),
  )
  return gid
}

// Rounded-rect path (for borders, beams and clip paths that need a single <path>).
export function roundedRectPath(x, y, w, hgt, r) {
  const rr = Math.min(r, w / 2, hgt / 2)
  return (
    `M${n(x + rr)} ${n(y)}H${n(x + w - rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(x + w)} ${n(y + rr)}` +
    `V${n(y + hgt - rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(x + w - rr)} ${n(y + hgt)}` +
    `H${n(x + rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(x)} ${n(y + hgt - rr)}` +
    `V${n(y + rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(x + rr)} ${n(y)}Z`
  )
}

export function dataUri(mime, base64) {
  return `data:${mime};base64,${base64}`
}
