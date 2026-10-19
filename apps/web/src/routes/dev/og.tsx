import { createFileRoute, notFound } from '@tanstack/react-router'

const CARDS = {
  platform: { mark: '/favicon.svg', title: 'TRMNL Games', tagline: 'Games for your TRMNL e-ink display.', note: 'Desk Crawler is free on the TRMNL marketplace' },
  'desk-crawler': { mark: '/games/desk-crawler/icon-192.png', title: 'Desk Crawler', tagline: 'An office RPG that plays itself on your desk.', note: 'Free on the TRMNL marketplace' },
} as const
type Card = keyof typeof CARDS

/**
 * Dev-only social cards (1200x630). `node tools/art/og.mjs` screenshots `#og-card` into
 * public/og.png and public/games/desk-crawler/og.png (then bump OG_VERSION in lib/seo.ts), so the cards use the site's own fonts
 * and the same real TRMNL X screen, in the same device frame, as the home page's `DeviceSample`.
 */
export const Route = createFileRoute('/dev/og')({
  validateSearch: (search: Record<string, unknown>): { card: Card } => ({ card: search.card === 'desk-crawler' ? 'desk-crawler' : 'platform' }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: OgCard,
})

function OgCard() {
  const card = CARDS[Route.useSearch().card]
  return (
    <div id="og-card" className="flex h-[630px] w-[1200px] items-center gap-12 bg-ground px-14">
      <div className="flex w-[400px] shrink-0 flex-col gap-6">
        <img src={card.mark} alt="" width={96} height={96} className="size-24 [image-rendering:pixelated]" />
        <p className="font-display text-[4.25rem] leading-none font-bold text-gold-ink">{card.title}</p>
        <p className="text-[2rem] leading-snug text-ink">{card.tagline}</p>
        <p className="text-[1.5rem] font-semibold text-xp-ink">{card.note}</p>
      </div>
      {/* The home page's frame around the X marketing render (tools/trmnl/preview.ts --marketing --recap). */}
      <div className="w-[640px] shrink-0 rounded-[1.4rem] bg-[#3a3566] p-4 shadow-[0_0_0_3px_var(--color-night)]">
        <img src="/games/desk-crawler/screen-sample.png" alt="" width={1200} height={900} className="block h-auto w-full rounded-md bg-white" />
      </div>
    </div>
  )
}
