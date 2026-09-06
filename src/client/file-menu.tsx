/**
 * The file tree's context menu: right-click one changed-file row in the tree
 * panel and this popover appears with the file-manager operations — open
 * (default app), reveal in the OS file manager, open with an explicit app,
 * copy path/file name, add the path to the conversation, rename and delete.
 * The same menu pattern the reference DSH git plugins use (copy repo path /
 * reveal in file manager / per-file actions), anchored like forward menus.
 *
 * The component is presentational: every action is a callback returning a
 * Promise<string | null> — the error text to show, or null on success (the
 * parent closes on success and refreshes). Rename and delete happen inside
 * this popover (two-step confirmations), so the destructive path stays
 * behind an explicit user gesture.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { OpenApp } from '../contract.ts'
import type { InputActions, InputState } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import { CheckIcon, CopyIcon, FileIcon, FolderIcon, MinusIcon, OpenIcon, PencilIcon, PlusIcon, TrashIcon, UndoIcon } from './icons.tsx'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import css from './review.module.css'

type T = PropsLocale<typeof NS>['t']

export interface FileMenuState {
  /** Repo-relative path of the clicked file. */
  path: string
  x: number
  y: number
  /** Which tree opened the menu: commit-detail rows can jump into the
   *  plugin's own file view (absent = worktree rows, already there). */
  from?: 'commit'
  /** The row's worktree git state (worktree tree only; absent for commit
   *  files, whose rows carry no worktree ops). */
  git?: {
    /** The file has staged changes (index differs from HEAD). */
    staged: boolean
    /** The file has unstaged changes (worktree differs from index). */
    unstaged: boolean
    untracked: boolean
    /** Unmerged (UU/AA/DD/…): the ours/theirs items show. */
    conflicted?: boolean
  }
}

export interface FileMenuProps {
  state: FileMenuState
  apps: OpenApp[] | null
  /** Whether destructive worktree operations are allowed (agent running off). */
  writable: boolean
  /** Whether the current list is not the worktree tree (no worktree ops). */
  refsMode: boolean
  /** Conversation input channels (the add-to-chat item appends the path). */
  useInput: SnapshotSelectorHook<InputState> | undefined
  inputActions: InputActions | undefined
  onClose: () => void
  openApp: (path: string, app: OpenApp['id']) => Promise<string | null>
  copyPath: (path: string) => Promise<string | null>
  copyName: (path: string) => Promise<string | null>
  rename: (path: string, newPath: string) => Promise<string | null>
  remove: (path: string) => Promise<string | null>
  /** SCM row actions (stage/unstage/discard); absent hides the group. */
  gitAction?: (action: 'stage' | 'unstage' | 'discard', path: string) => Promise<string | null>
  /** Conflict resolution (ours/theirs); absent hides the conflict group. */
  conflictResolve?: (side: 'ours' | 'theirs', path: string) => Promise<string | null>
  openInPlugin?: (path: string) => void
  t: T
}

interface LineItem {
  key: string
  icon: React.ReactNode
  label: string
  onClick: () => void
}

/** Add-to-chat row: owns the composer-draft subscription, so the menu
 *  itself never calls a hook conditionally (the kit may arrive late). A
 *  draft subscription at the review-view level would re-render the whole
 *  pane on every composer keystroke — here only this row re-renders. */
function ChatItem({ path, useInput, inputActions, onRun, t }: {
  path: string
  useInput: SnapshotSelectorHook<InputState>
  inputActions: NonNullable<FileMenuProps['inputActions']>
  onRun: (label: string, fn: () => Promise<string | null>) => void
  t: T
}) {
  const draft = useInput((s: InputState) => s.draft)
  return (
    <button
      type="button"
      className={css.fileMenuItem}
      onClick={() => {
        onRun('chat', () => {
          const current = draft.replace(/\s+$/, '')
          inputActions.setDraft(current === '' ? path : current + '\n' + path)
          return Promise.resolve(null)
        })
      }}
    >
      <span className={css.fileMenuItemIcon}><CheckIcon /></span>
      <span className={css.pickerItemName}>{t('menu.addToChat')}</span>
    </button>
  )
}

export function FileMenu({ state, apps, writable, refsMode, useInput, inputActions, onClose, openApp, copyPath, copyName, rename, remove, gitAction, conflictResolve, openInPlugin, t }: FileMenuProps) {
  const [mode, setMode] = useState<'menu' | 'apps' | 'rename' | 'delete' | 'discard' | 'busy'>('menu')
  const [renameValue, setRenameValue] = useState(state.path)
  const [note, setNote] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const canChat = useInput !== undefined && inputActions !== undefined

  useEffect(() => {
    // Escape always dismisses (even mid-flight — the op continues in the
    // background and its completion handler is idempotent); outside-click
    // stays disabled while busy so a stray click can't drop the error row.
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    if (mode === 'busy') {
      return () => {
        document.removeEventListener('keydown', onKey)
      }
    }
    const onDown = (event: MouseEvent): void => {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [mode, onClose])

  // The tree lives on the view's RIGHT side, so a menu anchored at the raw
  // cursor position overflows the viewport's right edge. After every mount
  // and mode switch (the popover's size changes), pull the popover back
  // inside with an 8px margin — a poor man's flip-constraint.
  const [pos, setPos] = useState({ left: state.x, top: state.y })
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

  const run = async (_label: string, fn: () => Promise<string | null>): Promise<void> => {
    setMode('busy')
    setNote(null)
    const error = await fn()
    if (error === null) {
      onClose()
      return
    }
    setNote(error)
    setMode('menu')
  }

  const appLabel = (id: OpenApp['id']): string => {
    switch (id) {
      case 'default': return t('menu.app.default')
      case 'explorer': return t('menu.app.explorer')
      case 'notepad': return t('menu.app.notepad')
      case 'code': return t('menu.app.code')
      case 'code-insiders': return t('menu.app.codeInsiders')
      default: return id
    }
  }

  if (mode === 'rename') {
    const name = state.path.split('/').pop() ?? state.path
    const dir = state.path.slice(0, state.path.length - name.length)
    return (
      <div className={css.fileMenuPop} ref={rootRef} style={{ left: pos.left, top: pos.top, width: 330 }}>
        <div className={css.fileMenuTitle}>{t('menu.rename')}</div>
        <div className={css.fileMenuRenamePath}>{dir}</div>
        <input
          className={css.branchNameInput}
          value={renameValue}
          onChange={event => { setRenameValue(event.target.value) }}
          onKeyDown={event => {
            if (event.key === 'Enter' && renameValue.trim() !== '' && renameValue.trim() !== state.path) {
              void run('rename', () => rename(state.path, renameValue.trim()))
            }
            if (event.key === 'Escape') setMode('menu')
          }}
          autoFocus
          spellCheck={false}
        />
        <div className={css.fileMenuActions}>
          <button
            type="button"
            className={css.commitBtn}
            disabled={renameValue.trim() === '' || renameValue.trim() === state.path}
            onClick={() => { void run('rename', () => rename(state.path, renameValue.trim())) }}
          >
            {t('menu.confirmRename')}
          </button>
          <button type="button" className={css.commitBtn} onClick={() => { setMode('menu'); setNote(null) }}>
            {t('menu.cancel')}
          </button>
        </div>
        {note !== null && <div className={css.commitNote + ' ' + css.errorText}>{note}</div>}
      </div>
    )
  }

  if (mode === 'delete') {
    return (
      <div className={css.fileMenuPop} ref={rootRef} style={{ left: pos.left, top: pos.top, width: 330 }}>
        <div className={css.fileMenuTitle}>{t('menu.confirmDeleteTitle')}</div>
        <div className={css.fileMenuDeletePath}>{state.path}</div>
        <div className={css.fileMenuActions}>
          <button
            type="button"
            className={css.commitBtn + ' ' + css.branchDanger}
            onClick={() => { void run('delete', () => remove(state.path)) }}
          >
            {t('menu.confirmDelete')}
          </button>
          <button type="button" className={css.commitBtn} onClick={() => { setMode('menu'); setNote(null) }}>
            {t('menu.cancel')}
          </button>
        </div>
        {note !== null && <div className={css.commitNote + ' ' + css.errorText}>{note}</div>}
      </div>
    )
  }

  if (mode === 'discard') {
    return (
      <div className={css.fileMenuPop} ref={rootRef} style={{ left: pos.left, top: pos.top, width: 330 }}>
        <div className={css.fileMenuTitle}>{t('menu.confirmDiscardTitle')}</div>
        <div className={css.fileMenuDeletePath}>{state.path}</div>
        <div className={css.fileMenuActions}>
          <button
            type="button"
            className={css.commitBtn + ' ' + css.branchDanger}
            onClick={() => { void run('discard', () => gitAction?.('discard', state.path) ?? Promise.resolve(t('menu.unavailable'))) }}
          >
            {t('menu.confirmDiscard')}
          </button>
          <button type="button" className={css.commitBtn} onClick={() => { setMode('menu'); setNote(null) }}>
            {t('menu.cancel')}
          </button>
        </div>
        {note !== null && <div className={css.commitNote + ' ' + css.errorText}>{note}</div>}
      </div>
    )
  }

  if (mode === 'apps') {
    return (
      <div className={css.fileMenuPop} ref={rootRef} style={{ left: pos.left, top: pos.top, width: 240 }}>
        <div className={css.fileMenuTitle} title={state.path}>{state.path}</div>
        <div className={css.fileMenuApps}>
          {(apps ?? []).map(app => (
            <button
              key={app.id}
              type="button"
              className={css.pickerItem + (app.available ? '' : ' ' + css.pickerItemDisabled)}
              disabled={!app.available}
              onClick={() => { void run('openWith', () => openApp(state.path, app.id)) }}
            >
              <span className={css.pickerItemName}>{appLabel(app.id)}</span>
              {!app.available && <span className={css.pickerItemMeta}>{t('menu.appUnavailable')}</span>}
            </button>
          ))}
          <button type="button" className={css.pickerItem} onClick={() => { setMode('menu') }}>
            <span className={css.pickerItemName}>{t('menu.back')}</span>
          </button>
        </div>
        {note !== null && <div className={css.commitNote + ' ' + css.errorText}>{note}</div>}
      </div>
    )
  }

  const pluginOpener = state.from === 'commit' ? openInPlugin : undefined
  const items: LineItem[] = [
    ...(pluginOpener === undefined ? [] : [{ key: 'open-in-plugin', icon: <FileIcon />, label: t('menu.openInPlugin'), onClick: () => { pluginOpener(state.path); onClose() } }]),
    { key: 'open', icon: <OpenIcon />, label: t('menu.openDefault'), onClick: () => { void run('open', () => openApp(state.path, 'default')) } },
    { key: 'reveal', icon: <FolderIcon />, label: t('menu.reveal'), onClick: () => { void run('open', () => openApp(state.path, 'explorer')) } },
    { key: 'open-with', icon: <FileIcon />, label: t('menu.openWith'), onClick: () => { setNote(null); setMode('apps') } },
  ]
  return (
    <div className={css.fileMenuPop} ref={rootRef} style={{ left: pos.left, top: pos.top, width: 240 }}>
      <div className={css.fileMenuTitle} title={state.path}>{state.path}</div>
      <>
        {items.map(item => (
          <button key={item.key} type="button" className={css.fileMenuItem} onClick={item.onClick}>
            <span className={css.fileMenuItemIcon}>{item.icon}</span>
            <span className={css.pickerItemName}>{item.label}</span>
          </button>
        ))}
          <div className={css.fileMenuDivider} />
          <button
            type="button"
            className={css.fileMenuItem}
            onClick={() => { void run('copy', () => copyPath(state.path)) }}
          >
            <span className={css.fileMenuItemIcon}><CopyIcon /></span>
            <span className={css.pickerItemName}>{t('menu.copyPath')}</span>
          </button>
          <button
            type="button"
            className={css.fileMenuItem}
            onClick={() => { void run('copy', () => copyName(state.path)) }}
          >
            <span className={css.fileMenuItemIcon}><CopyIcon /></span>
            <span className={css.pickerItemName}>{t('menu.copyName')}</span>
          </button>
          {canChat && useInput !== undefined && inputActions !== undefined && (
            <ChatItem path={state.path} useInput={useInput} inputActions={inputActions} onRun={(label, fn) => { void run(label, fn) }} t={t} />
          )}
          {writable && !refsMode && state.git?.conflicted === true && conflictResolve !== undefined && (
            <>
              <div className={css.fileMenuDivider} />
              <button
                type="button"
                className={css.fileMenuItem}
                onClick={() => { void run('ours', () => conflictResolve('ours', state.path)) }}
              >
                <span className={css.fileMenuItemIcon}><CheckIcon /></span>
                <span className={css.pickerItemName}>{t('conflict.ours')}</span>
              </button>
              <button
                type="button"
                className={css.fileMenuItem}
                onClick={() => { void run('theirs', () => conflictResolve('theirs', state.path)) }}
              >
                <span className={css.fileMenuItemIcon}><CheckIcon /></span>
                <span className={css.pickerItemName}>{t('conflict.theirs')}</span>
              </button>
            </>
          )}
          {writable && !refsMode && state.git !== undefined && state.git.conflicted !== true && gitAction !== undefined && (
            <>
              <div className={css.fileMenuDivider} />
              {(state.git.unstaged || state.git.untracked) && (
                <button
                  type="button"
                  className={css.fileMenuItem}
                  onClick={() => { void run('stage', () => gitAction('stage', state.path)) }}
                >
                  <span className={css.fileMenuItemIcon}><PlusIcon /></span>
                  <span className={css.pickerItemName}>{t('menu.stage')}</span>
                </button>
              )}
              {state.git.staged && (
                <button
                  type="button"
                  className={css.fileMenuItem}
                  onClick={() => { void run('unstage', () => gitAction('unstage', state.path)) }}
                >
                  <span className={css.fileMenuItemIcon}><MinusIcon /></span>
                  <span className={css.pickerItemName}>{t('menu.unstage')}</span>
                </button>
              )}
              <button
                type="button"
                className={css.fileMenuItem + ' ' + css.fileMenuDanger}
                onClick={() => { setNote(null); setMode('discard') }}
              >
                <span className={css.fileMenuItemIcon}><UndoIcon /></span>
                <span className={css.pickerItemName}>{t('menu.discard')}</span>
              </button>
            </>
          )}
          {writable && !refsMode && (
            <>
              <div className={css.fileMenuDivider} />
              <button
                type="button"
                className={css.fileMenuItem}
                onClick={() => { setNote(null); setMode('rename') }}
              >
                <span className={css.fileMenuItemIcon}><PencilIcon /></span>
                <span className={css.pickerItemName}>{t('menu.rename')}</span>
              </button>
              <button
                type="button"
                className={css.fileMenuItem + ' ' + css.fileMenuDanger}
                onClick={() => { setNote(null); setMode('delete') }}
              >
                <span className={css.fileMenuItemIcon}><TrashIcon /></span>
                <span className={css.pickerItemName}>{t('menu.delete')}</span>
              </button>
            </>
          )}
      </>
      {note !== null && mode !== 'busy' && <div className={css.commitNote + ' ' + css.errorText}>{note}</div>}
      {mode === 'busy' && <div className={css.commitNote}>{t('menu.busy')}</div>}
    </div>
  )
}
