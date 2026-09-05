/**
 * The reviewed (Viewed) markers — the multi-round review workflow: a file the
 * user has signed off stays marked until its CONTENT changes (the marker is
 * keyed on the worktree blob hash, so an agent's new edit auto-unmarks it),
 * and the tree panel counts what is still pending.
 *
 * The store is client-local (localStorage) by design: review progress is a
 * machine-local reading gesture, not a preference the settings card owns.
 * Only a capped number of hashes is kept (oldest dropped) so the key cannot
 * grow without bound across long-lived repositories.
 */
import type { PrefsStorage } from './prefs.ts'

export const VIEWED_KEY = 'dsh-git-review.viewed'

/** Oldest-dropped cap on remembered blob hashes. */
export const VIEWED_CAP = 2000

/** Parse a stored raw value into a bounded array of blob hashes; anything
 *  unexpected (junk, non-strings, oversize) degrades rather than crashes. */
export function parseViewed(raw: string | null): string[] {
  if (raw === null) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  const seen = new Set<string>()
  for (const item of parsed) {
    if (typeof item === 'string' && item !== '') seen.add(item)
    if (seen.size >= VIEWED_CAP) break
  }
  return [...seen]
}

/** The reviewed-marker store: one JSON array in localStorage, newest first. */
export interface ViewedStore {
  /** Whether this blob hash is currently marked reviewed. */
  has(blob: string): boolean
  /** Toggle one hash; returns the state AFTER the toggle. */
  toggle(blob: string): boolean
  /** How many hashes are remembered. */
  count(): number
}

export function createViewedStore(
  storage: PrefsStorage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
): ViewedStore {
  // `set` is the fast membership face; `order` (newest first) is the
  // persisted form and the eviction queue.
  let order: string[]
  try {
    order = parseViewed(storage?.getItem(VIEWED_KEY) ?? null)
  } catch {
    order = []
  }
  const set = new Set(order)
  const persist = (): void => {
    if (storage === undefined) return
    try {
      storage.setItem(VIEWED_KEY, JSON.stringify(order))
    } catch {
      // Private-mode quota errors keep the in-memory state authoritative.
    }
  }
  return {
    has(blob) {
      return set.has(blob)
    },
    toggle(blob) {
      const marked = !set.has(blob)
      if (marked) {
        set.add(blob)
        order.unshift(blob)
        if (order.length > VIEWED_CAP) {
          for (const dropped of order.splice(VIEWED_CAP)) set.delete(dropped)
        }
      } else {
        set.delete(blob)
        order = order.filter(item => item !== blob)
      }
      persist()
      return marked
    },
    count() {
      return order.length
    },
  }
}
