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
import { normalizeWorkspaceKey } from './prefs.ts'

export const VIEWED_KEY = 'dsh-git-review.viewed'

/** Per-workspace store key: blob hashes are content-derived, so one global
 *  key leaks reviewed marks across repositories that share content. (The
 *  pre-scoping global key is left unread: its mixed-workspace data cannot
 *  be attributed safely.) */
export function viewedKey(cwd: string): string {
  return VIEWED_KEY + ':' + encodeURIComponent(normalizeWorkspaceKey(cwd))
}

/** Oldest-dropped cap on remembered blob hashes. */
export const VIEWED_CAP = 2000

/** Parse a stored raw value into a bounded array of blob hashes; anything
 *  unexpected (junk, non-strings, non-hex, oversize) degrades rather than
 *  crashes. Hashes are 40/64-hex; anything else cannot be a blob mark. */
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
    if (typeof item === 'string' && /^[0-9a-f]{40}$|^[0-9a-f]{64}$/.test(item)) seen.add(item)
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
}

export function createViewedStore(
  cwd: string | undefined,
  storage: PrefsStorage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
): ViewedStore {
  // `set` is the fast membership face; `order` (newest first) is the
  // persisted form and the eviction queue.
  const key = cwd === undefined ? VIEWED_KEY : viewedKey(cwd)
  let order: string[]
  try {
    order = parseViewed(storage?.getItem(key) ?? null)
  } catch {
    order = []
  }
  const set = new Set(order)
  const persist = (): void => {
    if (storage === undefined) return
    try {
      storage.setItem(key, JSON.stringify(order))
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
  }
}
