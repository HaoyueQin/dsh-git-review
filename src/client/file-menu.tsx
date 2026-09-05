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
import { useEffect, useRef, useState } from 'react'
import type { OpenApp } from '../contract.ts'
import type { InputActions, InputState } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import { CheckIcon, CopyIcon, FileIcon, FolderIcon, OpenIcon, PencilIcon, TrashIcon } from './icons.tsx'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import css from './review.module.css'

type T = PropsLocale<typeof NS>['t']

export interface FileMenuState {
  /** Repo-relative path of the clicked file. */
  path: string
  x: number
  y: number
}

export interface FileMenuProps {
  state: FileMenuState
  apps: OpenApp[] | null
  /** Whether destructive worktree operations are allowed (agent running off). */
  writable: boolean
  /** Whether the current list is a commit diff (no worktree ops available). */
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
  t: T
}

interface LineItem {
  key: string
  icon: React.ReactNode
  label: string
  onClick: () => void
}

export function FileMenu({ state, apps, writable, refsMode, useInput, inputActions, onClose, openApp, copyPath, copyName, rename, remove, t }: FileMenuProps) {
  const [mode, setMode] = useState<'menu' | 'apps' | 'rename' | 'delete' | 'busy'>('menu')
  const [renameValue, setRenameValue] = useState(state.path)
  const [note, setNote] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const canChat = useInput !== undefined && inputActions !== undefined
  // The draft is read inside this component's render (a draft subscription
  // at the review-view level would re-render the pane on every keystroke).
  const draft = useInput !== undefined ? useInput((s: InputState) => s.draft) : ''
  const addToChat = (path: string): Promise<string | null> => {
    if (useInput === undefined || inputActions === undefined) return Promise.resolve(t('menu.chatUnavailable'))
    const current = draft.replace(/\s+$/, '')
    inputActions.setDraft(current === '' ? path : current + '\n' + path)
    return Promise.resolve(null)
  }

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
    }
  }

  if (mode === 'rename') {
    const name = state.path.split('/').pop() ?? state.path
    const dir = state.path.slice(0, state.path.length - name.length)
    return (
      <div className={css.fileMenuPop} ref={rootRef} style={{ left: state.x, top: state.y, width: 330 }}>
        <div className={css.fileMenuTitle}>{t('menu.rename')}</div>
        <div className={css.fileMenuRenamePath}>{dir}</div>
        <input
          className={css.branchNameInput}
          value={renameValue}
          onChange={event => { setRenameValue(event.target.value) }}
          onKeyDown={event => {
            if (event.key === 'Enter') void run('rename', () => rename(state.path, renameValue.trim()))
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
      <div className={css.fileMenuPop} ref={rootRef} style={{ left: state.x, top: state.y, width: 330 }}>
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

  if (mode === 'apps') {
    return (
      <div className={css.fileMenuPop} ref={rootRef} style={{ left: state.x, top: state.y, width: 240 }}>
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

  const items: LineItem[] = [
    { key: 'open', icon: <OpenIcon />, label: t('menu.openDefault'), onClick: () => { void run('open', () => openApp(state.path, 'default')) } },
    { key: 'reveal', icon: <FolderIcon />, label: t('menu.reveal'), onClick: () => { void run('open', () => openApp(state.path, 'explorer')) } },
    { key: 'open-with', icon: <FileIcon />, label: t('menu.openWith'), onClick: () => { setNote(null); setMode('apps') } },
  ]
  return (
    <div className={css.fileMenuPop} ref={rootRef} style={{ left: state.x, top: state.y, width: 240 }}>
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
          {canChat && (
            <button
              type="button"
              className={css.fileMenuItem}
              onClick={() => { void run('chat', () => addToChat(state.path)) }}
            >
              <span className={css.fileMenuItemIcon}><CheckIcon /></span>
              <span className={css.pickerItemName}>{t('menu.addToChat')}</span>
            </button>
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
