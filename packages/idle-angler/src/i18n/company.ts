/** D220: "A, B and C" in a language's own "and", or "A, B, C and 8 others" when `more` follows the names (Desk Crawler's D216 shape). */
export const company = (and: string, more: (count: number) => string, alone: (count: number) => string) => (names: readonly string[], others: number): string => {
  const rest = others - names.length
  if (names.length === 0) return others > 0 ? alone(others) : ''
  if (rest > 0) return `${names.join(', ')} ${more(rest)}`
  return names.length === 1 ? names[0]! : `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`
}
