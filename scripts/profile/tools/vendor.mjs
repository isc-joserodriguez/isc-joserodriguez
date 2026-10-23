#!/usr/bin/env node
// One-off vendoring: brand logos, UI glyphs and raster images the panels embed.
// Run after changing the lists below; the output is committed so CI needs no icon packages.
//
//   node scripts/profile/tools/vendor.mjs            # icons + images
//   node scripts/profile/tools/vendor.mjs --icons    # icons only
//
// Sources: simple-icons (CC0), @iconify-json/devicon (MIT), @iconify-json/logos (CC0),
// lucide-static (ISC), GitHub avatar.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as simpleIcons from 'simple-icons'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const vendor = path.join(root, 'scripts', 'profile', 'vendor')
const args = process.argv.slice(2)
const iconsOnly = args.includes('--icons')

// Brand logos. `si:` simple-icons slug, `dev:` devicon, `logos:` iconify logos.
const BRANDS = {
  anthropic: 'si:anthropic',
  claude: 'si:claude',
  openai: 'logos:openai-icon',
  langchain: 'si:langchain',
  n8n: 'si:n8n',
  ollama: 'si:ollama',
  copilot: 'si:githubcopilot',
  mcp: 'si:modelcontextprotocol',
  typescript: 'si:typescript',
  javascript: 'si:javascript',
  node: 'si:nodedotjs',
  nestjs: 'si:nestjs',
  react: 'si:react',
  next: 'si:nextdotjs',
  postgresql: 'si:postgresql',
  mongodb: 'si:mongodb',
  prisma: 'si:prisma',
  aws: 'dev:amazonwebservices',
  docker: 'si:docker',
  kubernetes: 'si:kubernetes',
  githubactions: 'si:githubactions',
  playwright: 'dev:playwright',
  angular: 'si:angular',
  gatsby: 'si:gatsby',
  tailwind: 'si:tailwindcss',
  mui: 'si:mui',
  antdesign: 'si:antdesign',
  redux: 'si:redux',
  reactquery: 'si:reactquery',
  reacthookform: 'si:reacthookform',
  styledcomponents: 'si:styledcomponents',
  storybook: 'si:storybook',
  sass: 'si:sass',
  express: 'si:express',
  graphql: 'si:graphql',
  swagger: 'si:swagger',
  strapi: 'si:strapi',
  stripe: 'si:stripe',
  paypal: 'si:paypal',
  mysql: 'si:mysql',
  typeorm: 'si:typeorm',
  mongoose: 'si:mongoose',
  sequelize: 'si:sequelize',
  jest: 'si:jest',
  cypress: 'si:cypress',
  firebase: 'si:firebase',
  circleci: 'si:circleci',
  vercel: 'si:vercel',
  netlify: 'si:netlify',
  digitalocean: 'si:digitalocean',
  linux: 'si:linux',
  vite: 'si:vite',
  webpack: 'si:webpack',
  github: 'si:github',
  git: 'si:git',
  gmail: 'si:gmail',
  credly: 'si:credly',
  hackerrank: 'si:hackerrank',
  php: 'si:php',
  codeigniter: 'si:codeigniter',
  linkedin: 'dev:linkedin',
}

// UI glyphs (Lucide, 24×24 stroke icons).
const GLYPHS = [
  'mail', 'globe', 'map-pin', 'users', 'bot', 'rocket', 'graduation-cap', 'layers', 'git-branch',
  'git-merge', 'git-pull-request', 'zap', 'terminal', 'shield-check', 'calendar', 'clock', 'flame',
  'trophy', 'code-xml', 'cpu', 'database', 'cloud', 'sparkles', 'arrow-up-right', 'arrow-right',
  'check', 'activity', 'star', 'folder', 'award', 'briefcase', 'brain', 'workflow', 'file-text',
  'flask-conical', 'book-open', 'network', 'boxes', 'shopping-cart', 'hand-coins', 'wallet', 'car',
  'gamepad-2', 'smartphone', 'eye-off', 'lock', 'credit-card', 'server', 'refresh-cw', 'gauge',
  'timer', 'trending-up', 'git-commit-horizontal', 'package', 'circle-dot', 'search', 'list-checks',
  'file-code', 'puzzle', 'plug', 'user', 'building-2', 'crown', 'medal', 'gem', 'target',
  'hourglass', 'history', 'calendar-days', 'chart-line', 'repeat', 'receipt', 'key-round',
  'scan-eye', 'split', 'merge',
]

// Raster images, resized and embedded as data URIs by the components. Credly badges are not
// here: data/credly.mjs pulls them from the Credly API every month.
const IMAGES = {
  avatar: { url: 'https://avatars.githubusercontent.com/u/26130533?s=256&v=4', size: 256 },
}

const luminance = (hex) => {
  const v = hex.replace('#', '')
  const full = v.length === 3 ? [...v].map((c) => c + c).join('') : v
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// Dark fills vanish on the navy panels: hand them to currentColor so the renderer decides.
const liftDarkFills = (body) =>
  body.replace(/fill="(#[0-9a-fA-F]{3,6})"/g, (m, hex) => (luminance(hex) < 0.05 ? 'fill="currentColor"' : m))

function iconify(set, name) {
  const file = path.join(root, 'node_modules', '@iconify-json', set, 'icons.json')
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  const icon = json.icons[name]
  if (!icon) throw new Error(`${set}:${name} not found`)
  const w = icon.width ?? json.width ?? 16
  const h = icon.height ?? json.height ?? 16
  return { w, h, body: liftDarkFills(icon.body), color: null }
}

function brand(source) {
  const [kind, name] = source.split(':')
  if (kind === 'si') {
    const icon = Object.values(simpleIcons).find((i) => i && i.slug === name)
    if (!icon) throw new Error(`simple-icons:${name} not found`)
    return { w: 24, h: 24, body: `<path d="${icon.path}"/>`, color: `#${icon.hex}` }
  }
  if (kind === 'dev') return iconify('devicon', name)
  if (kind === 'logos') return iconify('logos', name)
  throw new Error(`unknown icon source ${source}`)
}

function glyph(name) {
  const svg = fs.readFileSync(path.join(root, 'node_modules', 'lucide-static', 'icons', `${name}.svg`), 'utf8')
  const inner = svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/\s*\n\s*/g, '')
    .trim()
  return inner
}

async function vendorImages() {
  const { fetchImage } = await import('../data/images.mjs')
  const out = {}
  for (const [key, { url, size }] of Object.entries(IMAGES)) {
    const png = await fetchImage(url, size)
    out[key] = { mime: 'image/png', size, data: png.toString('base64') }
    console.log(`image ${key}: ${(png.length / 1024).toFixed(1)} KB`)
  }
  fs.writeFileSync(path.join(vendor, 'images.json'), JSON.stringify(out, null, 1) + '\n')
}

async function main() {
  const brands = Object.fromEntries(Object.entries(BRANDS).map(([k, src]) => [k, brand(src)]))
  const glyphs = Object.fromEntries(GLYPHS.map((n) => [n, glyph(n)]))
  fs.mkdirSync(vendor, { recursive: true })
  fs.writeFileSync(path.join(vendor, 'icons.json'), JSON.stringify({ brands, glyphs }, null, 1) + '\n')
  console.log(`icons: ${Object.keys(brands).length} brands, ${Object.keys(glyphs).length} glyphs`)
  if (!iconsOnly) await vendorImages()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
