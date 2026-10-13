/** D146: the top bag (32 slots under v22) + two equipped + one held + the stack rows, with room for more stack kinds. */
export const MAX_INVENTORY_ROWS = 48
/** Backend reads take a little more than the bound, so a hero over it fails `INVENTORY_SIZE` instead of being truncated. */
export const INVENTORY_READ = MAX_INVENTORY_ROWS + 8
/** D146: `sellMany` and `salvageMany` take up to this many items, so the top bag clears in one intent (the validator keeps it so). */
export const BATCH_ITEMS = 32
