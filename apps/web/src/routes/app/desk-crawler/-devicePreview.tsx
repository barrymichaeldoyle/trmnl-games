import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { api } from '@trmnl-games/backend/api'
import { screenMarkup as deskCrawlerMarkup } from '@trmnl-games/desk-crawler/templates/screen'
import { screenMarkup as idleAnglerMarkup } from '@trmnl-games/idle-angler/templates/screen'
import { sceneUrlsAt } from '@trmnl-games/desk-crawler/art/sceneTime'
import { browserUtcOffset, localSceneUrl as sceneForNow, useMinute } from '../../../lib/localClock'
import { useT } from '../../../lib/i18n'
import { dcPagesMessages } from '../../../i18n/dcPages'
import { PREVIEW_DEVICES, PREVIEW_LAYOUTS, previewDocument, previewSize, type PreviewDevice, type PreviewLayout } from '@trmnl-games/desk-crawler/templates/preview'

const STORAGE_KEY = 'desk-crawler.preview'
const LAYOUTS = Object.keys(PREVIEW_LAYOUTS) as PreviewLayout[]
const DEVICES = Object.keys(PREVIEW_DEVICES) as PreviewDevice[]
/** The games with a device preview: each has its own templates and payload query, in the same framework shell. */
export type PreviewGame = 'desk-crawler' | 'idle-angler'
const MARKUP: Record<PreviewGame, Record<PreviewLayout, string>> = { 'desk-crawler': deskCrawlerMarkup, 'idle-angler': idleAnglerMarkup }
type Renderer = { engine: import('liquidjs').Liquid; templates: Record<PreviewLayout, import('liquidjs').Template[]> }
const renderers: Partial<Record<PreviewGame, Promise<Renderer>>> = {}
const getRenderer = (game: PreviewGame) => renderers[game] ??= import('liquidjs').then(({ Liquid }) => {
  const engine = new Liquid({ timezoneOffset: 0 })
  const templates = Object.fromEntries(LAYOUTS.map((layout) => [layout, engine.parse(MARKUP[game][layout])])) as Record<PreviewLayout, import('liquidjs').Template[]>
  return { engine, templates }
}).catch((error) => { delete renderers[game]; throw error })

/** Per-viewer convenience only: the remembered device and layout. Storage can be unavailable. */
function remembered(): { device: PreviewDevice; layout: PreviewLayout; portrait: boolean } {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null') as { device?: string; layout?: string; portrait?: boolean } | null
    return {
      device: DEVICES.includes(saved?.device as PreviewDevice) ? (saved!.device as PreviewDevice) : 'x',
      layout: LAYOUTS.includes(saved?.layout as PreviewLayout) ? (saved!.layout as PreviewLayout) : 'markup',
      portrait: saved?.portrait === true,
    }
  } catch {
    return { device: 'x', layout: 'markup', portrait: false }
  }
}

/**
 * What the owner's TRMNL is showing: the same canonical payload and Liquid
 * templates the plugin serves, rendered in the pinned framework inside a
 * drawn bezel. Until it renders, the bezel shows the hero's scene.
 */
export function DevicePreview({ sceneUrl, heroName }: { sceneUrl: string; heroName: string }) {
  const now = useMinute()
  const t = useT(dcPagesMessages)
  return <GamePreview game="desk-crawler" title={heroName} standIn={<img src={sceneForNow(sceneUrl, now)} alt={t.currentScene(heroName)} width={760} height={200} decoding="async" className="absolute inset-0 m-auto w-full [image-rendering:pixelated]" />} />
}

/**
 * Either game's preview: the owner's payload rendered through that game's templates in the chosen layout, device
 * and orientation (remembered per viewer). `standIn` fills the bezel until the render lands and whenever it fails;
 * `title` names the owner in the frame's title.
 */
export function GamePreview({ game, title, standIn }: { game: PreviewGame; title: string; standIn: ReactNode }) {
  const now = useMinute()
  const utcOffset = browserUtcOffset(now)
  const deskCrawler = useQuery({ ...convexQuery(api.trmnlPayload.mine, { now: now ?? 0, utcOffset }), enabled: now !== null && game === 'desk-crawler', throwOnError: false })
  const idleAngler = useQuery({ ...convexQuery(api.idleAngler.payload.preview, {}), enabled: game === 'idle-angler', throwOnError: false })
  const { data: payload, isError: payloadError } = game === 'desk-crawler' ? deskCrawler : idleAngler
  const [choice, setChoice] = useState<{ device: PreviewDevice; layout: PreviewLayout; portrait: boolean }>({ device: 'x', layout: 'markup', portrait: false })
  const [html, setHtml] = useState<string | null>(null)
  const [scale, setScale] = useState(0)
  const [loaded, setLoaded] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const frame = useRef<HTMLDivElement>(null)
  const t = useT(dcPagesMessages)
  const device = PREVIEW_DEVICES[choice.device]
  const size = previewSize(choice.device, choice.portrait)

  useEffect(() => setChoice(remembered()), [])

  const choose = (next: Partial<typeof choice>) => {
    const value = { ...choice, ...next }
    setChoice(value)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // Private mode or blocked storage: the choice simply isn't remembered.
    }
  }

  useEffect(() => {
    if (!payload || now === null) return
    let cancelled = false
    void (async () => {
      const { engine, templates } = await getRenderer(game)
      // TRMNL renders in UTC and the screen route adds the owner's offset as `utc_offset`; the browser's offset stands in for the TRMNL setting here.
      const context = game === 'desk-crawler' ? sceneUrlsAt(payload as Parameters<typeof sceneUrlsAt>[0], now, utcOffset) : payload
      const inner = await engine.render(templates[choice.layout], { ...context, utc_offset: utcOffset })
      if (!cancelled) { setHtml(previewDocument(inner, choice.device, choice.layout, `${title} on ${device.label}`, { shadeOtherSlots: true, portrait: choice.portrait })); setFailed(false) }
    })().catch(() => { if (!cancelled) { setFailed(true); setHtml(null) } })
    return () => {
      cancelled = true
    }
  }, [game, payload, now, utcOffset, choice, title, device.label])

  useEffect(() => {
    const element = frame.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setScale(entry!.contentRect.width / size.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [size.width])

  return (
    <figure className="flex flex-col gap-3">
      <div className="rounded-[1.4rem] bg-[#3a3566] p-[clamp(0.5rem,2.5vw,1rem)]">
        <div ref={frame} className="relative overflow-hidden rounded-md bg-white" style={{ aspectRatio: `${size.width} / ${size.height}` }}>
          {/* Scene stand-in: also what screen readers get, since the iframe is decorative duplication of the page. */}
          <div className={`absolute inset-0 transition-opacity duration-200 ${!payloadError && html && scale && loaded === html ? 'opacity-0' : 'opacity-100'}`}>{standIn}</div>
          {!payloadError && html && scale ? (
            <iframe
              title={t.previewTitle(t.layouts[choice.layout], device.label)}
              srcDoc={html}
              onLoad={() => setLoaded(html)}
              sandbox="allow-scripts"
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
              style={{ width: size.width, height: size.height, transform: `scale(${scale})` }}
            />
          ) : null}
          {/* E-ink refresh: replays whenever a new screen finishes loading. */}
          {!payloadError && loaded && loaded === html ? <div key={loaded} aria-hidden="true" className="pointer-events-none absolute inset-0 animate-[eink-refresh_420ms_steps(6,end)_both]" /> : null}
        </div>
      </div>
      <figcaption className="text-sm text-muted">
        {/* Separate rows keep every choice readable on narrow phones. */}
        <div role="group" aria-label={t.previewLayout} className="flex border-2 border-edge">
          {LAYOUTS.map((layout) => (
            <button
              key={layout}
              type="button"
              aria-pressed={choice.layout === layout}
              onClick={() => choose({ layout })}
              className="menu-cursor flex min-h-11 flex-1 items-center justify-center px-2 font-semibold text-muted not-last:border-r-2 not-last:border-edge hover:text-ink aria-pressed:bg-navy aria-pressed:text-gold"
            >
              {t.layouts[layout]}
            </button>
          ))}
        </div>
        <div role="group" aria-label={t.previewDevice} className="mt-2 flex justify-between gap-x-2 sm:justify-start sm:gap-x-5 sm:pl-0.5">
          {DEVICES.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={choice.device === key}
              onClick={() => choose({ device: key })}
              className="menu-cursor inline-flex min-h-11 items-center font-semibold whitespace-nowrap text-muted hover:text-ink aria-pressed:text-gold-ink"
            >
              {PREVIEW_DEVICES[key].label}
            </button>
          ))}
        </div>
        <div role="group" aria-label={t.previewOrientation} className="mt-2 flex border-2 border-edge">
          {[false, true].map((portrait) => (
            <button
              key={String(portrait)}
              type="button"
              aria-pressed={choice.portrait === portrait}
              onClick={() => choose({ portrait })}
              className="menu-cursor flex min-h-11 flex-1 items-center justify-center px-2 font-semibold text-muted not-last:border-r-2 not-last:border-edge hover:text-ink aria-pressed:bg-navy aria-pressed:text-gold"
            >
              {portrait ? t.portrait : t.landscape}
            </button>
          ))}
        </div>
        <p className="mt-3">
          {failed || payloadError
            ? t.previewUnavailable
            : choice.layout === 'markup'
              ? t.liveRender
              : t.liveRenderShared}
        </p>
      </figcaption>
    </figure>
  )
}

