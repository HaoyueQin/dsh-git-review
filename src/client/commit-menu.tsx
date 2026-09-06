/**
 * The graph commit's context menu: right-click a commit row (or use the
 * detail bar's buttons) and this popover offers the history operations —
 * reset to this commit (soft/mixed/hard), revert (a new inverse commit)
 * and cherry-pick onto the current branch. Same presentational contract as
 * the file menu: every action is a callback returning the error text or
 * null on success; the reset confirmation lives inside this popover and
 * hard carries the red warning (its leftover-files semantics included).
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { UndoIcon } from './icons.tsx'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import css from './review.module.css'

type T = PropsLocale<typeof NS>['t']

export interface CommitMenuState {
  hash: string
  subject: string
  x: number
  y: number
}

export interface CommitMenuProps {
  state: CommitMenuState
  /** Agent-running gate (all history operations are write operations). */
  running: boolean
  onClose: () => void
  /** Run one operation; resolves to the error text, or null on success
   *  (the menu closes and the caller refreshes). */
  run: (action: 'reset' | 'revert' | 'cherry-pick', commit: string, mode?: 'soft' | 'mixed' | 'hard') => Promise<string | null>
  t: T
}

export function CommitMenu({ state, running, onClose, run, t }: CommitMenuProps) {
  const [mode, setMode] = useState<'menu' | 'reset' | 'busy'>('menu')
  const [note, setNote] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState({ left: state.x, top: state.y })

  useEffect(() => {
    if (mode === 'busy') return
    const onDown = (event: MouseEvent): void => {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [mode, onClose])

  // Same viewport flip the file menu needs: the graph list hugs the view's
  // left, but the detail-bar buttons sit at the right edge.
  useLayoutEffect(() => {
    const el = rootRef.current
    if (el === null) return
    const rect = el.getBoundingClientRect()
    const margin = 8
    let { left, top } = pos
    if (pos.left + rect.width > window.innerWidth - margin) left = window.innerWidth - rect.width - margin
    if (pos.top + rect.height > window.innerHeight - margin) top = window.innerHeight - rect.height - margin
    left = Math.max(margin, left)
    top = Math.max(margin, top)
    if (left !== pos.left || top !== pos.top) setPos({ left, top })
  })

  const exec = async (action: 'reset' | 'revert' | 'cherry-pick', graphMode?: 'soft' | 'mixed' | 'hard'): Promise<void> => {
    setMode('busy')
    setNote(null)
    const error = await run(action, state.hash, graphMode)
    if (error === null) {
      onClose()
      return
    }
    setNote(error)
    setMode('menu')
  }

  const itemClass = css.fileMenuItem
  if (mode === 'reset') {
    return (
      <div className={css.fileMenuPop} ref={rootRef} style={{ left: pos.left, top: pos.top, width: 320 }}>
        <div className={css.fileMenuTitle}>{t('history.resetTitle')}</div>
        <div className={css.fileMenuDeletePath}>{state.hash.slice(0, 10) + ' \u00b7 ' + state.subject}</div>
        <div className={css.fileMenuApps}>
          <button type="button" className={css.stashRowText + ' ' + itemClass} disabled={running} onClick={() => { void exec('reset', 'soft') }}>
            <span className={css.pickerItemName}>{t('history.resetSoft')}</span>
            <span className={css.pickerItemMeta}>{t('history.resetSoftHint')}</span>
          </button>
          <button type="button" className={css.stashRowText + ' ' + itemClass} disabled={running} onClick={() => { void exec('reset', 'mixed') }}>
            <span className={css.pickerItemName}>{t('history.resetMixed')}</span>
            <span className={css.pickerItemMeta}>{t('history.resetMixedHint')}</span>
          </button>
          <button type="button" className={css.stashRowText + ' ' + itemClass + ' ' + css.fileMenuDanger} disabled={running} onClick={() => { void exec('reset', 'hard') }}>
            <span className={css.pickerItemName}>{t('history.resetHard')}</span>
            <span className={css.pickerItemMeta}>{t('history.resetHardHint')}</span>
          </button>
        </div>
        <div className={css.fileMenuActions}>
          <button type="button" className={css.commitBtn} onClick={() => { setMode('menu'); setNote(null) }}>
            {t('menu.cancel')}
          </button>
        </div>
        {note !== null && <div className={css.commitNote + ' ' + css.errorText}>{note}</div>}
      </div>
    )
  }

  return (
    <div className={css.fileMenuPop} ref={rootRef} style={{ left: pos.left, top: pos.top, width: 250 }}>
      <div className={css.fileMenuTitle} title={state.hash}>{state.hash.slice(0, 10) + ' \u00b7 ' + state.subject}</div>
      <button type="button" className={itemClass} disabled={running} onClick={() => { setNote(null); setMode('reset') }}>
        <span className={css.fileMenuItemIcon}><UndoIcon /></span>
        <span className={css.pickerItemName}>{t('history.reset')}</span>
      </button>
      <button type="button" className={itemClass} disabled={running} onClick={() => { void exec('revert') }}>
        <span className={css.pickerItemName}>{t('history.revert')}</span>
      </button>
      <button type="button" className={itemClass} disabled={running} onClick={() => { void exec('cherry-pick') }}>
        <span className={css.pickerItemName}>{t('history.cherryPick')}</span>
      </button>
      {note !== null && mode !== 'busy' && <div className={css.commitNote + ' ' + css.errorText}>{note}</div>}
      {mode === 'busy' && <div className={css.commitNote}>{t('menu.busy')}</div>}
    </div>
  )
}
