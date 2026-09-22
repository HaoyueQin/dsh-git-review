/**
 * dsh-git-review — browser half.
 *
 * Registers one Review tab in the conversation view slot (the same
 * public slot the trajectory tab uses): workspace changes vs HEAD as a
 * filterable file tree plus per-file diffs, a commit-graph view, and the
 * fenced git workbench (stage/commit/branches/tags/stash/conflicts). Data
 * comes from the host half's fenced prefix route (see src/index.ts); when
 * the host half is absent the tab degrades to an explicit notice instead
 * of erroring.
 *
 * The plugin's preference card renders in the settings modal's plugins tab
 * (`settings.plugin.item`, keyed on the host-served `dsh-git-review` settings
 * namespace — the G-round `settings.section` nav entry was replaced). The
 * same preference store feeds the tab, so a card edit and a toolbar flip
 * land in one place and both surfaces follow.
 *
 * Kernel contract: DeepSeek Harness >= 0.1.2-rc.1. The conversation.view
 * slot, the session-scope runtime shares and the settings card carry their
 * rc.1 shapes (re-verified unchanged through 0.1.6-alpha.2 — re-verify per
 * new harness, same policy as dsh-diff-stat). The 0.1.6 diff moved
 * composer-only types into ui-conversation's contract/draft-editor.ts and
 * added the conversation.input.permission seat; neither is touched here,
 * and no host DOM class name or structural selector is relied on anywhere in
 * this plugin. Anchored on dsh-client-ui-layout for the optional global panel
 * Hook (0.1.5+) read through Partial<GlobalStandardProps>.
 *
 * 0.1.6-alpha.2 retired the `settings.plugin.item` slot (the settings modal's
 * plugin-configuration cards) and moved plugin configuration to the Plugins
 * page: ui-plugin-manager declares `plugins.bundle.config` (keyed by the
 * bundle package name) and asks each entry for a `summary` line and a `page`
 * form. Both registrations are kept — an absent slot only parks its inject
 * callback — so one artifact serves either host.
 *
 * 0.1.7-alpha.1 REPLACED the settings seam itself: `ctx.settingsScope` became
 * `ctx.configForms` (the plugin's own volatile `Config`, keyed by the profile
 * entry id), and the host half's `settings.register` became
 * `settings.configure`. Both generations are served here — the binding funnel
 * below picks whichever service this host provides (see the block before the
 * registrations).
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
// Type-only imports: pull the Context merges this plugin's registrations type
// against (locale dictionary map, the conversation.view SlotMap row, the
// renderer shares ConvViewProps references, the slot runtime itself).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import { createElement } from 'react'
import { ReviewView, type ReviewInjected } from './review-view.tsx'
import { SettingsCard, SettingsPanel, type SettingsCardProps, type SettingsPanelProps } from './settings-card.tsx'
import { createReviewSettings, configFormScope, type ReviewSettings, type ReviewSettingsBinderFace, type ReviewConfigFormsFace } from './review-settings.ts'
import { en, NS, zh, type ReviewKey } from './locales.ts'
import { subscribeGlassReady } from './glass.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Review tab copy. */
    'git-review': ReviewKey
  }
  interface SlotMap {
    /** One plugin's card in the settings modal's plugins tab, keyed by the
     *  settings namespace it edits. Declared here because the declaring
     *  ui-settings-plugins package is not in our dependency tree. Retired by
     *  the host in 0.1.6-alpha.2 — the registration below still serves every
     *  host up to that version. */
    'settings.plugin.item': { kind: 'keyed'; scope: 'root'; owner: { children?: never } }
    /** A bundle's own configuration on the Plugins page, keyed by the bundle
     *  package name; the owner asks for `summary` (the line under the title)
     *  or `page` (the form body). Declared here for the same reason as the
     *  row above — importing ui-plugin-manager would put it in the client
     *  bundle's platform table, which no pre-alpha.2 host can satisfy. */
    'plugins.bundle.config': { kind: 'keyed'; scope: 'root'; owner: { readonly view: 'summary' | 'page' } }
  }
}

/** Required services: the slot registry, the session directory (workspace
 *  lookup) and the locale service. */
export const inject = ['slots', 'sessions', 'locale']

/** The host-served settings namespace (must equal the host half's
 *  SETTINGS_NAMESPACE in src/settings-schema.ts; spelled locally because the
 *  client bundle may not import from the host source tree). */
const SETTINGS_NAMESPACE = 'dsh-git-review'

/**
 * Mount the Review tab. The registration rides the slot service's effect
 * wrapper, so plugin unload removes the tab.
 * @param ctx - client root context (services arrive via the inject declaration).
 */
export function apply(ctx: ClientContext & { sessions: ISessions }): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-git-review: dictionaries')
  // Frosted-glass surfaces (deepseek-harness-background v1 bridge, fill mode:
  // the review root paints --dsw-alias-bg-layer-1, outside the auto-transparency
  // table, so the registry takes over the fill as well as the blur chain).
  // The graph column header is registered SEPARATELY from its panel: it is a
  // sticky row nested inside [data-git-review-graph], and a registry rule
  // addresses the registered element itself, never its descendants — without
  // its own anchor the header kept this stylesheet's opaque paint while every
  // other surface frosted, which is exactly the "table head will not join the
  // glass" symptom. Registering it (rather than hand-writing the recipe in
  // review.module.css) keeps the recipe in ONE place: the sheen + blur chain,
  // the panel-opacity slider curve and the dark-scheme calibration all ride
  // the bridge, and a future recipe change follows for free. Hand-rolled
  // copies carry the SAME specificity as the generated rule (body[attr]
  // [attr]), so the winner would be stylesheet insertion order — a silent
  // flip-flop instead of a decision.
  // Zero-dependency: absent bridge means no registration, UI unchanged.
  ctx.effect(() => {
    let unregister: (() => void) | undefined
    let disposed = false
    const unsubscribe = subscribeGlassReady(glass => {
      if (disposed) return
      unregister?.()
      // A hostile or broken bridge must never take the tab factory down.
      try {
        unregister = glass.register({
          plugin: 'dsh-git-review',
          selectors: [
            '[data-git-review-toolbar]',
            '[data-git-review-tree]',
            '[data-git-review-diff]',
            '[data-git-review-graph]',
            // The header of the graph column: sticky, therefore it must keep
            // its own fill (see the effect's comment above).
            '[data-git-review-graph-header]',
          ],
          mode: 'fill',
        })
      } catch {
        unregister = undefined
      }
    })
    return () => {
      disposed = true
      unsubscribe()
      unregister?.()
    }
  }, 'dsh-git-review: frosted-glass surfaces')
  // Registration-time text (the view tab label) reads through the bound
  // translate as a thunk, so it follows the active locale without
  // re-registration.
  const t = ctx.locale.bind(NS)
  // One preference store shared by the tab and the settings card (created
  // once here; the scope binds inside the optional settingsScope inject).
  const settings: ReviewSettings = createReviewSettings()
  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'git-review',
    order: 20,
    locale: NS,
    label: () => t('tab'),
    inject: (sessionId: string): ReviewInjected => ({
      cwd: ctx.sessions.list.getSnapshot().byId[sessionId as SessionId]?.cwd,
      // The snapshot above is shell-cached per session and can stick at
      // undefined when the list arrives late — the view subscribes to this
      // source and re-resolves instead of going blind forever.
      sessionId,
      sessionsList: ctx.sessions.list,
      settings,
    }),
  }, ReviewView))
  // One preference source per host generation, bound once (both funnels feed
  // the same store, so the tab and the preference surface never depend on
  // which host generation is running):
  //  - ≥ 0.1.7 — `configForms` serves this plugin's own Config (its volatile
  //    fields) keyed by the profile entry id. `settingsScope` was REMOVED
  //    upstream in 0.1.7, so a build that only knows the old service silently
  //    loses the whole configuration section there (no error, no log — see
  //    handover §12.5-54).
  //  - ≤ 0.1.6 — `settingsScope` serves the namespace registered by the host
  //    half. `configForms` does not exist yet, so that inject stays parked.
  // Either way the binding and the registrations ride the INJECTED scope
  // (raw): a settings service that disappears later then takes them with it
  // instead of leaving them bound to a dead service.
  let settingsBound = false
  /** Publish the preference UI on whichever config surface this host declares;
   *  both dispatch the same store, and an absent slot only parks its callback
   *  (the owner's unload cascades the clear), so one artifact serves both
   *  generations. */
  const publishPreferenceSurface = (scoped: ClientContext): void => {
    // ≤ 0.1.6-alpha.1 — Settings → Plugins → Plugin configuration: a keyed
    // card in the settings modal (declared by ui-settings-plugins).
    scoped.slots.inject('settings.plugin.item', () => scoped.slots.register({
      name: 'settings.plugin.item',
      key: SETTINGS_NAMESPACE,
      locale: NS,
      inject: () => ({ reviewSettings: settings.store, set: (field: Parameters<SettingsCardProps['set']>[0], value: string | boolean) => { settings.set(field, value) } }),
    }, props => createElement(SettingsCard, props as unknown as SettingsCardProps)))
    // ≥ 0.1.6-alpha.2 — the Plugins page hosts configuration: the bundle's own
    // page renders this entry between its description and its rows (declared
    // by ui-plugin-manager, keyed by the bundle package name). That page never
    // passes a form (only `plugins.item` and `plugins.row.config` get one), so
    // this entry reads the shared store exactly like the card above.
    scoped.slots.inject('plugins.bundle.config', () => scoped.slots.register({
      name: 'plugins.bundle.config',
      key: SETTINGS_NAMESPACE,
      locale: NS,
      inject: () => ({ reviewSettings: settings.store, set: (field: Parameters<SettingsPanelProps['set']>[0], value: string | boolean) => { settings.set(field, value) } }),
    }, props => createElement(SettingsPanel, props as unknown as SettingsPanelProps)))
  }
  ctx.inject(['configForms'], (raw) => {
    if (settingsBound) return
    const scoped = raw as ClientContext & { configForms?: ReviewConfigFormsFace }
    const forms = scoped.configForms
    if (forms === undefined || typeof forms.get !== 'function') return
    const form = forms.get(SETTINGS_NAMESPACE)
    if (form === undefined) return
    settingsBound = true
    scoped.effect(() => settings.attach(configFormScope(form)), 'dsh-git-review: config form')
    publishPreferenceSurface(scoped)
  })
  ctx.inject(['settingsScope'], (raw) => {
    // A host that already offers the 0.1.7 form service must not also bind the
    // legacy namespace: that host no longer serves registered namespaces, so
    // the modern path owns the binding there.
    if (settingsBound || ctx.get('configForms') !== undefined) return
    const scoped = raw as ClientContext & { settingsScope?: ReviewSettingsBinderFace }
    const binder = scoped.settingsScope
    if (binder === undefined) return
    settingsBound = true
    scoped.effect(() => settings.attach(binder.bind({ namespace: SETTINGS_NAMESPACE })), 'dsh-git-review: settings scope')
    publishPreferenceSurface(scoped)
  })
}
