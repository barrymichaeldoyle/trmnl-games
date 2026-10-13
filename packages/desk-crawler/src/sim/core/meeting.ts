import { createRng, type Rng } from './rng'
import type { ContentCatalog, MeetingKind, StreamSeeds } from './types'

/**
 * Meetings (D141). The `meeting` stream's draws have fixed positions so the adapter and the core read the same
 * numbers: 1 launch (permille), 2 where to look in the floor's pool (uint32), 3 the partner's new shard (uint32),
 * 4 which meeting (index). The stream exists only under a catalog with meeting rules, so earlier catalogs draw
 * nothing and replay unchanged.
 */

export interface MeetingPlan {
  /** Where the adapter starts looking among the floor's pool rows: the first at or after this shard, wrapping once. */
  readonly shard: number
  /** The partner's new pool position, as for raids, so no hero stays behind a wide gap. */
  readonly reshard: number
}

/** The meeting stream for this tick, or undefined when meetings cannot happen (no rules or no seed). */
export function meetingStream(streams: StreamSeeds, content: ContentCatalog): Rng | undefined {
  return content.meetings === undefined || streams.meeting === undefined ? undefined : createRng(streams.meeting)
}

/** Draws 1 to 3: whether the hero starts a meeting if this tick reaches its encounter, where to look, where the partner moves. */
export function drawMeetingPlan(rng: Rng, content: ContentCatalog): MeetingPlan | undefined {
  const launch = rng.int(1, 1000) <= content.meetings!.launchPermille
  const shard = Math.floor(rng.next() * 2 ** 32)
  const reshard = Math.floor(rng.next() * 2 ** 32)
  return launch ? { shard, reshard } : undefined
}

/**
 * For the adapter, before it calls the core: whether to look for a partner this tick. Pure; the core takes the
 * same first draws from the same seed, so the two can never disagree.
 */
export function planMeeting(streams: StreamSeeds, content: ContentCatalog): MeetingPlan | undefined {
  const rng = meetingStream(streams, content)
  return rng === undefined ? undefined : drawMeetingPlan(rng, content)
}

/** Draw 4: the meeting kind. */
export function drawMeetingKind(rng: Rng, content: ContentCatalog): MeetingKind {
  const kinds = content.meetings!.kinds
  return kinds[rng.int(0, kinds.length - 1)]!
}

/** A kind by id, for the partner's side and the readers; undefined when the pinned catalog has no such kind. */
export function meetingKind(content: ContentCatalog, id: string): MeetingKind | undefined {
  return content.meetings?.kinds.find((kind) => kind.id === id)
}
