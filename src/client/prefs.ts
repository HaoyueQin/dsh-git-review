/**
 * User preferences for the review tab, persisted in localStorage under one
 * JSON key. Every value here mirrors a control the user can flip inside the
 * tab (layout, search scope, graph rail), so the store is written on every
 * change and read back on mount — the settings card in Settings → Plugins
 * edits the same store, and `prefs/change` keeps concurrent views in sync.
 *
 * localStorage (the dsh-review-checkout precedent) beats a host settings
 * namespace for now: single-user single-machine, zero host surface, edits
 * apply instantly without a save button. If cross-device sync is ever
 * wanted, migrate the same shape to a registered settings namespace
 * (dsh-context's src/host/settings.ts is the in-ecosystem template).
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
}

export const PREFS_KEY = 'dsh-git-review.prefs'

/** Fired on `window` after every write so open views can re-read. */
export const PREFS_EVENT = 'dsh-git-review:prefs-change'

export const DEFAULT_PREFS: ReviewPrefs = {
  viewMode: 'split',
  searchScope: 'diff',
  graphCollapsed: false,
  searchCS: false,
  searchRegex: false,
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

export function writePrefs(prefs: ReviewPrefs): void {
  if (typeof localStorage === 'undefined') return
  savePrefs(localStorage, prefs)
  window.dispatchEvent(new CustomEvent(PREFS_EVENT))
}
