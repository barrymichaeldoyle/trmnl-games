// Runs before `wrangler deploy`: copies the hashed /assets files of recent live builds into this build.
//
// A deploy replaces the whole asset set, so a tab opened before it asks for chunks that no longer exist and the page
// fails to load (Sentry TRMNL-GAMES-2). Carrying the old files forward lets that tab keep working on its own build
// until deployWatch or a reload moves it on. `/assets.json` records when each file was last part of a live build;
// files drop out once they have not been live for RETAIN_DAYS. Any failure here only means fewer files are carried:
// the deploy goes ahead.
import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// CARRY_ASSETS_FROM points the script at another copy of the site, for testing.
const SITE = process.env.CARRY_ASSETS_FROM ?? 'https://trmnlgames.com'
const RETAIN_DAYS = 7
const CLIENT = new URL('../../apps/web/dist/client/', import.meta.url).pathname
const ASSETS = join(CLIENT, 'assets')
// Hashed build output only: never a source map or anything outside /assets.
const SAFE_NAME = /^[\w.-]+\.(js|css)$/

if (!existsSync(ASSETS)) {
  console.error(`carry-assets: ${ASSETS} is missing; run the build first.`)
  process.exit(1)
}

const now = new Date().toISOString()
const current = readdirSync(ASSETS).filter((name) => SAFE_NAME.test(name))
const files = Object.fromEntries(current.map((name) => [name, now]))

let previous = {}
try {
  const response = await fetch(`${SITE}/assets.json`, { cache: 'no-store' })
  if (response.ok) previous = (await response.json()).files ?? {}
  else console.warn(`carry-assets: ${SITE}/assets.json answered ${response.status}; carrying nothing this time.`)
} catch (error) {
  console.warn(`carry-assets: could not read ${SITE}/assets.json (${error}); carrying nothing this time.`)
}

const cutoff = Date.now() - RETAIN_DAYS * 24 * 60 * 60 * 1000
const wanted = Object.entries(previous).filter(([name, lastLive]) =>
  SAFE_NAME.test(name) && !(name in files) && typeof lastLive === 'string' && Date.parse(lastLive) >= cutoff)

let carried = 0
let failed = 0
const queue = [...wanted]
const worker = async () => {
  for (let item = queue.shift(); item; item = queue.shift()) {
    const [name, lastLive] = item
    try {
      const response = await fetch(`${SITE}/assets/${name}`)
      if (!response.ok) throw new Error(`status ${response.status}`)
      writeFileSync(join(ASSETS, name), Buffer.from(await response.arrayBuffer()))
      files[name] = lastLive
      carried++
    } catch (error) {
      failed++
      console.warn(`carry-assets: skipped ${name} (${error.message ?? error})`)
    }
  }
}
await Promise.all(Array.from({ length: 8 }, worker))

writeFileSync(join(CLIENT, 'assets.json'), JSON.stringify({ files }))
const retired = Object.keys(previous).filter((name) => !(name in files)).length - failed
console.log(`carry-assets: ${current.length} in this build, ${carried} carried from recent builds, ${failed} skipped, ${retired} retired.`)
