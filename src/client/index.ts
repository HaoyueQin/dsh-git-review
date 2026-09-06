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
 * slot and the session-scope runtime shares carry their rc.1 shapes
 * (alpha.1→rc.1 had no structural change on these surfaces — re-verify per
 * new rc, same policy as dsh-diff-stat).
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
// Type-only imports: pull the Context merges this plugin's registrations type
// against (locale dictionary map, the conversation.view SlotMap row, the
// renderer shares ConvViewProps references, the slot runtime itself).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import { createElement } from 'react'
import { ReviewView, type ReviewInjected } from './review-view.tsx'
import { SettingsCard, type SettingsCardProps } from './settings-card.tsx'
import { createReviewSettings, type ReviewSettings, type ReviewSettingsBinderFace } from './review-settings.ts'
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
     *  ui-settings-plugins package is not in our dependency tree. */
    'settings.plugin.item': { kind: 'keyed'; scope: 'root'; owner: { children?: never } }
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
  // Zero-dependency: absent bridge means no registration, UI unchanged.
  ctx.effect(() => {
    let unregister: (() => void) | undefined
    let disposed = false
    const unsubscribe = subscribeGlassReady(glass => {
      if (disposed) return
      unregister?.()
      unregister = glass.register({
        plugin: 'dsh-git-review',
        selectors: ['[data-git-review-toolbar]', '[data-git-review-tree]', '[data-git-review-diff]'],
        mode: 'fill',
      })
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
      settings,
    }),
  }, ReviewView))
  // Optional composition: bind the host-served preference namespace and claim
  // its plugin-configuration card. A deployment without the settings surface
  // never runs this callback — the tab keeps its localStorage fallback and
  // the intersection filter leaves no card behind.
  ctx.inject(['settingsScope'], (raw) => {
    const binder = (raw as ClientContext & { settingsScope?: ReviewSettingsBinderFace }).settingsScope
    if (binder === undefined) return
    ctx.effect(() => settings.attach(binder.bind({ namespace: SETTINGS_NAMESPACE })), 'dsh-git-review: settings scope')
    ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
      name: 'settings.plugin.item',
      key: SETTINGS_NAMESPACE,
      locale: NS,
      inject: () => ({ reviewSettings: settings.store, set: (field: Parameters<SettingsCardProps['set']>[0], value: string | boolean) => { settings.set(field, value) } }),
    }, props => createElement(SettingsCard, props as unknown as SettingsCardProps)))
  })
}
