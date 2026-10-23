#!/usr/bin/env node
// Static server for the repo root, to preview panels and the README in a real browser.
//
//   node scripts/profile/tools/serve.mjs [port]     → http://localhost:4173/assets/hero.svg

import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const port = Number(process.argv[2] ?? 4173)
const TYPES = { '.svg': 'image/svg+xml', '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css', '.md': 'text/markdown; charset=utf-8' }

http
  .createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    const file = path.join(root, url === '/' ? 'README.md' : url)
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end('not found')
      return
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' })
    fs.createReadStream(file).pipe(res)
  })
  .listen(port, () => console.log(`serving ${root} on http://localhost:${port}`))
