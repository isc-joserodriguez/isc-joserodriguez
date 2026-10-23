// Brand logos (simple-icons, devicon, logos) and UI glyphs (Lucide), vendored by tools/vendor.mjs.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { C } from './tokens.mjs'
import { g, n } from './svg.mjs'

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'vendor', 'icons.json')
const { brands, glyphs } = JSON.parse(fs.readFileSync(file, 'utf8'))

const luminance = (hex) => {
  const v = hex.replace('#', '')
  const [r, gg, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255)
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b)
}

// Brand colour, lifted when it would disappear on the navy panels.
export function brandColor(key) {
  const icon = brands[key]
  if (!icon?.color) return C.text2
  return luminance(icon.color) < 0.06 ? C.text2 : icon.color
}

export const hasBrand = (key) => Boolean(brands[key])

// Draw a brand logo in a size×size box at (x, y). `color` forces a monochrome fill.
export function brand(key, { x, y, size = 16, color, opacity } = {}) {
  const icon = brands[key]
  if (!icon) throw new Error(`unknown brand icon "${key}"`)
  const s = size / Math.max(icon.w, icon.h)
  const dx = (size - icon.w * s) / 2
  const dy = (size - icon.h * s) / 2
  const fill = color ?? (icon.color ? brandColor(key) : 'currentColor')
  return g(
    {
      transform: `translate(${n(x + dx)} ${n(y + dy)}) scale(${n(s * 1000) / 1000})`,
      fill,
      color: icon.color ? undefined : (color ?? C.text2),
      opacity,
    },
    icon.body,
  )
}

// Lucide glyph (24×24 stroke icon) in a size×size box.
export function glyph(name, { x, y, size = 16, color = C.text2, width = 1.75, opacity } = {}) {
  const body = glyphs[name]
  if (!body) throw new Error(`unknown glyph "${name}"`)
  const s = size / 24
  return g(
    {
      transform: `translate(${n(x)} ${n(y)}) scale(${n(s * 1000) / 1000})`,
      fill: 'none',
      stroke: color,
      'stroke-width': n(width / s),
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      opacity,
    },
    body,
  )
}
