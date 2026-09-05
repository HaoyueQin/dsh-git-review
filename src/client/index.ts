/**
 * dsh-git-review — browser half.
 *
 * Registers one read-only Review tab in the conversation view slot (the same
 * public slot the trajectory tab uses): workspace changes vs HEAD as a
 * filterable file tree plus per-file side-by-side diffs. Data comes from the
 * host half's fenced prefix route (see src/index.ts); when the host half is
 * absent the tab degrades to an explicit notice instead of erroring.
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
import { ReviewView, type ReviewInjected } from './review-view.tsx'
import { SettingsCard } from './settings-card.tsx'
import { en, NS, zh, type ReviewKey } from './locales.ts'
import { subscribeGlassReady } from './glass.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Review tab copy. */
    'git-review': ReviewKey
  }
  interface SlotMap {
    /** Own settings section in the settings modal's nav. Declared here
     *  because the owning ui-settings package is not in our dependency
     *  tree; `settings.plugin.item` was rejected — that tab renders the
     *  intersection with the host-served settings namespaces, which a
     *  localStorage-backed card has no row in. */
    'settings.section': { kind: 'list'; scope: 'root' }
  }
}

/** Required services: the slot registry, the session directory (workspace
 *  lookup) and the locale service. */
export const inject = ['slots', 'sessions', 'locale']

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
  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'git-review',
    order: 20,
    locale: NS,
    label: () => t('tab'),
    inject: (sessionId: string): ReviewInjected => ({
      cwd: ctx.sessions.list.getSnapshot().byId[sessionId as SessionId]?.cwd,
    }),
  }, ReviewView))
  // Own settings section in the settings modal's nav (the review-checkout
  // precedent): the plugins-configuration tab filters cards by host-served
  // settings namespaces, which a localStorage-backed card has no row in.
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'git-review',
    order: 25,
    locale: NS,
    label: () => t('settings.title'),
    inject: () => ({}),
  }, SettingsCard))
}
