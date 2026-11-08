/** Review a fixed set of catch IDs. New catches never slip into an already-open sale. */
export function catchesForSale<T extends { id: string }>(catches: readonly T[], reviewedIds: readonly string[], actions: Readonly<Record<string, { mountCost: number | null }>> | undefined, includeTrophies: boolean): T[] {
  const ids = new Set(reviewedIds)
  return catches.filter((fish) => ids.has(fish.id) && (includeTrophies || actions?.[fish.id]?.mountCost == null))
}
