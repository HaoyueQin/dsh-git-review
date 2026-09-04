/**
 * The Review tab: workspace changes vs HEAD as a filterable file tree plus
 * per-file side-by-side diffs. Read-only MVP: the only write-ish affordance
 * is Refresh, because an agent may be mutating the workspace while the tab
 * is open. The view opts into the conversation composer overlay
 * (data-conversation-composer-overlay) like the trajectory view: the shell
 * fixes the view's height and floats the input card over its bottom, so the
 * review→agent feedback loop stays one keystroke away.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { InjectFace, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { GitFileDiffPayload, GitStatusFailure, GitStatusPayload } from '../contract.ts'
import { hostCall } from './api.ts'
import { BranchIcon, RefreshIcon } from './icons.tsx'
import { DiffPane, type DiffScope } from './diff-pane.tsx'
import { TreePanel } from './tree-panel.tsx'
import type { NS } from './locales.ts'
import css from './review.module.css'

/** Props injected by the slot registration (see client/index.ts). */
export interface ReviewInjected {
  /** The session workspace path; undefined when the session has none. */
  cwd: string | undefined
}

type T = PropsLocale<typeof NS>['t']

/** The status side of the view. */
type StatusState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: GitStatusPayload }
  | { kind: 'notRepo' }
  | { kind: 'noWorkspace' }
  | { kind: 'hostUnavailable' }
  | { kind: 'error'; message: string }

/** The per-file diff side of the view. */
type DiffState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'text'; diff: string; truncated: boolean }
  | { kind: 'binary'; size: number }
  | { kind: 'failed'; message: string }

/** Fetch one status snapshot; maps every failure onto an explicit state. */
async function loadStatus(cwd: string): Promise<Exclude<StatusState, { kind: 'loading' }>> {
  const payload = await hostCall<GitStatusPayload | GitStatusFailure>('status', { cwd })
  if (payload === null) return { kind: 'hostUnavailable' }
  if (!payload.ok) return payload.isRepository === false ? { kind: 'notRepo' } : { kind: 'error', message: payload.error }
  return { kind: 'ready', data: payload }
}

/** Fetch one file's diff; keeps non-ok payloads as explicit failures. */
async function loadFileDiff(cwd: string, path: string, origPath: string | undefined, untracked: boolean, full: boolean, scope: DiffScope): Promise<Exclude<DiffState, { kind: 'loading' }>> {
  const payload = await hostCall<GitFileDiffPayload & { error?: string }>('file-diff', { cwd, path, origPath, untracked, full, scope })
  if (payload === null) return { kind: 'failed', message: 'host unavailable' }
  if (!payload.ok) return { kind: 'failed', message: payload.error ?? 'unknown error' }
  return payload.binary ? { kind: 'binary', size: payload.size } : { kind: 'text', diff: payload.diff, truncated: payload.truncated }
}

/** Total-render formatting: thousands separators, like Codex's toolbar. */
function fmtCount(value: number): string {
  return value.toLocaleString('en-US')
}

/**
 * The resident Review view for one session.
 * @param props - injected cwd plus the locale dictionary.
 */
export function ReviewView({ cwd, t }: InjectFace<ReviewInjected> & PropsLocale<typeof NS>) {
  const [status, setStatus] = useState<StatusState>({ kind: 'loading' })
  const [reloadTick, setReloadTick] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [diffFull, setDiffFull] = useState(false)
  const [diffScope, setDiffScope] = useState<DiffScope>('all')
  const [diff, setDiff] = useState<DiffState>({ kind: 'idle' })

  // Status lifecycle: on mount, on explicit refresh, and when the session's
  // workspace changes. A refresh keeps the previous list visible (loading
  // states only replace an empty board) so the tree never flashes blank.
  useEffect(() => {
    if (cwd === undefined) {
      setStatus({ kind: 'noWorkspace' })
      return
    }
    let alive = true
    setStatus(previous => (previous.kind === 'ready' || previous.kind === 'error' ? previous : { kind: 'loading' }))
    void loadStatus(cwd).then(next => {
      if (alive) setStatus(next)
    })
    return () => { alive = false }
  }, [cwd, reloadTick])

  const ready = status.kind === 'ready' ? status.data : null
  const selectedFile = useMemo(
    () => ready?.files.find(file => file.path === selected) ?? null,
    [ready, selected],
  )

  // Diff lifecycle: whenever the selected file, its untracked-ness (a status
  // refresh may reclassify it), the context depth, or the staged/unstaged
  // scope changes.
  useEffect(() => {
    if (cwd === undefined || selected === null || selectedFile === null) {
      setDiff({ kind: 'idle' })
      return
    }
    let alive = true
    setDiff({ kind: 'loading' })
    void loadFileDiff(cwd, selected, selectedFile.origPath, selectedFile.untracked, diffFull, diffScope).then(next => {
      if (alive) setDiff(next)
    })
    return () => { alive = false }
  }, [cwd, selected, selectedFile?.untracked, selectedFile?.origPath, diffFull, diffScope])

  const toggleDir = useCallback((path: string) => {
    setCollapsed(previous => {
      const next = new Set(previous)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const refresh = useCallback(() => {
    setReloadTick(tick => tick + 1)
  }, [])

  /** Select a tree file; the staged/unstaged scope resets per selection. */
  const selectFile = useCallback((path: string) => {
    setSelected(path)
    setDiffScope('all')
  }, [])

  if (status.kind === 'noWorkspace' || status.kind === 'hostUnavailable' || status.kind === 'notRepo' || status.kind === 'error') {
    return <CenteredState t={t} status={status} onRetry={refresh} />
  }

  const data = ready
  return (
    <div className={css.root} data-conversation-composer-overlay="">
      <header className={css.toolbar} data-git-review-toolbar="">
        <span className={css.branchChip} title={t('branch')}>
          <BranchIcon />
          {data?.branch ?? '\u2014'}
        </span>
        {data !== null && (
          <span className={css.totals}>
            <span className={css.totalAdded}>{'+' + fmtCount(data.totals.added)}</span>
            <span className={css.totalDeleted}>{'\u2212' + fmtCount(data.totals.deleted)}</span>
            <span className={css.fileCount}>{t('filesChanged', { count: data.files.length })}</span>
          </span>
        )}
        <span className={css.toolbarSpacer} />
        <button type="button" className={css.toolBtn} onClick={refresh} title={t('refresh')}>
          <RefreshIcon />
          <span>{status.kind === 'loading' ? t('refreshing') : t('refresh')}</span>
        </button>
      </header>
      <div className={css.body}>
        <main className={css.mainPane}>
          {selected === null || selectedFile === null || diff.kind === 'idle'
            ? (
              <div className={css.emptyState}>
                <div className={css.emptyTitle}>{t('empty.title')}</div>
                <div className={css.emptyHint}>{t('empty.hint')}</div>
              </div>
            )
            : diff.kind === 'failed'
              ? <div className={css.paneNotice + ' ' + css.errorText}>{diff.message}</div>
              : (
                <DiffPane
                  file={selectedFile}
                  diff={diff.kind === 'text' ? diff.diff : ''}
                  truncated={diff.kind === 'text' && diff.truncated}
                  loading={diff.kind === 'loading'}
                  binary={diff.kind === 'binary'}
                  size={diff.kind === 'binary' ? diff.size : 0}
                  full={diffFull}
                  onToggleFull={() => { setDiffFull(value => !value) }}
                  scope={diffScope}
                  onScopeChange={setDiffScope}
                  t={t}
                />
              )}
        </main>
        {data !== null && (
          <TreePanel
            files={data.files}
            selected={selected}
            onSelect={selectFile}
            filter={filter}
            onFilterChange={setFilter}
            collapsed={collapsed}
            onToggleDir={toggleDir}
            t={t}
          />
        )}
      </div>
    </div>
  )
}

/** Full-surface state for the non-ready cases (degradation with guidance). */
function CenteredState({ status, t, onRetry }: { status: Exclude<StatusState, { kind: 'ready' } | { kind: 'loading' }>; t: T; onRetry: () => void }) {
  if (status.kind === 'notRepo') {
    return (
      <div className={css.root + ' ' + css.centered} data-conversation-composer-overlay="">
        <div className={css.emptyTitle}>{t('state.notRepo.title')}</div>
        <div className={css.emptyHint}>{t('state.notRepo.hint')}</div>
      </div>
    )
  }
  const message = status.kind === 'noWorkspace'
    ? t('state.noWorkspace')
    : status.kind === 'hostUnavailable'
      ? t('state.hostUnavailable')
      : (t('state.error') + ': ' + status.message)
  return (
    <div className={css.root + ' ' + css.centered} data-conversation-composer-overlay="">
      <div className={css.emptyTitle}>{message}</div>
      <button type="button" className={css.toolBtn} onClick={onRetry}>
        <RefreshIcon />
        <span>{t('refresh')}</span>
      </button>
    </div>
  )
}
