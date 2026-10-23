// About: pixel-art avatar in a gradient ring, intro, and six facets.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { C, PAD, W } from '../core/tokens.mjs'
import { wrap } from '../core/fonts.mjs'
import { glow, liveDot, orbit, starfield } from '../core/motion.mjs'
import { createDoc, dataUri, g, h, linearGradient, n, txt } from '../core/svg.mjs'
import { about, profile, START_YEAR, yearsOfExperience } from '../content.mjs'
import { card, footer, FOOTER_H, frame, iconTile } from './shared/panel.mjs'

const images = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'vendor', 'images.json'), 'utf8'))

function avatar(doc, { cx, cy, r }) {
  const out = []
  out.push(glow(doc, { cx, cy, rx: r * 2.2, color: C.violet, opacity: 0.35, breathe: 8 }))
  out.push(glow(doc, { cx: cx - r * 0.5, cy: cy - r * 0.4, rx: r * 1.6, color: C.blue, opacity: 0.3 }))
  out.push(orbit(doc, { cx, cy, r: r + 22, count: 3, dur: 26, seed: 'about-orbit', dot: 2.2, color: [C.cyan, C.violet, C.blue], trackOpacity: 0.5 }))
  out.push(orbit(doc, { cx, cy, r: r + 40, count: 2, dur: 40, seed: 'about-orbit-2', dot: 1.6, color: [C.blue, C.cyan], reverse: true, trackOpacity: 0.28, dash: '1 7' }))
  const ring = linearGradient(doc, { stops: [[0, C.blue], [0.5, C.violet], [1, C.cyan]], x1: 0, y1: 0, x2: 1, y2: 1 })
  const bg = linearGradient(doc, { stops: [[0, '#14254a'], [1, '#2a1650']], x1: 0, y1: 0, x2: 1, y2: 1 })
  out.push(h('circle', { cx, cy, r: r + 5, fill: C.bg, stroke: `url(#${ring})`, 'stroke-width': 2.5 }))
  out.push(h('circle', { cx, cy, r, fill: `url(#${bg})` }))
  const clip = doc.uid('av')
  doc.defs(h('clipPath', { id: clip }, h('circle', { cx, cy, r })))
  const img = images.avatar
  out.push(
    h('image', {
      href: dataUri(img.mime, img.data),
      x: cx - r,
      y: cy - r + 4,
      width: r * 2,
      height: r * 2,
      'clip-path': `url(#${clip})`,
      style: 'image-rendering:pixelated',
      preserveAspectRatio: 'xMidYMid slice',
    }),
  )
  // Status badge.
  const bx = cx + r * 0.72
  const by = cy + r * 0.72
  out.push(h('circle', { cx: bx, cy: by, r: 11, fill: C.bg, stroke: C.borderHi }))
  out.push(liveDot(doc, { cx: bx, cy: by, r: 5, color: C.green }))
  return out.join('')
}

export default {
  name: 'about',
  async render({ now }) {
    const years = yearsOfExperience(now)
    const intro = profile.intro(years)
    const facets = about.facets
    const cols = 2
    const gap = 12
    const cardW = (W - PAD * 2 - gap) / cols
    const cardH = 90
    const rows = Math.ceil(facets.length / cols)
    const topH = 214
    const gridY = topH + 6
    const H = gridY + rows * cardH + (rows - 1) * gap + 28 + FOOTER_H

    const doc = createDoc({
      width: W,
      height: H,
      title: `About ${profile.name}`,
      desc: `${intro} ${facets.map((f) => `${f.title}: ${f.text}`).join(' ')}`,
    })
    const f = frame(doc, { height: H })
    const out = [f.open]
    out.push(starfield(doc, { x: 0, y: 0, w: W, h: topH, count: 46, seed: 'about-stars', avoid: [{ x: 210, y: 30, w: 620, h: 170 }] }))
    out.push(avatar(doc, { cx: PAD + 82, cy: 112, r: 58 }))

    const tx = 232
    out.push(txt(doc, { x: tx, y: 58, text: `@${profile.handle}  ·  ${profile.location}  ·  UTC−7`.toUpperCase(), face: 'monoMedium', size: 11, tracking: 0.1, fill: C.faint }))
    out.push(txt(doc, { x: tx, y: 94, text: profile.name, face: 'head', size: 30, tracking: -0.025, fill: C.text }))
    const roleGrad = linearGradient(doc, { stops: [[0, '#8fb6ff'], [1, '#c99bf5']], units: 'userSpaceOnUse', x1: tx, x2: tx + 420, y1: 0, y2: 0 })
    out.push(txt(doc, { x: tx, y: 120, text: `${profile.role} at ${profile.company}`, face: 'semibold', size: 14.5, fill: `url(#${roleGrad})` }))
    wrap(intro, 'sans', 14, W - tx - PAD).forEach((line, i) => out.push(txt(doc, { x: tx, y: 150 + i * 21, text: line, face: 'sans', size: 14, fill: C.text2 })))

    facets.forEach((facet, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = PAD + col * (cardW + gap)
      const y = gridY + row * (cardH + gap)
      out.push(card(doc, { x, y, w: cardW, h: cardH, r: 12 }))
      out.push(iconTile(doc, { x: x + 16, y: y + (cardH - 38) / 2, size: 38, icon: facet.icon, color: i % 2 ? '#c99bf5' : '#8fb6ff', fill: C.surface3, r: 10 }))
      const lines = wrap(facet.text, 'sans', 13, cardW - 88)
      if (lines.length > 2) console.warn(`about: facet "${facet.title}" needs ${lines.length} lines; shorten it`)
      const top = y + (lines.length > 1 ? 31 : 39)
      out.push(txt(doc, { x: x + 68, y: top, text: facet.title, face: 'semibold', size: 14.5, fill: C.text }))
      lines.slice(0, 2).forEach((line, j) => out.push(txt(doc, { x: x + 68, y: top + 20 + j * 18, text: line, face: 'sans', size: 13, fill: C.muted })))
    })

    out.push(f.close)
    out.push(
      footer(doc, {
        y: H - FOOTER_H,
        left: [['Based', 'Tepic, Nayarit · MX'], ['Building since', String(START_YEAR)]],
        right: [['Focus', 'AI-native · full stack · leadership']],
      }),
    )
    return [{ path: 'assets/about.svg', svg: await doc.render(out.join('')) }]
  },
}
