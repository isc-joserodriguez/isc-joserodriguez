// GitHub GraphQL collector → the metrics model the data panels render (see assets/generated/metrics.json).
// With the owner's token (repo + read:user) the numbers include private contributions.

import { TZ } from '../core/format.mjs'

const ENDPOINT = 'https://api.github.com/graphql'
const DAY = 86_400_000

async function gql(token, query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'isc-joserodriguez-profile' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`GitHub GraphQL HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(`GitHub GraphQL: ${json.errors.map((e) => e.message).join('; ')}`)
  return json.data
}

const PROFILE = `query($login: String!) {
  user(login: $login) {
    login name createdAt
    followers { totalCount } following { totalCount }
    publicRepos: repositories(ownerAffiliations: OWNER, privacy: PUBLIC) { totalCount }
    privateRepos: repositories(ownerAffiliations: OWNER, privacy: PRIVATE) { totalCount }
    pullRequests { totalCount }
    mergedPullRequests: pullRequests(states: MERGED) { totalCount }
    openPullRequests: pullRequests(states: OPEN) { totalCount }
    issues { totalCount }
    repositoriesContributedTo(contributionTypes: [COMMIT, PULL_REQUEST, ISSUE, REPOSITORY]) { totalCount }
    contributionsCollection { contributionYears }
  }
}`

const REPOS = `query($login: String!, $after: String) {
  user(login: $login) {
    repositories(first: 100, after: $after, ownerAffiliations: OWNER, isFork: false) {
      pageInfo { hasNextPage endCursor }
      nodes {
        stargazerCount
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
      }
    }
  }
}`

const COLLECTION_FIELDS = `
  totalCommitContributions totalPullRequestContributions totalIssueContributions
  totalPullRequestReviewContributions totalRepositoryContributions restrictedContributionsCount
  contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } }`

const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 }

const days = (collection) =>
  collection.contributionCalendar.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: LEVEL[d.contributionLevel] ?? 0 })),
  )

function streaks(list, today) {
  // list: ascending, one entry per day.
  let longest = { days: 0, start: null, end: null }
  let run = { days: 0, start: null, end: null }
  for (const d of list) {
    if (d.count > 0) {
      run = run.days ? { days: run.days + 1, start: run.start, end: d.date } : { days: 1, start: d.date, end: d.date }
      if (run.days > longest.days) longest = { ...run }
    } else {
      run = { days: 0, start: null, end: null }
    }
  }
  // Current streak: ends today, or yesterday when today has nothing yet.
  let i = list.length - 1
  while (i >= 0 && list[i].date > today) i -= 1
  if (i >= 0 && list[i].count === 0 && list[i].date === today) i -= 1
  let current = { days: 0, start: null, end: null }
  if (i >= 0 && list[i].count > 0) {
    const end = list[i].date
    let start = end
    let count = 0
    while (i >= 0 && list[i].count > 0) {
      start = list[i].date
      count += 1
      i -= 1
    }
    current = { days: count, start, end }
  }
  return { current, longest }
}

export async function fetchGitHub({ token, login, now = new Date() }) {
  const { user } = await gql(token, PROFILE, { login })
  if (!user) throw new Error(`GitHub user ${login} not found`)

  // Owned, non-fork repositories: stars and language bytes.
  let stars = 0
  const langBytes = new Map()
  let after = null
  for (let page = 0; page < 20; page += 1) {
    const data = await gql(token, REPOS, { login, after })
    const repos = data.user.repositories
    for (const repo of repos.nodes) {
      stars += repo.stargazerCount
      for (const e of repo.languages.edges) {
        const prev = langBytes.get(e.node.name) ?? { bytes: 0, color: e.node.color }
        langBytes.set(e.node.name, { bytes: prev.bytes + e.size, color: prev.color ?? e.node.color })
      }
    }
    if (!repos.pageInfo.hasNextPage) break
    after = repos.pageInfo.endCursor
  }
  const totalBytes = [...langBytes.values()].reduce((s, l) => s + l.bytes, 0)
  const languages = [...langBytes.entries()]
    .map(([name, l]) => ({ name, color: l.color, bytes: l.bytes, share: totalBytes ? l.bytes / totalBytes : 0 }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10)

  // Every contribution year (one aliased query), plus the rolling year and the one before it.
  const years = [...user.contributionsCollection.contributionYears].sort((a, b) => a - b)
  const iso = (t) => new Date(t).toISOString()
  const nowMs = now.getTime()
  const aliases = years
    .map((y) => `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {${COLLECTION_FIELDS}}`)
    .join('\n')
  const windows = `
    lastYear: contributionsCollection(from: "${iso(nowMs - 364 * DAY)}", to: "${iso(nowMs)}") {${COLLECTION_FIELDS}}
    previousYear: contributionsCollection(from: "${iso(nowMs - 729 * DAY)}", to: "${iso(nowMs - 365 * DAY)}") { contributionCalendar { totalContributions } }`
  const yearsData = (await gql(token, `query($login: String!) { user(login: $login) { ${aliases} ${windows} } }`, { login })).user

  const byYear = years.map((y) => {
    const c = yearsData[`y${y}`]
    return {
      year: y,
      total: c.contributionCalendar.totalContributions,
      commits: c.totalCommitContributions,
      pullRequests: c.totalPullRequestContributions,
      issues: c.totalIssueContributions,
      reviews: c.totalPullRequestReviewContributions,
      repositories: c.totalRepositoryContributions,
      restricted: c.restrictedContributionsCount,
    }
  })

  const allDays = new Map()
  for (const y of years) for (const d of days(yearsData[`y${y}`])) allDays.set(d.date, d)
  const lastYearDays = days(yearsData.lastYear)
  for (const d of lastYearDays) allDays.set(d.date, d)
  const timeline = [...allDays.values()].sort((a, b) => (a.date < b.date ? -1 : 1))

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now)
  const { current, longest } = streaks(timeline, today)

  // Calendar for the heatmap: the last 53 weeks, Sunday-aligned, ending at the latest day.
  const calendar = lastYearDays.slice(-371)
  const lastYear = yearsData.lastYear.contributionCalendar.totalContributions
  const previousYear = yearsData.previousYear.contributionCalendar.totalContributions

  const monthlyMap = new Map()
  const weekday = [0, 0, 0, 0, 0, 0, 0]
  for (const d of lastYearDays) {
    const m = d.date.slice(0, 7)
    monthlyMap.set(m, (monthlyMap.get(m) ?? 0) + d.count)
    weekday[new Date(`${d.date}T12:00:00Z`).getUTCDay()] += d.count
  }
  const monthly = [...monthlyMap.entries()].sort().slice(-12).map(([month, total]) => ({ month, total }))
  const best = lastYearDays.reduce((b, d) => (d.count > (b?.count ?? -1) ? d : b), null)
  const bestAllTime = timeline.reduce((b, d) => (d.count > (b?.count ?? -1) ? d : b), null)
  const activeDays = lastYearDays.filter((d) => d.count > 0).length

  const mergeRate = user.pullRequests.totalCount ? user.mergedPullRequests.totalCount / user.pullRequests.totalCount : null

  return {
    user: {
      login: user.login,
      name: user.name,
      createdAt: user.createdAt,
      followers: user.followers.totalCount,
      following: user.following.totalCount,
      publicRepos: user.publicRepos.totalCount,
      privateRepos: user.privateRepos.totalCount,
      totalRepos: user.publicRepos.totalCount + user.privateRepos.totalCount,
      stars,
      yearsOnGitHub: (nowMs - Date.parse(user.createdAt)) / (365.25 * DAY),
    },
    contributions: {
      allTime: byYear.reduce((s, y) => s + y.total, 0),
      lastYear,
      previousYear,
      yoyGrowth: previousYear ? lastYear / previousYear - 1 : null,
      byYear,
      calendar,
      monthly,
      weekday,
      busiestWeekday: weekday.indexOf(Math.max(...weekday)),
      currentStreak: current,
      longestStreak: longest,
      bestDay: best && best.count ? { date: best.date, count: best.count } : null,
      bestDayAllTime: bestAllTime && bestAllTime.count ? { date: bestAllTime.date, count: bestAllTime.count } : null,
      activeDays,
      dailyAverage: lastYearDays.length ? lastYear / lastYearDays.length : null,
      windowDays: lastYearDays.length,
    },
    pullRequests: {
      total: user.pullRequests.totalCount,
      merged: user.mergedPullRequests.totalCount,
      open: user.openPullRequests.totalCount,
      mergeRate,
    },
    issues: { total: user.issues.totalCount },
    repositoriesContributedTo: user.repositoriesContributedTo.totalCount,
    languages,
  }
}
