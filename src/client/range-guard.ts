/** Ref-range order guard: a `base...target` comparison is empty exactly when
 *  the target adds nothing beyond the base (target inside the base's history),
 *  which reads as a broken tab when the ends are picked in the wrong order.
 *  These pure helpers turn the loaded commit feeds into picker constraints;
 *  anything outside the loaded window stays selectable and falls through to
 *  the empty-direction hint with its one-click swap. No I/O and no React —
 *  the check script imports this file directly under Node's native TS type
 *  stripping (Node >= 23.6).
 */

/** Minimal commit shape for ancestry walks and name resolution. */
export interface RangeCommit {
  hash: string
  parents: readonly string[]
  refs?: readonly { name: string }[]
}

/** Find the tip hash of a branch by its decoration name (newest first wins).
 *  Null when the branch points outside the loaded window (or is unknown). */
export function findBranchTip(commits: readonly RangeCommit[], branch: string | null | undefined): string | null {
  if (branch === null || branch === undefined || branch === '') return null
  for (const commit of commits) {
    if (commit.refs !== undefined && commit.refs.some(deco => deco.name === branch)) return commit.hash
  }
  return null
}

/** Resolve a picker value to a commit hash: 'HEAD' via the branch tip,
 *  a 40-hex id as-is, any other name via its newest loaded decoration.
 *  Null = unselected or outside the loaded window (unconstrainable). */
export function resolveRangeHash(
  value: string | null | undefined,
  commits: readonly RangeCommit[],
  headHash: string | null,
): string | null {
  if (value === null || value === undefined) return null
  if (value === 'HEAD') return headHash
  if (/^[0-9a-f]{40}$/i.test(value)) return value.toLowerCase()
  for (const commit of commits) {
    if (commit.refs !== undefined && commit.refs.some(deco => deco.name === value)) return commit.hash
  }
  return null
}

/** True when ancestor === descendant or ancestor is reachable by walking
 *  parents (bounded: unknown hashes and exhausted windows answer false,
 *  never hang). Powers both directions: a target is invalid exactly when it
 *  is the base or an ancestor of it; a base is invalid exactly when the
 *  target is it or one of its descendants. */
export function isAncestorOrSelf(
  parents: ReadonlyMap<string, readonly string[]>,
  ancestor: string,
  descendant: string,
  budget = 2000,
): boolean {
  if (ancestor === descendant) return true
  const seen = new Set<string>([descendant])
  let frontier: string[] = [descendant]
  while (frontier.length > 0 && budget > 0) {
    const next: string[] = []
    for (const hash of frontier) {
      for (const parent of parents.get(hash) ?? []) {
        if (parent === ancestor) return true
        if (!seen.has(parent)) {
          seen.add(parent)
          next.push(parent)
        }
        budget -= 1
        if (budget <= 0) return false
      }
    }
    frontier = next
  }
  return false
}
