import { ConvexError } from 'convex/values'

/** Stable error codes from api.md. */
export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'ACCOUNT_UNAVAILABLE'
  | 'GAME_UNAVAILABLE'
  | 'HERO_EXISTS'
  | 'HERO_NOT_FOUND'
  | 'INVALID_INPUT'
  | 'ALIAS_TAKEN'
  | 'INVALID_STATE'
  | 'INSTALL_INVALID'
  | 'TRMNL_REQUIRED'
  | 'CONNECTION_CONFLICT'
  | 'CONNECTION_UNAVAILABLE'
  | 'SERVICE_PAUSED'
  | 'RATE_LIMITED'
  | 'OPERATION_CONFLICT'
  | 'BIOME_LOCKED'
  | 'ITEM_NOT_AVAILABLE'
  | 'ITEM_EQUIPPED'
  | 'ITEM_HELD'
  | 'TODO_UNAVAILABLE'
  | 'TASK_DONE'
  | 'SWAP_USED'
  /** P35: the feature unlocks at a later level. */
  | 'LOCKED'
  /** D129: no goal reward is waiting. */
  | 'NOTHING_TO_CLAIM'
  | 'BAG_FULL'
  | 'BAG_UNAVAILABLE'
  | 'POUCH_UNAVAILABLE'
  | 'POUCH_FULL'
  | 'MERCHANT_GONE'
  | 'NO_CHOICE'
  | 'OFFER_UNAVAILABLE'
  | 'NOT_ENOUGH_GOLD'
  | 'HELD_ITEM_PENDING'
  | 'LEVEL_REQUIREMENT'
  /** D129: the workbench step would make the item unequippable, the materials are short, or the catalog has no workbench. */
  | 'LEVEL_TOO_LOW'
  | 'NOT_ENOUGH_MATERIALS'
  | 'WORKBENCH_UNAVAILABLE'
  | 'NO_POTION'
  | 'FULL_HP'
  /** D131: combining needs more of the source potion, or the catalog has no potion strengths. */
  | 'NOT_ENOUGH_POTIONS'
  | 'POTIONS_UNAVAILABLE'
  /** D142: the public name changed within the last 30 days, or today's name tag is sold. */
  | 'NAME_CHANGE_LIMIT'
  | 'NAME_TAG_SOLD_OUT'
  /** D143: the hero page to follow is private or missing (one shape for both), or the account follows 20 already. */
  | 'PLAYER_NOT_FOUND'
  | 'FOLLOW_LIMIT'
  | 'RECAP_CHANGED'
  /** D163: travelling would leave a dug-in elite behind; the companion asks first. */
  | 'STANDOFF_RUNNING'
  | 'DELETION_CONFIRMATION_REQUIRED'
  | 'DELETION_LINK_EXPIRED'
  | 'EMAIL_UNAVAILABLE'

const RETRYABLE = new Set<ErrorCode>(['RATE_LIMITED'])

/** Structured, user-safe error: `{ code, message, retryable }`. Never includes tokens or identities. */
export const appError = (code: ErrorCode, message: string) => new ConvexError({ code, message, retryable: RETRYABLE.has(code) })
