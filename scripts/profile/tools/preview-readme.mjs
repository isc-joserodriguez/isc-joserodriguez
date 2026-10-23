#!/usr/bin/env node
// Render README.md through GitHub's Markdown API into .preview/readme.html (gitignored), styled
// like the profile page, so it can be opened through tools/serve.mjs with the local assets.
//
//   node scripts/profile/tools/preview-readme.mjs [--light]
//   node scripts/profile/tools/serve.mjs   →   http://localhost:4173/.preview/readme.html

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const light = process.argv.includes('--light')
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN

const res = await fetch('https://api.github.com/markdown', {
  method: 'POST',
  headers: { Accept: 'text/html', 'Content-Type': 'application/json', 'User-Agent': 'isc-joserodriguez-profile', ...(token ? { Authorization: `bearer ${token}` } : {}) },
  body: JSON.stringify({ text: fs.readFileSync(path.join(root, 'README.md'), 'utf8'), mode: 'gfm' }),
})
if (!res.ok) throw new Error(`GitHub Markdown API: HTTP ${res.status}`)
// Assets resolve against the repo root, one level up from .preview/.
const html = (await res.text()).replace(/(src|srcset)="\.\//g, '$1="../')

const theme = light ? 'light' : 'dark'
const page = `<!doctype html>
<html lang="en" data-color-mode="${theme}"><head><meta charset="utf-8"><title>README preview</title>
<meta name="color-scheme" content="${theme}">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.8.1/github-markdown-${theme}.css">
<style>body{margin:0;background:${light ? '#ffffff' : '#0d1117'}}.markdown-body{box-sizing:border-box;width:879px;margin:24px auto;padding:24px}</style>
</head><body><article class="markdown-body">${html}</article></body></html>`
fs.mkdirSync(path.join(root, '.preview'), { recursive: true })
fs.writeFileSync(path.join(root, '.preview', `readme${light ? '-light' : ''}.html`), page)
console.log(`wrote .preview/readme${light ? '-light' : ''}.html`)
