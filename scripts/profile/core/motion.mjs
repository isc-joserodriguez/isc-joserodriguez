// Ambient motion kit. Everything is CSS keyframes on opacity/transform/stroke-dashoffset (so the
// reduced-motion rule in createDoc stops it), loops are slow, phases are seeded and staggered, and
// the resting frame (animation: none) is always a complete picture.

import { C } from './tokens.mjs'
import { g, h, n, radialGradient, roundedRectPath } from './svg.mjs'

// mulberry32 over a string/number seed.
export function rng(seed) {
  let s = typeof seed === 'number' ? seed >>> 0 : [...String(seed)].reduce((a, c) => Math.imul(a ^ c.charCodeAt(0), 2654435761) >>> 0, 2166136261)
  const r = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  r.range = (a, b) => a + r() * (b - a)
  r.int = (a, b) => Math.floor(r.range(a, b + 1))
  r.pick = (list) => list[Math.floor(r() * list.length)]
  r.chance = (p) => r() < p
  return r
}

const inside = (x, y, rects = [], pad = 0) =>
  rects.some((a) => x > a.x - pad && x < a.x + a.w + pad && y > a.y - pad && y < a.y + a.h + pad)

const anim = (name, dur, delay = 0, extra = '') =>
  `animation:${name} ${n(dur)}s ${extra || 'ease-in-out'} ${n(-Math.abs(delay))}s infinite`

function registerTwinkle(doc) {
  doc.css('tw', '@keyframes jr-tw{0%,100%{opacity:1}50%{opacity:.25}}')
}

// Stars: tiny dots, a share of them twinkling in a few shared groups (cheap), plus 4-point flares.
export function starfield(doc, { x = 0, y = 0, w, h: hgt, count = 80, seed = 'stars', avoid = [], flares = 0, opacity = 1, colors = [C.text, '#c7d7ff', C.cyan] }) {
  registerTwinkle(doc)
  const r = rng(seed)
  const groups = [[], [], [], [], []] // 0 = static, 1..4 twinkle variants
  for (let i = 0; i < count; i += 1) {
    const sx = x + r() * w
    const sy = y + r() * hgt
    if (inside(sx, sy, avoid, 6)) continue
    const size = r() < 0.85 ? r.range(0.35, 0.9) : r.range(0.9, 1.5)
    const color = r() < 0.72 ? colors[0] : r() < 0.8 ? colors[1] : colors[2]
    const dot = h('circle', { cx: sx, cy: sy, r: size, fill: color, opacity: n(r.range(0.25, 0.9)) })
    groups[r() < 0.45 ? 1 + Math.floor(r() * 4) : 0].push(dot)
  }
  const out = [groups[0].join('')]
  const periods = [3.6, 5.2, 7.4, 9.8]
  for (let i = 1; i <= 4; i += 1) {
    if (groups[i].length) out.push(g({ style: anim('jr-tw', periods[i - 1], i * 1.3) }, groups[i]))
  }
  if (flares) {
    doc.css('flare-k', '@keyframes jr-flare{0%,100%{opacity:.9;transform:scale(1)}50%{opacity:.35;transform:scale(.6)}}')
    for (let i = 0; i < flares; i += 1) {
      let fx = x + r() * w
      let fy = y + r() * hgt
      for (let t = 0; t < 12 && inside(fx, fy, avoid, 14); t += 1) {
        fx = x + r() * w
        fy = y + r() * hgt
      }
      if (inside(fx, fy, avoid, 14)) continue
      out.push(flare(doc, { x: fx, y: fy, size: r.range(5, 9), color: r() < 0.7 ? C.text : C.cyan, delay: r.range(0, 8), dur: r.range(6, 10) }))
    }
  }
  return g({ opacity }, out)
}

export function flare(doc, { x, y, size = 7, color = C.text, delay = 0, dur = 8 }) {
  const s = size
  const d = `M0 ${-s}Q${n(s * 0.12)} ${n(-s * 0.12)} ${s} 0Q${n(s * 0.12)} ${n(s * 0.12)} 0 ${s}Q${n(-s * 0.12)} ${n(s * 0.12)} ${-s} 0Q${n(-s * 0.12)} ${n(-s * 0.12)} 0 ${-s}Z`
  return g(
    { transform: `translate(${n(x)} ${n(y)})` },
    g(
      { style: `transform-box:fill-box;transform-origin:center;${anim('jr-flare', dur, delay)}` },
      h('circle', { r: s * 0.9, fill: color, opacity: 0.08 }),
      h('path', { d, fill: color, opacity: 0.9 }),
    ),
  )
}

// Soft coloured light: a radial-gradient ellipse that breathes.
export function glow(doc, { cx, cy, rx, ry = rx, color = C.blue, opacity = 0.35, breathe = 0, delay = 0 }) {
  const id = radialGradient(doc, { stops: [[0, color, 1], [0.55, color, 0.28], [1, color, 0]] })
  if (breathe) doc.css('breathe-k', '@keyframes jr-breathe{0%,100%{opacity:1}50%{opacity:.55}}')
  const ell = h('ellipse', { cx, cy, rx, ry, fill: `url(#${id})`, opacity })
  return breathe ? g({ style: anim('jr-breathe', breathe, delay) }, ell) : ell
}

// Faint dot grid, faded out towards the edges (portfolio background texture).
export function dotGrid(doc, { x = 0, y = 0, w, h: hgt, gap = 22, r = 0.8, color = C.text, opacity = 0.07, fade = true }) {
  const pid = doc.uid('pt')
  doc.defs(h('pattern', { id: pid, x, y, width: gap, height: gap, patternUnits: 'userSpaceOnUse' }, h('circle', { cx: gap / 2, cy: gap / 2, r, fill: color })))
  if (!fade) return h('rect', { x, y, width: w, height: hgt, fill: `url(#${pid})`, opacity })
  const mid = doc.uid('mk')
  const rg = radialGradient(doc, { stops: [[0, '#fff', 1], [0.7, '#fff', 0.45], [1, '#fff', 0]] })
  doc.defs(h('mask', { id: mid, maskUnits: 'userSpaceOnUse', x, y, width: w, height: hgt }, h('rect', { x, y, width: w, height: hgt, fill: `url(#${rg})` })))
  return h('rect', { x, y, width: w, height: hgt, fill: `url(#${pid})`, opacity, mask: `url(#${mid})` })
}

// A bright dash travelling along a path. `length` and the path are in pathLength=100 units.
export function pulseAlong(doc, { d, color = C.cyan, dur = 4, delay = 0, length = 14, width = 1.6, rest = 0.35, opacity = 1, glowWidth = 3.5 }) {
  const L = Math.round(length)
  const travel = Math.round((1 - rest) * 100)
  const key = `pulse-${L}-${travel}`
  doc.css(key, `@keyframes jr-${key}{0%{stroke-dashoffset:${L}}${travel}%,100%{stroke-dashoffset:-100}}`)
  const style = `${anim(`jr-${key}`, dur, delay, 'linear')}`
  const common = { d, pathLength: 100, 'stroke-dasharray': `${L} 200`, 'stroke-dashoffset': -40, 'stroke-linecap': 'round', fill: 'none', style }
  return g(
    { opacity },
    h('path', { ...common, stroke: color, 'stroke-width': glowWidth * width, opacity: 0.18 }),
    h('path', { ...common, stroke: color, 'stroke-width': width }),
  )
}

// A segment of light running around a rounded rect.
export function borderBeam(doc, { x, y, w, h: hgt, r = 16, color = C.cyan, dur = 8, delay = 0, length = 120, width = 1.4, opacity = 0.9 }) {
  const L = Math.round(length)
  const key = `beam-${L}`
  doc.css(key, `@keyframes jr-${key}{from{stroke-dashoffset:0}to{stroke-dashoffset:-1000}}`)
  const d = roundedRectPath(x, y, w, hgt, r)
  const common = { d, pathLength: 1000, 'stroke-dasharray': `${L} ${1000 - L}`, fill: 'none', 'stroke-linecap': 'round', style: anim(`jr-${key}`, dur, delay, 'linear') }
  return g(
    { opacity },
    h('path', { ...common, stroke: color, 'stroke-width': width * 4, opacity: 0.12 }),
    h('path', { ...common, stroke: color, 'stroke-width': width }),
  )
}

// Diagonal sheen crossing a rect in the first part of each loop.
export function shineSweep(doc, { x, y, w, h: hgt, r = 12, dur = 7, delay = 0, opacity = 0.08, band = 70 }) {
  doc.css('shine-k', '@keyframes jr-shine{0%{transform:translateX(0)}45%,100%{transform:translateX(var(--d))}}')
  const cid = doc.uid('cl')
  doc.defs(h('clipPath', { id: cid }, h('rect', { x, y, width: w, height: hgt, rx: r })))
  const lg = doc.uid('sh')
  doc.defs(h('linearGradient', { id: lg, x1: 0, y1: 0, x2: 1, y2: 0 }, h('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0 }), h('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 1 }), h('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 })))
  const travel = w + band * 2 + hgt
  return g(
    { 'clip-path': `url(#${cid})` },
    g(
      { style: `--d:${n(travel)}px;${anim('jr-shine', dur, delay, 'ease-in-out')}` },
      h('rect', { x: x - band - hgt, y: y - 20, width: band, height: hgt + 40, fill: `url(#${lg})`, opacity, transform: `translate(${n(x)} ${n(y)}) skewX(-20) translate(${n(-x)} ${n(-y)})` }),
    ),
  )
}

// Dots orbiting (cx, cy) on a ring.
export function orbit(doc, { cx, cy, r, count = 3, dur = 24, seed = 'orbit', dot = 2, color = C.cyan, reverse = false, track = true, trackOpacity = 0.25, dash = '2 6' }) {
  const key = reverse ? 'orbit-r' : 'orbit'
  doc.css(key, `@keyframes jr-${key}{from{transform:rotate(0deg)}to{transform:rotate(${reverse ? -360 : 360}deg)}}`)
  const rr = rng(seed)
  const dots = []
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 + rr.range(0, 0.6)
    const size = typeof dot === 'number' ? dot : rr.range(dot[0], dot[1])
    const c = Array.isArray(color) ? color[i % color.length] : color
    dots.push(h('circle', { cx: cx + Math.cos(a) * r, cy: cy + Math.sin(a) * r, r: size, fill: c }))
    dots.push(h('circle', { cx: cx + Math.cos(a) * r, cy: cy + Math.sin(a) * r, r: size * 3, fill: c, opacity: 0.15 }))
  }
  return g(
    {},
    track ? h('circle', { cx, cy, r, stroke: C.borderHi, 'stroke-dasharray': dash, opacity: trackOpacity }) : '',
    g({ style: `transform-box:view-box;transform-origin:${n(cx)}px ${n(cy)}px;${anim(`jr-${key}`, dur, rr.range(0, dur), 'linear')}` }, dots),
  )
}

// Network of nodes with k-nearest edges; some edges carry pulses. Returns markup + geometry.
export function constellation(doc, { x = 0, y = 0, w, h: hgt, nodes = 24, seed = 'net', k = 2, avoid = [], pulses = 6, minDist = 46, color = C.blue, edgeOpacity = 0.16, pulseColors = [C.cyan, C.blue, C.violet], nodeR = [1.2, 2.6] }) {
  registerTwinkle(doc)
  const r = rng(seed)
  const pts = []
  for (let tries = 0; pts.length < nodes && tries < nodes * 60; tries += 1) {
    const p = { x: x + r() * w, y: y + r() * hgt }
    if (inside(p.x, p.y, avoid, 10)) continue
    if (pts.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < minDist)) continue
    pts.push(p)
  }
  const seen = new Set()
  const edges = []
  pts.forEach((p, i) => {
    const near = pts
      .map((q, j) => ({ j, d: Math.hypot(q.x - p.x, q.y - p.y) }))
      .filter((e) => e.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, k)
    for (const { j, d } of near) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (seen.has(key) || d > minDist * 3.2) continue
      seen.add(key)
      edges.push({ a: p, b: pts[j], d })
    }
  })
  const lines = edges.map((e) => `M${n(e.a.x)} ${n(e.a.y)}L${n(e.b.x)} ${n(e.b.y)}`).join('')
  const out = [h('path', { d: lines, stroke: color, 'stroke-width': 0.8, opacity: edgeOpacity })]
  const twinkleGroups = [[], [], []]
  pts.forEach((p, i) => {
    const size = r.range(nodeR[0], nodeR[1])
    const c = r() < 0.7 ? '#c7d7ff' : r.pick(pulseColors)
    const node = h('circle', { cx: p.x, cy: p.y, r: size, fill: c, opacity: 0.85 }) + (size > 2.1 ? h('circle', { cx: p.x, cy: p.y, r: size * 3.2, fill: c, opacity: 0.1 }) : '')
    twinkleGroups[i % 3].push(node)
  })
  out.push(g({ style: anim('jr-tw', 6.4, 0.7) }, twinkleGroups[0]), g({ style: anim('jr-tw', 8.8, 2.9) }, twinkleGroups[1]), g({}, twinkleGroups[2]))
  const longest = [...edges].sort((a, b) => b.d - a.d).slice(0, pulses)
  longest.forEach((e, i) => {
    const forward = r() < 0.5
    const [a, b] = forward ? [e.a, e.b] : [e.b, e.a]
    out.push(pulseAlong(doc, { d: `M${n(a.x)} ${n(a.y)}L${n(b.x)} ${n(b.y)}`, color: pulseColors[i % pulseColors.length], dur: r.range(3.2, 5.6), delay: r.range(0, 5), length: 22, width: 1.3, rest: r.range(0.25, 0.55) }))
  })
  return { markup: g({}, out), nodes: pts, edges }
}

// Gentle vertical float for a group (badges, cards).
export function floatStyle(doc, { dur = 6, delay = 0, dist = 3 } = {}) {
  const key = `float-${dist}`
  doc.css(key, `@keyframes jr-${key}{0%,100%{transform:translateY(0)}50%{transform:translateY(-${dist}px)}}`)
  return anim(`jr-${key}`, dur, delay)
}

export function blinkStyle(doc, { dur = 1.1, delay = 0 } = {}) {
  doc.css('blink-k', '@keyframes jr-blink{0%,49%{opacity:1}50%,100%{opacity:0}}')
  return anim('jr-blink', dur, delay, 'steps(1,end)')
}

// Live-status dot: solid core + expanding ring.
export function liveDot(doc, { cx, cy, r = 3.5, color = C.green }) {
  doc.css('ping-k', '@keyframes jr-ping{0%{transform:scale(1);opacity:.6}80%,100%{transform:scale(2.6);opacity:0}}')
  return g(
    {},
    h('circle', { cx, cy, r, fill: color, opacity: 0, style: `transform-box:fill-box;transform-origin:center;${anim('jr-ping', 2.4, 0, 'ease-out')}` }),
    h('circle', { cx, cy, r, fill: color }),
  )
}
