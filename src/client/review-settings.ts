/**
 * The review tab's preference store (browser half) — one observable snapshot
 * shared by the tab and the plugins-settings card, replacing the G-round
 * localStorage-only store plus CustomEvent bridge.
 *
 * Primary source: the host-served `dsh-git-review` settings namespace, bound
 * through ctx.settingsScope. The harness settings document persists the
 * section, the scope's subscribe keeps both surfaces in sync (a card edit
 * reaches the tab through the store, a tab edit reaches the card through the
 * scope round-trip), and writes are validated by the host schema.
 *
 * Degradation: a host without the settings seam (or a memory-mode browser)
 * never gets the namespace served — the settings card is not dispatched then,
 * and the tab falls back to the localStorage store (prefs.ts) with the same
 * instant-apply behavior. A legacy localStorage store is migrated into the
 * scope once, on the first ready section, and removed afterwards.
 */
import {
  DEFAULT_PREFS, PREFS_KEY, loadPrefs, normalizePrefs, savePrefs,
  type PrefsStorage, type ReviewPrefs,
} from './prefs.ts'

/** The five persisted fields (the ReviewPrefs keys the UI can set). */
export type ReviewSettingsField = keyof ReviewPrefs

/** The scope face this plugin binds — a minimal re-type of ctx.settingsScope's
 *  product (the runtime service comes from the user's harness; spelling the
 *  consumed members keeps the dependency graph honest). */
export interface ReviewSettingsScopeLike {
  getSnapshot(): { status: 'loading' | 'ready' | 'unavailable'; value: unknown; writable: boolean }
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<void>
}

/** The ctx.settingsScope binder face, as consumed. */
export interface ReviewSettingsBinderFace {
  bind(spec: { namespace: string }): ReviewSettingsScopeLike
}

/** What the store publishes and both consumers render. */
export interface ReviewSettingsState {
  /** `ready` while the scope serves the section; `unavailable` falls back to
   *  the localStorage store inside the tab (the card is not dispatched then). */
  status: 'loading' | 'ready' | 'unavailable'
  prefs: ReviewPrefs
  /** Whether scope writes can land (memory-mode browsers are read-only). */
  writable: boolean
}

export interface ReviewSettings {
  /** Observable snapshot for useSyncExternalStore-style consumers. */
  store: {
    subscribe(listener: () => void): () => void
    getSnapshot(): ReviewSettingsState
  }
  /** Bind the scope (once per plugin); returns the unsubscriber. */
  attach(scope: ReviewSettingsScopeLike): () => void
  /** Apply one user choice: local echo first, then the durable write. */
  set(field: ReviewSettingsField, value: string | boolean): void
}

/** Prefs read back out of a served section: unknown shapes degrade to the
 *  defaults (same discipline as the localStorage normalizer). */
export function prefsFromSection(value: unknown): ReviewPrefs {
  return normalizePrefs(value)
}

/** Whether a served section still carries ONLY schema defaults — the guard
 *  that keeps the one-time legacy migration from clobbering a section the
 *  user already customized through the settings card. */
export function sectionIsDefault(value: unknown): boolean {
  const prefs = normalizePrefs(value)
  return prefsEqual(prefs, DEFAULT_PREFS)
}

/** The fields worth carrying over from a legacy localStorage store, or null
 *  when there is nothing to migrate (no stored value, or a store equal to
 *  the defaults — writing the defaults over a default section is noise). */
export function migrationFields(raw: unknown): ReviewPrefs | null {
  const prefs = typeof raw === 'string' ? parseJson(raw) : raw
  if (prefs === null || typeof prefs !== 'object') return null
  const normalized = normalizePrefs(prefs)
  return prefsEqual(normalized, DEFAULT_PREFS) ? null : normalized
}

/** Field list derived from the defaults: adding a preference can no
 *  longer silently skip the equality check below. */
const PREF_FIELDS = Object.keys(DEFAULT_PREFS) as (keyof ReviewPrefs)[]

function prefsEqual(a: ReviewPrefs, b: ReviewPrefs): boolean {
  return PREF_FIELDS.every(field => a[field] === b[field])
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

/** Read the raw legacy store (string or null) WITHOUT normalizing — the
 *  migration decision needs to distinguish "no store" from "a default store". */
function readLegacyRaw(storage: PrefsStorage | undefined): string | null {
  if (storage === undefined) return null
  try {
    return storage.getItem(PREFS_KEY)
  } catch {
    return null
  }
}

function removeLegacyStore(storage: PrefsStorage | undefined): void {
  if (storage === undefined) return
  try {
    storage.removeItem(PREFS_KEY)
  } catch {
    // A private-mode quota error leaves the scope authoritative anyway.
  }
}

export function createReviewSettings(storage: PrefsStorage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage): ReviewSettings {
  let state: ReviewSettingsState = { status: 'loading', prefs: loadPrefs(storage), writable: false }
  const listeners = new Set<() => void>()
  let scope: ReviewSettingsScopeLike | undefined
  let migrated = false

  const publish = (next: ReviewSettingsState): void => {
    if (next.status === state.status && next.writable === state.writable
      && prefsEqual(next.prefs, state.prefs)) return
    state = next
    for (const listener of listeners) listener()
  }

  return {
    store: {
      subscribe(listener) {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      },
      getSnapshot: () => state,
    },
    attach(bound) {
      scope = bound
      const sync = (): void => {
        const snap = bound.getSnapshot()
        if (snap.status !== 'ready') {
          publish({ status: snap.status === 'unavailable' ? 'unavailable' : 'loading', prefs: state.prefs, writable: false })
          return
        }
        // One-time legacy carry-over: a user-written localStorage store moves
        // into a still-default section, then the legacy store goes away —
        // the scope is the only source after the first ready section.
        if (!migrated) {
          const raw = readLegacyRaw(storage)
          if (raw === null) {
            migrated = true
          } else {
            const fields = migrationFields(raw)
            if (fields !== null && snap.writable && sectionIsDefault(snap.value)) {
              // Migrating: block re-entry while the writes land (each publish
              // would otherwise re-trigger this branch). The legacy store
              // goes away only after every field lands: a failed write must
              // keep the old copy for the next attempt.
              migrated = true
              const pending = Object.entries(fields).map(([field, value]) => bound.set(field, value))
              void Promise.allSettled(pending).then(results => {
                if (results.every(result => result.status === 'fulfilled')) removeLegacyStore(storage)
              })
            } else if (fields !== null && !snap.writable) {
              // Read-only ready with a legacy store: keep both the copy and
              // the one migration chance — a later writable ready migrates.
            } else {
              // Nothing to carry, or the scope already holds user choices
              // (legacy superseded): drop the legacy copy. A read-only
              // scope keeps it — deleting would strand the user's prefs
              // with nowhere to live.
              if (fields === null || sectionIsDefault(snap.value)) removeLegacyStore(storage)
              migrated = true
            }
          }
        }
        publish({ status: 'ready', prefs: prefsFromSection(snap.value), writable: snap.writable })
      }
      sync()
      return bound.subscribe(sync)
    },
    set(field, value) {
      // Normalize over the merge so an invalid write can never poison the
      // in-memory prefs (the host schema validates the durable copy).
      const next = normalizePrefs({ ...state.prefs, [field]: value })
      if (state.status === 'ready' && state.writable && scope !== undefined) {
        publish({ status: state.status, prefs: next, writable: state.writable })
        void scope.set(field, value).catch(() => { /* the next scope sync re-publishes host state */ })
        return
      }
      // Fallback channel: tab-local persistence while no scope serves the
      // section (the card is absent then, so no cross-surface sync is needed).
      publish({ status: state.status, prefs: next, writable: state.writable })
      savePrefs(storage, next)
    },
  }
}
