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
import type { InjectFace, PropsLocale, SessionStandardProps } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionSnapshot } from '@deepseek-ai/dsh-api-session-controller/client'
import type { GitFileContentPayload, GitFileDiffPayload, GitListFilesPayload, GitRefEntry, GitRefsPayload, GitSearchPayload, GitStatusFailure, GitStatusPayload, GitWritePayload } from '../contract.ts'
import { hostCall } from './api.ts'
import { BranchIcon, CommitIcon, RefreshIcon, SearchIcon } from './icons.tsx'
import { DiffPane, type DiffScope } from './diff-pane.tsx'
import { FilePane, type FileViewMode } from './file-pane.tsx'
import { mergeAllFiles } from './file-tree.ts'
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
  | { kind: 'content'; content: string; truncated: boolean; size: number }
  | { kind: 'failed'; message: string }

/** Fetch one status snapshot; maps every failure onto an explicit state. */
async function loadStatus(cwd: string, base: string | null): Promise<Exclude<StatusState, { kind: 'loading' }>> {
  const payload = await hostCall<GitStatusPayload | GitStatusFailure>('status', { cwd, base })
  if (payload === null) return { kind: 'hostUnavailable' }
  if (!payload.ok) return payload.isRepository === false ? { kind: 'notRepo' } : { kind: 'error', message: payload.error }
  return { kind: 'ready', data: payload }
}

/** Fetch one file's diff; keeps non-ok payloads as explicit failures. */
async function loadFileDiff(cwd: string, path: string, origPath: string | undefined, untracked: boolean, full: boolean, scope: DiffScope, base: string | null): Promise<Exclude<DiffState, { kind: 'loading' }>> {
  const payload = await hostCall<GitFileDiffPayload & { error?: string }>('file-diff', { cwd, path, origPath, untracked, full, scope, base })
  if (payload === null) return { kind: 'failed', message: 'host unavailable' }
  if (!payload.ok) return { kind: 'failed', message: payload.error ?? 'unknown error' }
  return payload.binary ? { kind: 'binary', size: payload.size } : { kind: 'text', diff: payload.diff, truncated: payload.truncated }
}

/** Fetch one file's full content; keeps non-ok payloads as explicit failures. */
async function loadFileContent(cwd: string, path: string): Promise<Exclude<DiffState, { kind: 'loading' }>> {
  const payload = await hostCall<GitFileContentPayload & { error?: string }>('file-content', { cwd, path })
  if (payload === null) return { kind: 'failed', message: 'host unavailable' }
  if (!payload.ok) return { kind: 'failed', message: payload.error ?? 'unknown error' }
  return payload.binary
    ? { kind: 'binary', size: payload.size }
    : { kind: 'content', content: payload.content, truncated: payload.truncated, size: payload.size }
}

/** Total-render formatting: thousands separators, like Codex's toolbar. */
function fmtCount(value: number): string {
  return value.toLocaleString('en-US')
}

/**
 * The resident Review view for one session. The session-scope standard kit
 * (useSession/useInput/inputActions) is assembled by the conversation shell;
 * typed optional so a kit change degrades instead of crashing.
 * @param props - injected cwd, locale dictionary and the session standard kit.
 */
export function ReviewView({ cwd, t, useSession, useInput, inputActions }: InjectFace<ReviewInjected> & PropsLocale<typeof NS> & Partial<SessionStandardProps>) {
  // Agent-running gate for the write actions (commit/push) — a boolean
  // selector keeps re-renders to the running flip only.
  const running = useSession !== undefined ? (useSession((s: SessionSnapshot) => s.running) ?? false) : false
  const [status, setStatus] = useState<StatusState>({ kind: 'loading' })
  const [reloadTick, setReloadTick] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [diffFull, setDiffFull] = useState(false)
  const [diffScope, setDiffScope] = useState<DiffScope>('all')
  const [diff, setDiff] = useState<DiffState>({ kind: 'idle' })
  // All-files tree mode: the whole repository file list (lazily fetched).
  const [treeMode, setTreeMode] = useState<'changes' | 'all'>('changes')
  const [allFiles, setAllFiles] = useState<string[] | null>(null)
  const [allFilesFailed, setAllFilesFailed] = useState(false)
  const [viewMode, setViewMode] = useState<FileViewMode>('diff')
  // Content search: the draft debounces into the committed query; matches map
  // drives the tree's per-file count chips and the diff pane's highlighting.
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [searchMatches, setSearchMatches] = useState<ReadonlyMap<string, number> | null>(null)
  // Diff-base override: null compares against HEAD; the refs list feeds the
  // dropdown (fetched alongside each status refresh).
  const [baseRef, setBaseRef] = useState<string | null>(null)
  const [refs, setRefs] = useState<GitRefEntry[] | null>(null)
  // Commit/push popover state: two-step armed buttons, verbatim git output.
  const [commitOpen, setCommitOpen] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [stageAll, setStageAll] = useState(true)
  const [armed, setArmed] = useState<'commit' | 'commitPush' | 'push' | null>(null)
  const [writeState, setWriteState] = useState<{ kind: 'idle' } | { kind: 'busy' } | { kind: 'result'; ok: boolean; text: string }>({ kind: 'idle' })

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
    void loadStatus(cwd, baseRef).then(next => {
      if (alive) setStatus(next)
    })
    return () => { alive = false }
  }, [cwd, reloadTick, baseRef])

  // Selectable diff-base refs (branches, remotes, tags).
  useEffect(() => {
    if (cwd === undefined) {
      setRefs(null)
      return
    }
    let alive = true
    void hostCall<GitRefsPayload>('refs', { cwd }).then(payload => {
      if (alive) setRefs(payload !== null && payload.ok ? payload.refs : null)
    })
    return () => { alive = false }
  }, [cwd, reloadTick])

  // All-files list lifecycle: fetched when the tree switches to 'all' mode
  // (and again on refresh while that mode is active).
  useEffect(() => {
    if (treeMode !== 'all' || cwd === undefined) return
    let alive = true
    void hostCall<GitListFilesPayload>('list-files', { cwd }).then(payload => {
      if (!alive) return
      if (payload === null || !payload.ok) {
        setAllFiles([])
        setAllFilesFailed(true)
        return
      }
      setAllFiles(payload.files)
      setAllFilesFailed(false)
    })
    return () => { alive = false }
  }, [treeMode, cwd, reloadTick])

  // Search lifecycle: 400ms debounce on the draft, then one host call per
  // committed query (re-run on refresh; cleared with the draft).
  useEffect(() => {
    const trimmed = searchDraft.trim()
    if (trimmed === '') {
      setSearch('')
      return
    }
    const timer = setTimeout(() => { setSearch(trimmed) }, 400)
    return () => { clearTimeout(timer) }
  }, [searchDraft])

  useEffect(() => {
    if (search === '' || cwd === undefined) {
      setSearchMatches(null)
      return
    }
    let alive = true
    void hostCall<GitSearchPayload>('search', { cwd, query: search }).then(payload => {
      if (!alive) return
      setSearchMatches(payload !== null && payload.ok
        ? new Map(payload.matches.map(match => [match.path, match.count] as const))
        : null)
    })
    return () => { alive = false }
  }, [search, cwd, reloadTick])

  const ready = status.kind === 'ready' ? status.data : null
  /** Every repository row in all-files mode (changed rows merged in); null in changes mode. */
  const allRows = useMemo(
    () => (treeMode === 'all' && allFiles !== null ? mergeAllFiles(allFiles, ready?.files ?? []) : null),
    [treeMode, allFiles, ready],
  )
  const selectedFile = useMemo(() => {
    const source = allRows ?? ready?.files
    return source?.find(file => file.path === selected) ?? null
  }, [allRows, ready, selected])
  /** Unchanged rows have no diff — the file view is their only view. */
  const effectiveView: FileViewMode = selectedFile?.unchanged === true ? 'file' : viewMode

  // Diff/content lifecycle: whenever the selected file, its untracked-ness
  // (a status refresh may reclassify it), the context depth, the staged/
  // unstaged scope, or the diff/file view changes. Unchanged rows and the
  // file view load whole-file content instead of a diff.
  useEffect(() => {
    if (cwd === undefined || selected === null || selectedFile === null) {
      setDiff({ kind: 'idle' })
      return
    }
    let alive = true
    setDiff({ kind: 'loading' })
    const wantFile = selectedFile.unchanged === true || effectiveView === 'file'
    const loader = wantFile
      ? loadFileContent(cwd, selected)
      : loadFileDiff(cwd, selected, selectedFile.origPath, selectedFile.untracked, diffFull, diffScope, baseRef)
    void loader.then(next => {
      if (alive) setDiff(next)
    })
    return () => { alive = false }
  }, [cwd, selected, selectedFile, selectedFile?.untracked, selectedFile?.origPath, diffFull, diffScope, effectiveView, baseRef])

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

  /** Switch the tree between changed files and the whole repository. */
  const changeTreeMode = useCallback((mode: 'changes' | 'all') => {
    setTreeMode(mode)
    if (mode === 'changes') setAllFiles(null)
  }, [])

  /** Pick a new diff base; the selection resets (the file list changes). */
  const changeBase = useCallback((ref: string | null) => {
    setBaseRef(ref)
    setSelected(null)
    setDiffScope('all')
  }, [])

  /** Execute one armed write (commit / commit+push / push) against the host. */
  const executeWrite = useCallback(async (kind: 'commit' | 'commitPush' | 'push') => {
    if (cwd === undefined) return
    setWriteState({ kind: 'busy' })
    const pushBody = { cwd, confirm: true }
    const pushCall = async (): Promise<{ ok: boolean; text: string }> => {
      const payload = await hostCall<GitWritePayload>('push', pushBody)
      if (payload === null) return { ok: false, text: t('state.hostUnavailable') }
      return payload.ok ? { ok: true, text: payload.output ?? '' } : { ok: false, text: payload.error ?? 'unknown error' }
    }
    let outcome: { ok: boolean; text: string }
    if (kind === 'push') {
      outcome = await pushCall()
    } else {
      const commitResult = await hostCall<GitWritePayload>('commit', { cwd, message: commitMessage, mode: stageAll ? 'all' : 'staged', confirm: true })
      if (commitResult === null) {
        outcome = { ok: false, text: t('state.hostUnavailable') }
      } else if (!commitResult.ok) {
        outcome = { ok: false, text: commitResult.error ?? 'unknown error' }
      } else if (kind === 'commit') {
        outcome = { ok: true, text: commitResult.output ?? '' }
      } else {
        const pushed = await pushCall()
        outcome = pushed.ok ? { ok: true, text: (commitResult.output ?? '') + '\n' + pushed.text } : pushed
      }
    }
    setWriteState({ kind: 'result', ok: outcome.ok, text: outcome.text })
    setArmed(null)
    if (outcome.ok) {
      if (kind !== 'push') setCommitMessage('')
      refresh()
    }
  }, [cwd, commitMessage, stageAll, refresh, t])

  if (status.kind === 'noWorkspace' || status.kind === 'hostUnavailable' || status.kind === 'notRepo' || status.kind === 'error') {
    return <CenteredState t={t} status={status} onRetry={refresh} />
  }

  const data = ready
  return (
    <div className={css.root} data-conversation-composer-overlay="">
      <header className={css.toolbar} data-git-review-toolbar="">
        <label className={css.branchChip} title={t('base.label')}>
          <BranchIcon />
          <select
            className={css.branchSelect}
            value={baseRef ?? ''}
            onChange={event => { changeBase(event.target.value === '' ? null : event.target.value) }}
          >
            <option value="">{data?.branch ?? 'HEAD'}</option>
            {(refs ?? []).map(ref => (
              <option key={ref.kind + ':' + ref.name} value={ref.name}>{ref.name}</option>
            ))}
          </select>
          {baseRef !== null && <span className={css.baseArrow}>{'\u2192'}</span>}
        </label>
        {data !== null && (
          <span className={css.totals}>
            <span className={css.totalAdded}>{'+' + fmtCount(data.totals.added)}</span>
            <span className={css.totalDeleted}>{'\u2212' + fmtCount(data.totals.deleted)}</span>
            <span className={css.fileCount}>{t('filesChanged', { count: data.files.length })}</span>
          </span>
        )}
        <label className={css.searchBox}>
          <SearchIcon />
          <input
            className={css.searchInput}
            value={searchDraft}
            onChange={event => { setSearchDraft(event.target.value) }}
            onKeyDown={event => { if (event.key === 'Escape') setSearchDraft('') }}
            placeholder={t('search.placeholder')}
            spellCheck={false}
          />
          {search !== '' && (
            <span className={css.searchMeta}>{searchMatches === null ? '\u2026' : t('search.files', { count: searchMatches.size })}</span>
          )}
        </label>
        <span className={css.toolbarSpacer} />
        <button type="button" className={css.toolBtn} onClick={refresh} title={t('refresh')}>
          <RefreshIcon />
          <span>{status.kind === 'loading' ? t('refreshing') : t('refresh')}</span>
        </button>
        <button
          type="button"
          className={css.toolBtn + ' ' + css.commitToggle}
          disabled={data === null || running}
          title={running ? t('commit.running') : t('commit.title')}
          onClick={() => { setCommitOpen(value => !value); setArmed(null) }}
        >
          <CommitIcon />
          <span>{t('commit.title')}</span>
        </button>
      </header>
      {commitOpen && data !== null && (
        <div className={css.commitPop}>
          <textarea
            className={css.commitInput}
            value={commitMessage}
            onChange={event => { setCommitMessage(event.target.value) }}
            onKeyDown={event => { if (event.key === 'Escape') setCommitOpen(false) }}
            placeholder={t('commit.message')}
            rows={3}
            autoFocus
          />
          <label className={css.commitCheck}>
            <input type="checkbox" checked={stageAll} onChange={event => { setStageAll(event.target.checked) }} />
            <span>{t('commit.stageAll')}</span>
          </label>
          <div className={css.commitActions}>
            <button
              type="button"
              className={css.commitBtn + (armed === 'commit' ? ' ' + css.commitBtnArmed : '')}
              disabled={running || writeState.kind === 'busy' || commitMessage.trim() === ''}
              onClick={() => { if (armed === 'commit') void executeWrite('commit'); else setArmed('commit') }}
            >
              {armed === 'commit' ? t('commit.confirmCommit') : t('commit.commit')}
            </button>
            <button
              type="button"
              className={css.commitBtn + (armed === 'commitPush' ? ' ' + css.commitBtnArmed : '')}
              disabled={running || writeState.kind === 'busy' || commitMessage.trim() === ''}
              onClick={() => { if (armed === 'commitPush') void executeWrite('commitPush'); else setArmed('commitPush') }}
            >
              {armed === 'commitPush' ? t('commit.confirmCommitPush') : t('commit.commitPush')}
            </button>
            <button
              type="button"
              className={css.commitBtn + (armed === 'push' ? ' ' + css.commitBtnArmed : '')}
              disabled={running || writeState.kind === 'busy'}
              onClick={() => { if (armed === 'push') void executeWrite('push'); else setArmed('push') }}
            >
              {armed === 'push' ? t('commit.confirmPush') : t('commit.push')}
            </button>
          </div>
          {writeState.kind === 'busy' && <div className={css.commitNote}>{t('commit.busy')}</div>}
          {writeState.kind === 'result' && (
            <div className={css.commitNote + (writeState.ok ? '' : ' ' + css.errorText)}>{writeState.text}</div>
          )}
        </div>
      )}
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
              : effectiveView === 'file'
                ? (
                  <FilePane
                    file={selectedFile}
                    content={diff.kind === 'content' ? diff.content : ''}
                    truncated={diff.kind === 'content' && diff.truncated}
                    binary={diff.kind === 'binary'}
                    size={diff.kind === 'binary' || diff.kind === 'content' ? diff.size : 0}
                    loading={diff.kind === 'loading'}
                    canShowDiff={selectedFile.unchanged !== true}
                    view={effectiveView}
                    onViewChange={setViewMode}
                    t={t}
                  />
                )
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
                    view={effectiveView}
                    onViewChange={setViewMode}
                    search={search}
                    baseActive={baseRef !== null}
                    useInput={useInput}
                    inputActions={inputActions}
                    t={t}
                  />
                )}
        </main>
        {data !== null && (
          <TreePanel
            files={allRows ?? data.files}
            selected={selected}
            onSelect={selectFile}
            filter={filter}
            onFilterChange={setFilter}
            collapsed={collapsed}
            onToggleDir={toggleDir}
            mode={treeMode}
            onModeChange={changeTreeMode}
            listFailed={allFilesFailed}
            matchCounts={searchMatches ?? undefined}
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
