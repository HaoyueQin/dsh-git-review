/**
 * The plugin's card in Settings → Plugins → Plugin configuration
 * (`settings.plugin.item` keyed slot, dispatched under the host-served
 * `dsh-git-review` settings namespace). Visual language follows the harness's
 * own plugin cards: a rounded bordered card whose header toggles disclosure,
 * rows separated by hairlines, and the tab's segmented buttons as controls —
 * sized to the settings modal instead of the review toolbar.
 *
 * Edits apply instantly to the bound settings scope (deliberately no staged
 * save/discard form: every option here mirrors a control the tab already
 * has, and instant-apply is what the tab's own controls do). When the scope
 * is read-only (memory-mode browser) the controls disable with a note.
 */
import { useCallback, useEffect, useState } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { ReviewSettingsField, ReviewSettingsState } from './review-settings.ts'
import type { ReviewPrefs } from './prefs.ts'
import { ChevronIcon } from './icons.tsx'
import css from './review.module.css'
import type { NS } from './locales.ts'

type T = PropsLocale<typeof NS>['t']

/** The store face the card consumes (published through the registration's inject). */
export interface ReviewSettingsStoreLike {
  subscribe(listener: () => void): () => void
  getSnapshot(): ReviewSettingsState
}

export interface SettingsCardProps {
  t: T
  reviewSettings: ReviewSettingsStoreLike
  set: (field: ReviewSettingsField, value: string | boolean) => void
}

/** One segmented row: label + hint + the current choice among options. */
function PrefRow({ label, hint, value, options, disabled, onChange }: {
  label: string
  hint: string
  value: string
  options: ReadonlyArray<{ key: string; label: string }>
  disabled: boolean
  onChange: (key: string) => void
}) {
  return (
    <div className={css.pluginPrefRow}>
      <div className={css.pluginPrefText}>
        <span className={css.pluginPrefLabel}>{label}</span>
        <span className={css.pluginPrefHint}>{hint}</span>
      </div>
      <span className={css.scopeSwitch} role="group" aria-label={label}>
        {options.map(option => (
          <button
            key={option.key}
            type="button"
            disabled={disabled}
            className={css.scopeBtn + (value === option.key ? ' ' + css.scopeBtnActive : '')}
            onClick={() => { onChange(option.key) }}
          >
            {option.label}
          </button>
        ))}
      </span>
    </div>
  )
}

/** The plugin-configuration card (one keyed dispatch in the plugins tab). */
export function SettingsCard({ t, reviewSettings, set }: SettingsCardProps) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ReviewSettingsState>(() => reviewSettings.getSnapshot())
  useEffect(() => reviewSettings.subscribe(() => { setState(reviewSettings.getSnapshot()) }), [reviewSettings])
  const update = useCallback((patch: Partial<ReviewPrefs>) => {
    for (const [field, value] of Object.entries(patch)) set(field as ReviewSettingsField, value as string | boolean)
  }, [set])
  const prefs = state.prefs
  const disabled = state.status !== 'ready' || !state.writable
  return (
    <li className={css.pluginCard + (open ? ' ' + css.pluginCardOpen : '')}>
      <button
        type="button"
        className={css.pluginCardHead}
        aria-expanded={open}
        aria-label={(open ? t('settings.collapse') : t('settings.expand')) + ': ' + t('settings.title')}
        onClick={() => { setOpen(value => !value) }}
      >
        <span className={css.pluginCardHeadText}>
          <span className={css.pluginCardName}>{t('settings.title')}</span>
          <span className={css.pluginCardDescription}>{t('settings.description')}</span>
        </span>
        <ChevronIcon rotated={open} />
      </button>
      {open && (
        <div className={css.pluginCardBody}>
          {state.status !== 'ready' && <p className={css.pluginCardNote}>{t('settings.loading')}</p>}
          {state.status === 'ready' && !state.writable && <p className={css.pluginCardNote}>{t('settings.readOnly')}</p>}
          <PrefRow
            label={t('settings.layout')}
            hint={t('settings.layoutHint')}
            value={prefs.viewMode}
            disabled={disabled}
            options={[
              { key: 'split', label: t('view.split') },
              { key: 'unified', label: t('view.unified') },
            ]}
            onChange={key => { update({ viewMode: key === 'unified' ? 'unified' : 'split' }) }}
          />
          <PrefRow
            label={t('settings.scope')}
            hint={t('settings.scopeHint')}
            value={prefs.searchScope}
            disabled={disabled}
            options={[
              { key: 'diff', label: t('search.scope.diff') },
              { key: 'content', label: t('search.scope.content') },
              { key: 'path', label: t('search.scope.path') },
            ]}
            onChange={key => { update({ searchScope: key === 'content' ? 'content' : key === 'path' ? 'path' : 'diff' }) }}
          />
          <PrefRow
            label={t('settings.rail')}
            hint={t('settings.railHint')}
            value={prefs.graphCollapsed ? 'collapsed' : 'expanded'}
            disabled={disabled}
            options={[
              { key: 'expanded', label: t('settings.railExpanded') },
              { key: 'collapsed', label: t('settings.railCollapsed') },
            ]}
            onChange={key => { update({ graphCollapsed: key === 'collapsed' }) }}
          />
          <div className={css.pluginPrefRow}>
            <div className={css.pluginPrefText}>
              <span className={css.pluginPrefLabel}>{t('settings.matching')}</span>
              <span className={css.pluginPrefHint}>{t('settings.matchingHint')}</span>
            </div>
            <span className={css.scopeSwitch} role="group" aria-label={t('settings.matching')}>
              {([['cs', t('search.flagCS')], ['rx', t('search.flagRegex')]] as const).map(([key, label]) => {
                const active = key === 'cs' ? prefs.searchCS : prefs.searchRegex
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    className={css.scopeBtn + (active ? ' ' + css.scopeBtnActive : '')}
                    onClick={() => { update(key === 'cs' ? { searchCS: !prefs.searchCS } : { searchRegex: !prefs.searchRegex }) }}
                  >
                    {label}
                  </button>
                )
              })}
            </span>
          </div>
          {state.status === 'ready' && <p className={css.pluginCardNote}>{t('settings.instantNote')}</p>}
        </div>
      )}
    </li>
  )
}
