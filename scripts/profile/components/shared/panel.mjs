// Shared panel system: frame, toolbar header, pills, chips, footer strip and freshness labels.
// Every panel is a self-contained navy card so it reads on GitHub's dark and light themes alike.

import { C, PAD, RADIUS, W } from '../../core/tokens.mjs'
import { measure } from '../../core/fonts.mjs'
import { glyph } from '../../core/icons.mjs'
import { dateIn } from '../../core/format.mjs'
import { liveDot, glow } from '../../core/motion.mjs'
import { g, h, linearGradient, txt } from '../../core/svg.mjs'

export const TYPE = {
  title: { face: 'title', size: 16 },
  subtitle: { face: 'sans', size: 13 },
  eyebrow: { face: 'monoMedium', size: 11, tracking: 0.1 },
  body: { face: 'sans', size: 13.5 },
  kpi: { face: 'head', size: 32 },
  stat: { face: 'head', size: 24 },
}

export const HEADER_H = 64
export const FOOTER_H = 40

// Background card. `glows` adds the portfolio's soft blue/violet light in the corners.
export function frame(doc, { width = W, height, glows = true, r = RADIUS, fill = C.bg }) {
  const edge = linearGradient(doc, { stops: [[0, '#fff', 0], [0.5, '#fff', 0.14], [1, '#fff', 0]], units: 'userSpaceOnUse', x1: 0, x2: width, y1: 0, y2: 0 })
  const clip = doc.uid('fr')
  doc.defs(h('clipPath', { id: clip }, h('rect', { x: 0, y: 0, width, height, rx: r })))
  return {
    open: [
      h('rect', { x: 0.5, y: 0.5, width: width - 1, height: height - 1, rx: r, fill, stroke: C.border }),
      `<g clip-path="url(#${clip})">`,
      glows ? glow(doc, { cx: width * 0.12, cy: -40, rx: 320, ry: 200, color: C.blue, opacity: 0.16 }) : '',
      glows ? glow(doc, { cx: width * 0.9, cy: -20, rx: 300, ry: 190, color: C.violet, opacity: 0.12 }) : '',
    ].join(''),
    close: '</g>' + h('path', { d: `M${r} 0.5H${width - r}`, stroke: `url(#${edge})`, 'stroke-width': 1 }),
  }
}

export function eyebrow(doc, { x, y, text, fill = C.faint, anchor }) {
  return txt(doc, { x, y, text: text.toUpperCase(), ...TYPE.eyebrow, fill, anchor })
}

// Small rounded square holding a glyph.
export function iconTile(doc, { x, y, size = 30, icon, color = C.text2, fill = C.surface2, stroke = C.borderHi, iconSize, r = 8 }) {
  const s = iconSize ?? Math.round(size * 0.53)
  return g(
    {},
    h('rect', { x: x + 0.5, y: y + 0.5, width: size - 1, height: size - 1, rx: r, fill, stroke }),
    glyph(icon, { x: x + (size - s) / 2, y: y + (size - s) / 2, size: s, color }),
  )
}

// Pill with optional status dot or glyph; returns { markup, width }.
export function pill(doc, { x, y, text, dot, live = false, icon, anchor = 'start', height = 26, tone = 'neutral', face = 'medium', size = 12 }) {
  const padX = 11
  const lead = dot || icon ? 15 : 0
  const w = Math.round(measure(text, face, size) + padX * 2 + lead)
  const left = anchor === 'end' ? x - w : x
  const tones = {
    neutral: { fill: C.surface2, stroke: C.borderHi, ink: C.text2 },
    cyan: { fill: '#04253a', stroke: '#0b5266', ink: '#7eeaf8' },
    blue: { fill: '#0d1d3d', stroke: '#24427a', ink: '#a9c8ff' },
    violet: { fill: '#1c1236', stroke: '#45307a', ink: '#d5b5fb' },
    green: { fill: '#052a20', stroke: '#0f5a42', ink: '#86efc4' },
  }
  const t = tones[tone] ?? tones.neutral
  const cy = y + height / 2
  const parts = [h('rect', { x: left + 0.5, y: y + 0.5, width: w - 1, height: height - 1, rx: height / 2, fill: t.fill, stroke: t.stroke })]
  if (dot) parts.push(live ? liveDot(doc, { cx: left + padX + 3.5, cy, r: 3.2, color: dot }) : h('circle', { cx: left + padX + 3.5, cy, r: 3.2, fill: dot }))
  if (icon) parts.push(glyph(icon, { x: left + padX - 1, y: cy - 6.5, size: 13, color: t.ink }))
  parts.push(txt(doc, { x: left + padX + lead, y: cy + 4.2, text, face, size, fill: t.ink }))
  return { markup: g({}, parts), width: w, x: left }
}

// Toolbar: icon tile + title + subtitle on the left, pills on the right, hairline below.
export function header(doc, { width = W, icon, title, subtitle, pills = [] }) {
  const out = [iconTile(doc, { x: PAD, y: 17, size: 30, icon })]
  out.push(txt(doc, { x: PAD + 42, y: 30, text: title, ...TYPE.title, fill: C.text }))
  if (subtitle) out.push(txt(doc, { x: PAD + 42, y: 48, text: subtitle, ...TYPE.subtitle, fill: C.muted }))
  let right = width - PAD + 8
  for (const p of [...pills].reverse()) {
    const made = pill(doc, { ...p, x: right, y: 19, anchor: 'end' })
    out.push(made.markup)
    right = made.x - 8
  }
  out.push(h('path', { d: `M0 ${HEADER_H}H${width}`, stroke: C.border }))
  return out.join('')
}

// Provenance strip: [label, value] pairs left and right.
export function footer(doc, { width = W, y, left = [], right = [] }) {
  const out = [h('path', { d: `M0 ${y}H${width}`, stroke: C.border })]
  const baseline = y + FOOTER_H / 2 + 4
  const pairs = (list, x0, anchorEnd) => {
    let x = x0
    const items = anchorEnd ? [...list].reverse() : list
    for (const [label, value] of items) {
      const lw = measure(label.toUpperCase(), 'mono', 10.5, { tracking: 0.08 })
      const vw = measure(value, 'mono', 10.5)
      const total = lw + 7 + vw
      const sx = anchorEnd ? x - total : x
      out.push(txt(doc, { x: sx, y: baseline, text: label.toUpperCase(), face: 'mono', size: 10.5, tracking: 0.08, fill: C.faint }))
      out.push(txt(doc, { x: sx + lw + 7, y: baseline, text: value, face: 'mono', size: 10.5, fill: C.muted }))
      x = anchorEnd ? sx - 22 : sx + total + 22
    }
  }
  pairs(left, PAD, false)
  pairs(right, width - PAD, true)
  return out.join('')
}

// Neutral chip: { markup, width }.
export function chip(doc, { x, y, text, height = 22, face = 'medium', size = 11.5, fill = C.surface3, stroke = C.borderHi, ink = C.text2 }) {
  const w = Math.round(measure(text, face, size) + 18)
  return {
    width: w,
    markup: g({}, h('rect', { x: x + 0.5, y: y + 0.5, width: w - 1, height: height - 1, rx: 6, fill, stroke }), txt(doc, { x: x + 9, y: y + height / 2 + 4, text, face, size, fill: ink })),
  }
}

// "Live · updated Oct 23, 2026" or "Cached · Oct 20, 2026".
export function freshness(metrics) {
  const state = metrics?.sources?.github
  const at = metrics?.sources?.githubAt ?? metrics?.generatedAt
  if (!at) return { live: false, text: 'No data', dot: C.faint }
  const date = dateIn(at)
  return state === 'live' ? { live: true, text: `Live · ${date}`, dot: C.green, tone: 'green' } : { live: false, text: `Cached · ${date}`, dot: C.faint, tone: 'neutral' }
}

// Inner card with a lit top edge.
export function card(doc, { x, y, w, h: hgt, r = 14, fill = C.surface, stroke = C.border, lit = true, glowColor }) {
  const out = [h('rect', { x: x + 0.5, y: y + 0.5, width: w - 1, height: hgt - 1, rx: r, fill, stroke })]
  if (glowColor) {
    const clip = doc.uid('cc')
    doc.defs(h('clipPath', { id: clip }, h('rect', { x, y, width: w, height: hgt, rx: r })))
    out.push(g({ 'clip-path': `url(#${clip})` }, glow(doc, { cx: x + w / 2, cy: y, rx: w * 0.6, ry: hgt * 0.55, color: glowColor, opacity: 0.22 })))
  }
  if (lit) {
    const edge = linearGradient(doc, { stops: [[0, '#fff', 0], [0.5, '#fff', 0.16], [1, '#fff', 0]], units: 'userSpaceOnUse', x1: x, x2: x + w, y1: 0, y2: 0 })
    out.push(h('path', { d: `M${x + r} ${y + 0.5}H${x + w - r}`, stroke: `url(#${edge})` }))
  }
  return out.join('')
}
