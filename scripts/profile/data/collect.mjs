// Collect every data source the panels need. Live sources fall back to the committed cache, so
// a failing API (or an expired token) re-renders the last good numbers instead of breaking images.

import fs from 'node:fs'
import path from 'node:path'
import { fetchCredly } from './credly.mjs'
import { fetchGitHub } from './github.mjs'

export const LOGIN = 'isc-joserodriguez'
export const CREDLY_USER = 'isc-joserodriguez'

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

// Plain log locally; a visible annotation on the run page in GitHub Actions.
const annotate = (level, title, message) => {
  if (process.env.GITHUB_ACTIONS) console.log(`::${level} title=${title}::${message}`)
  else console.warn(`${title}: ${message}`)
}

const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data, null, 1) + '\n')
}

export async function collect({ root, offline = false, credly = false, now = new Date() }) {
  const metricsFile = path.join(root, 'assets', 'generated', 'metrics.json')
  const credlyFile = path.join(root, 'assets', 'generated', 'credly.json')
  const cached = readJson(metricsFile)

  let metrics = cached
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (!offline && token) {
    try {
      const github = await fetchGitHub({ token, login: LOGIN, now })
      metrics = {
        schemaVersion: 1,
        generatedAt: now.toISOString(),
        sources: { github: 'live', githubAt: now.toISOString() },
        ...github,
      }
      writeJson(metricsFile, metrics)
      console.log('github: live')
      // A token without the `repo` scope sees no private repositories.
      if (!github.user.privateRepos && cached?.user?.privateRepos) {
        annotate('warning', 'METRICS_TOKEN cannot see private repositories', 'Private repositories came back as 0: give METRICS_TOKEN the "repo" scope.')
      }
    } catch (err) {
      annotate('warning', 'GitHub data not live', `Live fetch failed, panels rendered from cache: ${err.message}. If this repeats, renew METRICS_TOKEN.`)
      if (metrics) metrics = { ...metrics, sources: { ...metrics.sources, github: 'cache' } }
    }
  } else {
    if (!offline) annotate('warning', 'GitHub data not live', 'No GITHUB_TOKEN: panels rendered from cache. Add the METRICS_TOKEN secret.')
    if (metrics) metrics = { ...metrics, sources: { ...metrics.sources, github: 'cache' } }
  }

  let badges = readJson(credlyFile)
  if (credly && !offline) {
    try {
      badges = await fetchCredly(CREDLY_USER)
      writeJson(credlyFile, badges)
      console.log(`credly: live (${badges.total} badges)`)
    } catch (err) {
      console.warn(`credly: live fetch failed, using cache (${err.message})`)
    }
  }

  return { metrics: metrics ?? { sources: { github: 'none' } }, credly: badges ?? { badges: [], total: 0 }, now }
}
