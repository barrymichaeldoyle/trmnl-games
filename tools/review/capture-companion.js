/*
 * Refresh tools/review/fixtures/companion.json from a real hero (the companion review harness's data).
 *
 * 1. Open https://trmnlgames.com/app/desk-crawler signed in, then the browser's DevTools console.
 * 2. Paste this whole file and press Enter. It runs read-only queries and copies the fixture to the clipboard.
 * 3. In the repository: pbpaste > tools/review/fixtures/companion.json
 *
 * The repository is public, so the capture is cleaned before it leaves the browser: your alias and hero name become
 * the fixture's Maximilian_Wolfgangs and Pip, every other player on the boards gets a made-up name (in the logs too),
 * logs that involve other players (meetings, raids, lost property) are dropped, document ids become stable fakes, and
 * tokens, emails, the installation id and the timezone are replaced.
 */
;(async () => {
  const client = window.__TSR_ROUTER__?.options?.context?.convexClient
  if (!client) throw new Error('Open the Desk Crawler companion signed in, then run this again.')
  const q = (name, args = {}) => client.query(name, args)
  const [me, hero, inventory, recap, achievements, keepsakes, connections, log, recent24h, recent7d, overall] = await Promise.all([
    q('users:me'), q('heroes:mine'), q('inventory:mine'), q('heroes:returnSummary'), q('achievements:mine'), q('keepsakes:mine'), q('connections:mine'),
    q('heroes:recentLog', { paginationOpts: { numItems: 30, cursor: null } }),
    q('leaderboard:view', { board: 'recent_24h' }), q('leaderboard:view', { board: 'recent_7d' }), q('leaderboard:view', { board: 'overall' }),
  ])
  if (!hero) throw new Error('No hero on this account yet.')

  const OTHERS = ['Quill_Danvers', 'Odette', 'Marcus_the_Bold', 'Sunny_Patel', 'Toastie_Fan', 'Rook', 'Juniper_Vale', 'Hal_9001', 'Bea_Okafor', 'Ziggy', 'Mo', 'Zed', 'Pemberton', 'Lark', 'Nova_K', 'Ines', 'Teo', 'Wren', 'Basil', 'Clem']
  const HEROES = ['Stapler Steve', 'Lady Lanyard', 'Kevin', 'Ms. Sheets', 'Toastie', 'Sir Clips', 'Fern', 'Biscuit', 'Dot', 'Margo', 'Bram', 'Pixel', 'Inky', 'Tess', 'Quinn', 'Ruth', 'Otto', 'Nell', 'Vim', 'Cass']
  const names = new Map([[me.user.publicAlias, 'Maximilian_Wolfgangs'], [hero.name, 'Pip']])
  for (const board of [recent24h, recent7d, overall]) for (const row of board?.entries ?? []) {
    if (!names.has(row.name)) names.set(row.name, OTHERS[(names.size - 2) % OTHERS.length] + (names.size - 2 >= OTHERS.length ? `_${names.size}` : ''))
    if (row.hero_name && !names.has(row.hero_name)) names.set(row.hero_name, HEROES[(names.size - 2) % HEROES.length])
  }

  const fixture = {
    me: { gameState: me.gameState, hasActiveInstallation: me.hasActiveInstallation, hero: me.hero, signedIn: true, user: { analyticsConsent: false, nameRepairRequired: false, publicAlias: me.user.publicAlias, state: 'active', timezone: 'Africa/Johannesburg' } },
    hero,
    inventory,
    log: (log?.page ?? []).filter((entry) => !/meeting|raid|lost|spare|follow|rival/i.test(`${entry.kind} ${entry.detail?.outcome?.variant ?? ''}`) && entry.detail?.outcome?.spare === undefined),
    recap,
    achievements,
    keepsakes,
    connections: (connections ?? []).map((c, i) => ({ ...c, uuid: `749de423-cca9-4bf5-9b03-${String(i).padStart(12, '0')}` })),
    leaderboard: { recent_24h: recent24h, recent_7d: recent7d, overall },
  }

  // Drop anything secret-shaped, then swap names and document ids across the whole capture.
  const SECRET = /token|secret|email|clerk|vapid|endpoint|userId$/i
  let text = JSON.stringify(fixture, (key, value) => (SECRET.test(key) ? undefined : value))
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Whole names only, so a short alias never rewrites part of another word.
  const whole = (s) => `${/^\w/.test(s) ? '\\b' : ''}${escape(s)}${/\w$/.test(s) ? '\\b' : ''}`
  for (const [real, fake] of [...names].sort((a, b) => b[0].length - a[0].length)) if (real) text = text.replace(new RegExp(whole(real), 'g'), fake)
  const ids = new Map()
  text = text.replace(/"([a-z0-9]{28,40})"/g, (_, id) => { if (!ids.has(id)) ids.set(id, `fx${String(ids.size + 1).padStart(4, '0')}`); return `"${ids.get(id)}"` })
  const out = JSON.stringify(JSON.parse(text), null, 2) + '\n'
  if (typeof copy === 'function') copy(out)
  else await navigator.clipboard.writeText(out)
  console.log(`Copied the fixture (${out.length} characters, ${names.size - 2} other players renamed). Now: pbpaste > tools/review/fixtures/companion.json`)
})()
