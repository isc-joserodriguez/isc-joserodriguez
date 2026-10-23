#!/usr/bin/env node
// Render SVGs to PNG with headless Chrome, on GitHub's dark page colour, to check them by eye.
//
//   node scripts/profile/tools/preview.mjs assets/hero.svg [more.svg…] --out <dir> [--scale 2] [--time 3000] [--light]
//
// --time advances Chrome's virtual clock so animations are mid-flight; --still freezes them
// (prefers-reduced-motion) to check the resting frame.

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}
const files = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--') && a.endsWith('.svg'))
const out = path.resolve(opt('out', path.join(os.tmpdir(), 'profile-preview')))
const scale = Number(opt('scale', 1))
const time = Number(opt('time', 2500))
const light = args.includes('--light')
const still = args.includes('--still')

export function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean)
  const found = candidates.find((p) => fs.existsSync(p))
  if (!found) throw new Error('Chrome not found: set CHROME_PATH')
  return found
}

fs.mkdirSync(out, { recursive: true })
const chrome = chromePath()
for (const file of files) {
  const abs = path.resolve(file)
  const svg = fs.readFileSync(abs, 'utf8')
  const width = Number(svg.match(/width="(\d+(?:\.\d+)?)"/)?.[1] ?? 860)
  const height = Number(svg.match(/height="(\d+(?:\.\d+)?)"/)?.[1] ?? 400)
  const bg = light ? '#ffffff' : '#0d1117'
  const html = path.join(out, `${path.basename(file, '.svg')}.html`)
  fs.writeFileSync(html, `<!doctype html><html><body style="margin:0;background:${bg}"><img src="${pathToFileURL(abs)}" width="${width}" height="${height}" style="display:block"></body></html>`)
  const png = path.join(out, `${path.basename(file, '.svg')}${light ? '-light' : ''}${still ? '-still' : ''}.png`)
  const flags = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--allow-file-access-from-files',
    `--force-device-scale-factor=${scale}`,
    `--window-size=${Math.ceil(width)},${Math.ceil(height)}`,
    `--virtual-time-budget=${time}`,
    `--screenshot=${png}`,
  ]
  if (still) flags.push('--force-prefers-reduced-motion')
  if (process.env.CI) flags.push('--no-sandbox')
  execFileSync(chrome, [...flags, pathToFileURL(html).href], { stdio: 'ignore' })
  console.log(`${file} → ${png}`)
}
