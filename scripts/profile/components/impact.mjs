// Impact: eight KPI tiles from the GitHub metrics, each with a small visual. Every field may be
// missing (cache-less first run): tiles then show "—" instead of failing.

import { C, PAD, W } from '../core/tokens.mjs'
import { measure } from '../core/fonts.mjs'
import { glyph } from '../core/icons.mjs'
import { compact, dateIn, int, plural, signedPercent, WEEKDAYS } from '../core/format.mjs'
import { liveDot, starfield } from '../core/motion.mjs'
import { createDoc, g, h, linearGradient, n, txt } from '../core/svg.mjs'
import { card, footer, FOOTER_H, frame, freshness, header, HEADER_H } from './shared/panel.mjs'

const TILE_H = 166
const GAP = 12

const fin = (v) => Number.isFinite(v)

function smooth(points) {
  if (points.length < 2) return ''
  let d = `M${n(points[0][0])} ${n(points[0][1])}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`
  }
  return d
}

function tile(doc, { x, y, w, eyebrow, icon, value, unit, sub, chip, viz, labels }) {
  const out = [card(doc, { x, y, w, h: TILE_H, r: 14 })]
  out.push(txt(doc, { x: x + 18, y: y + 28, text: eyebrow.toUpperCase(), face: 'monoMedium', size: 10, tracking: 0.1, fill: C.faint }))
  out.push(glyph(icon, { x: x + w - 32, y: y + 16, size: 15, color: C.muted }))
  out.push(txt(doc, { x: x + 18, y: y + 68, text: value, face: 'head', size: 31, tracking: -0.03, fill: C.text, tnum: true }))
  if (unit) out.push(txt(doc, { x: x + 18 + measure(value, 'head', 31, { tracking: -0.03, tnum: true }) + 4, y: y + 68, text: unit, face: 'medium', size: 14, fill: C.muted }))
  let sx = x + 18
  if (chip) {
    const cw = measure(chip.text, 'semibold', 11) + 14
    const tone = chip.tone === 'green' ? { fill: '#052a20', stroke: '#0f5a42', ink: '#86efc4' } : { fill: C.surface3, stroke: C.borderHi, ink: C.text2 }
    out.push(h('rect', { x: sx + 0.5, y: y + 78.5, width: cw - 1, height: 19, rx: 9.5, fill: tone.fill, stroke: tone.stroke }))
    out.push(txt(doc, { x: sx + cw / 2, y: y + 92, text: chip.text, face: 'semibold', size: 11, fill: tone.ink, anchor: 'middle', tnum: true }))
    sx += cw + 7
  }
  if (sub) out.push(txt(doc, { x: sx, y: y + 92, text: sub, face: 'sans', size: 12.5, fill: C.muted }))
  if (viz) out.push(viz({ x: x + 18, y: y + 108, w: w - 36, hgt: 30 }))
  if (labels) {
    out.push(txt(doc, { x: x + 18, y: y + 154, text: labels[0], face: 'mono', size: 9.5, tracking: 0.06, fill: C.faint }))
    out.push(txt(doc, { x: x + w - 18, y: y + 154, text: labels[1], face: 'mono', size: 9.5, tracking: 0.06, fill: C.faint, anchor: 'end' }))
  }
  return out.join('')
}

export default {
  name: 'impact',
  async render({ metrics }) {
    const c = metrics.contributions ?? {}
    const u = metrics.user ?? {}
    const pr = metrics.pullRequests ?? {}
    const fresh = freshness(metrics)
    const tileW = (W - PAD * 2 - GAP * 3) / 4
    const rowsY = [HEADER_H + 24, HEADER_H + 24 + TILE_H + GAP]
    const H = rowsY[1] + TILE_H + 24 + FOOTER_H
    const doc = createDoc({
      width: W,
      height: H,
      title: 'Impact: GitHub activity',
      desc:
        `GitHub impact over the last 12 months, including private repositories: ${int(c.lastYear)} contributions` +
        (signedPercent(c.yoyGrowth) ? ` (${signedPercent(c.yoyGrowth)} vs the prior year)` : '') +
        `, ${int(c.allTime)} all-time, ${int(pr.total)} pull requests (${fin(pr.mergeRate) ? Math.round(pr.mergeRate * 100) : '—'}% merged), ` +
        `${int(u.totalRepos)} repositories, a ${int(c.currentStreak?.days)}-day current streak (longest ${int(c.longestStreak?.days)}), ` +
        `best day ${int(c.bestDay?.count)} contributions, ${fin(c.dailyAverage) ? c.dailyAverage.toFixed(1) : '—'} per day on average, busiest on ${WEEKDAYS[c.busiestWeekday] ?? '—'}.`,
    })
    const f = frame(doc, { height: H })
    const out = [f.open]
    out.push(header(doc, { icon: 'activity', title: 'Impact', subtitle: 'GitHub activity across every repository, private ones included', pills: [{ text: 'Last 12 months', icon: 'calendar' }, { text: fresh.text, dot: fresh.dot, live: fresh.live, tone: fresh.tone }] }))
    out.push(starfield(doc, { x: 0, y: HEADER_H, w: W, h: H - HEADER_H - FOOTER_H, count: 50, seed: 'impact-stars', avoid: [{ x: PAD, y: rowsY[0], w: W - PAD * 2, h: TILE_H * 2 + GAP }] }))

    const blue = linearGradient(doc, { stops: [[0, C.blue], [1, C.violet]] })
    const monthly = c.monthly ?? []
    const byYear = c.byYear ?? []
    const weekday = c.weekday ?? []
    const calendar = c.calendar ?? []

    const tiles = [
      {
        eyebrow: 'Contributions',
        icon: 'trending-up',
        value: int(c.lastYear),
        chip: signedPercent(c.yoyGrowth) ? { text: signedPercent(c.yoyGrowth), tone: c.yoyGrowth > 0 ? 'green' : 'neutral' } : null,
        sub: 'vs prior year',
        labels: monthly.length ? [dateIn(`${monthly[0].month}-15`, { month: 'short', year: '2-digit' }).toUpperCase(), dateIn(`${monthly.at(-1).month}-15`, { month: 'short', year: '2-digit' }).toUpperCase()] : null,
        viz: ({ x, y, w, hgt }) => {
          if (monthly.length < 2) return ''
          const max = Math.max(...monthly.map((m) => m.total), 1)
          const pts = monthly.map((m, i) => [x + (i / (monthly.length - 1)) * w, y + hgt - (m.total / max) * (hgt - 4)])
          const line = smooth(pts)
          const area = linearGradient(doc, { stops: [[0, C.blue, 0.45], [1, C.blue, 0]], x1: 0, y1: 0, x2: 0, y2: 1 })
          const last = pts.at(-1)
          return g({}, h('path', { d: `${line}L${n(x + w)} ${y + hgt}L${x} ${y + hgt}Z`, fill: `url(#${area})` }), h('path', { d: line, stroke: `url(#${blue})`, 'stroke-width': 1.8 }), liveDot(doc, { cx: last[0], cy: last[1], r: 2.6, color: C.cyan }))
        },
      },
      {
        eyebrow: 'All-time',
        icon: 'layers',
        value: compact(c.allTime),
        sub: byYear.length ? `Contributions since ${byYear[0].year}` : 'Contributions',
        labels: byYear.length ? [String(byYear[0].year), String(byYear.at(-1).year)] : null,
        viz: ({ x, y, w, hgt }) => {
          if (!byYear.length) return ''
          const max = Math.max(...byYear.map((b) => b.total), 1)
          const bw = (w - (byYear.length - 1) * 3) / byYear.length
          return g(
            {},
            byYear.map((b, i) => {
              const bh = Math.max(2, (b.total / max) * hgt)
              return h('rect', { x: x + i * (bw + 3), y: y + hgt - bh, width: bw, height: bh, rx: 1.5, fill: i === byYear.length - 1 ? `url(#${blue})` : C.surface3, stroke: i === byYear.length - 1 ? undefined : C.borderHi })
            }),
          )
        },
      },
      {
        eyebrow: 'Pull requests',
        icon: 'git-pull-request',
        value: int(pr.total),
        chip: fin(pr.mergeRate) ? { text: `${Math.round(pr.mergeRate * 100)}%`, tone: 'neutral' } : null,
        sub: 'merged',
        labels: [`MERGED ${int(pr.merged)}`, `OPEN ${int(pr.open)}`],
        viz: ({ x, y, w, hgt }) => {
          const segs = 36
          const sw = (w - (segs - 1) * 2) / segs
          const merged = fin(pr.mergeRate) ? Math.round(pr.mergeRate * segs) : 0
          return g({}, Array.from({ length: segs }, (_, i) => h('rect', { x: x + i * (sw + 2), y: y + 6, width: sw, height: hgt - 10, rx: 1.5, fill: i < merged ? `url(#${blue})` : C.surface3 })))
        },
      },
      {
        eyebrow: 'Repositories',
        icon: 'folder',
        value: int(u.totalRepos),
        sub: fin(u.publicRepos) ? `${int(u.publicRepos)} public · ${int(u.privateRepos)} private` : '',
        labels: ['● PUBLIC', '● PRIVATE'],
        viz: ({ x, y, w, hgt }) => {
          const total = u.totalRepos ?? 0
          if (!total) return ''
          const rows = 4
          const cols = Math.ceil(total / rows)
          const sx = w / cols
          const dots = []
          for (let i = 0; i < total; i += 1) {
            const col = Math.floor(i / rows)
            const row = i % rows
            dots.push(h('circle', { cx: x + col * sx + sx / 2, cy: y + 4 + row * ((hgt - 6) / (rows - 1)), r: Math.min(1.5, sx * 0.36), fill: i < (u.publicRepos ?? 0) ? '#c7d7ff' : C.violet }))
          }
          return g({}, dots)
        },
      },
      {
        eyebrow: 'Current streak',
        icon: 'flame',
        value: int(c.currentStreak?.days),
        unit: plural(c.currentStreak?.days, 'day'),
        sub: fin(c.longestStreak?.days) ? `Longest ${quantityText(c.longestStreak.days)}` : '',
        labels: ['LAST 21 DAYS', 'TODAY'],
        viz: ({ x, y, w, hgt }) => {
          const last = calendar.slice(-21)
          if (!last.length) return ''
          const step = w / last.length
          return g(
            {},
            last.map((d, i) => {
              const cx = x + step * i + step / 2
              const on = d.count > 0
              return h('circle', { cx, cy: y + hgt / 2, r: 3.4, fill: on ? (i === last.length - 1 ? C.cyan : C.blue) : C.surface3, stroke: on ? undefined : C.borderHi })
            }),
            last.at(-1)?.count > 0 ? liveDot(doc, { cx: x + step * (last.length - 1) + step / 2, cy: y + hgt / 2, r: 3.4, color: C.cyan }) : '',
          )
        },
      },
      {
        eyebrow: 'Best day',
        icon: 'zap',
        value: int(c.bestDay?.count),
        sub: c.bestDay ? dateIn(c.bestDay.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '',
        labels: calendar.length ? [monthShortYY(calendar[0].date), monthShortYY(calendar.at(-1).date)] : null,
        viz: ({ x, y, w, hgt }) => {
          if (!calendar.length) return ''
          const max = Math.max(...calendar.map((d) => d.count), 1)
          const bw = w / calendar.length
          const peak = calendar.findIndex((d) => d.date === c.bestDay?.date)
          const bars = calendar.map((d, i) => (d.count ? `M${n(x + i * bw)} ${n(y + hgt)}V${n(y + hgt - Math.max(1, (d.count / max) * hgt))}` : '')).join('')
          return g({}, h('path', { d: bars, stroke: '#3567c9', 'stroke-width': Math.max(0.6, bw * 0.8) }), peak >= 0 ? liveDot(doc, { cx: x + peak * bw, cy: y + 1, r: 2.6, color: C.cyan }) : '')
        },
      },
      {
        eyebrow: 'Daily average',
        icon: 'gauge',
        value: fin(c.dailyAverage) ? c.dailyAverage.toFixed(1) : '—',
        unit: '/ day',
        sub: fin(c.activeDays) ? `${int(c.activeDays)} of ${int(c.windowDays ?? 365)} days active` : '',
        labels: ['ACTIVE DAYS', fin(c.activeDays) ? `${Math.round((c.activeDays / (c.windowDays ?? 365)) * 100)}%` : '—'],
        viz: ({ x, y, w, hgt }) => {
          const segs = 30
          const sw = (w - (segs - 1) * 2) / segs
          const on = fin(c.activeDays) ? Math.round((c.activeDays / (c.windowDays ?? 365)) * segs) : 0
          return g({}, Array.from({ length: segs }, (_, i) => h('rect', { x: x + i * (sw + 2), y: y + 9, width: sw, height: hgt - 16, rx: 1.5, fill: i < on ? (i === on - 1 ? C.cyan : C.blue) : C.surface3 })))
        },
      },
      {
        eyebrow: 'Top weekday',
        icon: 'calendar-days',
        value: WEEKDAYS[c.busiestWeekday] ?? '—',
        sub: weekday.length ? `${Math.round((weekday[c.busiestWeekday] / Math.max(1, weekday.reduce((a, b) => a + b, 0))) * 100)}% of yearly activity` : '',
        viz: ({ x, y, w, hgt }) => {
          if (!weekday.length) return ''
          const max = Math.max(...weekday, 1)
          const bw = (w - 6 * 6) / 7
          return g(
            {},
            weekday.map((v, i) => {
              const bh = Math.max(3, (v / max) * (hgt + 4))
              const top = i === c.busiestWeekday
              return g({}, h('rect', { x: x + i * (bw + 6), y: y + hgt + 4 - bh, width: bw, height: bh, rx: 3, fill: top ? `url(#${blue})` : C.surface3, stroke: top ? undefined : C.borderHi }), txt(doc, { x: x + i * (bw + 6) + bw / 2, y: y + 46, text: 'SMTWTFS'[i], face: 'monoMedium', size: 9.5, fill: top ? C.text : C.faint, anchor: 'middle' }))
            }),
          )
        },
      },
    ]

    tiles.forEach((t, i) => {
      const col = i % 4
      const row = Math.floor(i / 4)
      out.push(tile(doc, { ...t, x: PAD + col * (tileW + GAP), y: rowsY[row], w: tileW }))
    })

    out.push(f.close)
    out.push(footer(doc, { y: H - FOOTER_H, left: [['Source', 'GitHub GraphQL API · incl. private repositories']], right: [['Window', 'Rolling 365 days']] }))
    return [{ path: 'assets/generated/impact.svg', svg: await doc.render(out.join('')) }]
  },
}

function quantityText(days) {
  return `${int(days)} ${plural(days, 'day')}`
}

function monthShortYY(date) {
  return dateIn(date, { month: 'short', year: '2-digit' }).toUpperCase()
}
