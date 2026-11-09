/**
 * Writes the catch scenario's device payload to tools/review/fixtures/idle-angler-payload.json, which the companion
 * fixtures harness serves as `idleAngler/payload:preview` so the On your TRMNL page renders a real screen offline.
 *   pnpm tsx tools/review/dump-idle-angler-payload.ts
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildPayload } from '@trmnl-games/idle-angler/payload'
import { previewScenarios } from '@trmnl-games/idle-angler/templates/previewScenarios'

// The production art host, so the harness preview draws the scene and fish the device would.
const payload = buildPayload(previewScenarios('https://exciting-cormorant-948.convex.site')['catch']!)
writeFileSync(resolve(import.meta.dirname, 'fixtures/idle-angler-payload.json'), JSON.stringify(payload, null, 2) + '\n')
console.log('wrote tools/review/fixtures/idle-angler-payload.json')
