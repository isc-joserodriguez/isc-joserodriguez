// Contribution activity: 53-week heatmap, monthly trend, weekday split and yearly totals.

import { C, HEAT, PAD, W } from '../core/tokens.mjs'
import { measure } from '../core/fonts.mjs'
import { compact, dateIn, dateRange, int, WEEKDAYS } from '../core/format.mjs'
import { liveDot, starfield } from '../core/motion.mjs'
import { createDoc, g, h, linearGradient, n, rich, txt } from '../core/svg.mjs'
import { footer, FOOTER_H, frame, freshness, header, HEADER_H } from './shared/panel.mjs'

const CELL = 11
const STEP = 14

function smooth(points) {
  if (points.length < 2) return ''
  let d = `M${n(points[0][0])} ${n(points[0][1])}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`
  }
  return d
}

const niceMax = (v) => {
  if (v <= 0) return 4
  const mag = 10 ** Math.floor(Math.log10(v))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * mag * 4 >= v) * mag
  return step * 4
}

// Sunday-aligned columns of { date, count, level } (null for padding before the first day).
function weeks(calendar) {
  if (!calendar.length) return []
  const first = new Date(`${calendar[0].date}T12:00:00Z`).getUTCDay()
  const cells = [...Array(first).fill(null), ...calendar]
  const cols = []
  for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7))
  return cols
}

export default {
  name: 'activity',
  async render({ metrics }) {
    const c = metrics.contributions ?? {}
    const calendar = c.calendar ?? []
    const monthly = c.monthly ?? []
    const weekday = c.weekday ?? []
    const byYear = c.byYear ?? []
    const fresh = freshness(metrics)

    const summaryY = HEADER_H
    const heatY = summaryY + 92
    const gridTop = heatY + 64
    const trendY = gridTop + 7 * STEP + 34
    const chart = { x: 70, y: trendY + 44, w: W - PAD - 70, h: 130 }
    const splitY = chart.y + chart.h + 46
    const splitH = 236
    const H = splitY + splitH + FOOTER_H

    const range = calendar.length ? dateRange(calendar[0].date, calendar.at(-1).date) : '—'
    const doc = createDoc({
      width: W,
      height: H,
      title: 'Contribution activity',
      desc:
        `${int(c.lastYear)} contributions between ${range}, on ${int(c.activeDays)} active days` +
        (c.bestDay ? `, peaking at ${int(c.bestDay.count)} on ${dateIn(c.bestDay.date)}` : '') +
        `. Monthly totals: ${monthly.map((m) => `${dateIn(`${m.month}-15`, { month: 'short', year: 'numeric' })} ${m.total}`).join(', ')}. ` +
        `By weekday: ${weekday.map((v, i) => `${WEEKDAYS[i]} ${v}`).join(', ')}. By year: ${byYear.map((y) => `${y.year} ${y.total}`).join(', ')}.`,
    })
    const f = frame(doc, { height: H })
    const out = [f.open]
    out.push(header(doc, { icon: 'calendar-days', title: 'Contribution activity', subtitle: 'Every contribution on GitHub, day by day', pills: [{ text: range, icon: 'calendar' }, { text: fresh.text, dot: fresh.dot, live: fresh.live, tone: fresh.tone }] }))
    out.push(starfield(doc, { x: 420, y: summaryY + 8, w: W - 420, h: 80, count: 26, seed: 'act-stars', flares: 2 }))

    // Summary.
    out.push(rich(doc, { x: PAD, y: summaryY + 48, size: 24, parts: [{ text: `${int(c.lastYear)} contributions`, face: 'head', fill: C.text }, { text: ' in the last year', face: 'head', fill: C.muted }] }).markup)
    const peak = c.bestDay ? ` · peak of ${int(c.bestDay.count)} on ${dateIn(c.bestDay.date)}` : ''
    out.push(txt(doc, { x: PAD, y: summaryY + 72, text: `${int(c.activeDays)} active days · ${Number.isFinite(c.dailyAverage) ? c.dailyAverage.toFixed(1) : '—'} per day${peak}`, face: 'sans', size: 13, fill: C.muted }))
    out.push(h('path', { d: `M0 ${heatY}H${W}`, stroke: C.border }))

    // Heatmap.
    const cols = weeks(calendar)
    const gridX = PAD + 34
    out.push(txt(doc, { x: PAD, y: heatY + 30, text: 'CONTRIBUTION GRAPH', face: 'monoMedium', size: 10.5, tracking: 0.1, fill: C.faint }))
    // Legend: Less ▢▢▢▢▢▢ More, right-aligned.
    const moreW = measure('More', 'sans', 11.5) + 6
    const legendX = W - PAD - moreW - HEAT.length * STEP + 3
    out.push(txt(doc, { x: legendX - 6, y: heatY + 30, text: 'Less', face: 'sans', size: 11.5, fill: C.faint, anchor: 'end' }))
    out.push(g({}, HEAT.map((col, i) => h('rect', { x: legendX + i * STEP, y: heatY + 21, width: CELL, height: CELL, rx: 2.5, fill: col }))))
    out.push(txt(doc, { x: W - PAD, y: heatY + 30, text: 'More', face: 'sans', size: 11.5, fill: C.faint, anchor: 'end' }))

    const max = Math.max(1, ...calendar.map((d) => d.count))
    const levelOf = (d) => {
      if (!d || !d.count) return 0
      if (d.count === max) return 5
      return Math.min(4, Math.max(1, d.level || 1))
    }
    let lastMonth = null
    const cellsByLevel = HEAT.map(() => '')
    let peakCell = null
    cols.forEach((col, ci) => {
      const firstReal = col.find(Boolean)
      if (firstReal) {
        const m = firstReal.date.slice(0, 7)
        const dom = Number(firstReal.date.slice(8, 10))
        if (m !== lastMonth && dom <= 7 && ci < cols.length - 1) {
          out.push(txt(doc, { x: gridX + ci * STEP, y: gridTop - 10, text: dateIn(firstReal.date, { month: 'short' }), face: 'sans', size: 11, fill: C.muted }))
        }
        lastMonth = m
      }
      col.forEach((d, ri) => {
        if (!d) return
        const x = gridX + ci * STEP
        const y = gridTop + ri * STEP
        const lvl = levelOf(d)
        cellsByLevel[lvl] += `M${n(x + 2.5)} ${n(y)}h${CELL - 5}a2.5 2.5 0 0 1 2.5 2.5v${CELL - 5}a2.5 2.5 0 0 1-2.5 2.5h-${CELL - 5}a2.5 2.5 0 0 1-2.5-2.5v-${CELL - 5}a2.5 2.5 0 0 1 2.5-2.5z`
        if (lvl === 5 && !peakCell) peakCell = { x, y }
      })
    })
    cellsByLevel.forEach((d, lvl) => {
      if (d) out.push(h('path', { d, fill: HEAT[lvl] }))
    })
    for (const [ri, label] of [[1, 'Mon'], [3, 'Wed'], [5, 'Fri']]) out.push(txt(doc, { x: PAD, y: gridTop + ri * STEP + 9, text: label, face: 'sans', size: 11, fill: C.faint }))
    if (peakCell) {
      out.push(h('rect', { x: peakCell.x - 2.5, y: peakCell.y - 2.5, width: CELL + 5, height: CELL + 5, rx: 4, stroke: C.cyan, 'stroke-width': 1.2 }))
      out.push(liveDot(doc, { cx: peakCell.x + CELL / 2, cy: peakCell.y + CELL / 2, r: 2, color: '#e0fbff' }))
    }
    // Slow scan line across the grid.
    if (cols.length) {
      const scan = linearGradient(doc, { stops: [[0, C.cyan, 0], [0.5, C.cyan, 0.22], [1, C.cyan, 0]] })
      const gw = cols.length * STEP
      doc.css('scan-k', `@keyframes jr-scan{0%{transform:translateX(0);opacity:0}8%{opacity:1}85%{opacity:1}100%{transform:translateX(${n(gw)}px);opacity:0}}`)
      out.push(h('rect', { x: gridX - 40, y: gridTop - 4, width: 40, height: 7 * STEP + 4, fill: `url(#${scan})`, opacity: 0, style: 'animation:jr-scan 9s linear -3s infinite' }))
    }
    out.push(h('path', { d: `M0 ${trendY}H${W}`, stroke: C.border }))

    // Monthly trend.
    out.push(txt(doc, { x: PAD, y: trendY + 30, text: 'MONTHLY TREND', face: 'monoMedium', size: 10.5, tracking: 0.1, fill: C.faint }))
    if (monthly.length > 1) {
      const avg = monthly.reduce((s, m) => s + m.total, 0) / monthly.length
      out.push(rich(doc, { x: W - PAD, y: trendY + 30, anchor: 'end', size: 12.5, parts: [{ text: int(avg), face: 'semibold', fill: C.text }, { text: ' avg / month', face: 'sans', fill: C.muted }] }).markup)
      const top = niceMax(Math.max(...monthly.map((m) => m.total)))
      for (let i = 0; i <= 4; i += 1) {
        const y = chart.y + chart.h - (i / 4) * chart.h
        out.push(h('path', { d: `M${chart.x} ${n(y)}H${chart.x + chart.w}`, stroke: C.guide, 'stroke-dasharray': i ? '2 4' : undefined }))
        out.push(txt(doc, { x: chart.x - 12, y: y + 4, text: compact((top * i) / 4), face: 'mono', size: 10, fill: C.faint, anchor: 'end' }))
      }
      const pts = monthly.map((m, i) => [chart.x + (i / (monthly.length - 1)) * chart.w, chart.y + chart.h - (m.total / top) * chart.h])
      const line = smooth(pts)
      const area = linearGradient(doc, { stops: [[0, C.blue, 0.38], [1, C.blue, 0]], x1: 0, y1: 0, x2: 0, y2: 1 })
      const stroke = linearGradient(doc, { stops: [[0, C.blue], [0.6, C.violet], [1, C.cyan]], units: 'userSpaceOnUse', x1: chart.x, x2: chart.x + chart.w, y1: 0, y2: 0 })
      out.push(h('path', { d: `${line}L${n(chart.x + chart.w)} ${chart.y + chart.h}L${chart.x} ${chart.y + chart.h}Z`, fill: `url(#${area})` }))
      // Average line.
      const ay = chart.y + chart.h - (avg / top) * chart.h
      out.push(h('path', { d: `M${chart.x} ${n(ay)}H${chart.x + chart.w}`, stroke: C.muted, 'stroke-dasharray': '4 4', opacity: 0.5 }))
      // Line draws itself once when the image loads; the resting state is fully drawn.
      doc.css('draw-k', '@keyframes jr-draw{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}')
      out.push(h('path', { d: line, stroke: `url(#${stroke})`, 'stroke-width': 2.2, pathLength: 100, 'stroke-dasharray': '100 100', style: 'animation:jr-draw 2.6s ease-out .3s both' }))
      monthly.forEach((m, i) => {
        const [px] = pts[i]
        out.push(txt(doc, { x: px, y: chart.y + chart.h + 20, text: dateIn(`${m.month}-15`, { month: 'short' }), face: 'sans', size: 11, fill: C.muted, anchor: 'middle' }))
      })
      const pi = monthly.reduce((bi, m, i) => (m.total > monthly[bi].total ? i : bi), 0)
      const [px, py] = pts[pi]
      out.push(h('path', { d: `M${n(px)} ${n(py)}V${chart.y + chart.h}`, stroke: C.borderHi, 'stroke-dasharray': '2 3' }))
      out.push(h('circle', { cx: px, cy: py, r: 5, fill: C.bg, stroke: C.violet, 'stroke-width': 2 }))
      const label = `${int(monthly[pi].total)}  ${dateIn(`${monthly[pi].month}-15`, { month: 'short', year: 'numeric' }).toUpperCase()}`
      const lw = measure(label, 'monoMedium', 11) + 26
      const bx = Math.min(Math.max(px - lw / 2, chart.x), chart.x + chart.w - lw)
      out.push(h('rect', { x: bx + 0.5, y: py - 36.5, width: lw - 1, height: 23, rx: 7, fill: C.surface2, stroke: C.borderHi }))
      out.push(h('circle', { cx: bx + 12, cy: py - 25, r: 3, fill: C.violet }))
      out.push(txt(doc, { x: bx + 20, y: py - 21, text: label, face: 'monoMedium', size: 11, fill: C.text }))
      const lp = pts.at(-1)
      out.push(liveDot(doc, { cx: lp[0], cy: lp[1], r: 3, color: C.cyan }))
    }
    out.push(h('path', { d: `M0 ${splitY}H${W}M${W / 2} ${splitY}V${splitY + splitH}`, stroke: C.border }))

    // By weekday.
    const colW = W / 2 - PAD * 1.5
    out.push(txt(doc, { x: PAD, y: splitY + 32, text: 'BY WEEKDAY', face: 'monoMedium', size: 10.5, tracking: 0.1, fill: C.faint }))
    const wTotal = weekday.reduce((a, b) => a + b, 0) || 1
    const wMax = Math.max(1, ...weekday)
    const barX = PAD + 92
    const barW = colW - 92 - 86
    const busy = linearGradient(doc, { stops: [[0, C.blue], [1, C.violet]] })
    weekday.forEach((v, i) => {
      const y = splitY + 52 + i * 25
      const top = i === c.busiestWeekday
      out.push(txt(doc, { x: PAD, y: y + 12, text: WEEKDAYS[i], face: top ? 'semibold' : 'sans', size: 12.5, fill: top ? C.text : C.text2 }))
      out.push(h('rect', { x: barX, y: y + 2, width: barW, height: 14, rx: 4, fill: C.surface2 }))
      out.push(h('rect', { x: barX, y: y + 2, width: Math.max(4, (v / wMax) * barW), height: 14, rx: 4, fill: top ? `url(#${busy})` : '#1d3a74' }))
      out.push(txt(doc, { x: barX + barW + 44, y: y + 13, text: int(v), face: 'mono', size: 11, fill: C.text2, anchor: 'end', tnum: true }))
      out.push(txt(doc, { x: W / 2 - PAD / 2, y: y + 13, text: `${Math.round((v / wTotal) * 100)}%`, face: 'mono', size: 11, fill: top ? '#c99bf5' : C.faint, anchor: 'end', tnum: true }))
    })

    // By year.
    const yx = W / 2 + PAD / 2
    out.push(txt(doc, { x: yx, y: splitY + 32, text: 'BY YEAR', face: 'monoMedium', size: 10.5, tracking: 0.1, fill: C.faint }))
    if (byYear.length) {
      const yMax = Math.max(1, ...byYear.map((y) => y.total))
      const areaW = W - PAD - yx
      const bw = Math.min(30, (areaW - (byYear.length - 1) * 8) / byYear.length)
      const stepX = (areaW - bw) / Math.max(1, byYear.length - 1)
      const base = splitY + splitH - 34
      const maxH = 132
      const cur = linearGradient(doc, { stops: [[0, C.cyan], [1, C.blue]], x1: 0, y1: 0, x2: 0, y2: 1 })
      byYear.forEach((y, i) => {
        const bx = yx + i * stepX
        const bh = Math.max(3, (y.total / yMax) * maxH)
        const last = i === byYear.length - 1
        out.push(h('rect', { x: bx, y: base - bh, width: bw, height: bh, rx: 4, fill: last ? `url(#${cur})` : '#1d3a74' }))
        out.push(txt(doc, { x: bx + bw / 2, y: base - bh - 7, text: compact(y.total), face: 'mono', size: 10, fill: last ? C.text : C.muted, anchor: 'middle' }))
        out.push(txt(doc, { x: bx + bw / 2, y: base + 16, text: `’${String(y.year).slice(2)}`, face: last ? 'monoBold' : 'mono', size: 10.5, fill: last ? C.text : C.faint, anchor: 'middle' }))
      })
      out.push(txt(doc, { x: yx + (byYear.length - 1) * stepX + bw / 2, y: base + 29, text: 'YTD', face: 'monoMedium', size: 9, fill: C.cyan, anchor: 'middle', tracking: 0.08 }))
    }

    out.push(f.close)
    out.push(footer(doc, { y: H - FOOTER_H, left: [['Source', 'GitHub contribution calendar']], right: [['Peak', c.bestDay ? `${int(c.bestDay.count)} on ${dateIn(c.bestDay.date)}` : '—']] }))
    return [{ path: 'assets/generated/activity.svg', svg: await doc.render(out.join('')) }]
  },
}
