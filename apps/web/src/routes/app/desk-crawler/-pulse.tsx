import { useEffect, useState } from 'react'
import { nextSlotAfter, slotEta, wallSlotFor, SLOT_MS } from '@trmnl-games/desk-crawler/sim/schedule'
import { formatTime, useLocale, useT } from '../../../lib/i18n'
import { dcScreenMessages } from '../../../i18n/dcScreen'

const STATUS_GLYPH: Record<string, string> = { exploring: 'combat', resting: 'rest', travelling: 'travel', dead: 'death', paused: 'system', sleeping: 'loot' }

export type PulseHero = {
  status: string
  simulationState: string
  biomeName: string
  targetName: string
  arriveAtTick: number | null
  reviveAtTick: number | null
  wakeAtTick: number | null
  /** Sleeping with a free slot and nothing held, so Resume is the next step. */
  bagReady?: boolean
  world: { currentTick: number; lastCompletedTick: number | null; lastCompletedAt: number | null; lastStartedWallSlot: number | null; paused: boolean } | null
}

/** Ticking clock, null until mounted so SSR and hydration agree. */
export function useNow(intervalMs = 1000): number | null {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') setNow(Date.now()) }, intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])
  return now
}


function countdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}

function sentence(hero: PulseHero, t: (typeof dcScreenMessages)['en']): string {
  switch (hero.status) {
    case 'exploring':
      return t.exploring(hero.biomeName)
    case 'resting':
      return t.resting(hero.biomeName)
    case 'travelling':
      return t.travelling(hero.targetName)
    case 'dead':
      return t.knockedOut
    case 'paused':
      return t.pausedByYou
    case 'sleeping':
      return hero.wakeAtTick !== null ? t.readyToResume : hero.bagReady ? t.roomInBag : t.stoppedForBag
    default:
      return t.adventuring
  }
}

/**
 * What the hero is doing and when the next adventure lands. Calm by design: no
 * urgency, and delays are explained without blaming the player (PRODUCT.md).
 */
export function usePulse(hero: PulseHero): { glyph: string; sentence: string; detail: string | null; countdown: string | null } {
  const now = useNow()
  const t = useT(dcScreenMessages)
  const locale = useLocale()
  const clock = (at: number) => formatTime(locale, at)
  const world = hero.world
  let detail: string | null = null
  // The HUD's next-adventure box is reserved whenever adventures are scheduled, so it never
  // appears or vanishes on hydration: the server render shows a blank clock in its place.
  const scheduled = hero.simulationState !== 'quarantined' && !world?.paused && world !== null && hero.status !== 'paused' && hero.status !== 'sleeping'
  let next: string | null = scheduled ? '--:--' : null
  if (hero.simulationState === 'quarantined') detail = t.serviceCheck
  else if (world?.paused) detail = t.maintenance
  else if (now !== null && world) {
    const slot = wallSlotFor(now)
    const running = world.lastCompletedTick !== world.currentTick || (world.lastStartedWallSlot ?? 0) < slot
    const late = world.lastCompletedAt !== null && now - world.lastCompletedAt > 2 * SLOT_MS
    const ticksTo = (tick: number | null) => (tick === null ? null : Math.max(1, tick - world.currentTick))
    if (late) detail = t.late
    else if (hero.status === 'paused') detail = t.noAdventures
    else if (hero.status === 'sleeping') detail = hero.wakeAtTick !== null ? t.resumeScheduled : hero.bagReady ? t.chooseResume : t.manageBag
    else if (running && now - slot < 5 * 60_000) detail = t.adventuringNow
    else if (hero.status === 'travelling' && ticksTo(hero.arriveAtTick)) detail = t.arrivesAbout(clock(slotEta(now, ticksTo(hero.arriveAtTick)!)))
    else if (hero.status === 'dead' && ticksTo(hero.reviveAtTick)) detail = t.backAbout(clock(slotEta(now, ticksTo(hero.reviveAtTick)!)))
    if (scheduled) next = running && now - slot < 5 * 60_000 ? t.now : countdown(nextSlotAfter(now) - now)
  }
  return { glyph: STATUS_GLYPH[hero.status] ?? 'system', sentence: sentence(hero, t), detail, countdown: next }
}
