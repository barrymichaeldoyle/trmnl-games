import { cloudflare } from '@cloudflare/vite-plugin'
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * One id per build: the commit Workers Builds deploys, else the build time. The bundle carries it and `/build.json`
 * publishes it, so a tab left open across a deploy can tell its code is old (lib/deployWatch).
 */
const BUILD_ID = process.env.WORKERS_CI_COMMIT_SHA || `local-${Date.now()}`
const buildManifest = (): Plugin => ({
  name: 'build-manifest',
  generateBundle() {
    if (this.environment.name === 'client') this.emitFile({ type: 'asset', fileName: 'build.json', source: JSON.stringify({ id: BUILD_ID }) })
  },
})

/**
 * Source maps for Sentry (D113): only when the build has SENTRY_AUTH_TOKEN (Workers Builds). The maps are uploaded under
 * the same release the SDKs report (BUILD_ID) and deleted afterwards, so neither the Worker nor the site serves them.
 */
const sentrySourceMaps = (): Plugin[] => process.env.SENTRY_AUTH_TOKEN
  ? sentryTanstackStart({ org: 'barry-michael-doyle', project: 'trmnl-games', release: { name: BUILD_ID }, autoInstrumentMiddleware: false, telemetry: false })
  : []

/**
 * D169: Desk Crawler's content dictionaries load one locale at a time in the browser (lib/content, i18n/lazy), where
 * the package's own modules (the log presenter, the device payload) import the static index that holds all seven.
 * This swaps that index for the lazy registry wherever the web build resolves it, so no page carries the other six
 * languages.
 */
const lazyContentDictionaries = (): Plugin => ({
  name: 'lazy-content-dictionaries',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (importer === undefined) return null
    const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
    return resolved && /[\\/]packages[\\/]desk-crawler[\\/]src[\\/]i18n[\\/]index\.ts$/.test(resolved.id) ? resolved.id.replace(/index\.ts$/, 'lazy.ts') : null
  },
})

export default defineConfig({
  resolve: { tsconfigPaths: true },
  define: { 'import.meta.env.VITE_BUILD_ID': JSON.stringify(BUILD_ID) },
  plugins: [lazyContentDictionaries(), cloudflare({ viteEnvironment: { name: 'ssr' } }), tailwindcss(), tanstackStart(), viteReact(), buildManifest(), ...sentrySourceMaps()],
})
