// Credentials: the Credly badges (assets/generated/credly.json, refreshed monthly), newest first.

import { C, PAD, W } from '../core/tokens.mjs'
import { truncate, wrap } from '../core/fonts.mjs'
import { dateIn } from '../core/format.mjs'
import { floatStyle, glow, starfield } from '../core/motion.mjs'
import { createDoc, dataUri, g, h, txt } from '../core/svg.mjs'
import { card, footer, FOOTER_H, frame, header, HEADER_H } from './shared/panel.mjs'

const PER_ROW = 5
const GAP = 12
const CARD_H = 250
const BADGE = 96

export default {
  name: 'credentials',
  async render({ credly }) {
    const badges = credly.badges ?? []
    const rows = Math.max(1, Math.ceil(badges.length / PER_ROW))
    const top = HEADER_H + 24
    const H = top + rows * CARD_H + (rows - 1) * GAP + 24 + FOOTER_H
    const synced = credly.fetchedAt ? dateIn(credly.fetchedAt) : '—'
    const doc = createDoc({
      width: W,
      height: H,
      title: 'Credentials',
      desc: badges.length
        ? `${badges.length} Credly badges: ${badges.map((b) => `${b.name} (${b.issuer ?? 'Credly'}, ${dateIn(b.issuedAt, { month: 'short', year: 'numeric' })})`).join('; ')}.`
        : 'Credly badges.',
    })
    const f = frame(doc, { height: H })
    const out = [f.open]
    out.push(header(doc, { icon: 'award', title: 'Credentials', subtitle: 'Verified badges on Credly, synced every month', pills: [{ text: `${badges.length} ${badges.length === 1 ? 'badge' : 'badges'}`, icon: 'shield-check' }] }))
    out.push(starfield(doc, { x: 0, y: HEADER_H, w: W, h: H - HEADER_H - FOOTER_H, count: 36, seed: 'cred-stars', flares: 2, avoid: [{ x: PAD, y: top, w: W - PAD * 2, h: rows * CARD_H + (rows - 1) * GAP }] }))

    const cardW = (W - PAD * 2 - GAP * (PER_ROW - 1)) / PER_ROW
    badges.forEach((b, i) => {
      const row = Math.floor(i / PER_ROW)
      const inRow = Math.min(PER_ROW, badges.length - row * PER_ROW)
      // Centre an incomplete last row.
      const offset = ((PER_ROW - inRow) * (cardW + GAP)) / 2
      const x = PAD + offset + (i % PER_ROW) * (cardW + GAP)
      const y = top + row * (CARD_H + GAP)
      const cx = x + cardW / 2
      out.push(card(doc, { x, y, w: cardW, h: CARD_H, r: 14, glowColor: i % 2 ? C.violet : C.blue }))
      out.push(glow(doc, { cx, cy: y + 20 + BADGE / 2, rx: BADGE * 0.75, color: i % 2 ? C.violet : C.blue, opacity: 0.4, breathe: 7, delay: i * 1.3 }))
      out.push(g({ style: floatStyle(doc, { dur: 6 + (i % 3), delay: i * 1.1, dist: 3 }) }, h('image', { href: dataUri(b.image.mime, b.image.data), x: cx - BADGE / 2, y: y + 20, width: BADGE, height: BADGE })))
      const lines = wrap(b.name, 'semibold', 12.5, cardW - 20)
      const shown = lines.length > 4 ? [...lines.slice(0, 3), truncate(lines.slice(3).join(' '), 'semibold', 12.5, cardW - 20)] : lines
      shown.forEach((line, j) => out.push(txt(doc, { x: cx, y: y + 20 + BADGE + 26 + j * 16, text: line, face: 'semibold', size: 12.5, fill: C.text, anchor: 'middle' })))
      const after = y + 20 + BADGE + 26 + shown.length * 16
      out.push(txt(doc, { x: cx, y: after + 4, text: truncate(b.issuer ?? 'Credly', 'sans', 12, cardW - 24), face: 'sans', size: 12, fill: C.muted, anchor: 'middle' }))
      out.push(txt(doc, { x: cx, y: y + CARD_H - 18, text: dateIn(b.issuedAt, { month: 'short', year: 'numeric' }).toUpperCase(), face: 'mono', size: 10.5, tracking: 0.08, fill: C.faint, anchor: 'middle' }))
    })
    if (!badges.length) out.push(txt(doc, { x: W / 2, y: top + CARD_H / 2, text: 'Badges sync from Credly on the 1st of each month.', face: 'sans', size: 14, fill: C.muted, anchor: 'middle' }))

    out.push(f.close)
    out.push(footer(doc, { y: H - FOOTER_H, left: [['Source', `Credly · ${credly.username ?? 'isc-joserodriguez'}`]], right: [['Synced', synced]] }))
    return [{ path: 'assets/generated/credentials.svg', svg: await doc.render(out.join('')) }]
  },
}
