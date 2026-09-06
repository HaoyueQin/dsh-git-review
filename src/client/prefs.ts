/**
 * User preferences for the review tab. The durable source is the host-served
 * settings namespace (review-settings.ts binds it and both surfaces read that
 * store); this module keeps the fallback channel the tab degrades to when no
 * settings seam serves the section: one JSON key in localStorage, written on
 * every change and read back on mount. On first contact with a serving scope
 * the store is migrated there and removed (review-settings.ts).
 */

export type ReviewPrefs = {
  /** Default diff layout for the worktree pane. */
  viewMode: 'split' | 'unified'
  /** Default search scope (diff content / file content / file names). */
  searchScope: 'diff' | 'content' | 'path'
  /** Whether the graph pane starts folded to the narrow rail. */
  graphCollapsed: boolean
  /** Remembered match toggles of the search. */
  searchCS: boolean
  searchRegex: boolean
  /** Whether diffs hide whitespace-only edits (git --ignore-all-space). */
  wsIgnore: boolean
  /** Whether diff/file lines get lightweight syntax coloring. */
  syntaxHighlight: boolean
}

export const PREFS_KEY = 'dsh-git-review.prefs'

export const DEFAULT_PREFS: ReviewPrefs = {
  viewMode: 'split',
  searchScope: 'diff',
  graphCollapsed: false,
  searchCS: false,
  searchRegex: false,
  wsIgnore: false,
  syntaxHighlight: true,
}

/** Merge a raw stored value over the defaults, keeping only known keys with
 *  valid values (a stale or hand-edited store must never crash the tab). */
export function normalizePrefs(raw: unknown): ReviewPrefs {
  const source = typeof raw === 'string' ? parseJson(raw) : raw
  if (source === null || typeof source !== 'object') return { ...DEFAULT_PREFS }
  const record = source as Record<string, unknown>
  const viewMode = record.viewMode === 'unified' ? 'unified' : 'split'
  const searchScope = record.searchScope === 'content' || record.searchScope === 'path' ? record.searchScope : 'diff'
  return {
    viewMode,
    searchScope,
    graphCollapsed: record.graphCollapsed === true,
    searchCS: record.searchCS === true,
    searchRegex: record.searchRegex === true,
    wsIgnore: record.wsIgnore === true,
    syntaxHighlight: record.syntaxHighlight !== false,
  }
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

/** Minimal storage surface (localStorage) — injectable for tests. */
export interface PrefsStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function loadPrefs(storage: PrefsStorage | undefined): ReviewPrefs {
  if (storage === undefined) return { ...DEFAULT_PREFS }
  try {
    return normalizePrefs(storage.getItem(PREFS_KEY))
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(storage: PrefsStorage | undefined, prefs: ReviewPrefs): void {
  if (storage === undefined) return
  try {
    storage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Private-mode quota errors leave the in-memory state authoritative.
  }
}

export function readPrefs(): ReviewPrefs {
  return loadPrefs(typeof localStorage === 'undefined' ? undefined : localStorage)
}
