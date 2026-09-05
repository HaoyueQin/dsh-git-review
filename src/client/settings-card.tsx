/**
 * The review tab's preference card in Settings → Plugins (`settings.plugin.item`
 * keyed slot). Edits apply instantly to the same localStorage store the tab
 * reads on mount and follows live via the prefs event — deliberately no
 * save/discard form: every option here mirrors a control the tab already has,
 * and the industry pattern (GitHub's diff gear, GitLab's preferences) keeps
 * these per-view choices instant rather than form-committed.
 */
import { useCallback, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { readPrefs, writePrefs, type ReviewPrefs } from './prefs.ts'
import css from './review.module.css'
import type { NS } from './locales.ts'

type T = PropsLocale<typeof NS>['t']

/** One segmented row: label + hint + the current choice among options. */
function PrefRow({ label, hint, value, options, onChange }: {
  label: string
  hint: string
  value: string
  options: ReadonlyArray<{ key: string; label: string }>
  onChange: (key: string) => void
}) {
  return (
    <div className={css.prefRow}>
      <div className={css.prefRowText}>
        <span className={css.prefLabel}>{label}</span>
        <span className={css.prefHint}>{hint}</span>
      </div>
      <span className={css.scopeSwitch} role="group" aria-label={label}>
        {options.map(option => (
          <button
            key={option.key}
            type="button"
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

/** The section page the settings modal renders (one nav entry). */
export function SettingsCard(_props: PropsRuntime<'settings.section'> & { t: T }) {
  const { t } = _props
  const [prefs, setPrefs] = useState<ReviewPrefs>(() => readPrefs())
  const update = useCallback((patch: Partial<ReviewPrefs>) => {
    setPrefs(previous => {
      const next = { ...previous, ...patch }
      writePrefs(next)
      return next
    })
  }, [])
  return (
    <div className={css.prefCard}>
      <div className={css.prefCardHead}>
        <span className={css.prefTitle}>{t('settings.title')}</span>
        <span className={css.prefDescription}>{t('settings.description')}</span>
      </div>
      <PrefRow
        label={t('settings.layout')}
        hint={t('settings.layoutHint')}
        value={prefs.viewMode}
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
        options={[
          { key: 'expanded', label: t('settings.railExpanded') },
          { key: 'collapsed', label: t('settings.railCollapsed') },
        ]}
        onChange={key => { update({ graphCollapsed: key === 'collapsed' }) }}
      />
      <div className={css.prefRow}>
        <div className={css.prefRowText}>
          <span className={css.prefLabel}>{t('settings.matching')}</span>
          <span className={css.prefHint}>{t('settings.matchingHint')}</span>
        </div>
        <span className={css.scopeSwitch} role="group" aria-label={t('settings.matching')}>
          {([['cs', t('search.flagCS')], ['rx', t('search.flagRegex')]] as const).map(([key, label]) => {
            const active = key === 'cs' ? prefs.searchCS : prefs.searchRegex
            return (
              <button
                key={key}
                type="button"
                className={css.scopeBtn + (active ? ' ' + css.scopeBtnActive : '')}
                onClick={() => { update(key === 'cs' ? { searchCS: !prefs.searchCS } : { searchRegex: !prefs.searchRegex }) }}
              >
                {label}
              </button>
            )
          })}
        </span>
      </div>
      <span className={css.prefNote}>{t('settings.instantNote')}</span>
    </div>
  )
}
