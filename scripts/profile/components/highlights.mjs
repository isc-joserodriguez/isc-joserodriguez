// Highlights: the production wins from content.mjs as cards with a gradient metric and a small
// visual each (pipeline steps, migration logos, before/after bars, prompt, recurring billing).

import { C, PAD, W } from '../core/tokens.mjs'
import { measure, wrap } from '../core/fonts.mjs'
import { brand, glyph } from '../core/icons.mjs'
import { borderBeam, pulseAlong, shineSweep, starfield } from '../core/motion.mjs'
import { createDoc, h, linearGradient, txt } from '../core/svg.mjs'
import { highlights } from '../content.mjs'
import { card, header, HEADER_H, frame, iconTile } from './shared/panel.mjs'

const CARD_H = 230
const GAP = 12

function visual(doc, item, { x, y, w }) {
  const out = []
  if (item.key === 'agents') {
    const steps = item.steps
    const widths = steps.map((s) => measure(s, 'medium', 12) + 22)
    const total = widths.reduce((a, b) => a + b, 0)
    const spacing = (w - total) / (steps.length - 1)
    const lineY = y + 12
    const d = `M${x + 10} ${lineY}H${x + w - 10}`
    out.push(h('path', { d, stroke: C.borderHi }))
    out.push(pulseAlong(doc, { d, color: C.cyan, dur: 4.2, delay: 1, length: 18, width: 2, rest: 0.3 }))
    let cx = x
    steps.forEach((s, i) => {
      out.push(h('rect', { x: cx + 0.5, y: y + 0.5, width: widths[i] - 1, height: 23, rx: 7, fill: C.surface3, stroke: C.borderHi }))
      out.push(txt(doc, { x: cx + widths[i] / 2, y: y + 16, text: s, face: 'medium', size: 12, fill: C.text2, anchor: 'middle' }))
      cx += widths[i] + spacing
    })
  } else if (item.key === 'migration') {
    let cx = x
    const tile = (key) => {
      out.push(h('rect', { x: cx + 0.5, y: y + 0.5, width: 31, height: 31, rx: 8, fill: C.surface3, stroke: C.borderHi }))
      out.push(brand(key, { x: cx + 7, y: y + 7, size: 18 }))
      cx += 38
    }
    item.from.forEach(tile)
    out.push(glyph('arrow-right', { x: cx + 2, y: y + 7, size: 18, color: C.cyan, width: 2 }))
    cx += 28
    item.to.forEach(tile)
    const label = 'Zero downtime'
    const lw = measure(label, 'semibold', 11.5) + 30
    out.push(h('rect', { x: x + w - lw + 0.5, y: y + 4.5, width: lw - 1, height: 23, rx: 11.5, fill: '#052a20', stroke: '#0f5a42' }))
    out.push(glyph('check', { x: x + w - lw + 9, y: y + 10, size: 12, color: '#86efc4', width: 2.2 }))
    out.push(txt(doc, { x: x + w - lw + 24, y: y + 20, text: label, face: 'semibold', size: 11.5, fill: '#86efc4' }))
  } else if (item.key === 'cicd') {
    const labelW = 52
    const bar = (yy, label, frac, value, grad) => {
      out.push(txt(doc, { x, y: yy + 9, text: label.toUpperCase(), face: 'mono', size: 10, tracking: 0.06, fill: C.faint }))
      out.push(h('rect', { x: x + labelW, y: yy, width: w - labelW - 46, height: 12, rx: 6, fill: C.surface3 }))
      out.push(h('rect', { x: x + labelW, y: yy, width: (w - labelW - 46) * frac, height: 12, rx: 6, fill: grad }))
      out.push(txt(doc, { x: x + w, y: yy + 10, text: value, face: 'mono', size: 10.5, fill: C.text2, anchor: 'end' }))
    }
    const fast = linearGradient(doc, { stops: [[0, C.blue], [1, C.cyan]] })
    bar(y, 'Before', 1, 'days', C.borderHi)
    bar(y + 20, 'After', 0.16, 'hours', `url(#${fast})`)
  } else if (item.key === 'cli') {
    out.push(h('rect', { x: x + 0.5, y: y + 0.5, width: w - 1, height: 31, rx: 8, fill: '#030b1c', stroke: C.borderHi }))
    out.push(txt(doc, { x: x + 12, y: y + 20.5, text: '›', face: 'monoBold', size: 13, fill: C.cyan }))
    out.push(txt(doc, { x: x + 26, y: y + 20, text: 'provision environment', face: 'mono', size: 11, fill: C.text2 }))
    out.push(brand(item.logos[0], { x: x + w - 28, y: y + 8, size: 16 }))
  } else if (item.key === 'billing') {
    const n4 = 4
    const step = (w - 60) / (n4 - 1)
    out.push(h('path', { d: `M${x + 12} ${y + 16}H${x + w - 48}`, stroke: C.borderHi, 'stroke-dasharray': '2 4' }))
    for (let i = 0; i < n4; i += 1) {
      const cx = x + 12 + i * step
      out.push(h('circle', { cx, cy: y + 16, r: 10, fill: '#052a20', stroke: '#0f5a42' }))
      out.push(glyph('check', { x: cx - 6, y: y + 10, size: 12, color: '#86efc4', width: 2.2 }))
    }
    out.push(glyph('repeat', { x: x + w - 24, y: y + 6, size: 20, color: '#c99bf5' }))
  }
  return out.join('')
}

function highlightCard(doc, item, { x, y, w, i }) {
  const out = [card(doc, { x, y, w, h: CARD_H, r: 14, glowColor: i % 2 ? C.violet : C.blue })]
  if (i === 0) out.push(borderBeam(doc, { x: x + 0.5, y: y + 0.5, w: w - 1, h: CARD_H - 1, r: 14, color: C.cyan, dur: 9, length: 140 }))
  out.push(iconTile(doc, { x: x + 20, y: y + 20, size: 32, icon: item.icon, color: i % 2 ? '#c99bf5' : '#8fb6ff', fill: C.surface3 }))
  out.push(txt(doc, { x: x + 64, y: y + 40, text: item.eyebrow.toUpperCase(), face: 'monoMedium', size: 10.5, tracking: 0.12, fill: '#7eeaf8' }))
  const mw = measure(item.metric, 'head', 30, { tracking: -0.03 })
  const grad = linearGradient(doc, { stops: [[0, '#8fb6ff'], [1, '#c99bf5']], units: 'userSpaceOnUse', x1: x + 20, x2: x + 20 + mw, y1: 0, y2: 0 })
  out.push(txt(doc, { x: x + 20, y: y + 92, text: item.metric, face: 'head', size: 30, tracking: -0.03, fill: `url(#${grad})` }))
  out.push(txt(doc, { x: x + 20, y: y + 120, text: item.title, face: 'semibold', size: 15, fill: C.text }))
  const lines = wrap(item.text, 'sans', 13, w - 40)
  if (lines.length > 2) console.warn(`highlights: "${item.key}" text needs ${lines.length} lines`)
  lines.slice(0, 2).forEach((line, j) => out.push(txt(doc, { x: x + 20, y: y + 142 + j * 18, text: line, face: 'sans', size: 13, fill: C.muted })))
  out.push(visual(doc, item, { x: x + 20, y: y + CARD_H - 52, w: w - 40 }))
  out.push(shineSweep(doc, { x, y, w, h: CARD_H, r: 14, dur: 11, delay: i * 2.1, opacity: 0.05, band: 90 }))
  return out.join('')
}

export default {
  name: 'highlights',
  async render() {
    const rowsY = [HEADER_H + 24, HEADER_H + 24 + CARD_H + GAP]
    const H = rowsY[1] + CARD_H + 28
    const doc = createDoc({
      width: W,
      height: H,
      title: 'Highlights',
      desc: highlights.map((x) => `${x.eyebrow}: ${x.metric}. ${x.title}. ${x.text}`).join(' '),
    })
    const f = frame(doc, { height: H })
    const out = [f.open]
    out.push(header(doc, { icon: 'trophy', title: 'Highlights', subtitle: 'Results that made it to production', pills: [{ text: `${highlights.length} highlights`, icon: 'star' }] }))
    out.push(starfield(doc, { x: 0, y: HEADER_H, w: W, h: H - HEADER_H, count: 40, seed: 'hl-stars', avoid: [{ x: PAD, y: rowsY[0], w: W - PAD * 2, h: H - rowsY[0] - 20 }] }))
    const top = highlights.slice(0, 2)
    const bottom = highlights.slice(2)
    const w2 = (W - PAD * 2 - GAP) / 2
    const w3 = (W - PAD * 2 - GAP * 2) / 3
    top.forEach((item, i) => out.push(highlightCard(doc, item, { x: PAD + i * (w2 + GAP), y: rowsY[0], w: w2, i })))
    bottom.forEach((item, i) => out.push(highlightCard(doc, item, { x: PAD + i * (w3 + GAP), y: rowsY[1], w: w3, i: i + 2 })))
    out.push(f.close)
    return [{ path: 'assets/highlights.svg', svg: await doc.render(out.join('')) }]
  },
}
