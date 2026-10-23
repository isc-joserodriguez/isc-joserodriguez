// Credly badges from the public profile JSON (no token needed). Refreshed monthly by
// .github/workflows/credly.yml; every other build renders from assets/generated/credly.json.

import { fetchImage } from './images.mjs'

const BADGE_SIZE = 192 // drawn at 96px, so 2× for retina screens

async function getJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'isc-joserodriguez-profile' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return res.json()
}

export async function fetchCredly(username) {
  const badges = []
  for (let page = 1; page <= 10; page += 1) {
    const json = await getJson(`https://www.credly.com/users/${username}/badges.json?page=${page}&page_size=48`)
    badges.push(...json.data)
    const meta = json.metadata ?? {}
    if (!meta.total_pages || page >= meta.total_pages) break
  }

  const out = []
  for (const b of badges.filter((x) => x.public !== false && x.state !== 'rejected')) {
    const t = b.badge_template ?? {}
    const issuer = (t.issuer?.entities ?? []).map((e) => e.entity?.name).filter(Boolean)
    const png = await fetchImage(t.image_url ?? b.image_url, BADGE_SIZE)
    out.push({
      id: b.id,
      name: t.name,
      issuer: issuer.join(' · ') || null,
      issuedAt: b.issued_at_date,
      expiresAt: b.expires_at_date ?? null,
      level: t.level || null,
      url: `https://www.credly.com/badges/${b.id}`,
      image: { mime: 'image/png', size: BADGE_SIZE, data: png.toString('base64') },
    })
  }
  out.sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : a.issuedAt > b.issuedAt ? -1 : a.name.localeCompare(b.name)))
  return { username, fetchedAt: new Date().toISOString(), total: out.length, badges: out }
}
