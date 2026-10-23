// Hero: name in the portfolio gradient over an agent network, a terminal typing real lines of
// work, and a stat strip (claims from content.mjs + live GitHub numbers).

import { C, W } from '../core/tokens.mjs'
import { measure, wrap } from '../core/fonts.mjs'
import { compact } from '../core/format.mjs'
import { blinkStyle, constellation, dotGrid, glow, starfield } from '../core/motion.mjs'
import { createDoc, g, h, linearGradient, n, txt } from '../core/svg.mjs'
import { profile, yearsOfExperience } from '../content.mjs'
import { pill } from './shared/panel.mjs'

const H = 500
const STRIP_Y = 396

function typingTerminal(doc, { x, y, w, hgt, lines }) {
  const out = []
  const bg = C.surface
  out.push(h('rect', { x: x + 0.5, y: y + 0.5, width: w - 1, height: hgt - 1, rx: 12, fill: bg, stroke: C.borderHi }))
  // Lit top edge, like the portfolio's glass cards.
  const edge = linearGradient(doc, { stops: [[0, C.cyan, 0], [0.5, C.cyan, 0.55], [1, C.cyan, 0]], units: 'userSpaceOnUse', x1: x, x2: x + w, y1: 0, y2: 0 })
  out.push(h('path', { d: `M${x + 24} ${y + 0.5}H${x + w - 24}`, stroke: `url(#${edge})` }))
  const cy = y + hgt / 2
  out.push(txt(doc, { x: x + 20, y: cy + 5, text: '›', face: 'monoBold', size: 16, fill: C.cyan }))
  const textX = x + 40
  const room = x + w - 24 - textX
  let size = 14
  while (size > 11 && lines.some((l) => measure(l, 'mono', size) + 12 > room)) size -= 0.5
  // Each line's slot: type 40% → hold 30% → backspace 16% → empty prompt 14%.
  const slot = 6 // seconds per line
  const TYPED = 0.4
  const ERASE = 0.7
  const ERASED = 0.86
  const cycle = slot * lines.length
  const share = 100 / lines.length
  const cursor = blinkStyle(doc, { dur: 1.05 })
  const inner = doc.uid('tc')
  doc.defs(h('clipPath', { id: inner }, h('rect', { x: textX - 4, y: y + 1, width: room, height: hgt - 2 })))
  const typed = []
  lines.forEach((line, i) => {
    const tw = measure(line, 'mono', size)
    const chars = [...line].length
    const start = n(i * share)
    const end = n((i + 1) * share)
    const at = (f) => n(i * share + share * f)
    const vis = `jr-line-${i}`
    const typing = `jr-type-${i}`
    // Visible only during its slot.
    const visKeys =
      i === 0
        ? `0%,${n(end - 0.01)}%{opacity:1}${end}%,100%{opacity:0}`
        : `0%,${n(start - 0.01)}%{opacity:0}${start}%,${n(end - 0.01)}%{opacity:1}${end}%,100%{opacity:0}`
    doc.css(vis, `@keyframes ${vis}{${visKeys}}`)
    // A cover in the terminal colour slides right one character per step (typing), holds, then
    // slides back the same way (backspace), leaving an empty prompt before the next line.
    const step = `animation-timing-function:steps(${chars},end)`
    doc.css(
      typing,
      `@keyframes ${typing}{0%,${start}%{transform:translateX(0);${step}}` +
        `${at(TYPED)}%{transform:translateX(${n(tw)}px)}` +
        `${at(ERASE)}%{transform:translateX(${n(tw)}px);${step}}` +
        `${at(ERASED)}%,100%{transform:translateX(0)}}`,
    )
    typed.push(
      g(
        { opacity: i === 0 ? 1 : 0, style: `animation:${vis} ${cycle}s linear infinite` },
        txt(doc, { x: textX, y: cy + 5, text: line, face: 'mono', size, fill: '#e2e8f0' }),
        // Resting frame (no animation): the inline transform keeps the line fully typed.
        g(
          { style: `transform:translateX(${n(tw)}px);animation:${typing} ${cycle}s linear infinite` },
          h('rect', { x: textX + 1, y: y + 8, width: tw + 60, height: hgt - 16, fill: bg }),
          h('rect', { x: textX + 1, y: cy - 9, width: 8, height: 18, rx: 1.5, fill: C.cyan, opacity: 0.9, style: cursor }),
        ),
      ),
    )
  })
  out.push(g({ 'clip-path': `url(#${inner})` }, typed))
  return out.join('')
}

function nameBlock(doc, { cx, y, text, size }) {
  const tw = measure(text, 'display', size, { tracking: -0.035 })
  const x0 = cx - tw / 2
  const grad = linearGradient(doc, { stops: [[0, C.blue], [1, C.violet]], units: 'userSpaceOnUse', x1: x0, y1: y - size, x2: x0 + tw, y2: y + size * 0.2 })
  const name = (extra = {}) => txt(doc, { x: cx, y, text, face: 'display', size, tracking: -0.035, anchor: 'middle', ...extra })
  const blur = doc.uid('bl')
  doc.defs(h('filter', { id: blur, x: '-20%', y: '-60%', width: '140%', height: '220%' }, h('feGaussianBlur', { stdDeviation: 22 })))
  // Light sweeping across the letters: a band clipped to the glyphs.
  const clip = doc.uid('nm')
  doc.defs(h('clipPath', { id: clip }, name()))
  const band = linearGradient(doc, { stops: [[0, '#fff', 0], [0.5, '#fff', 0.85], [1, '#fff', 0]] })
  doc.css('name-shine', `@keyframes jr-name-shine{0%{transform:translateX(0)}38%,100%{transform:translateX(${n(tw + 260)}px)}}`)
  return [
    name({ fill: `url(#${grad})`, filter: `url(#${blur})`, opacity: 0.55 }),
    name({ fill: `url(#${grad})` }),
    g(
      { 'clip-path': `url(#${clip})` },
      g(
        { style: 'animation:jr-name-shine 7.5s ease-in-out -2s infinite' },
        h('rect', { x: x0 - 180, y: y - size, width: 120, height: size * 1.3, fill: `url(#${band})`, opacity: 0.55, transform: `translate(${n(x0 - 120)} ${n(y)}) skewX(-22) translate(${n(-(x0 - 120))} ${n(-y)})` }),
      ),
    ),
  ].join('')
}

export default {
  name: 'hero',
  async render({ metrics, now }) {
    const years = yearsOfExperience(now)
    const c = metrics.contributions ?? {}
    const pr = metrics.pullRequests ?? {}
    const stats = [
      { value: `${years}+`, label: 'Years building' },
      { value: profile.claims.products, label: 'Products shipped' },
      { value: profile.claims.mentored, label: 'Students mentored' },
      { value: Number.isFinite(c.lastYear) ? compact(c.lastYear) : '—', label: 'Contributions · 12 mo' },
      { value: Number.isFinite(pr.merged) ? compact(pr.merged) : '—', label: 'Pull requests merged' },
    ]
    const doc = createDoc({
      width: W,
      height: H,
      title: `${profile.name}: ${profile.role}`,
      desc:
        `${profile.name}, ${profile.role} based in ${profile.location}. ${profile.headline} ` +
        `Stats: ${stats.map((s) => `${s.value} ${s.label.toLowerCase()}`).join(', ')}.`,
    })

    const clip = doc.uid('hc')
    doc.defs(h('clipPath', { id: clip }, h('rect', { x: 0, y: 0, width: W, height: H, rx: 20 })))
    const body = []
    body.push(h('rect', { x: 0.5, y: 0.5, width: W - 1, height: H - 1, rx: 20, fill: C.bg, stroke: C.border }))
    const layers = []
    layers.push(glow(doc, { cx: 150, cy: 40, rx: 420, ry: 260, color: C.blue, opacity: 0.32, breathe: 9 }))
    layers.push(glow(doc, { cx: 760, cy: 210, rx: 360, ry: 260, color: C.violet, opacity: 0.26, breathe: 11, delay: 4 }))
    layers.push(glow(doc, { cx: 430, cy: STRIP_Y, rx: 340, ry: 70, color: C.cyan, opacity: 0.1 }))
    layers.push(dotGrid(doc, { x: 0, y: 0, w: W, h: STRIP_Y, gap: 22, opacity: 0.09 }))
    const centre = { x: 110, y: 92, w: 640, h: 270 }
    layers.push(starfield(doc, { x: 0, y: 56, w: W, h: STRIP_Y - 56, count: 90, seed: 'hero-stars', avoid: [centre], flares: 4 }))
    layers.push(constellation(doc, { x: 14, y: 70, w: W - 28, h: STRIP_Y - 90, nodes: 30, seed: 'hero-net', k: 2, avoid: [centre], pulses: 9, minDist: 44, edgeOpacity: 0.2 }).markup)

    // Top bar: monogram + handle, status pill.
    const mono = linearGradient(doc, { stops: [[0, C.blue], [1, C.violet]], x1: 0, y1: 0, x2: 1, y2: 1 })
    layers.push(h('rect', { x: 28, y: 18, width: 30, height: 30, rx: 9, fill: `url(#${mono})` }))
    layers.push(txt(doc, { x: 43, y: 38, text: 'JR', face: 'head', size: 13, fill: '#fff', anchor: 'middle', tracking: -0.02 }))
    layers.push(txt(doc, { x: 68, y: 37.5, text: profile.handle, face: 'mono', size: 12.5, fill: C.muted }))
    layers.push(pill(doc, { x: W - 28, y: 20, text: profile.status, dot: C.cyan, live: true, tone: 'cyan', anchor: 'end' }).markup)

    // Eyebrow with hairlines.
    const eyebrow = 'TECH LEAD  ·  SENIOR FULL STACK AI ENGINEER'
    const ew = measure(eyebrow, 'monoMedium', 11.5, { tracking: 0.14 })
    const lineGrad = (dir) => linearGradient(doc, { stops: dir ? [[0, C.cyan, 0], [1, C.cyan, 0.6]] : [[0, C.cyan, 0.6], [1, C.cyan, 0]], units: 'userSpaceOnUse', x1: dir ? W / 2 - ew / 2 - 70 : W / 2 + ew / 2 + 14, x2: dir ? W / 2 - ew / 2 - 14 : W / 2 + ew / 2 + 70, y1: 0, y2: 0 })
    layers.push(h('path', { d: `M${n(W / 2 - ew / 2 - 70)} 120H${n(W / 2 - ew / 2 - 14)}`, stroke: `url(#${lineGrad(true)})` }))
    layers.push(h('path', { d: `M${n(W / 2 + ew / 2 + 14)} 120H${n(W / 2 + ew / 2 + 70)}`, stroke: `url(#${lineGrad(false)})` }))
    layers.push(txt(doc, { x: W / 2, y: 124, text: eyebrow, face: 'monoMedium', size: 11.5, tracking: 0.14, fill: '#7eeaf8', anchor: 'middle' }))

    layers.push(nameBlock(doc, { cx: W / 2, y: 210, text: profile.name, size: 86 }))

    const lines = wrap(profile.headline, 'sans', 17, 600)
    lines.forEach((line, i) => layers.push(txt(doc, { x: W / 2, y: 252 + i * 25, text: line, face: 'sans', size: 17, fill: C.text2, anchor: 'middle' })))

    layers.push(typingTerminal(doc, { x: W / 2 - 310, y: 252 + lines.length * 25 + 14, w: 620, hgt: 46, lines: profile.taglines }))

    // Stat strip.
    layers.push(h('rect', { x: 0, y: STRIP_Y, width: W, height: H - STRIP_Y, fill: '#030b1c', opacity: 0.85 }))
    layers.push(h('path', { d: `M0 ${STRIP_Y}H${W}`, stroke: C.border }))
    const cell = W / stats.length
    stats.forEach((s, i) => {
      const x = i * cell
      if (i) layers.push(h('path', { d: `M${n(x)} ${STRIP_Y}V${H}`, stroke: C.border }))
      const value = s.value
      if (i === 0) {
        const vg = linearGradient(doc, { stops: [[0, C.blue], [1, C.violet]], units: 'userSpaceOnUse', x1: x + 26, x2: x + 26 + measure(value, 'head', 36), y1: 0, y2: 0 })
        layers.push(txt(doc, { x: x + 26, y: STRIP_Y + 54, text: value, face: 'head', size: 36, fill: `url(#${vg})`, tracking: -0.03, tnum: true }))
      } else {
        layers.push(txt(doc, { x: x + 26, y: STRIP_Y + 54, text: value, face: 'head', size: 36, fill: C.text, tracking: -0.03, tnum: true }))
      }
      layers.push(txt(doc, { x: x + 26, y: STRIP_Y + 78, text: s.label, face: 'sans', size: 13, fill: C.muted }))
    })
    // Crosshairs where the strip meets the edges.
    for (const cx of [cell, cell * 2, cell * 3, cell * 4]) {
      layers.push(h('path', { d: `M${n(cx - 4)} ${STRIP_Y}H${n(cx + 4)}M${n(cx)} ${STRIP_Y - 4}V${STRIP_Y + 4}`, stroke: C.faint, opacity: 0.6 }))
    }

    body.push(g({ 'clip-path': `url(#${clip})` }, layers))
    const edge = linearGradient(doc, { stops: [[0, '#fff', 0], [0.5, '#fff', 0.18], [1, '#fff', 0]], units: 'userSpaceOnUse', x1: 0, x2: W, y1: 0, y2: 0 })
    body.push(h('path', { d: `M20 0.5H${W - 20}`, stroke: `url(#${edge})` }))
    return [{ path: 'assets/hero.svg', svg: await doc.render(body.join('')) }]
  },
}
