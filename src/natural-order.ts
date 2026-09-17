/**
 * Natural (number-aware) name ordering, shared by the host and the client.
 *
 * Plain `<` comparison is codepoint order, so digit runs compare as text:
 * `v0.3.10` lands before `v0.3.2` and `file10` before `file9`, which reads as
 * broken in a ref picker or a file tree (2026-09-16: both the branch popover
 * and the compare picker listed tags as v0.3.1, v0.3.10, v0.3.2 …).
 * `Intl.Collator` with `numeric: true` compares digit runs by VALUE instead.
 *
 * The collator is pinned to the 'en' locale with `sensitivity: 'base'` so the
 * order is identical in Node and in the browser whatever the machine's locale
 * (the client re-sorts what the host sends — a locale-dependent order would
 * disagree between the halves), and so case/diacritic-only differences do not
 * reorder names. Names still equal fall back to codepoint order: a total,
 * deterministic tie-break that keeps `Array.prototype.sort` predictable.
 */

/** One collator instance: constructing it is expensive, comparing is not. */
const COLLATOR = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

/** Compare two names naturally (v0.3.2 < v0.3.10, file9 < file10), ignoring
 *  case and diacritics, with codepoint order as the final tie-break. */
export function compareNatural(a: string, b: string): number {
  const ordered = COLLATOR.compare(a, b)
  if (ordered !== 0) return ordered
  return a < b ? -1 : a > b ? 1 : 0
}
