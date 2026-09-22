/**
 * The plugin's per-user preference namespace (host half) — one schema, two
 * host generations.
 *
 * **≤ 0.1.6** — preferences live in the harness settings document under the
 * `dsh-git-review` namespace, registered through `ctx.settings.register`; the
 * browser half binds that namespace through `ctx.settingsScope` and publishes
 * the preference surface as a keyed card in the settings modal
 * (`settings.plugin.item`, retired upstream in 0.1.6-alpha.2; the Plugins-page
 * entry below serves that host too).
 *
 * **≥ 0.1.7** — the settings seam was REPLACED: `SettingsProvider.register` is
 * gone, forms are derived from a plugin's own cordis Config with `.volatile()`
 * fields, keyed by the profile entry id, and persisted into the active
 * profile's patch. So the same field set is exported as this module's
 * `Config`, and the browser half binds `ctx.configForms.get(entryId)`. Both
 * registrations stay in place: an absent service only parks its inject
 * callback, so one artifact serves every host (handover §12.5-54).
 *
 * Every field is a display preference consumed in the browser (the host never
 * reads the section) — the host half only declares the schema. The field
 * names/shapes mirror the browser's ReviewPrefs (src/client/prefs.ts); the
 * duplication is deliberate, the two halves share no bundle. `Config` is
 * therefore never read here: it carries no `Volatile` consumers.
 *
 * Optional composition: a host without a settings domain never runs the
 * inject callback — no namespace, no page section, and the tab keeps its
 * localStorage fallback.
 */
import type { Context } from '@deepseek-ai/cordis'
// Type-only: pulls dsh-settings' Context merge (`settings`: the ≤0.1.6
// provider, the ≥0.1.7 SettingsForms) into this program without naming a
// member — the consumed members are read through the capability probes below.
import type {} from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'

/** The namespace is the join key between this registration and the browser
 *  form. It must stay equal to the loader entry id in cordis.patch.yml
 *  (itself equal to the package name): 0.1.7 keys both the config form and the
 *  Plugins-page entry by that id, and old hosts key the settings document by
 *  this namespace. check-meta locks the three together. */
export const SETTINGS_NAMESPACE = 'dsh-git-review'

/** Section shape as the wire envelope the browser form validates against. */
export interface ReviewSettingsSection {
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

/** Schema field names (check-meta locks these to DEFAULT_PREFS' keys — a
 *  preference added on one side but not the other breaks the build). */
export const REVIEW_SETTINGS_FIELDS = [
  'viewMode', 'searchScope', 'graphCollapsed', 'searchCS', 'searchRegex', 'wsIgnore', 'syntaxHighlight',
] as const

/** The one method this module needs from a schema field, spelled structurally
 *  so the probe compiles whichever schemastery generation is installed. */
interface VolatileCapable {
  volatile?: () => unknown
}

/**
 * Mark one field as live configuration when the host's schemastery knows the
 * marker, else hand it back untouched.
 *
 * Why the probe (harness 0.1.7 alpha): `.volatile()` arrived with schemastery
 * 3.18.4, which only the 0.1.7 host ships (0.1.5/0.1.6 ship 3.18.1/3.18.2 and
 * have no such method). Calling it unconditionally would throw while this
 * module is being imported, and the loader applies a patch list as one group —
 * one throwing entry fails the whole plugin tree and dsh cannot boot
 * (handover §12.5-48, the v0.1.3 accident). The marker only carries the
 * config-form projection, so an older host simply keeps a plain schema and
 * serves the namespace through `register` instead.
 * @param field - the finished field schema (defaults and loose() applied).
 * @returns the same field, marked live where the API exists.
 */
function live<T extends object>(field: T): T {
  const marker = (field as VolatileCapable).volatile
  return typeof marker === 'function' ? (marker.call(field) as T) : field
}

/** The preference fields, as one schema serving both generations: on a 0.1.7
 *  host the loader hands these to `Config` and the form projection exposes
 *  every volatile field; on older hosts the same object is the namespace
 *  schema handed to `settings.register` (plain, because `live` is a no-op
 *  there). */
export const ReviewSettingsSchema = z.object({
  // Loose: a stale persisted value degrades to the default instead of
  // rejecting the whole section (same discipline as dsh-context's schema).
  viewMode: live(z.union(['split', 'unified']).default('split').loose()),
  searchScope: live(z.union(['diff', 'content', 'path']).default('diff').loose()),
  graphCollapsed: live(z.boolean().default(false)),
  searchCS: live(z.boolean().default(false)),
  searchRegex: live(z.boolean().default(false)),
  wsIgnore: live(z.boolean().default(false)),
  syntaxHighlight: live(z.boolean().default(true)),
})

/** Cordis plugin Config for hosts that derive settings from it (0.1.7+).
 *  Same object as the legacy namespace schema — the two seams differ in who
 *  reads it, never in what the fields are, and keeping one source is what
 *  keeps a preference from existing on one host generation only. */
export const Config = ReviewSettingsSchema

/**
 * Serve the namespace on whichever settings generation this host offers.
 * Inert without a settings domain.
 * @param ctx - host plugin context.
 */
export function installSettings(ctx: Context): void {
  ctx.inject(['settings'], (sctx) => {
    // 0.1.7+: the plugin's Config IS the editable configuration; this call
    // only claims the page policy (auto:false — this plugin ships its own
    // Plugins-page form through `plugins.bundle.config`). Read through a
    // probe: a host whose settings service is older has no `configure`, and
    // an unconditional call would fail the inject callback.
    const configure = (sctx.settings as { configure?: (presentation: { auto?: boolean }, owner?: unknown) => () => void }).configure
    if (typeof configure === 'function') {
      // Owned by the plugin fiber so the policy follows its lifetime.
      sctx.effect(() => configure.call(sctx.settings, { auto: false }, ctx.fiber), 'dsh-git-review: settings page policy')
      return
    }
    // ≤ 0.1.6: the settings document owns the namespace. `register` is
    // addressed through a local alias (never `sctx.settings.register(...)`)
    // so the capability probe above stays the only way in — check-meta locks
    // the direct form out.
    const register = (sctx.settings as { register?: (namespace: string, schema: unknown) => unknown }).register
    if (typeof register === 'function') register.call(sctx.settings, SETTINGS_NAMESPACE, ReviewSettingsSchema)
  })
}
