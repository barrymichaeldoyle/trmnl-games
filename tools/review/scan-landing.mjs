/**
 * D217/D218: a scanned keepsake or fly code lands where it is seen. Drives the companion fixtures harness (see
 * companion-fixtures.mjs) at phone width and checks each landing: the code is sent exactly once, the address drops it
 * (so a reload never sends it again), confetti bursts and the new tile is marked New.
 *
 *   node tools/review/companion-fixtures.mjs && pnpm exec vite --config .previews/submission-companion/vite.config.mjs
 *   node tools/review/scan-landing.mjs [http://127.0.0.1:4197]
 */
import { chromium } from 'playwright-core'

const origin = process.argv[2] ?? 'http://127.0.0.1:4197'
const cases = [
  // The keepsake QR's short link lands on the keepsakes page (D218); the hero page passes an old ?keepsake= on.
  { name: 'keepsake', path: '/app/desk-crawler/keepsakes?keepsake=123456&ok=1', page: '/app/desk-crawler/keepsakes', fn: 'keepsakes:claim', code: '123456' },
  { name: 'fly', path: '/app/idle-angler/logbook?fly=654321&ok=1&outcome=claimed', page: '/app/idle-angler/logbook', fn: 'idleAngler/flies:claim', code: '654321' },
]

const failures = []
const check = (name, ok, detail) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${detail}`); if (!ok) failures.push(name) }
const browser = await chromium.launch({ channel: 'chrome' })
try {
  for (const c of cases) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.goto(origin + c.path)
    await page.waitForFunction(() => document.querySelector('.confetti') !== null, null, { timeout: 5000 }).catch(() => {})
    check(`${c.name} confetti`, (await page.locator('.confetti').count()) > 0, 'a burst over the landing')
    await page.waitForTimeout(600)
    const calls = await page.evaluate((fn) => (window.__mutations ?? []).filter((call) => call.fn === fn), c.fn)
    check(`${c.name} sent once`, calls.length === 1 && calls[0].args?.code === c.code, JSON.stringify(calls))
    check(`${c.name} address dropped`, new URL(page.url()).pathname === c.page && new URL(page.url()).search === '', page.url())
    check(`${c.name} New mark`, (await page.getByText(/^(New|Nouveau|Nouvelle)$/).count()) === 1, 'one tile marked New')
    await page.reload()
    await page.waitForTimeout(1200)
    const again = await page.evaluate((fn) => (window.__mutations ?? []).filter((call) => call.fn === fn).length, c.fn)
    check(`${c.name} reload`, again === 0, `${again} claims after a reload`)
    await page.close()
  }
} finally {
  await browser.close()
}
if (failures.length) { console.error(`${failures.length} failed`); process.exit(1) }
console.log('all landings ok')
