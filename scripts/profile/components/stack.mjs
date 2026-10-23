// Tech stack: one row per domain, brand-coloured chips that wrap; daily drivers get a gradient
// border and brighter ink.

import { C, PAD, W } from '../core/tokens.mjs'
import { measure } from '../core/fonts.mjs'
import { brand, glyph } from '../core/icons.mjs'
import { starfield } from '../core/motion.mjs'
import { createDoc, h, linearGradient, txt } from '../core/svg.mjs'
import { stack, START_YEAR } from '../content.mjs'
import { footer, FOOTER_H, frame, header, HEADER_H } from './shared/panel.mjs'

const CHIP_H = 30
const GAP = 8
const LEFT = 196
const ROW_PAD = 22

function layoutChips(items, width) {
  const rows = [[]]
  let x = 0
  for (const item of items) {
    const w = Math.ceil(measure(item.name, 'medium', 12.5) + 15 + 8 + 24)
    if (x && x + w > width) {
      rows.push([])
      x = 0
    }
    rows.at(-1).push({ item, x, w })
    x += w + GAP
  }
  return rows
}

export default {
  name: 'stack',
  async render() {
    const areaX = PAD + LEFT
    const areaW = W - PAD - areaX
    const blocks = stack.map((d) => ({ ...d, rows: layoutChips(d.items, areaW) }))
    let y = HEADER_H
    for (const b of blocks) {
      b.y = y
      b.h = ROW_PAD * 2 + b.rows.length * CHIP_H + (b.rows.length - 1) * GAP
      y += b.h
    }
    const H = y + FOOTER_H
    const total = stack.reduce((s, d) => s + d.items.length, 0)
    const core = stack.flatMap((d) => d.items.filter((i) => i.core))
    const doc = createDoc({
      width: W,
      height: H,
      title: 'Tech stack',
      desc: `${total} technologies across ${stack.length} domains. ${stack.map((d) => `${d.domain}: ${d.items.map((i) => i.name).join(', ')}`).join('. ')}. Daily drivers: ${core.map((i) => i.name).join(', ')}.`,
    })
    const f = frame(doc, { height: H })
    const out = [f.open]
    out.push(header(doc, { icon: 'layers', title: 'Tech stack', subtitle: `${total} technologies across ${stack.length} domains`, pills: [{ text: 'Daily driver', dot: C.cyan, tone: 'cyan' }] }))
    out.push(starfield(doc, { x: 0, y: HEADER_H, w: PAD + LEFT - 16, h: H - HEADER_H - FOOTER_H, count: 30, seed: 'stack-stars', avoid: blocks.map((b) => ({ x: PAD, y: b.y + 14, w: 150, h: 50 })) }))
    const coreStroke = linearGradient(doc, { stops: [[0, C.blue], [1, C.violet]], x1: 0, y1: 0, x2: 1, y2: 1 })

    blocks.forEach((b, bi) => {
      if (bi) out.push(h('path', { d: `M${PAD} ${b.y}H${W - PAD}`, stroke: C.border }))
      out.push(txt(doc, { x: PAD, y: b.y + ROW_PAD + 13, text: b.domain.toUpperCase(), face: 'monoMedium', size: 11, tracking: 0.1, fill: C.text2 }))
      const coreCount = b.items.filter((i) => i.core).length
      out.push(txt(doc, { x: PAD, y: b.y + ROW_PAD + 33, text: `${b.items.length} tools${coreCount ? ` · ${coreCount} daily` : ''}`, face: 'sans', size: 12, fill: C.faint }))
      b.rows.forEach((row, ri) => {
        const cy = b.y + ROW_PAD + ri * (CHIP_H + GAP)
        for (const { item, x, w } of row) {
          const cx = areaX + x
          out.push(
            h('rect', {
              x: cx + 0.5,
              y: cy + 0.5,
              width: w - 1,
              height: CHIP_H - 1,
              rx: 8,
              fill: item.core ? C.surface3 : C.surface,
              stroke: item.core ? `url(#${coreStroke})` : C.border,
            }),
          )
          const iy = cy + (CHIP_H - 15) / 2
          if (item.icon) out.push(brand(item.icon, { x: cx + 12, y: iy, size: 15 }))
          else out.push(glyph(item.glyph, { x: cx + 12, y: iy, size: 15, color: item.core ? C.cyan : C.muted }))
          out.push(txt(doc, { x: cx + 12 + 15 + 8, y: cy + CHIP_H / 2 + 4.5, text: item.name, face: 'medium', size: 12.5, fill: item.core ? C.text : C.text2 }))
        }
      })
    })

    out.push(f.close)
    out.push(footer(doc, { y: H - FOOTER_H, left: [['Daily drivers', String(core.length)], ['Total', String(total)]], right: [['Shipping with it since', String(START_YEAR)]] }))
    return [{ path: 'assets/stack.svg', svg: await doc.render(out.join('')) }]
  },
}
