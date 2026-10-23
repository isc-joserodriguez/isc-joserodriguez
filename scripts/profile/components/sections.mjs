// Section headers: numbered mono eyebrow + two-tone headline (accent in the brand gradient).
// Transparent, so each comes in a dark and a light variant for GitHub's two themes.

import { C, LIGHT, W } from '../core/tokens.mjs'
import { measure } from '../core/fonts.mjs'
import { createDoc, g, h, linearGradient, n, txt } from '../core/svg.mjs'
import { sections } from '../content.mjs'

const H = 96

async function header(key, s, theme) {
  const ink = theme === 'light' ? LIGHT : { text: C.text, faint: C.faint, border: C.border, blue: C.blue, violet: C.violet, cyan: '#7eeaf8' }
  const doc = createDoc({ width: W, height: H, title: `${s.n} ${s.eyebrow}`, desc: `${s.eyebrow}: ${s.lead} ${s.accent}` })
  const out = []
  const eyebrow = `${s.n}  /  ${s.eyebrow.toUpperCase()}`
  out.push(h('rect', { x: 0, y: 14, width: 6, height: 6, rx: 1.5, fill: ink.cyan, transform: `rotate(45 3 17)` }))
  out.push(txt(doc, { x: 18, y: 21, text: eyebrow, face: 'monoMedium', size: 12, tracking: 0.12, fill: ink.cyan }))
  const size = 31
  const leadW = measure(`${s.lead} `, 'head', size, { tracking: -0.025 })
  const accentW = measure(s.accent, 'head', size, { tracking: -0.025 })
  const grad = linearGradient(doc, { stops: [[0, ink.blue], [1, ink.violet]], units: 'userSpaceOnUse', x1: leadW, x2: leadW + accentW, y1: 0, y2: 0 })
  out.push(txt(doc, { x: 0, y: 64, text: s.lead, face: 'head', size, tracking: -0.025, fill: ink.text }))
  out.push(txt(doc, { x: leadW, y: 64, text: s.accent, face: 'head', size, tracking: -0.025, fill: `url(#${grad})` }))
  const rule = linearGradient(doc, { stops: [[0, ink.blue, 0.9], [0.35, ink.violet, 0.5], [1, ink.border, 0]], units: 'userSpaceOnUse', x1: 0, x2: W, y1: 0, y2: 0 })
  out.push(h('path', { d: `M0 ${H - 12.5}H${W}`, stroke: `url(#${rule})` }))
  out.push(h('path', { d: `M${n(leadW + accentW + 18)} ${H - 16.5}v8`, stroke: ink.faint, opacity: 0.7 }))
  const suffix = theme === 'light' ? '-light' : ''
  return { path: `assets/sections/${key}${suffix}.svg`, svg: await doc.render(g({}, out)) }
}

export default {
  name: 'sections',
  async render() {
    const jobs = []
    for (const [key, s] of Object.entries(sections)) for (const theme of ['dark', 'light']) jobs.push(header(key, s, theme))
    return Promise.all(jobs)
  },
}
