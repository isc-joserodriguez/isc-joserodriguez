// AI-native delivery: the spec-driven, multi-agent pipeline as a diagram (pulses run through it in
// order), the context layer that grounds the agents, four pillars and the toolbox.

import { C, PAD, W } from '../core/tokens.mjs'
import { measure, wrap } from '../core/fonts.mjs'
import { brand, glyph } from '../core/icons.mjs'
import { blinkStyle, dotGrid, glow, orbit, pulseAlong, starfield } from '../core/motion.mjs'
import { createDoc, g, h, linearGradient, n, txt } from '../core/svg.mjs'
import { ai } from '../content.mjs'
import { card, header, HEADER_H, frame, iconTile } from './shared/panel.mjs'

const NAMES = { claude: 'Claude', openai: 'OpenAI', langchain: 'LangChain', n8n: 'n8n', ollama: 'Ollama', copilot: 'Copilot', mcp: 'MCP' }

function stageCard(doc, { cx, cy, stage, accent }) {
  const w = 92
  const hh = 76
  const x = cx - w / 2
  const y = cy - hh / 2
  return g(
    {},
    card(doc, { x, y, w, h: hh, r: 12, fill: C.surface2, stroke: C.borderHi }),
    iconTile(doc, { x: cx - 15, y: y + 10, size: 30, icon: stage.icon, color: accent, fill: C.surface3 }),
    txt(doc, { x: cx, y: y + 56, text: stage.label, face: 'semibold', size: 13, fill: C.text, anchor: 'middle' }),
    txt(doc, { x: cx, y: y + 69, text: stage.sub.toUpperCase(), face: 'mono', size: 9.5, tracking: 0.1, fill: C.faint, anchor: 'middle' }),
  )
}

export default {
  name: 'ai',
  async render() {
    const y0 = HEADER_H + 150 // pipeline axis
    const busY = y0 + 150
    const pillarsY = busY + 64
    const pillarH = 150
    const toolsY = pillarsY + pillarH + 18
    const H = toolsY + 58

    const doc = createDoc({
      width: W,
      height: H,
      title: 'AI-native delivery',
      desc:
        'Spec-driven development pipeline: a spec and a plan feed an orchestrator that fans work out to analysis, code, test and documentation agents, ' +
        'followed by human review and a CI/CD release. MCP servers, RAG, agent Skills and repository memory ground the agents. ' +
        `Pillars: ${ai.pillars.map((p) => `${p.title}, ${p.text}`).join(' ')} Tools: ${ai.tools.map((t) => NAMES[t]).join(', ')}.`,
    })
    const f = frame(doc, { height: H })
    const out = [f.open]
    out.push(header(doc, { icon: 'workflow', title: 'AI-native delivery', subtitle: 'Spec-driven development with multi-agent workflows', pills: [{ text: 'SDD · MCP · RAG' }, { text: 'In production', dot: C.green, live: true, tone: 'green' }] }))

    // Backdrop.
    out.push(dotGrid(doc, { x: 0, y: HEADER_H, w: W, h: busY + 30 - HEADER_H, gap: 20, opacity: 0.07 }))
    out.push(starfield(doc, { x: 0, y: HEADER_H, w: W, h: busY - HEADER_H, count: 60, seed: 'ai-stars', flares: 3, avoid: [{ x: 20, y: y0 - 130, w: 820, h: 260 }] }))
    out.push(glow(doc, { cx: 312, cy: y0, rx: 190, ry: 150, color: C.blue, opacity: 0.32, breathe: 7 }))
    out.push(glow(doc, { cx: 486, cy: y0, rx: 150, ry: 170, color: C.violet, opacity: 0.2, breathe: 9, delay: 3 }))

    // Geometry.
    const spec = { cx: 78, stage: ai.stages[0] }
    const plan = { cx: 198, stage: ai.stages[1] }
    const hub = { cx: 312, r: 38 }
    const agentX = 422
    const agentW = 128
    const agentYs = [-99, -33, 33, 99].map((d) => y0 + d)
    const review = { cx: 666, stage: ai.finish[0] }
    const ship = { cx: 782, stage: ai.finish[1] }

    const T = 4.8 // one pipeline run
    const phase = (offset) => n((((T - offset) % T) + T) % T)
    const edge = (d, offset, color = C.cyan) =>
      h('path', { d, stroke: C.borderHi, 'stroke-width': 1.2 }) +
      pulseAlong(doc, { d, color, dur: T, delay: phase(offset), length: 34, width: 1.8, rest: 0.55 })

    out.push(edge(`M${spec.cx + 46} ${y0}H${plan.cx - 46}`, 0))
    out.push(edge(`M${plan.cx + 46} ${y0}H${hub.cx - hub.r - 4}`, 0.5))
    agentYs.forEach((ay, i) => {
      const x1 = hub.cx + hub.r + 4
      const xm = (x1 + agentX) / 2
      out.push(edge(`M${x1} ${y0}C${xm} ${y0} ${xm} ${ay} ${agentX} ${ay}`, 1.05 + i * 0.08, [C.cyan, C.blue, C.violet, C.cyan][i]))
      const x2 = agentX + agentW
      const xr = review.cx - 46
      const xn = (x2 + xr) / 2
      out.push(edge(`M${x2} ${ay}C${xn} ${ay} ${xn} ${y0} ${xr} ${y0}`, 2.2 + i * 0.08, C.violet))
    })
    out.push(edge(`M${review.cx + 46} ${y0}H${ship.cx - 46}`, 3.1, C.green))

    // Stage cards.
    out.push(stageCard(doc, { cx: spec.cx, cy: y0, stage: spec.stage, accent: '#8fb6ff' }))
    out.push(stageCard(doc, { cx: plan.cx, cy: y0, stage: plan.stage, accent: '#8fb6ff' }))
    out.push(stageCard(doc, { cx: review.cx, cy: y0, stage: review.stage, accent: '#c99bf5' }))
    out.push(stageCard(doc, { cx: ship.cx, cy: y0, stage: ship.stage, accent: C.green }))

    // Orchestrator hub.
    const ring = linearGradient(doc, { stops: [[0, C.blue], [0.5, C.violet], [1, C.cyan]], x1: 0, y1: 0, x2: 1, y2: 1 })
    out.push(orbit(doc, { cx: hub.cx, cy: y0, r: hub.r + 14, count: 3, dur: 14, seed: 'hub', dot: 1.8, color: [C.cyan, C.violet, C.blue], trackOpacity: 0.45 }))
    out.push(h('circle', { cx: hub.cx, cy: y0, r: hub.r, fill: C.surface2, stroke: `url(#${ring})`, 'stroke-width': 2 }))
    out.push(h('circle', { cx: hub.cx, cy: y0, r: hub.r - 8, fill: C.surface3, stroke: C.borderHi }))
    out.push(glyph('bot', { x: hub.cx - 14, y: y0 - 14, size: 28, color: C.text, width: 1.7 }))
    out.push(txt(doc, { x: hub.cx, y: y0 + hub.r + 30, text: 'ORCHESTRATOR', face: 'monoMedium', size: 10, tracking: 0.12, fill: '#7eeaf8', anchor: 'middle' }))

    // Agents.
    ai.agents.forEach((a, i) => {
      const ay = agentYs[i]
      const top = ay - 19
      out.push(card(doc, { x: agentX, y: top, w: agentW, h: 38, r: 10, fill: C.surface2, stroke: C.borderHi, lit: false }))
      out.push(glyph(a.icon, { x: agentX + 12, y: ay - 8, size: 16, color: [C.cyan, '#8fb6ff', '#c99bf5', C.cyan][i] }))
      out.push(txt(doc, { x: agentX + 36, y: ay + 4.5, text: a.label, face: 'medium', size: 13, fill: C.text }))
      out.push(h('circle', { cx: agentX + agentW - 16, cy: ay, r: 3, fill: C.cyan, style: blinkStyle(doc, { dur: 1.6 + i * 0.35, delay: i * 0.4 }) }))
    })
    out.push(txt(doc, { x: agentX + agentW / 2, y: agentYs[0] - 31, text: 'AGENTS · PARALLEL', face: 'monoMedium', size: 10, tracking: 0.12, fill: C.faint, anchor: 'middle' }))

    // Context layer: grounds the hub and the agents.
    const busX = 32
    const busW = W - 64
    out.push(h('rect', { x: busX + 0.5, y: busY - 21.5, width: busW - 1, height: 43, rx: 12, fill: C.surface, stroke: C.borderHi, 'stroke-dasharray': '4 4' }))
    out.push(txt(doc, { x: busX + 18, y: busY + 4, text: 'CONTEXT LAYER', face: 'monoMedium', size: 10.5, tracking: 0.12, fill: '#7eeaf8' }))
    let cx = busX + 150
    const chipIcons = ['plug', 'database', 'puzzle', 'history']
    ai.context.forEach((label, i) => {
      const w = measure(label, 'medium', 12) + 42
      out.push(h('rect', { x: cx + 0.5, y: busY - 13.5, width: w - 1, height: 27, rx: 8, fill: C.surface3, stroke: C.borderHi }))
      out.push(glyph(chipIcons[i], { x: cx + 10, y: busY - 7, size: 14, color: '#8fb6ff' }))
      out.push(txt(doc, { x: cx + 30, y: busY + 4.5, text: label, face: 'medium', size: 12, fill: C.text2 }))
      cx += w + 10
    })
    for (const [x, top, off] of [[hub.cx, y0 + hub.r + 38, 0.3], [agentX + agentW / 2, agentYs[3] + 19, 1.4]]) {
      const d = `M${x} ${busY - 22}V${top}`
      out.push(h('path', { d, stroke: C.borderHi, 'stroke-dasharray': '3 4' }))
      out.push(pulseAlong(doc, { d, color: C.cyan, dur: T, delay: phase(off), length: 40, width: 1.6, rest: 0.6 }))
    }

    // Pillars.
    const gap = 12
    const pw = (W - PAD * 2 - gap * 3) / 4
    const arts = [[C.blue, C.cyan], [C.blue, C.violet], [C.violet, '#ec4899'], [C.cyan, C.green]]
    ai.pillars.forEach((p, i) => {
      const x = PAD + i * (pw + gap)
      const y = pillarsY
      out.push(card(doc, { x, y, w: pw, h: pillarH, r: 14 }))
      const clip = doc.uid('pc')
      doc.defs(h('clipPath', { id: clip }, h('rect', { x, y, width: pw, height: 56, rx: 14 }), h('rect', { x, y: y + 20, width: pw, height: 36 })))
      const art = linearGradient(doc, { stops: [[0, arts[i][0], 0.55], [1, arts[i][1], 0.45]], x1: 0, y1: 0, x2: 1, y2: 1 })
      const fade = linearGradient(doc, { stops: [[0, C.surface, 0], [1, C.surface, 1]], x1: 0, y1: 0, x2: 0, y2: 1 })
      out.push(g({ 'clip-path': `url(#${clip})` }, h('rect', { x, y, width: pw, height: 56, fill: `url(#${art})` }), h('rect', { x, y: y + 16, width: pw, height: 40, fill: `url(#${fade})` }), orbit(doc, { cx: x + pw / 2, cy: y + 28, r: 34, count: 2, dur: 18 + i * 3, seed: `pillar-${i}`, dot: 1.4, color: '#ffffff', trackOpacity: 0.35 })))
      out.push(iconTile(doc, { x: x + pw / 2 - 17, y: y + 11, size: 34, icon: p.icon, color: '#fff', fill: 'rgba(2,8,23,0.45)', stroke: 'rgba(255,255,255,0.25)', r: 10 }))
      out.push(txt(doc, { x: x + 16, y: y + 80, text: p.title, face: 'title', size: 15, fill: C.text }))
      wrap(p.text, 'sans', 12.5, pw - 30).slice(0, 3).forEach((line, j) => out.push(txt(doc, { x: x + 16, y: y + 101 + j * 17, text: line, face: 'sans', size: 12.5, fill: C.muted })))
    })

    // Toolbox.
    out.push(h('path', { d: `M0 ${toolsY}H${W}`, stroke: C.border }))
    out.push(txt(doc, { x: PAD, y: toolsY + 33, text: 'TOOLBOX', face: 'mono', size: 10.5, tracking: 0.08, fill: C.faint }))
    let tx = PAD + 82
    for (const key of ai.tools) {
      out.push(brand(key, { x: tx, y: toolsY + 20, size: 17 }))
      out.push(txt(doc, { x: tx + 24, y: toolsY + 33, text: NAMES[key], face: 'medium', size: 12.5, fill: C.text2 }))
      tx += 24 + measure(NAMES[key], 'medium', 12.5) + 22
    }
    if (tx > W - PAD + 22) console.warn(`ai: toolbox overflows by ${Math.round(tx - W + PAD - 22)}px`)

    out.push(f.close)
    return [{ path: 'assets/ai.svg', svg: await doc.render(out.join('')) }]
  },
}
