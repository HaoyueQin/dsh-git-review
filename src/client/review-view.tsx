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
import type { ChangedFile, GitCommitFilesPayload, GitCommitSummary, GitFileContentPayload, GitFileDiffPayload, GitListFilesPayload, GitLogPayload, GitRefEntry, GitRefsPayload, GitSearchPayload, GitStatusFailure, GitStatusPayload, GitWritePayload } from '../contract.ts'
import { EMPTY_TREE_ID } from '../git-parse.ts'
import { hostCall } from './api.ts'
import { BranchIcon, ChevronIcon, CommitIcon, GraphIcon, RefreshIcon, SearchIcon } from './icons.tsx'
import { DiffPane, type DiffScope } from './diff-pane.tsx'
import { FilePane, type FileViewMode } from './file-pane.tsx'
import { CommitGraph, fmtGraphDate } from './graph-view.tsx'
import { computeGraphLanes } from './git-graph.ts'
import { mergeAllFiles } from './file-tree.ts'
import { TreePanel } from './tree-panel.tsx'
import type { NS, ReviewKey } from './locales.ts'
import css from './review.module.css'

/** Props injected by the slot registration (see client/index.ts). */
export interface ReviewInjected {
  /** The session workspace path; undefined when the session has none. */
  cwd: string | undefined
}

type T = PropsLocale<typeof NS>['t']

/** The comparison side of the toolbar: worktree-vs-base (the review tab's
 *  home mode) or any-two-commits (ref-range: base...target). */
type CompareMode = 'worktree' | 'refs'

/** The tab's main view: workspace changes or the commit graph. */
type ViewTab = 'changes' | 'graph'

/** The commit-graph feed's load state. */
type LogState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'ready'; commits: GitCommitSummary[]; truncated: boolean }
  | { kind: 'failed'; message: string }

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
async function loadStatus(cwd: string, base: string | null, target: string | null): Promise<Exclude<StatusState, { kind: 'loading' }>> {
  const payload = await hostCall<GitStatusPayload | GitStatusFailure>('status', { cwd, base, target })
  if (payload === null) return { kind: 'hostUnavailable' }
  if (!payload.ok) return payload.isRepository === false ? { kind: 'notRepo' } : { kind: 'error', message: payload.error }
  return { kind: 'ready', data: payload }
}

/** Fetch one file's diff; keeps non-ok payloads as explicit failures. */
async function loadFileDiff(cwd: string, path: string, origPath: string | undefined, untracked: boolean, full: boolean, scope: DiffScope, base: string | null, target: string | null): Promise<Exclude<DiffState, { kind: 'loading' }>> {
  const payload = await hostCall<GitFileDiffPayload & { error?: string }>('file-diff', { cwd, path, origPath, untracked, full, scope, base, target })
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
  // dropdowns (fetched alongside each status refresh). In refs mode the
  // comparison runs between two picked refs instead of the worktree.
  const [compareMode, setCompareMode] = useState<CompareMode>('worktree')
  const [baseRef, setBaseRef] = useState<string | null>(null)
  const [targetRef, setTargetRef] = useState<string | null>(null)
  const [refs, setRefs] = useState<GitRefEntry[] | null>(null)
  const refsMode = compareMode === 'refs'
  const rangeReady = !refsMode || (baseRef !== null && targetRef !== null)
  // Graph view: the log feed, the selected commit, and its file list/diff.
  const [viewTab, setViewTab] = useState<ViewTab>('changes')
  const [logState, setLogState] = useState<LogState>({ kind: 'idle' })
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null)
  const [graphFile, setGraphFile] = useState<string | null>(null)
  const [graphFilter, setGraphFilter] = useState('')
  const [graphCollapsed, setGraphCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [commitFiles, setCommitFiles] = useState<ChangedFile[] | null>(null)
  // Commit/push popover state: two-step armed buttons, verbatim git output.
  const [commitOpen, setCommitOpen] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [stageAll, setStageAll] = useState(true)
  const [armed, setArmed] = useState<'commit' | 'commitPush' | 'push' | null>(null)
  const [writeState, setWriteState] = useState<{ kind: 'idle' } | { kind: 'busy' } | { kind: 'result'; ok: boolean; text: string }>({ kind: 'idle' })
  // Branch manager popover state (create/switch/rename/delete).
  const [branchOpen, setBranchOpen] = useState(false)
  const [branchName, setBranchName] = useState('')
  const [branchStart, setBranchStart] = useState('')
  const [branchBusy, setBranchBusy] = useState(false)
  const [branchResult, setBranchResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteArmed, setDeleteArmed] = useState<string | null>(null)

  // Status lifecycle: on mount, on explicit refresh, and when the session's
  // workspace or comparison range changes. A refresh keeps the previous list
  // visible (loading states only replace an empty board) so the tree never
  // flashes blank; refs mode waits until both ends are picked.
  useEffect(() => {
    if (cwd === undefined) {
      setStatus({ kind: 'noWorkspace' })
      return
    }
    if (!rangeReady) {
      setStatus({ kind: 'loading' })
      return
    }
    let alive = true
    setStatus(previous => (previous.kind === 'ready' || previous.kind === 'error' ? previous : { kind: 'loading' }))
    void loadStatus(cwd, baseRef, refsMode ? targetRef : null).then(next => {
      if (alive) setStatus(next)
    })
    return () => { alive = false }
  }, [cwd, reloadTick, baseRef, targetRef, compareMode])

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
  // (and again on refresh while that mode is active). Refs mode pins the
  // tree to the changed list — the whole-worktree list has no meaning for a
  // commit-to-commit range.
  useEffect(() => {
    if (refsMode) setTreeMode('changes')
  }, [refsMode])
  useEffect(() => {
    if (treeMode !== 'all' || cwd === undefined || refsMode) return
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
  }, [treeMode, cwd, reloadTick, refsMode])

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
    if (search === '' || cwd === undefined || !rangeReady || viewTab !== 'changes') {
      setSearchMatches(null)
      return
    }
    let alive = true
    void hostCall<GitSearchPayload>('search', { cwd, query: search, base: baseRef, target: refsMode ? targetRef : null }).then(payload => {
      if (!alive) return
      setSearchMatches(payload !== null && payload.ok
        ? new Map(payload.matches.map(match => [match.path, match.count] as const))
        : null)
    })
    return () => { alive = false }
  }, [search, cwd, reloadTick, baseRef, targetRef, compareMode, viewTab])

  // Graph feed lifecycle: fetched when the graph view opens (and on refresh).
  useEffect(() => {
    if (viewTab !== 'graph' || cwd === undefined) return
    let alive = true
    setLogState({ kind: 'loading' })
    void hostCall<GitLogPayload>('log', { cwd }).then(payload => {
      if (!alive) return
      if (payload === null) setLogState({ kind: 'failed', message: t('state.hostUnavailable') })
      else if (!payload.ok) setLogState({ kind: 'failed', message: (payload as { error?: string }).error ?? t('graph.failed') })
      else setLogState({ kind: 'ready', commits: payload.commits, truncated: payload.truncated })
    })
    return () => { alive = false }
  }, [viewTab, cwd, reloadTick, t])

  // Selected commit's changed files (vs first parent / empty tree).
  useEffect(() => {
    if (viewTab !== 'graph' || cwd === undefined || selectedCommit === null) {
      setCommitFiles(null)
      return
    }
    let alive = true
    setCommitFiles(null)
    void hostCall<GitCommitFilesPayload>('commit-files', { cwd, commit: selectedCommit }).then(payload => {
      if (!alive) return
      setCommitFiles(payload !== null && payload.ok ? payload.files : [])
    })
    return () => { alive = false }
  }, [viewTab, cwd, selectedCommit])

  const ready = status.kind === 'ready' ? status.data : null
  /** Graph feed with the local search filter applied (topology rows kept). */
  const graphCommits = logState.kind === 'ready' ? logState.commits : []
  const graphLanes = useMemo(() => computeGraphLanes(graphCommits), [graphCommits])
  const visibleGraph = useMemo(() => {
    const query = graphFilter.trim().toLowerCase()
    const rows = graphCommits.map((commit, index) => ({ commit, lane: graphLanes[index] }))
    if (query === '') return rows
    return rows.filter(({ commit }) => commit.subject.toLowerCase().includes(query)
      || commit.authorName.toLowerCase().includes(query)
      || commit.hash.startsWith(query))
  }, [graphCommits, graphLanes, graphFilter])
  /** Every repository row in all-files mode (changed rows merged in); null in changes mode. */
  const allRows = useMemo(
    () => (treeMode === 'all' && !refsMode && allFiles !== null ? mergeAllFiles(allFiles, ready?.files ?? []) : null),
    [treeMode, refsMode, allFiles, ready],
  )
  const selectedFile = useMemo(() => {
    const source = allRows ?? ready?.files
    return source?.find(file => file.path === selected) ?? null
  }, [allRows, ready, selected])
  /** Unchanged rows have no diff — the file view is their only view. */
  const effectiveView: FileViewMode = selectedFile?.unchanged === true ? 'file' : viewMode

  // Diff/content lifecycle (worktree view): whenever the selected file, its
  // untracked-ness (a status refresh may reclassify it), the context depth,
  // the staged/unstaged scope, or the diff/file view changes. Unchanged rows
  // and the file view load whole-file content instead of a diff. The graph
  // view owns `diff` while active — this effect stands down there.
  useEffect(() => {
    if (viewTab !== 'changes') return
    if (cwd === undefined || selected === null || selectedFile === null) {
      setDiff({ kind: 'idle' })
      return
    }
    let alive = true
    setDiff({ kind: 'loading' })
    const wantFile = selectedFile.unchanged === true || effectiveView === 'file'
    const loader = wantFile
      ? loadFileContent(cwd, selected)
      : loadFileDiff(cwd, selected, selectedFile.origPath, selectedFile.untracked, diffFull, diffScope, baseRef, refsMode ? targetRef : null)
    void loader.then(next => {
      if (alive) setDiff(next)
    })
    return () => { alive = false }
  }, [cwd, selected, selectedFile, selectedFile?.untracked, selectedFile?.origPath, diffFull, diffScope, effectiveView, baseRef, targetRef, compareMode, viewTab])

  // The selected commit file's diff (graph view): parent0...commit — the
  // empty-tree baseline for a root commit — rendered by the shared DiffPane.
  const commitInfo = useMemo(
    () => (logState.kind === 'ready' && selectedCommit !== null
      ? logState.commits.find(commit => commit.hash === selectedCommit) ?? null
      : null),
    [logState, selectedCommit],
  )
  const graphFileInfo = useMemo(
    () => commitFiles?.find(file => file.path === graphFile) ?? null,
    [commitFiles, graphFile],
  )
  useEffect(() => {
    if (viewTab !== 'graph') return
    if (cwd === undefined || selectedCommit === null || graphFileInfo === null) {
      setDiff({ kind: 'idle' })
      return
    }
    let alive = true
    setDiff({ kind: 'loading' })
    const parent0 = commitInfo !== null && commitInfo.parents.length > 0 ? commitInfo.parents[0]! : EMPTY_TREE_ID
    void loadFileDiff(cwd, graphFileInfo.path, graphFileInfo.origPath, false, diffFull, 'all', parent0, selectedCommit).then(next => {
      if (alive) setDiff(next)
    })
    return () => { alive = false }
  }, [viewTab, cwd, selectedCommit, graphFileInfo, commitInfo, diffFull])

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

  /** Pick the ref-range target; same reset semantics as the base. */
  const changeTarget = useCallback((ref: string) => {
    setTargetRef(ref === '' ? null : ref)
    setSelected(null)
    setDiffScope('all')
  }, [])

  /** Switch the comparison side between worktree and ref-range modes. */
  const changeCompareMode = useCallback((mode: CompareMode) => {
    setCompareMode(mode)
    setSelected(null)
    setDiffScope('all')
    if (mode === 'refs') setTargetRef(previous => previous ?? 'HEAD')
  }, [])

  /** Switch the main view between workspace changes and the commit graph. */
  const changeViewTab = useCallback((tab: ViewTab) => {
    setViewTab(tab)
    setSelected(null)
    setSelectedCommit(null)
    setGraphFile(null)
  }, [])

  /** Select a graph commit; its file list and the file selection reset. */
  const selectCommit = useCallback((hash: string) => {
    setSelectedCommit(hash)
    setGraphFile(null)
    setDiffScope('all')
  }, [])

  const selectGraphFile = useCallback((path: string) => {
    setGraphFile(path)
  }, [])

  const toggleGraphDir = useCallback((path: string) => {
    setGraphCollapsed(previous => {
      const next = new Set(previous)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  /** Run one branch management action and surface git's answer verbatim;
   *  a success refreshes status + refs (the branch may have changed). */
  const executeBranch = useCallback(async (action: 'create' | 'switch' | 'delete' | 'rename', body: Record<string, unknown>) => {
    if (cwd === undefined) return
    setBranchBusy(true)
    setBranchResult(null)
    const payload = await hostCall<GitWritePayload>('branch-' + action, { cwd, confirm: true, ...body })
    setBranchBusy(false)
    if (payload === null) {
      setBranchResult({ ok: false, text: t('state.hostUnavailable') })
      return
    }
    setBranchResult({ ok: payload.ok, text: payload.ok ? (payload.output ?? '') : (payload.error ?? 'unknown error') })
    if (payload.ok) {
      setDeleteArmed(null)
      setRenameTarget(null)
      refresh()
    }
  }, [cwd, refresh, t])

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
        <button
          type="button"
          className={css.branchBtn}
          title={t('branch.manage')}
          onClick={() => { setBranchOpen(value => !value); setDeleteArmed(null); setRenameTarget(null); setBranchResult(null) }}
        >
          <BranchIcon />
          <span>{data?.branch ?? 'HEAD'}</span>
          <ChevronIcon rotated={branchOpen} />
        </button>
        <span className={css.scopeSwitch} role="group" aria-label={t('compare.mode')}>
          {(['worktree', 'refs'] as const).map(candidate => (
            <button
              key={candidate}
              type="button"
              className={css.scopeBtn + (compareMode === candidate ? ' ' + css.scopeBtnActive : '')}
              onClick={() => { changeCompareMode(candidate) }}
            >
              {t(('compare.' + candidate) as ReviewKey)}
            </button>
          ))}
        </span>
        {!refsMode ? (
          <label className={css.branchChip} title={t('base.label')}>
            <BranchIcon />
            <select
              className={css.branchSelect}
              value={baseRef ?? ''}
              onChange={event => { changeBase(event.target.value === '' ? null : event.target.value) }}
            >
              <option value="">{data?.branch ?? 'HEAD'}</option>
              <RefOptionGroups refs={refs} t={t} />
            </select>
            {baseRef !== null && <span className={css.baseArrow}>{'\u2192'}</span>}
          </label>
        ) : (
          <label className={css.branchChip + ' ' + css.rangeChip} title={t('compare.pickHint')}>
            <BranchIcon />
            <select
              className={css.branchSelect}
              value={baseRef ?? ''}
              onChange={event => { changeBase(event.target.value === '' ? null : event.target.value) }}
            >
              <option value="">{t('compare.pickBase')}</option>
              <RefOptionGroups refs={refs} t={t} />
            </select>
            <span className={css.baseArrow}>{'\u2192'}</span>
            <select
              className={css.branchSelect}
              value={targetRef ?? ''}
              onChange={event => { changeTarget(event.target.value) }}
            >
              <option value="HEAD">HEAD</option>
              <RefOptionGroups refs={refs} t={t} />
            </select>
          </label>
        )}
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
            placeholder={viewTab === 'graph' ? t('graph.search') : t('search.placeholder')}
            spellCheck={false}
          />
          {viewTab === 'changes' && search !== '' && (
            <span className={css.searchMeta}>{searchMatches === null ? '\u2026' : t('search.files', { count: searchMatches.size })}</span>
          )}
        </label>
        <span className={css.toolbarSpacer} />
        <span className={css.scopeSwitch} role="group" aria-label={t('view.label')}>
          {(['changes', 'graph'] as const).map(candidate => (
            <button
              key={candidate}
              type="button"
              className={css.scopeBtn + (viewTab === candidate ? ' ' + css.scopeBtnActive : '')}
              onClick={() => { changeViewTab(candidate) }}
            >
              {candidate === 'changes' ? null : <GraphIcon />}
              <span>{t(('viewTab.' + candidate) as ReviewKey)}</span>
            </button>
          ))}
        </span>
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
      {branchOpen && data !== null && (
        <div className={css.branchPop}>
          <div className={css.branchCreateRow}>
            <input
              className={css.branchNameInput}
              value={branchName}
              onChange={event => { setBranchName(event.target.value) }}
              onKeyDown={event => { if (event.key === 'Escape') setBranchOpen(false) }}
              placeholder={t('branch.newName')}
              spellCheck={false}
            />
            <select
              className={css.branchSelect}
              value={branchStart}
              onChange={event => { setBranchStart(event.target.value) }}
            >
              <option value="">{t('branch.fromHead')}</option>
              <RefOptionGroups refs={refs} t={t} />
            </select>
            <button
              type="button"
              className={css.commitBtn}
              disabled={branchName.trim() === '' || branchBusy || running}
              onClick={() => { void executeBranch('create', { name: branchName.trim(), startPoint: branchStart === '' ? undefined : branchStart }) }}
            >
              {t('branch.create')}
            </button>
          </div>
          <div className={css.branchListScroll}>
            <div className={css.branchGroupLabel}>{t('branch.local')}</div>
            {(refs ?? []).filter(ref => ref.kind === 'branch').map(ref => {
              const isCurrent = ref.name === data.branch
              if (renameTarget === ref.name) {
                return (
                  <div key={ref.name} className={css.branchRow}>
                    <input
                      className={css.branchNameInput}
                      value={renameValue}
                      onChange={event => { setRenameValue(event.target.value) }}
                      onKeyDown={event => {
                        if (event.key === 'Enter' && renameValue.trim() !== '' && renameValue.trim() !== ref.name) {
                          void executeBranch('rename', { name: ref.name, newName: renameValue.trim() })
                        }
                        if (event.key === 'Escape') setRenameTarget(null)
                      }}
                      autoFocus
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      className={css.branchIconBtn}
                      disabled={branchBusy || renameValue.trim() === '' || renameValue.trim() === ref.name}
                      onClick={() => { void executeBranch('rename', { name: ref.name, newName: renameValue.trim() }) }}
                    >
                      {'\u2713'}
                    </button>
                    <button type="button" className={css.branchIconBtn} onClick={() => { setRenameTarget(null) }}>
                      {'\u2715'}
                    </button>
                  </div>
                )
              }
              return (
                <div key={ref.name} className={css.branchRow + (isCurrent ? ' ' + css.branchRowCurrent : '')}>
                  {isCurrent && <span className={css.branchCurrentMark} title={t('branch.current')}>{'\u2713'}</span>}
                  <button
                    type="button"
                    className={css.branchNameBtn}
                    disabled={isCurrent || branchBusy || running}
                    title={isCurrent ? t('branch.current') : t('branch.switch')}
                    onClick={() => { void executeBranch('switch', { name: ref.name }) }}
                  >
                    {ref.name}
                  </button>
                  <button
                    type="button"
                    className={css.branchIconBtn}
                    title={t('branch.rename')}
                    onClick={() => { setRenameTarget(ref.name); setRenameValue(ref.name) }}
                  >
                    {'\u270e'}
                  </button>
                  {deleteArmed === ref.name ? (
                    <>
                      <button
                        type="button"
                        className={css.branchIconBtn + ' ' + css.branchDanger}
                        disabled={branchBusy || running}
                        title={t('branch.confirmDelete')}
                        onClick={() => { void executeBranch('delete', { name: ref.name, force: false }) }}
                      >
                        {t('branch.confirmDelete')}
                      </button>
                      <button
                        type="button"
                        className={css.branchIconBtn + ' ' + css.branchDanger}
                        disabled={branchBusy || running}
                        title={t('branch.forceDelete')}
                        onClick={() => { void executeBranch('delete', { name: ref.name, force: true }) }}
                      >
                        {t('branch.forceDelete')}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className={css.branchIconBtn + ' ' + css.branchDanger}
                      disabled={isCurrent || branchBusy || running}
                      title={t('branch.delete')}
                      onClick={() => { setDeleteArmed(ref.name) }}
                    >
                      {'\u2715'}
                    </button>
                  )}
                </div>
              )
            })}
            {(refs ?? []).some(ref => ref.kind === 'remote') && (
              <details className={css.branchRemoteDetails}>
                <summary>{t('branch.remote')}</summary>
                {(refs ?? []).filter(ref => ref.kind === 'remote').map(ref => (
                  <div key={ref.name} className={css.branchRow + ' ' + css.branchRowRemote}>
                    <span className={css.branchNameBtn}>{ref.name}</span>
                  </div>
                ))}
              </details>
            )}
          </div>
          {branchBusy && <div className={css.commitNote}>{t('branch.busy')}</div>}
          {branchResult !== null && (
            <div className={css.commitNote + (branchResult.ok ? '' : ' ' + css.errorText)}>{branchResult.text}</div>
          )}
        </div>
      )}
      <div className={css.body}>
        {viewTab === 'graph' ? (
          <>
            <section className={css.graphList} data-git-review-graph="">
              {logState.kind === 'loading' && <div className={css.paneNotice}>{t('graph.loading')}</div>}
              {logState.kind === 'failed' && <div className={css.paneNotice + ' ' + css.errorText}>{logState.message}</div>}
              {logState.kind === 'ready' && graphCommits.length === 0 && (
                <div className={css.paneNotice}>{t('graph.empty')}</div>
              )}
              {logState.kind === 'ready' && graphCommits.length > 0 && (
                <>
                  {logState.truncated && <div className={css.noticeRow}>{t('graph.truncated', { count: graphCommits.length })}</div>}
                  {visibleGraph.length === 0
                    ? <div className={css.paneNotice}>{t('graph.noMatches')}</div>
                    : (
                      <CommitGraph
                        commits={visibleGraph.map(row => row.commit)}
                        lanes={visibleGraph.map(row => row.lane)}
                        selected={selectedCommit}
                        onSelect={selectCommit}
                        t={t}
                      />
                    )}
                </>
              )}
            </section>
            <main className={css.mainPane}>
              {selectedCommit === null || commitInfo === null ? (
                <div className={css.emptyState}>
                  <div className={css.emptyTitle}>{t('graph.selectCommit')}</div>
                  <div className={css.emptyHint}>{t('graph.selectHint')}</div>
                </div>
              ) : (
                <div className={css.commitDetail} data-git-review-diff="">
                  <div className={css.commitInfo}>
                    <div className={css.commitInfoSubject}>{commitInfo.subject}</div>
                    <div className={css.commitInfoMeta}>
                      <span className={css.commitHash}>{commitInfo.hash.slice(0, 7)}</span>
                      <span>{commitInfo.authorName}</span>
                      <span>{fmtGraphDate(commitInfo.timestamp)}</span>
                      {commitInfo.refs.map(ref => (
                        <span
                          key={ref.kind + ':' + ref.name}
                          className={ref.kind === 'head' ? css.refBadgeHead : ref.kind === 'tag' ? css.refBadgeTag : css.refBadgeOther}
                        >
                          {ref.name}
                        </span>
                      ))}
                      {commitInfo.parents.length > 0 && (
                        <span>{t('graph.parent') + ' ' + commitInfo.parents[0]!.slice(0, 7)}</span>
                      )}
                      {commitFiles !== null && (
                        <span>{t('graph.filesCount', { count: commitFiles.length })}</span>
                      )}
                    </div>
                  </div>
                  <div className={css.commitSplit}>
                    <div className={css.commitTreePanel} data-git-review-tree="">
                      {commitFiles === null
                        ? <div className={css.paneNotice}>{t('graph.loading')}</div>
                        : commitFiles.length === 0
                          ? <div className={css.paneNotice}>{t('graph.noFiles')}</div>
                          : (
                            <TreePanel
                              files={commitFiles}
                              selected={graphFile}
                              onSelect={selectGraphFile}
                              filter={graphFilter}
                              onFilterChange={setGraphFilter}
                              collapsed={graphCollapsed}
                              onToggleDir={toggleGraphDir}
                              mode="changes"
                              onModeChange={() => { /* pinned in graph view */ }}
                              showModeRow={false}
                              listFailed={false}
                              t={t}
                            />
                          )}
                    </div>
                    <div className={css.commitDiffArea}>
                      {graphFileInfo !== null && diff.kind !== 'idle' && (
                        <DiffPane
                          file={graphFileInfo}
                          diff={diff.kind === 'text' ? diff.diff : ''}
                          truncated={diff.kind === 'text' && diff.truncated}
                          loading={diff.kind === 'loading'}
                          binary={diff.kind === 'binary'}
                          size={diff.kind === 'binary' ? diff.size : 0}
                          full={diffFull}
                          onToggleFull={() => { setDiffFull(value => !value) }}
                          scope={diffScope}
                          onScopeChange={setDiffScope}
                          view="diff"
                          onViewChange={() => { /* pinned: a commit diff has no file view */ }}
                          showViewSwitch={false}
                          search={search}
                          baseActive
                          useInput={useInput}
                          inputActions={inputActions}
                          t={t}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </main>
          </>
        ) : (
          <>
        <main className={css.mainPane}>
          {selected === null || selectedFile === null || diff.kind === 'idle'
            ? (
              <div className={css.emptyState}>
                <div className={css.emptyTitle}>{refsMode && !rangeReady ? t('compare.refs') : t('empty.title')}</div>
                <div className={css.emptyHint}>{refsMode && !rangeReady ? t('compare.pickHint') : t('empty.hint')}</div>
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
                    baseActive={baseRef !== null || refsMode}
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
            showModeRow={!refsMode}
            listFailed={allFilesFailed}
            matchCounts={searchMatches ?? undefined}
            t={t}
          />
        )}
          </>
        )}
      </div>
    </div>
  )
}

/** The refs dropdown's optgroups: local branches, remote branches, tags —
 *  three separate groups (mixing branches and tags into one flat list was
 *  the old UI's complaint). */
function RefOptionGroups({ refs, t }: { refs: GitRefEntry[] | null; t: T }) {
  if (refs === null || refs.length === 0) return null
  const groups: ReadonlyArray<{ kind: GitRefEntry['kind']; label: string }> = [
    { kind: 'branch', label: t('ref.branches') },
    { kind: 'remote', label: t('ref.remotes') },
    { kind: 'tag', label: t('ref.tags') },
  ]
  return (
    <>
      {groups.map(group => {
        const entries = refs.filter(ref => ref.kind === group.kind)
        if (entries.length === 0) return null
        return (
          <optgroup key={group.kind} label={group.label}>
            {entries.map(ref => (
              <option key={group.kind + ':' + ref.name} value={ref.name}>{ref.name}</option>
            ))}
          </optgroup>
        )
      })}
    </>
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
