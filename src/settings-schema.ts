/**
 * The plugin's per-user preference namespace (host half).
 *
 * Registering this namespace through the harness settings seam is what makes
 * the plugin's card render inside the settings modal's "Plugins → Plugin
 * configuration" tab: that tab dispatches the intersection of host-served
 * namespaces and `settings.plugin.item` cards keyed by namespace, so the
 * host half must serve `dsh-git-review` for the browser half's card to show
 * (the G-round `settings.section` nav entry was replaced by that card).
 *
 * Every field is a display preference consumed in the browser (the host
 * never reads the section) — the host half only registers the schema. The
 * field names/shapes mirror the browser's ReviewPrefs (src/client/prefs.ts);
 * the duplication is deliberate, the two halves share no bundle.
 *
 * Optional composition: a host without the settings domain never runs the
 * inject callback — no namespace, no card, and the tab keeps its localStorage
 * fallback.
 */
import type { Context } from '@deepseek-ai/cordis'
// Type-only: pulls dsh-settings' Context merge (settings: SettingsProvider)
// into this program without naming a member.
import type {} from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'

/** The namespace is the join key between this registration and the browser card. */
export const SETTINGS_NAMESPACE = 'dsh-git-review'

/** Section shape as the wire envelope the browser scope validates against. */
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
}

export const ReviewSettingsSchema: z<ReviewSettingsSection> = z.object({
  // Loose: a stale persisted value degrades to the default instead of
  // rejecting the whole section (same discipline as dsh-context's schema).
  viewMode: z.union(['split', 'unified']).default('split').loose(),
  searchScope: z.union(['diff', 'content', 'path']).default('diff').loose(),
  graphCollapsed: z.boolean().default(false),
  searchCS: z.boolean().default(false),
  searchRegex: z.boolean().default(false),
  wsIgnore: z.boolean().default(false),
})

/** Serve the namespace while a settings domain is composed; inert otherwise.
 *  The `settings` service (its type rides the dsh-settings type import above)
 *  validates the namespace against the harness's namespace pattern and owns
 *  the settings document from there. */
export function installSettings(ctx: Context): void {
  ctx.inject(['settings'], sctx => {
    sctx.settings.register(SETTINGS_NAMESPACE, ReviewSettingsSchema)
  })
}
