#!/usr/bin/env node
// Publish gate for the generated profile: run in CI before committing.
//
//   node scripts/profile/tools/check.mjs
//
// Every SVG under assets/: well-formed XML, <title> + <desc>, no external resources (GitHub shows
// them through <img>, which blocks network loads), unique ids, ≤ 300 KB. README.md: every local
// image it references exists.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const MAX_KB = 300
const errors = []
const fail = (file, msg) => errors.push(`${file}: ${msg}`)

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
}

// Tag-balance and entity check; enough to catch a broken template without an XML dependency.
function wellFormed(svg) {
  const body = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '<style/>')
  const stack = []
  const tag = /<(\/?)([A-Za-z][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g
  let last = 0
  for (let m; (m = tag.exec(body)); ) {
    const between = body.slice(last, m.index)
    if (/</.test(between)) return `stray "<" before offset ${m.index}`
    const bad = between.match(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/)
    if (bad) return `bad entity near offset ${m.index}`
    last = tag.lastIndex
    const [, close, name, , self] = m
    if (close) {
      if (stack.pop() !== name) return `unexpected </${name}>`
    } else if (!self) {
      stack.push(name)
    }
  }
  if (/</.test(body.slice(last))) return 'unparsed markup at the end'
  return stack.length ? `unclosed <${stack.at(-1)}>` : null
}

const svgs = walk(path.join(root, 'assets')).filter((f) => f.endsWith('.svg'))
for (const file of svgs) {
  const rel = path.relative(root, file).replaceAll('\\', '/')
  const svg = fs.readFileSync(file, 'utf8')
  const kb = Buffer.byteLength(svg) / 1024
  if (kb > MAX_KB) fail(rel, `${kb.toFixed(0)} KB, over the ${MAX_KB} KB budget`)
  if (!svg.startsWith('<svg ')) fail(rel, 'does not start with <svg')
  if (!/<title[^>]*>[^<]+<\/title>/.test(svg)) fail(rel, 'missing <title>')
  if (!/<desc[^>]*>[^<]+<\/desc>/.test(svg)) fail(rel, 'missing <desc>')
  if (/(?:href|src)="https?:/.test(svg) || /url\(["']?https?:/.test(svg)) fail(rel, 'references an external resource')
  if (/<script|<foreignObject/i.test(svg)) fail(rel, 'contains <script> or <foreignObject>')
  if (/\bNaN\b|undefined/.test(svg.replace(/base64,[^)"']+/g, ''))) fail(rel, 'contains NaN/undefined')
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  const dup = ids.find((id, i) => ids.indexOf(id) !== i)
  if (dup) fail(rel, `duplicate id "${dup}"`)
  const xml = wellFormed(svg)
  if (xml) fail(rel, `not well-formed: ${xml}`)
}

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8')
const refs = [...readme.matchAll(/(?:src|srcset)="\.\/([^"]+)"/g)].map((m) => m[1])
for (const ref of refs) {
  // The 3D chart is produced by its own action in CI; it may not exist on a fresh clone.
  if (ref.startsWith('profile-3d-contrib/')) continue
  if (!fs.existsSync(path.join(root, ref))) fail('README.md', `missing ./${ref}`)
}

if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`)
  console.error(`${errors.length} problem(s) in ${svgs.length} SVGs`)
  process.exit(1)
}
console.log(`✓ ${svgs.length} SVGs and ${refs.length} README images pass`)
