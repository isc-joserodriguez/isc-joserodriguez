#!/usr/bin/env node
// Profile pipeline: collect data → render every panel → write assets/ and README.md.
//
//   node scripts/profile/build.mjs                  # live GitHub data (GITHUB_TOKEN)
//   node scripts/profile/build.mjs --offline        # render from the cached data only
//   node scripts/profile/build.mjs --credly         # also refresh Credly badges (monthly workflow)
//   node scripts/profile/build.mjs --only hero,about
//
// Each component default-exports { name, render(ctx) → Promise<[{ path, svg }]> }.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { collect } from './data/collect.mjs'
import { renderReadme } from './readme.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const onlyArg = args.find((a) => a.startsWith('--only'))
const only = onlyArg ? (onlyArg.includes('=') ? onlyArg.split('=')[1] : args[args.indexOf(onlyArg) + 1]).split(',') : null

export const COMPONENTS = [
  'hero',
  'buttons',
  'sections',
  'about',
  'ai',
  'highlights',
  'building',
  'impact',
  'activity',
  'stack',
  'credentials',
  'footer',
]

function write(rel, content) {
  const dest = path.join(root, rel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const previous = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : null
  if (previous !== content) fs.writeFileSync(dest, content)
  const kb = (Buffer.byteLength(content) / 1024).toFixed(1)
  console.log(`${previous === content ? '=' : '✓'} ${rel} (${kb} KB)`)
  return previous !== content
}

const unescape = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

async function main() {
  const started = Date.now()
  const ctx = await collect({ root, offline: flag('offline'), credly: flag('credly') })
  const alts = {}
  let changed = 0
  for (const name of COMPONENTS.filter((c) => !only || only.includes(c))) {
    const { default: component } = await import(`./components/${name}.mjs`)
    for (const out of await component.render(ctx)) {
      if (write(out.path, out.svg)) changed += 1
      const desc = out.svg.match(/<desc id="desc">([\s\S]*?)<\/desc>/)?.[1]
      if (desc) alts[out.path] = unescape(desc)
      const kb = Buffer.byteLength(out.svg) / 1024
      if (kb > 300) console.warn(`  ! ${out.path} is ${kb.toFixed(0)} KB (budget 300 KB)`)
    }
  }
  // The README needs every panel's alt text, so it is only written on full builds.
  if (!only) {
    if (write('README.md', renderReadme({ ...ctx, alts }))) changed += 1
  }
  console.log(`done in ${Date.now() - started} ms, ${changed} file(s) changed`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
