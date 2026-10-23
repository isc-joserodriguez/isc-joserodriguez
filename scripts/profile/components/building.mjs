// Now building: the day job and the own products in progress. The 2D shooter card gets a tiny
// pixel-art scene (matching the pixel avatar); the stealth app stays redacted.

import { C, PAD, W } from '../core/tokens.mjs'
import { measure, wrap } from '../core/fonts.mjs'
import { glyph } from '../core/icons.mjs'
import { borderBeam, floatStyle, shineSweep, starfield } from '../core/motion.mjs'
import { createDoc, g, h, linearGradient, n, txt } from '../core/svg.mjs'
import { building } from '../content.mjs'
import { card, header, HEADER_H, frame, pill } from './shared/panel.mjs'

const GAP = 12
const CARD_H = 172

const INVADER = ['..X.....X..', '...X...X...', '..XXXXXXX..', '.XX.XXX.XX.', 'XXXXXXXXXXX', 'X.XXXXXXX.X', 'X.X.....X.X', '...XX.XX...']
const SHIP = ['.....X.....', '....XXX....', '....XXX....', '.XXXXXXXXX.', 'XXXXXXXXXXX', 'XXXXXXXXXXX', 'XX.XXXXX.XX']

function sprite(rows, { x, y, px, fill }) {
  let d = ''
  rows.forEach((row, r) => {
    ;[...row].forEach((c, col) => {
      if (c === 'X') d += `M${n(x + col * px)} ${n(y + r * px)}h${px}v${px}h-${px}z`
    })
  })
  return h('path', { d, fill, 'shape-rendering': 'crispEdges' })
}

function shooterScene(doc, { x, y, w, hgt }) {
  const px = 3.5
  const out = []
  const sw = 11 * px
  const shipX = x + w / 2 - sw / 2
  const shipY = y + hgt - 7 * px - 6
  doc.css('laser-k', `@keyframes jr-laser{0%{transform:translateY(0);opacity:0}8%{opacity:1}70%{opacity:1}85%,100%{transform:translateY(-${n(hgt - 40)}px);opacity:0}}`)
  doc.css('hit-k', '@keyframes jr-hit{0%,78%{opacity:0}82%{opacity:1}100%{opacity:0}}')
  doc.css('sway-k', '@keyframes jr-sway{0%,100%{transform:translateX(-10px)}50%{transform:translateX(10px)}}')
  out.push(g({ style: floatStyle(doc, { dur: 3.2, dist: 3 }) }, g({ style: 'animation:jr-sway 6s ease-in-out infinite' }, sprite(INVADER, { x: x + w / 2 - sw / 2, y: y + 8, px, fill: '#c99bf5' }))))
  for (let i = 0; i < 3; i += 1) {
    out.push(h('rect', { x: x + w / 2 - 1.5, y: shipY - 10, width: 3, height: 9, rx: 1, fill: C.cyan, opacity: 0, style: `animation:jr-laser 1.8s linear ${n(-i * 0.6)}s infinite` }))
  }
  // Spark where the bolt lands, just under the invader.
  out.push(h('circle', { cx: x + w / 2, cy: y + 8 + 8 * px + 4, r: 5, stroke: C.cyan, 'stroke-width': 1.5, opacity: 0, style: 'animation:jr-hit 1.8s ease-out infinite' }))
  out.push(sprite(SHIP, { x: shipX, y: shipY, px, fill: C.cyan }))
  return out.join('')
}

function redacted(doc, { x, y, w }) {
  const out = []
  const widths = [w * 0.92, w * 0.7]
  widths.forEach((bw, i) => out.push(h('rect', { x, y: y + i * 20, width: bw, height: 12, rx: 3, fill: C.surface3 })))
  out.push(shineSweep(doc, { x, y: y - 2, w, h: 36, r: 4, dur: 3.6, opacity: 0.18, band: 50 }))
  return out.join('')
}

function productCard(doc, p, { x, y, w, i }) {
  const out = [card(doc, { x, y, w, h: CARD_H, r: 14, glowColor: p.stealth ? C.violet : i % 2 ? C.violet : C.blue })]
  const tile = linearGradient(doc, { stops: p.stealth ? [[0, '#2a1650'], [1, '#14254a']] : [[0, '#14254a'], [1, '#2a1650']], x1: 0, y1: 0, x2: 1, y2: 1 })
  out.push(h('rect', { x: x + 20.5, y: y + 20.5, width: 41, height: 41, rx: 11, fill: `url(#${tile})`, stroke: C.borderHi }))
  out.push(glyph(p.icon, { x: x + 30, y: y + 30, size: 22, color: p.stealth ? '#c99bf5' : '#8fb6ff', width: 1.7 }))
  out.push(pill(doc, { x: x + w - 18, y: y + 26, text: p.status, dot: p.stealth ? C.violet : C.amber, live: true, tone: p.stealth ? 'violet' : 'neutral', anchor: 'end', height: 24, size: 11.5 }).markup)
  out.push(txt(doc, { x: x + 20, y: y + 96, text: p.name, face: 'title', size: 17, fill: C.text }))
  const textW = p.scene ? w * 0.52 : w - 40
  if (p.stealth) {
    out.push(redacted(doc, { x: x + 20, y: y + 112, w: Math.min(textW, 220) }))
    out.push(txt(doc, { x: x + 20, y: y + 156, text: p.text, face: 'mono', size: 11, fill: C.faint }))
  } else {
    wrap(p.text, 'sans', 13, textW).slice(0, 2).forEach((line, j) => out.push(txt(doc, { x: x + 20, y: y + 120 + j * 18, text: line, face: 'sans', size: 13, fill: C.muted })))
    // Indeterminate progress line along the bottom.
    const bar = linearGradient(doc, { stops: [[0, C.blue, 0], [0.5, C.cyan, 1], [1, C.violet, 0]] })
    const clip = doc.uid('pb')
    const bw = p.scene ? textW : w - 40
    doc.defs(h('clipPath', { id: clip }, h('rect', { x: x + 20, y: y + CARD_H - 18, width: bw, height: 3, rx: 1.5 })))
    doc.css('prog-k', '@keyframes jr-prog{from{transform:translateX(0)}to{transform:translateX(var(--d))}}')
    out.push(h('rect', { x: x + 20, y: y + CARD_H - 18, width: bw, height: 3, rx: 1.5, fill: C.surface3 }))
    out.push(g({ 'clip-path': `url(#${clip})` }, h('rect', { x: x + 20 - 90, y: y + CARD_H - 18, width: 90, height: 3, fill: `url(#${bar})`, style: `--d:${n(bw + 90)}px;animation:jr-prog ${n(3.4 + i * 0.5)}s ease-in-out ${n(-i * 0.9)}s infinite` })))
  }
  if (p.scene) out.push(shooterScene(doc, { x: x + w * 0.6, y: y + 62, w: w * 0.36, hgt: CARD_H - 80 }))
  return out.join('')
}

export default {
  name: 'building',
  async render() {
    const products = building.products.map((p) => (p.icon === 'gamepad-2' ? { ...p, scene: true } : p))
    const jobY = HEADER_H + 24
    const jobH = 100
    const row1 = jobY + jobH + GAP
    const row2 = row1 + CARD_H + GAP
    const H = row2 + CARD_H + 28
    const doc = createDoc({
      width: W,
      height: H,
      title: 'Now building',
      desc: `${building.dayJob.title}: ${building.dayJob.text} Own products in development: ${products.map((p) => `${p.name} (${p.stealth ? 'in stealth' : p.text})`).join(', ')}.`,
    })
    const f = frame(doc, { height: H })
    const out = [f.open]
    out.push(header(doc, { icon: 'boxes', title: 'Now building', subtitle: 'The day job, plus products of my own', pills: [{ text: `${products.length} products` }, { text: 'In progress', dot: C.amber, live: true }] }))
    out.push(starfield(doc, { x: 0, y: HEADER_H, w: W, h: H - HEADER_H, count: 36, seed: 'build-stars', avoid: [{ x: PAD, y: jobY, w: W - PAD * 2, h: H - jobY - 20 }] }))

    // Day job.
    const jw = W - PAD * 2
    out.push(card(doc, { x: PAD, y: jobY, w: jw, h: jobH, r: 14, glowColor: C.cyan }))
    out.push(borderBeam(doc, { x: PAD + 0.5, y: jobY + 0.5, w: jw - 1, h: jobH - 1, r: 14, color: C.cyan, dur: 10, length: 110 }))
    const tile = linearGradient(doc, { stops: [[0, C.blue], [1, C.cyan]], x1: 0, y1: 0, x2: 1, y2: 1 })
    out.push(h('rect', { x: PAD + 22, y: jobY + 29, width: 42, height: 42, rx: 11, fill: `url(#${tile})` }))
    out.push(glyph('building-2', { x: PAD + 32, y: jobY + 39, size: 22, color: C.bg, width: 1.9 }))
    out.push(txt(doc, { x: PAD + 82, y: jobY + 34, text: 'DAY JOB  ·  TECH LEAD', face: 'monoMedium', size: 10.5, tracking: 0.12, fill: '#7eeaf8' }))
    out.push(txt(doc, { x: PAD + 82, y: jobY + 58, text: building.dayJob.title, face: 'title', size: 17, fill: C.text }))
    out.push(txt(doc, { x: PAD + 82, y: jobY + 79, text: building.dayJob.text, face: 'sans', size: 13, fill: C.muted }))
    const textEnd = PAD + 82 + Math.max(measure(building.dayJob.title, 'title', 17), measure(building.dayJob.text, 'sans', 13))
    let cx = W - PAD - 20
    for (const [label, tone] of [['SDD', 'cyan'], ['MCP', 'violet'], ['RAG', 'blue'], ['Agents', 'cyan']]) {
      const p = pill(doc, { x: cx, y: jobY + 37, text: label, anchor: 'end', tone, height: 26 })
      if (p.x < textEnd + 12) break
      out.push(p.markup)
      cx = p.x - 8
    }

    const w3 = (W - PAD * 2 - GAP * 2) / 3
    const w2 = (W - PAD * 2 - GAP) / 2
    products.slice(0, 3).forEach((p, i) => out.push(productCard(doc, p, { x: PAD + i * (w3 + GAP), y: row1, w: w3, i })))
    products.slice(3).forEach((p, i) => out.push(productCard(doc, p, { x: PAD + i * (w2 + GAP), y: row2, w: w2, i: i + 3 })))
    out.push(f.close)
    return [{ path: 'assets/building.svg', svg: await doc.render(out.join('')) }]
  },
}
