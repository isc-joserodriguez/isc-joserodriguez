// Font faces: measured with fontkit at build time, subset per SVG with harfbuzz (subset-font)
// and embedded as woff2 data URIs, because SVGs shown through <img> cannot load web fonts.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as fontkit from 'fontkit'
import subsetFont from 'subset-font'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'vendor', 'fonts')

// face key → static instance (vendor/fonts, made from the Google Fonts variable sources).
export const FACES = {
  display: { file: 'bricolage-800.ttf', fallback: "'Bricolage Grotesque',system-ui,sans-serif" },
  head: { file: 'bricolage-700.ttf', fallback: "'Bricolage Grotesque',system-ui,sans-serif" },
  title: { file: 'bricolage-600.ttf', fallback: "'Bricolage Grotesque',system-ui,sans-serif" },
  sans: { file: 'dmsans-400.ttf', fallback: "'DM Sans',system-ui,sans-serif" },
  medium: { file: 'dmsans-500.ttf', fallback: "'DM Sans',system-ui,sans-serif" },
  semibold: { file: 'dmsans-600.ttf', fallback: "'DM Sans',system-ui,sans-serif" },
  bold: { file: 'dmsans-700.ttf', fallback: "'DM Sans',system-ui,sans-serif" },
  mono: { file: 'mono-400.ttf', fallback: "'JetBrains Mono',ui-monospace,monospace" },
  monoMedium: { file: 'mono-500.ttf', fallback: "'JetBrains Mono',ui-monospace,monospace" },
  monoBold: { file: 'mono-700.ttf', fallback: "'JetBrains Mono',ui-monospace,monospace" },
}

const loaded = new Map()
function face(key) {
  if (!FACES[key]) throw new Error(`unknown font face "${key}"`)
  if (!loaded.has(key)) {
    const buffer = fs.readFileSync(path.join(dir, FACES[key].file))
    loaded.set(key, { buffer, font: fontkit.create(buffer) })
  }
  return loaded.get(key)
}

const widthCache = new Map()

// Advance width in px of `text` set in `key` at `size`, with letter-spacing in em.
export function measure(text, key, size, { tracking = 0, tnum = false } = {}) {
  const str = String(text)
  if (!str) return 0
  const cacheKey = `${key}|${tnum}|${str}`
  let units = widthCache.get(cacheKey)
  if (units === undefined) {
    const { font } = face(key)
    const features = tnum ? { tnum: true, kern: true } : { kern: true }
    units = font.layout(str, features).advanceWidth / font.unitsPerEm
    widthCache.set(cacheKey, units)
  }
  return units * size + tracking * size * [...str].length
}

// Greedy word wrap to `max` px. Returns the lines.
export function wrap(text, key, size, max, opts = {}) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (line && measure(next, key, size, opts) > max) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

// Shorten with an ellipsis until it fits.
export function truncate(text, key, size, max, opts = {}) {
  let str = String(text)
  if (measure(str, key, size, opts) <= max) return str
  while (str.length > 1 && measure(`${str}…`, key, size, opts) > max) str = str.slice(0, -1).trimEnd()
  return `${str}…`
}

const subsetCache = new Map()

// @font-face rules for the characters each face actually draws in one SVG.
export async function fontFaceCss(usage) {
  const rules = []
  for (const [key, chars] of [...usage.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (!chars.size) continue
    const text = [...chars].sort().join('')
    const cacheKey = `${key}|${text}`
    let b64 = subsetCache.get(cacheKey)
    if (!b64) {
      const woff2 = await subsetFont(face(key).buffer, text, { targetFormat: 'woff2', noHinting: true })
      b64 = woff2.toString('base64')
      subsetCache.set(cacheKey, b64)
    }
    rules.push(`@font-face{font-family:jr-${key};src:url(data:font/woff2;base64,${b64}) format('woff2')}`)
    rules.push(`.f-${key}{font-family:jr-${key},${FACES[key].fallback}}`)
  }
  return rules.join('')
}
