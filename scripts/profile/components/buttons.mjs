// Link buttons (transparent canvas, sized to their measured label). The primary one uses the
// portfolio's "Contáctame" gradient; the rest are navy glass buttons.

import { C } from '../core/tokens.mjs'
import { measure } from '../core/fonts.mjs'
import { brand, glyph } from '../core/icons.mjs'
import { shineSweep } from '../core/motion.mjs'
import { createDoc, g, h, linearGradient, txt } from '../core/svg.mjs'

const H = 44

const BUTTONS = [
  { file: 'email', label: 'Get in touch', glyph: 'mail', primary: true, desc: 'Email José Rodriguez' },
  { file: 'linkedin', label: 'LinkedIn', brand: 'linkedin', desc: 'Connect with José Rodriguez on LinkedIn' },
  { file: 'portfolio', label: 'Portfolio', glyph: 'globe', glyphColor: C.cyan, desc: 'Visit jose-rodriguez.dev' },
  { file: 'projects', label: 'View case studies', glyph: 'arrow-up-right', trailing: true, desc: 'Case studies on jose-rodriguez.dev' },
  { file: 'credly', label: 'All badges on Credly', glyph: 'award', glyphColor: '#ff7a1a', trailingGlyph: 'arrow-up-right', desc: 'All badges on Credly' },
  { file: 'hackerrank', label: 'HackerRank', brand: 'hackerrank', desc: 'HackerRank profile' },
]

async function button(b) {
  const size = 14.5
  const face = 'semibold'
  const icon = 17
  const padX = 18
  const textW = measure(b.label, face, size)
  const lead = b.trailing ? 0 : icon + 9
  const trail = b.trailing || b.trailingGlyph ? icon + 6 : 0
  const width = Math.ceil(padX * 2 + lead + textW + trail)
  const doc = createDoc({ width, height: H, title: b.label, desc: b.desc })
  const out = []
  if (b.primary) {
    const fill = linearGradient(doc, { stops: [[0, C.blue], [1, C.cyan]], x1: 0, y1: 0, x2: 1, y2: 1 })
    out.push(h('rect', { x: 0, y: 0, width, height: H, rx: 12, fill: `url(#${fill})` }))
    out.push(h('rect', { x: 0.5, y: 0.5, width: width - 1, height: H - 1, rx: 11.5, stroke: '#fff', 'stroke-opacity': 0.25 }))
    out.push(shineSweep(doc, { x: 0, y: 0, w: width, h: H, r: 12, dur: 6, delay: 1, opacity: 0.35, band: 46 }))
  } else {
    out.push(h('rect', { x: 0.5, y: 0.5, width: width - 1, height: H - 1, rx: 11.5, fill: C.surface2, stroke: C.borderHi }))
    const edge = linearGradient(doc, { stops: [[0, '#fff', 0], [0.5, '#fff', 0.18], [1, '#fff', 0]], units: 'userSpaceOnUse', x1: 0, x2: width, y1: 0, y2: 0 })
    out.push(h('path', { d: `M12 0.5H${width - 12}`, stroke: `url(#${edge})` }))
  }
  const ink = b.primary ? C.bg : C.text
  const iy = (H - icon) / 2
  let x = padX
  if (!b.trailing) {
    if (b.brand) out.push(brand(b.brand, { x, y: iy, size: icon }))
    else out.push(glyph(b.glyph, { x, y: iy, size: icon, color: b.primary ? C.bg : (b.glyphColor ?? C.text2), width: 1.9 }))
    x += icon + 9
  }
  out.push(txt(doc, { x, y: H / 2 + 5, text: b.label, face, size, fill: ink }))
  x += textW + 6
  if (b.trailing) out.push(glyph(b.glyph, { x, y: iy, size: icon, color: C.cyan, width: 1.9 }))
  if (b.trailingGlyph) out.push(glyph(b.trailingGlyph, { x, y: iy, size: icon, color: C.muted, width: 1.9 }))
  return { path: `assets/buttons/${b.file}.svg`, svg: await doc.render(g({}, out)) }
}

export default {
  name: 'buttons',
  async render() {
    return Promise.all(BUTTONS.map(button))
  },
}
