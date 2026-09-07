/**
 * The Review tab: workspace changes vs HEAD as a filterable file tree plus
 * per-file diffs, a commit-graph view, and the fenced git workbench. Writes
 * stay gated while an agent is running, because it may be mutating the
 * workspace while the tab is open. The view opts into the conversation
 * composer overlay
 * (data-conversation-composer-overlay) like the trajectory view: the shell
 * fixes the view's height and floats the input card over its bottom, so the
 * review→agent feedback loop stays one keystroke away.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react'
import type { RefObject } from 'react'
import type { InjectFace, PropsLocale, SessionStandardProps } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionSnapshot } from '@deepseek-ai/dsh-api-session-controller/client'
import type { InputState } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { ChangedFile, GitBlameLine, GitBlamePayload, GitCommitFilesPayload, GitCommitSummary, GitFileBytesPayload, GitFileContentPayload, GitFileDiffPayload, GitFileHistoryPayload, GitFsEntry, GitFsListPayload, GitLastCommitPayload, GitListFilesPayload, GitLogPayload, GitRefEntry, GitRefsPayload, GitSearchPayload, GitStashEntry, GitStashPayload, GitStatusFailure, GitStatusPayload, GitWritePayload, OpenApp, OpenAppsPayload } from '../contract.ts'
import { FileMenu, type FileMenuState } from './file-menu.tsx'
import { CommitMenu, type CommitMenuState } from './commit-menu.tsx'
import { EMPTY_TREE_ID } from '../git-parse.ts'
import { assetUrl, hostCall } from './api.ts'
import { BranchIcon, CheckIcon, ChevronIcon, CommentIcon, CommitIcon, FileIcon, GraphIcon, PopupIcon, RefreshIcon, SearchIcon, SwapIcon } from './icons.tsx'
import { RefPicker } from './ref-picker.tsx'
import { DiffPane, type DiffScope } from './diff-pane.tsx'
import { buildHunkPatch } from './diff-parse.ts'
import { FilePane, type FileViewMode } from './file-pane.tsx'
import { markdownRenderer, PreviewPane } from './preview-pane.tsx'
import { previewKindForPath, type PreviewKind } from './preview-kind.ts'
import { collectMdAssets, defangRemoteImages, htmlFallbackForPreview, MD_ASSET_CAP, resolveMdAsset, rewriteMdAssets } from './md-preview.ts'
import { findBranchTip, isAncestorOrSelf, resolveRangeHash } from './range-guard.ts'
import type { ReviewSettings } from './review-settings.ts'
import { CommitGraph, fmtGraphDate } from './graph-view.tsx'
import { computeGraphLanes } from './git-graph.ts'
import { filterFiles, isUnmerged, mergeAllFiles } from './file-tree.ts'
import { createViewedStore } from './viewed.ts'
import { createDraftBox, type CommentDraft } from './comment-drafts.ts'
import { TreePanel } from './tree-panel.tsx'
import type { NS, ReviewKey } from './locales.ts'
import css from './review.module.css'

/** Props injected by the slot registration (see client/index.ts). */
export interface ReviewInjected {
  /** The session workspace path; undefined when the session has none. */
  cwd: string | undefined
  /** The session this tab renders (indexes sessionsList). */
  sessionId: string
  /** Reactive session-directory source (structural: the shell's session
   *  list face). The `cwd` snapshot above is shell-cached per session and
   *  can stick at undefined when the list arrives late — the view
   *  re-resolves through this source instead. */
  sessionsList: {
    subscribe(listener: () => void): () => void
    getSnapshot(): { byId: Record<string, { cwd?: string } | undefined> }
  }
  /** The plugin-level preference store (also edits the settings card). */
  settings: ReviewSettings
}

type T = PropsLocale<typeof NS>['t']

/** The comparison side of the toolbar: worktree-vs-base (the review tab's
 *  home mode) or any-two-commits (ref-range: base...target). */
type CompareMode = 'worktree' | 'refs'

/** The tab's main view: workspace changes or the commit graph. */
type ViewTab = 'changes' | 'graph'

/** Shared empty feed: a fresh [] per render would defeat the lanes memo. */
const NO_COMMITS: GitCommitSummary[] = []

/** The commit-graph feed's load state. */
type LogState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'ready'; commits: GitCommitSummary[]; truncated: boolean }
  | { kind: 'failed'; message: string }

/** The status side of the view. */
type StatusState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: GitStatusPayload }
  | { kind: 'notRepo'; root: string }
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
async function loadStatus(cwd: string, base: string | null, target: string | null, wsIgnore: boolean): Promise<Exclude<StatusState, { kind: 'loading' }>> {
  const payload = await hostCall<GitStatusPayload | GitStatusFailure>('status', { cwd, base, target, ws: wsIgnore })
  if (payload === null) return { kind: 'hostUnavailable' }
  if (!payload.ok) return payload.isRepository === false ? { kind: 'notRepo', root: payload.cwdRoot ?? cwd } : { kind: 'error', message: payload.error }
  return { kind: 'ready', data: payload }
}

/** Fetch one file's diff; keeps non-ok payloads as explicit failures. */
async function loadFileDiff(cwd: string, path: string, origPath: string | undefined, untracked: boolean, full: boolean, scope: DiffScope, base: string | null, target: string | null, wsIgnore: boolean): Promise<Exclude<DiffState, { kind: 'loading' }>> {
  const payload = await hostCall<GitFileDiffPayload & { error?: string }>('file-diff', { cwd, path, origPath, untracked, full, scope, base, target, ws: wsIgnore })
  if (payload === null) return { kind: 'failed', message: 'host unavailable' }
  if (!payload.ok) return { kind: 'failed', message: payload.error ?? 'unknown error' }
  return payload.binary ? { kind: 'binary', size: payload.size } : { kind: 'text', diff: payload.diff, truncated: payload.truncated }
}

/** Preview bytes (image/PDF) for the in-tab preview; mirrors loadFileContent. */
type PreviewBytesState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; mime: string; base64: string; size: number; truncated: boolean }
  | { kind: 'failed'; message: string }

async function loadPreviewBytes(cwd: string, path: string, ref?: string | null): Promise<Exclude<PreviewBytesState, { kind: 'idle' | 'loading' }>> {
  const payload = await hostCall<GitFileBytesPayload & { error?: string }>('file-bytes', ref ? { cwd, path, ref } : { cwd, path })
  if (payload === null) return { kind: 'failed', message: 'host unavailable' }
  if (!payload.ok) return { kind: 'failed', message: payload.error ?? 'unknown error' }
  return { kind: 'ready', mime: payload.mime, base64: payload.base64, size: payload.size, truncated: payload.truncated }
}

/** Fetch one file's full content; keeps non-ok payloads as explicit failures.
 *  A `ref` reads that history tree instead of the worktree (cat-file) —
 *  the ref-range mode's file view has no worktree copy to read. */
async function loadFileContent(cwd: string, path: string, ref?: string | null): Promise<Exclude<DiffState, { kind: 'loading' }>> {
  const payload = await hostCall<GitFileContentPayload & { error?: string }>('file-content', ref ? { cwd, path, ref } : { cwd, path })
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
export function ReviewView({ cwd: injectedCwd, sessionId, sessionsList, settings, t, useSession, useInput, inputActions }: InjectFace<ReviewInjected> & PropsLocale<typeof NS> & Partial<SessionStandardProps>) {
  // The shell caches injected props per session, so the `cwd` snapshot can
  // stick at undefined when the session list arrives late — re-resolve it
  // reactively; the injected value is only the first paint. (String compare
  // keeps the snapshot stable: no resubscribe loop.)
  const cwd = useSyncExternalStore(
    useCallback((notify: () => void) => sessionsList.subscribe(notify), [sessionsList]),
    () => sessionsList.getSnapshot().byId[sessionId]?.cwd ?? injectedCwd,
  )
  // Agent-running gate for the write actions (commit/push) — a boolean
  // selector keeps re-renders to the running flip only.
  const running = useSession !== undefined ? (useSession((s: SessionSnapshot) => s.running) ?? false) : false
  const [status, setStatus] = useState<StatusState>({ kind: 'loading' })
  const [reloadTick, setReloadTick] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [diffFull, setDiffFull] = useState(false)
  const [diffScope, setDiffScope] = useState<DiffScope>('all')
  /** Per-hunk op transport state: busy flag + verbatim git failure. */
  const [hunkBusy, setHunkBusy] = useState(false)
  const [hunkNotice, setHunkNotice] = useState<string | null>(null)
  const [diff, setDiff] = useState<DiffState>({ kind: 'idle' })
  /** Blame mode for the file view: on/off + loaded rows. */
  const [blameOn, setBlameOn] = useState(false)
  const [blameState, setBlameState] = useState<{ kind: 'idle' | 'loading' | 'ready' | 'failed'; lines: GitBlameLine[] | null; message: string | null }>({ kind: 'idle', lines: null, message: null })
  /** Per-file history popover state (the diff header's history button). */
  const [historyState, setHistoryState] = useState<{ kind: 'closed' } | { kind: 'loading' } | { kind: 'open'; x: number; y: number; commits: GitCommitSummary[]; truncated: boolean }>({ kind: 'closed' })
  const historyPopRef = useRef<HTMLDivElement | null>(null)
  /** Tree panel dragged width (J8-3): null = the CSS clamp default; the
   *  last dragged value persists across sessions. */
  const [treeWidth, setTreeWidth] = useState<number | null>(() => {
    try {
      const stored = Number(localStorage.getItem('dsh-git-review.treeWidth'))
      return Number.isFinite(stored) && stored >= 200 && stored <= 460 ? stored : null
    } catch {
      return null
    }
  })
  const treeResizeRef = useRef<{ startX: number; startWidth: number } | null>(null)
  /** Document-level drag listeners must not leak on a mid-drag unmount (the
   *  mouseup that removes them would never arrive). Both resizers register
   *  their teardown here. */
  const dragCleanupRef = useRef<(() => void) | null>(null)
  useEffect(() => () => {
    dragCleanupRef.current?.()
    dragCleanupRef.current = null
  }, [])
  /** Drag the divider between the diff pane and the tree: the tree sits on
   *  the right, so dragging LEFT widens it; clamped, persisted on release. */
  const startTreeResize = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    treeResizeRef.current = { startX: event.clientX, startWidth: treeWidth ?? 260 }
    let raf = 0
    let latest = 0
    const onMove = (move: MouseEvent): void => {
      const state = treeResizeRef.current
      if (state === null) return
      latest = Math.min(460, Math.max(200, state.startWidth + (state.startX - move.clientX)))
      if (raf !== 0) return
      raf = requestAnimationFrame(() => {
        raf = 0
        setTreeWidth(latest)
      })
    }
    const done = (): void => {
      if (raf !== 0) cancelAnimationFrame(raf)
      raf = 0
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      if (dragCleanupRef.current === done) dragCleanupRef.current = null
    }
    const onUp = (move: MouseEvent): void => {
      const state = treeResizeRef.current
      treeResizeRef.current = null
      done()
      if (state === null) return
      void move
      const final = Math.min(460, Math.max(200, state.startWidth + (state.startX - move.clientX)))
      try { localStorage.setItem('dsh-git-review.treeWidth', String(final)) } catch { /* private mode — width just doesn't persist */ }
    }
    dragCleanupRef.current?.()
    dragCleanupRef.current = done
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [treeWidth])
  /** Keyboard resize for the tree divider (arrows move 20px, Shift+arrows 100px). */
  const onTreeResizeKey = useCallback((event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const step = event.shiftKey ? 100 : 20
    // The tree sits on the right: dragging LEFT widens it, like the mouse path.
    const next = Math.min(460, Math.max(200, Math.round((treeWidth ?? 260) + (event.key === 'ArrowLeft' ? step : -step))))
    setTreeWidth(next)
    try { localStorage.setItem('dsh-git-review.treeWidth', String(next)) } catch { /* private mode — width just doesn't persist */ }
  }, [treeWidth])
  // All-files tree mode: the whole repository file list (lazily fetched).
  const [treeMode, setTreeMode] = useState<'changes' | 'all'>('changes')
  const [allFiles, setAllFiles] = useState<string[] | null>(null)
  const [allFilesFailed, setAllFilesFailed] = useState(false)
  // The layout/search/graph defaults come from the preference store (the
  // settings card edits the same store; see review-settings.ts). The
  // whole-file toggle is session-transient — only split/unified persist —
  // so the store's viewMode can drive the tab's state unconditionally.
  const initialPrefs = settings.store.getSnapshot().prefs
  const [viewMode, setViewMode] = useState<'split' | 'unified'>(initialPrefs.viewMode)
  // The whole-file view toggle (transient; unchanged rows force it anyway).
  const [fileView, setFileView] = useState(false)
  /** In-tab preview: source-first toggle (per selection) + fetched bytes for
   *  raster images and PDFs (markdown/SVG reuse the loaded text). */
  const [previewSource, setPreviewSource] = useState(false)
  const [previewBytes, setPreviewBytes] = useState<PreviewBytesState>({ kind: 'idle' })
  // Content search: the draft debounces into the committed query; matches map
  // drives the tree's per-file count chips and the diff pane's highlighting.
  // The scope decides what is searched — file names (client-side tree
  // filter), diff content (host git diff) or file content (host git grep) —
  // and case/regex are optional toggles, both off by default.
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [searchScope, setSearchScope] = useState<'path' | 'diff' | 'content'>(initialPrefs.searchScope)
  const [searchCS, setSearchCS] = useState(initialPrefs.searchCS)
  const [searchRegex, setSearchRegex] = useState(initialPrefs.searchRegex)
  // Whitespace-only edits hide behind the ignore-whitespace toggle (a
  // preference, so the choice follows the user across sessions).
  const [wsIgnore, setWsIgnore] = useState(initialPrefs.wsIgnore)
  const [syntaxHighlight, setSyntaxHighlight] = useState(initialPrefs.syntaxHighlight)
  // One search popover holds BOTH the scope choice and the matching toggles
  // (scope used to be a chip dropdown, matching a separate gear button — two
  // popovers for one box read as clutter and the gear was undiscoverable).
  const [searchOptionsOpen, setSearchOptionsOpen] = useState(false)
  const [searchMatches, setSearchMatches] = useState<ReadonlyMap<string, number> | null>(null)
  // Diff-base override: null compares against HEAD; the refs list feeds the
  // dropdowns (fetched alongside each status refresh). In refs mode the
  // comparison runs between two picked refs instead of the worktree.
  const [compareMode, setCompareMode] = useState<CompareMode>('worktree')
  const [baseRef, setBaseRef] = useState<string | null>(null)
  const [targetRef, setTargetRef] = useState<string | null>(null)
  const [refs, setRefs] = useState<GitRefEntry[] | null>(null)
  // The ref picker's commit section: recent commits, fetched once per
  // refresh alongside the refs list (capped — a picker is not a browser).
  const [pickerCommits, setPickerCommits] = useState<GitCommitSummary[] | null>(null)
  /** The 120-commit picker feed loads on the first picker open, not on refresh. */
  const [pickerFeedWanted, setPickerFeedWanted] = useState(false)
  const wantPickerFeed = useCallback(() => { setPickerFeedWanted(true) }, [])
  const refsMode = compareMode === 'refs'
  const rangeReady = !refsMode || (baseRef !== null && targetRef !== null)
  // Graph view: the log feed, the selected commit, and its file list/diff.
  const [viewTab, setViewTab] = useState<ViewTab>('changes')
  const [logState, setLogState] = useState<LogState>({ kind: 'idle' })
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null)
  /** Expanded commit header, by hash (null = folded): switching commits
   *  folds again, so the detail always opens on its compact summary row. */
  const [infoOpenHash, setInfoOpenHash] = useState<string | null>(null)
  const [graphFile, setGraphFile] = useState<string | null>(null)
  const [graphCollapsed, setGraphCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [graphListCollapsed, setGraphListCollapsed] = useState(initialPrefs.graphCollapsed)
  /** Graph-list dragged width in px (null = the CSS default; persists like the tree width). */
  const [graphListWidth, setGraphListWidth] = useState<number | null>(() => {
    try {
      const stored = Number(localStorage.getItem('dsh-git-review.graphWidth'))
      return Number.isFinite(stored) && stored >= 180 && stored <= 900 ? stored : null
    } catch {
      return null
    }
  })
  const graphListRef = useRef<HTMLElement | null>(null)
  const graphResizeRef = useRef<{ startX: number; startWidth: number } | null>(null)
  /** Visible-column density from the dragged width (null = full info). */
  const graphDensity = graphListWidth === null ? 4 : graphListWidth < 280 ? 1 : graphListWidth < 390 ? 2 : graphListWidth < 540 ? 3 : 4
  /** Drag the divider right of the graph list: dragging RIGHT widens it. */
  const startGraphResize = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    const section = graphListRef.current
    const startWidth = graphListWidth ?? section?.getBoundingClientRect().width ?? 480
    graphResizeRef.current = { startX: event.clientX, startWidth }
    const clamp = (value: number): number => Math.min(900, Math.max(180, value))
    let raf = 0
    let latest = 0
    const onMove = (move: MouseEvent): void => {
      const state = graphResizeRef.current
      if (state === null) return
      latest = clamp(state.startWidth + (move.clientX - state.startX))
      if (raf !== 0) return
      raf = requestAnimationFrame(() => {
        raf = 0
        setGraphListWidth(latest)
      })
    }
    const done = (): void => {
      if (raf !== 0) cancelAnimationFrame(raf)
      raf = 0
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      if (dragCleanupRef.current === done) dragCleanupRef.current = null
    }
    const onUp = (up: MouseEvent): void => {
      const state = graphResizeRef.current
      graphResizeRef.current = null
      done()
      if (state === null) return
      try { localStorage.setItem('dsh-git-review.graphWidth', String(Math.round(clamp(state.startWidth + (up.clientX - state.startX)))) ) } catch { /* private mode — width just doesn't persist */ }
    }
    dragCleanupRef.current?.()
    dragCleanupRef.current = done
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [graphListWidth])
  /** Double-click the divider restores the default list width. */
  const resetGraphWidth = useCallback(() => {
    setGraphListWidth(null)
    try { localStorage.removeItem('dsh-git-review.graphWidth') } catch { /* private mode — nothing persisted */ }
  }, [])
  /** Keyboard resize for the divider (arrows move 20px, Shift+arrows 100px). */
  const onGraphResizeKey = useCallback((event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const step = event.shiftKey ? 100 : 20
    const base = graphListWidth ?? graphListRef.current?.getBoundingClientRect().width ?? 480
    const next = Math.min(900, Math.max(180, Math.round(base + (event.key === 'ArrowRight' ? step : -step))))
    setGraphListWidth(next)
    try { localStorage.setItem('dsh-git-review.graphWidth', String(next)) } catch { /* private mode — width just doesn't persist */ }
  }, [graphListWidth])
  // The worktree virtual row's detail state (the graph view can show the
  // uncommitted changes as if they were a "commit").
  const [graphWorktree, setGraphWorktree] = useState(false)
  const [graphWorktreeFile, setGraphWorktreeFile] = useState<string | null>(null)
  const [graphLoadingMore, setGraphLoadingMore] = useState(false)
  const [commitFiles, setCommitFiles] = useState<ChangedFile[] | null>(null)
  /** Commit-detail file filter (local: the shared graphFilter drives the feed). */
  const [commitFilesFilter, setCommitFilesFilter] = useState('')
  const [commitTotals, setCommitTotals] = useState<{ added: number; deleted: number } | null>(null)
  const [copiedHash, setCopiedHash] = useState(false)
  /** Blame-jump return: the file view (path + line) a graph commit was opened from. */
  const [blameReturn, setBlameReturn] = useState<{ path: string; line: number } | null>(null)
  /** Sticky focus line kept after the one-click return (drives FilePane highlight). */
  const [blameFocus, setBlameFocus] = useState<{ path: string; line: number } | null>(null)
  /** Graph-to-plugin return: the commit detail a file was opened from. */
  const [pluginOpenReturn, setPluginOpenReturn] = useState<{ commit: string; graphFile: string | null } | null>(null)
  // Commit/push popover state: two-step armed buttons, verbatim git output.
  const [commitOpen, setCommitOpen] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [stageAll, setStageAll] = useState(true)
  const [armed, setArmed] = useState<'commit' | 'commitPush' | 'push' | null>(null)
  const [writeState, setWriteState] = useState<{ kind: 'idle' } | { kind: 'busy' } | { kind: 'result'; ok: boolean; text: string }>({ kind: 'idle' })
  // Branch manager popover state (create/switch/rename/delete).
  const [branchOpen, setBranchOpen] = useState(false)
  const branchPopRef = useRef<HTMLDivElement | null>(null)
  const commitPopRef = useRef<HTMLDivElement | null>(null)
  const branchBtnRef = useRef<HTMLButtonElement | null>(null)
  const commitBtnRef = useRef<HTMLButtonElement | null>(null)
  const draftPopRef = useRef<HTMLDivElement | null>(null)
  const draftBtnRef = useRef<HTMLButtonElement | null>(null)
  const searchOptionsRef = useRef<HTMLSpanElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  // Comment draft box: pending comments keyed per workspace, surfaced in a
  // toolbar popover with a bulk send into the composer draft.
  const draftBox = useMemo(() => (cwd === undefined ? null : createDraftBox(cwd)), [cwd])
  const [draftList, setDraftList] = useState<CommentDraft[]>([])
  const [draftOpen, setDraftOpen] = useState(false)
  useEffect(() => {
    setDraftList(draftBox?.list() ?? [])
  }, [draftBox])
  const addDraft = useCallback((draft: CommentDraft) => {
    draftBox?.add(draft)
    setDraftList(draftBox?.list() ?? [])
  }, [draftBox])

  // Popovers spawned before RefPicker/FileMenu had no outside-click close;
  // share the same document-mousedown rule those two use. The trigger buttons
  // are excluded so their own click-to-toggle doesn't fight the closer.
  useEffect(() => {
    if (!branchOpen && !commitOpen && !draftOpen) return
    const onDown = (event: MouseEvent): void => {
      const target = event.target as Node
      if (branchOpen && branchPopRef.current !== null && !branchPopRef.current.contains(target)
        && (branchBtnRef.current === null || !branchBtnRef.current.contains(target))) setBranchOpen(false)
      if (commitOpen && commitPopRef.current !== null && !commitPopRef.current.contains(target)
        && (commitBtnRef.current === null || !commitBtnRef.current.contains(target))) setCommitOpen(false)
      if (draftOpen && draftPopRef.current !== null && !draftPopRef.current.contains(target)
        && (draftBtnRef.current === null || !draftBtnRef.current.contains(target))) setDraftOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => { document.removeEventListener('mousedown', onDown) }
  }, [branchOpen, commitOpen, draftOpen])
  useEffect(() => {
    if (!searchOptionsOpen) return
    const onDown = (event: MouseEvent): void => {
      const root = searchOptionsRef.current
      if (root !== null && !root.contains(event.target as Node)) setSearchOptionsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => { document.removeEventListener('mousedown', onDown) }
  }, [searchOptionsOpen])
  useEffect(() => {
    if (historyState.kind !== 'open') return
    const onDown = (event: MouseEvent): void => {
      const root = historyPopRef.current
      if (root !== null && !root.contains(event.target as Node)) setHistoryState({ kind: 'closed' })
    }
    document.addEventListener('mousedown', onDown)
    return () => { document.removeEventListener('mousedown', onDown) }
  }, [historyState.kind])
  // Follow preference edits made in the settings card (and any other tab
  // instance) through the shared store. Every user flip inside this tab goes
  // through an explicit settings.set at its control (see the callbacks
  // below) — there is deliberately no echo-write effect, so a store update
  // never re-publishes itself.
  useEffect(() => settings.store.subscribe(() => {
    const prefs = settings.store.getSnapshot().prefs
    // Compare-before-set: the store publishes on every sync, and blind sets
    // re-render the whole tab for unchanged values (updaters stay pure —
    // returning the previous value bails out via Object.is).
    setViewMode(previous => (previous === prefs.viewMode ? previous : prefs.viewMode))
    setSearchScope(previous => (previous === prefs.searchScope ? previous : prefs.searchScope))
    setGraphListCollapsed(previous => (previous === prefs.graphCollapsed ? previous : prefs.graphCollapsed))
    setSearchCS(previous => (previous === prefs.searchCS ? previous : prefs.searchCS))
    setSearchRegex(previous => (previous === prefs.searchRegex ? previous : prefs.searchRegex))
    setWsIgnore(previous => (previous === prefs.wsIgnore ? previous : prefs.wsIgnore))
    setSyntaxHighlight(previous => (previous === prefs.syntaxHighlight ? previous : prefs.syntaxHighlight))
  }), [settings])
  const [branchName, setBranchName] = useState('')
  const [branchStart, setBranchStart] = useState('')
  const [branchBusy, setBranchBusy] = useState(false)
  const [branchResult, setBranchResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteArmed, setDeleteArmed] = useState<string | null>(null)
  // Stash (inside the branch popover): the list lazily loads when the popover
  // opens; drop is a two-step arm like branch deletion.
  const [stashList, setStashList] = useState<GitStashEntry[] | null>(null)
  const [stashOpen, setStashOpen] = useState(false)
  const [stashIncludeUntracked, setStashIncludeUntracked] = useState(true)
  const [stashArmed, setStashArmed] = useState<number | null>(null)
  // Tags (J8-1, inside the branch popover): create input + target picker +
  // per-row delete (two-step arm) and push; same busy/result plumbing.
  const [tagName, setTagName] = useState('')
  const [tagTarget, setTagTarget] = useState('')
  const [tagDeleteArmed, setTagDeleteArmed] = useState<string | null>(null)
  // First-run guide bubble (J8-2): localStorage once-per-user; a toolbar
  // "?" button reopens it after dismissal.
  const [guideSeen, setGuideSeen] = useState(() => {
    try { return window.localStorage.getItem('dsh-git-review.guideSeen') === '1' } catch { return true }
  })
  // Commit-amend: checking the box pulls the tip's message as the prefill
  // (never overwriting text the user already typed).
  const [amend, setAmend] = useState(false)
  // Graph commit context menu (reset/revert/cherry-pick).
  const [commitMenu, setCommitMenu] = useState<CommitMenuState | null>(null)
  // Conflict banner: the abort action is a two-step arm.
  const [conflictAbortArmed, setConflictAbortArmed] = useState(false)
  // File-tree context menu: the popover state + the open-with app list
  // (availability probed once per page by the host).
  const [fileMenu, setFileMenu] = useState<FileMenuState | null>(null)
  const [openApps, setOpenApps] = useState<OpenApp[] | null>(null)
  // Reviewed markers (worktree mode only): a plugin-local store keyed on
  // the worktree blob hash; bumpViewed re-renders the tree after a toggle.
  // Per-workspace reviewed markers: blob hashes are content-derived, but the
  // store instance is still session-scoped so a workspace switch never leaks
  // another repo's marks into this tab.
  const viewedStore = useMemo(() => createViewedStore(cwd), [cwd])
  const [viewedTick, bumpViewed] = useReducer(count => count + 1, 0)
  const viewedHas = useCallback((blob: string) => viewedStore.has(blob), [viewedStore])
  const toggleViewed = useCallback((blob: string) => {
    viewedStore.toggle(blob)
    bumpViewed()
  }, [viewedStore])

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
    void loadStatus(cwd, baseRef, refsMode ? targetRef : null, wsIgnore).then(next => {
      if (alive) setStatus(next)
    })
    return () => { alive = false }
  }, [cwd, reloadTick, baseRef, targetRef, compareMode, wsIgnore])

  // Selectable diff-base refs (branches, remotes, tags) ride every refresh.
  // The picker's recent-commit feed (a capped log — the picker is not a
  // history browser) loads lazily on the first picker open instead: a write
  // must not re-pull 120 commits for a picker that may never open.
  useEffect(() => {
    if (cwd === undefined) {
      setRefs(null)
      setPickerCommits(null)
      setPickerFeedWanted(false)
      return
    }
    let alive = true
    void hostCall<GitRefsPayload>('refs', { cwd }).then(payload => {
      if (alive) setRefs(payload !== null && payload.ok ? payload.refs : null)
    })
    if (pickerFeedWanted) {
      void hostCall<GitLogPayload>('log', { cwd, limit: 120 }).then(payload => {
        if (alive) setPickerCommits(payload !== null && payload.ok ? payload.commits : null)
      })
    } else {
      setPickerCommits(null)
    }
    return () => { alive = false }
  }, [cwd, reloadTick, pickerFeedWanted])

  // Open-with app availability: probed once (the app list has no repo
  // dependency; the menu just needs it before the first open-with click).
  useEffect(() => {
    let alive = true
    void hostCall<OpenAppsPayload>('apps', {}).then(payload => {
      if (alive) setOpenApps(payload !== null && payload.ok ? payload.apps : null)
    })
    return () => { alive = false }
  }, [])

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
    if (search === '' || searchScope === 'path' || cwd === undefined || !rangeReady || viewTab !== 'changes') {
      setSearchMatches(null)
      return
    }
    let alive = true
    void hostCall<GitSearchPayload>('search', {
      cwd,
      query: search,
      base: baseRef,
      target: refsMode ? targetRef : null,
      mode: searchScope === 'content' ? 'content' : 'diff',
      cs: searchCS,
      rx: searchRegex,
      ws: wsIgnore,
    }).then(payload => {
      if (!alive) return
      setSearchMatches(payload !== null && payload.ok
        ? new Map(payload.matches.map(match => [match.path, match.count] as const))
        : null)
    })
    return () => { alive = false }
  }, [search, searchScope, searchCS, searchRegex, wsIgnore, cwd, reloadTick, baseRef, targetRef, compareMode, viewTab])

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
      setCommitTotals(null)
      return
    }
    let alive = true
    setCommitFiles(null)
    setCommitTotals(null)
    void hostCall<GitCommitFilesPayload>('commit-files', { cwd, commit: selectedCommit }).then(payload => {
      if (!alive) return
      if (payload !== null && payload.ok) {
        setCommitFiles(payload.files)
        setCommitTotals(payload.totals)
        // Auto-select the first changed file: the diff is what the user came
        // for (merge commits with no rows show the empty notice instead).
        setGraphFile(payload.files.length > 0 ? payload.files[0]!.path : null)
      } else {
        setCommitFiles([])
      }
    })
    return () => { alive = false }
  }, [viewTab, cwd, selectedCommit])

  /** Copy-feedback timer: cleared on unmount so a late tick never touches a dead tree. */
  const copyTimerRef = useRef<number | null>(null)
  useEffect(() => () => {
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current)
  }, [])
  /** Copy the selected commit's full hash (the detail bar's hash button). */
  const copyCommitHash = useCallback(() => {
    if (selectedCommit === null) return
    void navigator.clipboard?.writeText(selectedCommit).then(() => {
      setCopiedHash(true)
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => { setCopiedHash(false) }, 1500)
    }).catch(() => { /* clipboard unavailable — the hash stays visible */ })
  }, [selectedCommit])

  const ready = status.kind === 'ready' ? status.data : null
  /** The search spec every pane consumes (query + optional case/regex). */
  const searchSpec = useMemo(
    () => ({ query: search, caseSensitive: searchCS, regex: searchRegex }),
    [search, searchCS, searchRegex],
  )
  const graphCommits = logState.kind === 'ready' ? logState.commits : NO_COMMITS
  const graphLanes = useMemo(() => computeGraphLanes(graphCommits), [graphCommits])
  // The feed has no filter input of its own (the commit-detail tree owns its
  // local filter): rows pass through with their topology lanes attached.
  const visibleGraph = useMemo(
    () => graphCommits.map((commit, index) => ({ commit, lane: graphLanes[index] })),
    [graphCommits, graphLanes],
  )
  /** Every repository row in all-files mode (changed rows merged in); null in changes mode. */
  const allRows = useMemo(
    () => (treeMode === 'all' && !refsMode && allFiles !== null ? mergeAllFiles(allFiles, ready?.files ?? []) : null),
    [treeMode, refsMode, allFiles, ready],
  )
  /** Changed-but-not-yet-reviewed count (worktree mode; drives the tree's chip). */
  const pendingCount = useMemo(() => {
    if (viewTab !== 'changes' || refsMode || ready === null) return undefined
    return ready.files.filter(file => file.blob !== undefined && !viewedStore.has(file.blob)).length
  }, [viewTab, refsMode, ready, viewedStore, viewedTick])
  const selectedFile = useMemo(() => {
    const source = allRows ?? ready?.files
    return source?.find(file => file.path === selected) ?? null
  }, [allRows, ready, selected])
  /** Unchanged rows have no diff — the file view is their only view. The
   *  whole-file toggle is transient and applies only where a diff exists. */
  const effectiveView: FileViewMode = fileView || selectedFile?.unchanged === true ? 'file' : viewMode
  /** In-tab preview gating (extension first, server mime wins at render):
   *  markdown needs the shared renderer + loaded text, SVG needs loaded
   *  text containing a tag (a lying extension falls back to source), raster
   *  images and PDFs stream bytes on demand. */
  const previewKind: PreviewKind | null = selectedFile !== null ? previewKindForPath(selectedFile.path) : null
  const previewSvg = selectedFile !== null && selectedFile.path.toLowerCase().endsWith('.svg')
  const previewMdOk = previewKind !== 'markdown' || markdownRenderer() !== null
  const previewSvgOk = !previewSvg || (diff.kind === 'content' && diff.content.toLowerCase().includes('<svg'))
  const previewAvailable = previewKind !== null && previewMdOk && previewSvgOk
  const showPreview = previewAvailable && !previewSource && (
    previewKind === 'markdown' || previewKind === 'html' || previewSvg ? diff.kind === 'content' : true
  )
  /** data: URL for the preview — encoded text for SVG, bytes otherwise. */
  const previewDataUrl: string | null = !showPreview || previewKind === null ? null
    : previewSvg && diff.kind === 'content'
      ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(diff.content)
      : previewBytes.kind === 'ready' && !previewBytes.truncated
        && (previewKind === 'pdf' ? previewBytes.mime === 'application/pdf' : previewBytes.mime.startsWith('image/'))
        ? 'data:' + previewBytes.mime + ';base64,' + previewBytes.base64
        : null
  const previewBytesFailed = showPreview && previewKind !== null && previewKind !== 'markdown' && !previewSvg
    && (previewBytes.kind === 'failed'
      || (previewBytes.kind === 'ready' && (previewBytes.truncated
        || (previewKind === 'pdf' ? previewBytes.mime !== 'application/pdf' : !previewBytes.mime.startsWith('image/')))))
  /** Markdown text for the renderer: raw HTML wrappers fall back first
   *  (pure, synchronous), then the asset effect below swaps inlined data:
   *  URLs for repo-relative images. A stale ready text never renders for a
   *  new selection (the `path` guard). */
  const mdFallback = useMemo(() => (
    previewKind === 'markdown' && diff.kind === 'content' ? htmlFallbackForPreview(diff.content) : null
  ), [previewKind, diff])
  /** Markdown text for the renderer: safe-HTML fallback first, remote
   *  images defanged to click-to-load links (the shell fetches absolute
   *  http(s) images on sight), then repo-relative images rewritten to
   *  absolute same-origin asset URLs (the shell renderer only paints
   *  absolute http(s) images — relative links are banned and data: URLs
   *  degrade to alt text, so neither can render there). Pure and
   *  synchronous: no fetch, nothing to stale. */
  const mdText = useMemo(() => {
    if (previewKind !== 'markdown' || mdFallback === null || selected === null || cwd === undefined) return mdFallback ?? ''
    const ref = refsMode && targetRef !== null ? targetRef : null
    const defanged = defangRemoteImages(mdFallback)
    const table = new Map<string, string>()
    for (const url of collectMdAssets(defanged).slice(0, MD_ASSET_CAP)) {
      const rel = resolveMdAsset(selected, url)
      if (rel !== null) table.set(url, assetUrl(cwd, rel, ref))
    }
    return rewriteMdAssets(defanged, table)
  }, [previewKind, mdFallback, selected, cwd, refsMode, targetRef])

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
      ? loadFileContent(cwd, selected, refsMode && targetRef !== null ? targetRef : null)
      : loadFileDiff(cwd, selected, selectedFile.origPath, selectedFile.untracked, diffFull, diffScope, baseRef, refsMode ? targetRef : null, wsIgnore)
    void loader.then(next => {
      if (alive) setDiff(next)
    })
    return () => { alive = false }
  }, [cwd, selected, selectedFile, selectedFile?.untracked, selectedFile?.origPath, diffFull, diffScope, effectiveView, baseRef, targetRef, compareMode, viewTab, wsIgnore])

  // Preview bytes lifecycle: raster images and PDFs need raw bytes (SVG and
  // markdown reuse the loaded text). SVG never reaches this effect — its
  // data: URL is encoded from the text content at render time.
  useEffect(() => {
    if (viewTab !== 'changes' || cwd === undefined || selected === null) {
      setPreviewBytes({ kind: 'idle' })
      return
    }
    if (previewSource) return
    const kind = previewKindForPath(selected)
    if (kind !== 'image' && kind !== 'pdf') return
    if (kind === 'image' && selected.toLowerCase().endsWith('.svg')) return
    let alive = true
    setPreviewBytes({ kind: 'loading' })
    void loadPreviewBytes(cwd, selected, refsMode && targetRef !== null ? targetRef : null).then(next => {
      if (alive) setPreviewBytes(next)
    })
    return () => { alive = false }
  }, [cwd, selected, viewTab, previewSource, refsMode, targetRef])


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
    void loadFileDiff(cwd, graphFileInfo.path, graphFileInfo.origPath, false, diffFull, 'all', parent0, selectedCommit, wsIgnore).then(next => {
      if (alive) setDiff(next)
    })
    return () => { alive = false }
  }, [viewTab, cwd, selectedCommit, graphFileInfo, commitInfo, diffFull, wsIgnore])

  // The worktree virtual row's file diff (graph view): plain worktree-vs-HEAD
  // semantics — same loader the changes view uses, scoped to this pane.
  useEffect(() => {
    if (viewTab !== 'graph' || !graphWorktree || cwd === undefined) return
    const file = ready?.files.find(item => item.path === graphWorktreeFile) ?? null
    if (graphWorktreeFile === null || file === null) {
      setDiff({ kind: 'idle' })
      return
    }
    let alive = true
    setDiff({ kind: 'loading' })
    const wantFile = file.unchanged === true || effectiveView === 'file'
    const loader = wantFile
      ? loadFileContent(cwd, graphWorktreeFile)
      : loadFileDiff(cwd, graphWorktreeFile, file.origPath, file.untracked, diffFull, diffScope, null, null, wsIgnore)
    void loader.then(next => {
      if (alive) setDiff(next)
    })
    return () => { alive = false }
  }, [viewTab, graphWorktree, cwd, graphWorktreeFile, ready, effectiveView, diffFull, diffScope, wsIgnore])

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

  // The review tab's core loop is "agent mutates → human reviews": when the
  // session's running flag drops, the worktree just stopped changing, so a
  // refresh shows the final state without a manual click. No competitor can
  // do this — none of them can read the session state.
  const runningPrevRef = useRef(false)
  /** Call-time workspace ticket: async callbacks compare the cwd they were
   *  launched with against this ref and drop stale responses. */
  const cwdRef = useRef(cwd)
  cwdRef.current = cwd
  useEffect(() => {
    if (runningPrevRef.current && !running) refresh()
    runningPrevRef.current = running
  }, [running, refresh])

  /** Select a tree file; the staged/unstaged scope resets per selection. */
  const selectFile = useCallback((path: string) => {
    setSelected(path)
    setFileView(false)
    setDiffScope('all')
    setHunkNotice(null)
    setBlameOn(false)
    setPreviewSource(false)
    setPreviewBytes({ kind: 'idle' })
    setHistoryState({ kind: 'closed' })
  }, [])

  /** Blame rows for the file view: loaded on demand when the toggle is on.
   *  In ref-range mode the file view reads the target tree, so blame follows
   *  the same revision (a worktree blame would misattribute every line). */
  const blameRef = refsMode && targetRef !== null ? targetRef : null
  useEffect(() => {
    if (!blameOn || cwd === undefined || selected === null || effectiveView !== 'file') {
      setBlameState({ kind: 'idle', lines: null, message: null })
      return
    }
    let alive = true
    setBlameState({ kind: 'loading', lines: null, message: null })
    void hostCall<GitBlamePayload>('blame', blameRef !== null ? { cwd, path: selected, ref: blameRef } : { cwd, path: selected }).then(payload => {
      if (!alive) return
      if (payload === null) setBlameState({ kind: 'failed', lines: null, message: t('state.hostUnavailable') })
      else if (!payload.ok) setBlameState({ kind: 'failed', lines: null, message: 'blame failed' })
      else setBlameState({ kind: 'ready', lines: payload.lines, message: null })
    })
    return () => { alive = false }
  }, [blameOn, cwd, selected, effectiveView, blameRef, t])

  /** Open-request token: fast file switches must not let a stale follow-log
   *  win over the newer one (the second request's state would be dropped). */
  const historyReqRef = useRef(0)
  /** Open the per-file history popover (fetches the follow log). */
  const openFileHistory = useCallback((path: string, x: number, y: number) => {
    if (cwd === undefined) return
    historyReqRef.current += 1
    const ticket = historyReqRef.current
    setHistoryState({ kind: 'loading' })
    void hostCall<GitFileHistoryPayload>('file-history', { cwd, path }).then(payload => {
      if (historyReqRef.current !== ticket) return
      setHistoryState(current => {
        if (current.kind !== 'loading') return current
        if (payload === null || !payload.ok) return { kind: 'open', x, y, commits: [], truncated: false }
        return { kind: 'open', x, y, commits: payload.commits, truncated: payload.truncated }
      })
    })
  }, [cwd])

  /** One per-hunk operation (stage/unstage/revert): cut the standalone
   *  patch from the raw diff the pane is showing and hand it to host
   *  `hunk-op`. Failures stay verbatim under the diff header; success
   *  refreshes so the diff/scope halves re-read from git. */
  /** Sync hunk-op gate: state alone still sees a stale false on rapid double
   *  clicks (the re-render hasn't landed), so the ref closes the race. */
  const hunkBusyRef = useRef(false)
  /** Sync commit/push gate: the same double-click race as the hunk gate. */
  const writeBusyRef = useRef(false)
  const executeHunkOp = useCallback(async (action: 'stage' | 'unstage' | 'revert', hunkIndex: number, path: string, rawDiff: string) => {
    if (cwd === undefined || running || refsMode || hunkBusyRef.current) return
    // Cut BEFORE arming the gate: a null patch must never lock the tab.
    const patch = buildHunkPatch(rawDiff, hunkIndex)
    if (patch === null) {
      setHunkNotice('internal error: failed to cut the hunk patch')
      return
    }
    hunkBusyRef.current = true
    setHunkBusy(true)
    const payload = await hostCall<GitWritePayload>('hunk-op', { cwd, path, patch, action, confirm: true })
    hunkBusyRef.current = false
    setHunkBusy(false)
    if (payload === null) {
      setHunkNotice(t('state.hostUnavailable'))
      return
    }
    if (!payload.ok) {
      setHunkNotice(payload.error ?? 'git apply failed')
      return
    }
    setHunkNotice(null)
    refresh()
  }, [cwd, running, refsMode, refresh, t])

  /** Switch the tree between changed files and the whole repository. */
  const changeTreeMode = useCallback((mode: 'changes' | 'all') => {
    setTreeMode(mode)
    if (mode === 'changes') setAllFiles(null)
  }, [])

  /** Apply a view-switch choice: the whole-file toggle is transient, the
   *  split/unified half persists into the preference store (the settings
   *  card reads the same store). */
  const changeViewMode = useCallback((next: FileViewMode) => {
    if (next === 'file') {
      setFileView(true)
      return
    }
    setFileView(false)
    setViewMode(next)
    settings.set('viewMode', next)
  }, [settings])

  /** The remembered search controls: each flip also writes the preference
   *  store (the settings card mirrors these three controls). */
  const changeSearchScope = useCallback((scope: 'path' | 'diff' | 'content') => {
    setSearchScope(scope)
    settings.set('searchScope', scope)
  }, [settings])
  // Preference flips write the store outside setState updaters (updaters must
  // stay pure — StrictMode double-invokes them, which would publish twice).
  const toggleSearchCS = useCallback(() => {
    const next = !searchCS
    setSearchCS(next)
    settings.set('searchCS', next)
  }, [settings, searchCS])
  const toggleSearchRegex = useCallback(() => {
    const next = !searchRegex
    setSearchRegex(next)
    settings.set('searchRegex', next)
  }, [settings, searchRegex])
  const toggleWsIgnore = useCallback(() => {
    const next = !wsIgnore
    setWsIgnore(next)
    settings.set('wsIgnore', next)
  }, [settings, wsIgnore])

  /** Per-file transient states (blame gutter, hunk arms, preview, history,
   *  whole-file toggle): they belong to one file+range, so every
   *  range/selection switch clears them together with the selection. */
  const resetFileTransient = useCallback(() => {
    setFileView(false)
    setBlameOn(false)
    setHunkNotice(null)
    setPreviewSource(false)
    setPreviewBytes({ kind: 'idle' })
    setHistoryState({ kind: 'closed' })
  }, [])

  /** Pick a new diff base; the selection resets (the file list changes). */
  const changeBase = useCallback((ref: string | null) => {
    setBaseRef(ref)
    setSelected(null)
    setDiffScope('all')
    resetFileTransient()
  }, [resetFileTransient])

  /** Pick the ref-range target; same reset semantics as the base. */
  const changeTarget = useCallback((ref: string | null) => {
    setTargetRef(ref)
    setSelected(null)
    setDiffScope('all')
    resetFileTransient()
  }, [resetFileTransient])

  /** Swap the two range ends: flipping `A…B` to `B…A` is the fastest way to
   *  compare in the other direction (and to get HEAD back as an end). */
  const swapEnds = useCallback(() => {
    setBaseRef(targetRef)
    setTargetRef(baseRef)
    setSelected(null)
    setDiffScope('all')
    resetFileTransient()
  }, [baseRef, targetRef, resetFileTransient])

  /** Switch the comparison side between worktree and ref-range modes. */
  const changeCompareMode = useCallback((mode: CompareMode) => {
    setCompareMode(mode)
    setSelected(null)
    setDiffScope('all')
    resetFileTransient()
    if (mode === 'refs') {
      // Both ends default to HEAD: the range is immediately ready (HEAD vs
      // HEAD shows no files — the picker invites real picks) instead of
      // parking the user on the guide empty state with a null base.
      setBaseRef(previous => previous ?? 'HEAD')
      setTargetRef(previous => previous ?? 'HEAD')
    }
  }, [resetFileTransient])

  /** Switch the main view between workspace changes and the commit graph. */
  const changeViewTab = useCallback((tab: ViewTab) => {
    setViewTab(tab)
    setSelected(null)
    setSelectedCommit(null)
    setGraphFile(null)
    setGraphWorktree(false)
    setGraphWorktreeFile(null)
    setGraphListCollapsed(false)
    setBlameReturn(null)
    setBlameFocus(null)
    setPluginOpenReturn(null)
  }, [])

  /** Select a graph commit; the list folds to the topology rail so the
   *  detail gets the width (the rail keeps every commit one click away).
   *  Clicking the selected commit again deselects and unfolds the list. */
  const selectCommit = useCallback((hash: string) => {
    setGraphWorktree(false)
    setGraphWorktreeFile(null)
    if (selectedCommit === hash) {
      setSelectedCommit(null)
      setGraphFile(null)
      setGraphListCollapsed(false)
      return
    }
    setSelectedCommit(hash)
    setGraphFile(null)
    setDiffScope('all')
    setGraphListCollapsed(true)
    setInfoOpenHash(null)
  }, [selectedCommit])

  /** Select a graph commit unconditionally (jumps never toggle: re-jumping
   *  the already-selected commit must land on its detail, not deselect). */
  const jumpSelectCommit = useCallback((hash: string) => {
    setGraphWorktree(false)
    setGraphWorktreeFile(null)
    setSelectedCommit(hash)
    setGraphFile(null)
    setDiffScope('all')
    setGraphListCollapsed(true)
    setInfoOpenHash(null)
  }, [])

  /** Jump from the history popover to the graph: switch tabs and select the
   *  commit when the loaded graph window has it (500-cap); otherwise just
   *  open the graph (its load-more reaches older commits). */
  const jumpToCommit = useCallback((hash: string) => {
    setHistoryState({ kind: 'closed' })
    const known = logState.kind === 'ready' && logState.commits.some(commit => commit.hash === hash)
    changeViewTab('graph')
    if (known) jumpSelectCommit(hash)
  }, [logState, changeViewTab, jumpSelectCommit])

  /** Jump from a blame gutter commit to the same graph detail, remembering
   *  the file view for the one-click return. Mirrors jumpToCommit. */
  const jumpFromBlame = useCallback((hash: string, line: number) => {
    if (selected === null) return
    const origin = { path: selected, line }
    setBlameOn(true)
    const known = logState.kind === 'ready' && logState.commits.some(commit => commit.hash === hash)
    changeViewTab('graph')
    // changeViewTab clears transient tab state; restore the return after it.
    setBlameReturn(origin)
    setBlameFocus(origin)
    if (known) jumpSelectCommit(hash)
  }, [selected, logState, changeViewTab, jumpSelectCommit])

  /** Return from a blame-opened commit to the file view it came from. */
  const backToBlameFile = useCallback(() => {
    if (blameReturn === null) return
    setBlameFocus(blameReturn)
    setBlameReturn(null)
    setViewTab('changes')
    setSelected(blameReturn.path)
    setBlameOn(true)
  }, [blameReturn])

  /** Open a graph-commit file in the changes view (all-files file view),
   *  remembering the commit detail for the one-click return. */
  const openCommitFileInPlugin = useCallback((path: string) => {
    if (selectedCommit === null) return
    const origin = { commit: selectedCommit, graphFile }
    setFileMenu(null)
    changeViewTab('changes')
    // changeViewTab clears transient tab state; restore the return after it.
    setPluginOpenReturn(origin)
    if (refsMode) changeCompareMode('worktree')
    changeTreeMode('all')
    // selectFile resets the whole-file toggle — set it after selecting.
    selectFile(path)
    setFileView(true)
  }, [selectedCommit, graphFile, refsMode, changeViewTab, changeCompareMode, changeTreeMode, selectFile])

  /** Return from a plugin-opened file to the graph commit it came from. */
  const backToGraphCommit = useCallback(() => {
    if (pluginOpenReturn === null) return
    const origin = pluginOpenReturn
    setPluginOpenReturn(null)
    setViewTab('graph')
    setSelectedCommit(origin.commit)
    setGraphFile(origin.graphFile)
    setGraphListCollapsed(true)
  }, [pluginOpenReturn])


  /** Show the worktree's uncommitted changes in the graph detail pane. */
  const selectGraphWorktree = useCallback(() => {
    setSelectedCommit(null)
    setGraphFile(null)
    setGraphWorktree(true)
  }, [])

  /** Page the graph feed forward ("load more"): --date-order is a total
   *  order, so appended rows never shift the ones already drawn. */
  const loadGraphMore = useCallback(() => {
    if (cwd === undefined || logState.kind !== 'ready' || graphLoadingMore) return
    const cwdAtCall = cwd
    setGraphLoadingMore(true)
    void hostCall<GitLogPayload>('log', { cwd, skip: logState.commits.length }).then(payload => {
      setGraphLoadingMore(false)
      if (cwdAtCall !== cwdRef.current) return
      if (payload === null || !payload.ok) return
      setLogState(previous => {
        if (previous.kind !== 'ready') return previous
        const seen = new Set(previous.commits.map(item => item.hash))
        const merged = [...previous.commits, ...payload.commits.filter(item => !seen.has(item.hash))]
        return { kind: 'ready', commits: merged, truncated: payload.truncated }
      })
    })
  }, [cwd, logState, graphLoadingMore])

  /** One graph history operation (reset/revert/cherry-pick): the error text
   *  to show in the commit menu, or null on success (it closes + refreshes). */
  const runHistory = useCallback(async (action: 'reset' | 'revert' | 'cherry-pick', commit: string, mode?: 'soft' | 'mixed' | 'hard'): Promise<string | null> => {
    if (running) return t('commit.running')
    if (cwd === undefined) return t('state.hostUnavailable')
    const payload = await hostCall<GitWritePayload>(action, { cwd, commit, mode, confirm: true })
    if (payload === null) return t('state.hostUnavailable')
    if (!payload.ok) return payload.error ?? 'unknown error'
    refresh()
    return null
  }, [cwd, running, refresh, t])

  /** Merge a branch into the current one; the answer surfaces in the branch
   *  popover's shared note area. */
  const executeMerge = useCallback(async (name: string, noFf: boolean) => {
    if (cwd === undefined) return
    setBranchBusy(true)
    setBranchResult(null)
    const payload = await hostCall<GitWritePayload>('merge', { cwd, name, noFf, confirm: true })
    setBranchBusy(false)
    if (payload === null) {
      setBranchResult({ ok: false, text: t('state.hostUnavailable') })
      return
    }
    setBranchResult({ ok: payload.ok, text: payload.ok ? (payload.output ?? '') : (payload.error ?? 'unknown error') })
    if (payload.ok) refresh()
  }, [cwd, refresh, t])

  /** Pull (fetch + integrate the upstream); like merge, verbatim output. */
  const executePull = useCallback(async (rebase: boolean) => {
    if (cwd === undefined) return
    setBranchBusy(true)
    setBranchResult(null)
    const payload = await hostCall<GitWritePayload>('pull', { cwd, rebase, confirm: true })
    setBranchBusy(false)
    if (payload === null) {
      setBranchResult({ ok: false, text: t('state.hostUnavailable') })
      return
    }
    setBranchResult({ ok: payload.ok, text: payload.ok ? (payload.output ?? '') : (payload.error ?? 'unknown error') })
    if (payload.ok) refresh()
  }, [cwd, refresh, t])

  /** A mid-flight history operation (merge/rebase/…): its conflicted files
   *  and the banner's continue/abort actions. */
  const inProgress = ready?.inProgress ?? null
  const conflictCount = useMemo(
    () => (ready === null ? 0 : ready.files.filter(file => isUnmerged(file.x, file.y)).length),
    [ready],
  )
  const conflictFinish = useCallback(async (action: 'continue' | 'abort') => {
    if (cwd === undefined || inProgress === null) return
    setBranchBusy(true)
    const payload = await hostCall<GitWritePayload>('conflict-finish', { cwd, action, kind: inProgress, confirm: true })
    setBranchBusy(false)
    setConflictAbortArmed(false)
    if (payload === null || !payload.ok) {
      setBranchOpen(true)
      setBranchResult({ ok: false, text: payload === null ? t('state.hostUnavailable') : (payload.error ?? 'unknown error') })
      return
    }
    refresh()
  }, [cwd, inProgress, refresh, t])
  useEffect(() => {
    if (inProgress === null) setConflictAbortArmed(false)
  }, [inProgress])

  const toggleGraphList = useCallback(() => {
    // The user-facing fold toggle is the one that updates the remembered
    // default (auto-folds on commit selection are transient view state).
    const next = !graphListCollapsed
    setGraphListCollapsed(next)
    settings.set('graphCollapsed', next)
  }, [settings, graphListCollapsed])

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

  // Keyboard review flow: j/k walks the visible file list (the graph view
  // walks commits), "/" jumps to the search box. The handler lives on the
  // view's own root (focused on activation) instead of document — a focused
  // scope cannot fight the shell's global shortcuts, and typing in any
  // input/textarea still yields. Keys also yield to open popovers.
  const onRootKeyDown = useCallback((event: React.KeyboardEvent): void => {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    const target = event.target as HTMLElement | null
    if (target !== null && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
    if (commitOpen || branchOpen || draftOpen || fileMenu !== null || commitMenu !== null || historyState.kind !== 'closed') return
    if (event.key === '/') {
      event.preventDefault()
      searchInputRef.current?.focus()
      return
    }
    if (event.key !== 'j' && event.key !== 'k') return
    event.preventDefault()
    const forward = event.key === 'j'
    if (viewTab === 'graph') {
      const hashes = visibleGraph.map(row => row.commit.hash)
      if (hashes.length === 0) return
      const at = selectedCommit === null ? -1 : hashes.indexOf(selectedCommit)
      const next = at === -1 ? (forward ? 0 : hashes.length - 1) : forward ? Math.min(hashes.length - 1, at + 1) : Math.max(0, at - 1)
      if (hashes[next] !== selectedCommit) selectCommit(hashes[next]!)
      return
    }
    const files = filterFiles(allRows ?? ready?.files ?? [], searchScope === 'path' ? search : '')
    if (files.length === 0) return
    const at = files.findIndex(file => file.path === selected)
    const next = at === -1 ? (forward ? 0 : files.length - 1) : forward ? Math.min(files.length - 1, at + 1) : Math.max(0, at - 1)
    selectFile(files[next]!.path)
  }, [viewTab, selected, selectedCommit, visibleGraph, allRows, ready, search, searchScope, selectFile, selectCommit, commitOpen, branchOpen, draftOpen, fileMenu, commitMenu, historyState])
  // Focusing the root when the view activates makes the keyboard flow live
  // without a click; preventScroll keeps the view steady. Never steal focus
  // on data refreshes (status.kind flips on every refresh — yanking focus
  // out of the search box mid-typing), and never when focus is already
  // inside the view.
  useEffect(() => {
    const root = rootRef.current
    if (root !== null && (document.activeElement === null || !root.contains(document.activeElement))) {
      root.focus({ preventScroll: true })
    }
  }, [viewTab, cwd])

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

  /** Check out a remote branch as a local tracking branch (J8-5). */
  const executeTrack = useCallback(async (remote: string) => {
    if (cwd === undefined) return
    setBranchBusy(true)
    setBranchResult(null)
    const payload = await hostCall<GitWritePayload>('branch-track', { cwd, remote, confirm: true })
    setBranchBusy(false)
    if (payload === null) {
      setBranchResult({ ok: false, text: t('state.hostUnavailable') })
      return
    }
    setBranchResult({ ok: payload.ok, text: payload.ok ? (payload.output ?? '') : (payload.error ?? 'unknown error') })
    if (payload.ok) refresh()
  }, [cwd, refresh, t])

  /** One tag action (J8-1): create / delete / push a lightweight local tag. */
  const executeTag = useCallback(async (action: 'create' | 'delete' | 'push', body: Record<string, unknown>) => {
    if (cwd === undefined) return
    setBranchBusy(true)
    setBranchResult(null)
    const payload = await hostCall<GitWritePayload>('tag-' + action, { cwd, confirm: true, ...body })
    setBranchBusy(false)
    if (payload === null) {
      setBranchResult({ ok: false, text: t('state.hostUnavailable') })
      return
    }
    setBranchResult({ ok: payload.ok, text: payload.ok ? (payload.output ?? '') : (payload.error ?? 'unknown error') })
    if (payload.ok) {
      setTagDeleteArmed(null)
      if (action === 'create') { setTagName(''); setTagTarget('') }
      refresh()
    }
  }, [cwd, refresh, t])

  /** Dismiss the first-run guide bubble (J8-2): persist once-per-user. */
  const dismissGuide = useCallback(() => {
    try { window.localStorage.setItem('dsh-git-review.guideSeen', '1') } catch { /* private mode — bubble just hides */ }
    setGuideSeen(true)
  }, [])
  const reopenGuide = useCallback(() => {
    try { window.localStorage.removeItem('dsh-git-review.guideSeen') } catch { /* ignore */ }
    setGuideSeen(false)
  }, [])

  /** Run the file tree's context-menu action handlers. Every one returns an
   *  error string to show in the popover, or null on success (the menu
   *  closes and the tree refreshes). */
  const openFileApp = useCallback(async (path: string, app: OpenApp['id']): Promise<string | null> => {
    if (cwd === undefined) return t('state.hostUnavailable')
    const payload = await hostCall<GitWritePayload>('open-with', { cwd, path, app, confirm: true })
    if (payload === null) return t('state.hostUnavailable')
    if (!payload.ok) return payload.error ?? 'unknown error'
    return null
  }, [cwd, t])
  const copyFilePath = useCallback(async (path: string): Promise<string | null> => {
    try {
      await navigator.clipboard.writeText(path)
      return null
    } catch {
      return t('menu.clipboardFailed')
    }
  }, [t])
  const copyFileName = useCallback(async (path: string): Promise<string | null> => {
    const name = path.split('/').pop() ?? path
    try {
      await navigator.clipboard.writeText(name)
      return null
    } catch {
      return t('menu.clipboardFailed')
    }
  }, [t])
  const renameFile = useCallback(async (path: string, newPath: string): Promise<string | null> => {
    if (running) return t('commit.running')
    if (cwd === undefined) return t('state.hostUnavailable')
    const payload = await hostCall<GitWritePayload>('file-op', { cwd, path, action: 'rename', newPath, confirm: true })
    if (payload === null) return t('state.hostUnavailable')
    if (!payload.ok) return payload.error ?? 'unknown error'
    setSelected(null)
    refresh()
    return null
  }, [cwd, running, refresh, t])
  const removeFile = useCallback(async (path: string): Promise<string | null> => {
    if (running) return t('commit.running')
    if (cwd === undefined) return t('state.hostUnavailable')
    const payload = await hostCall<GitWritePayload>('file-op', { cwd, path, action: 'delete', confirm: true })
    if (payload === null) return t('state.hostUnavailable')
    if (!payload.ok) return payload.error ?? 'unknown error'
    setSelected(null)
    refresh()
    return null
  }, [cwd, running, refresh, t])

  /** Execute one armed write (commit / commit+push / push) against the host. */
  const executeWrite = useCallback(async (kind: 'commit' | 'commitPush' | 'push') => {
    // Button `disabled` is async rendering: re-check the running gate and the
    // sync ref here so an agent start (or a double click) cannot slip a write
    // through between arming and dispatch.
    if (cwd === undefined || running || writeBusyRef.current) return
    writeBusyRef.current = true
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
      const commitResult = await hostCall<GitWritePayload>('commit', { cwd, message: commitMessage, mode: stageAll ? 'all' : 'staged', amend, confirm: true })
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
    writeBusyRef.current = false
    setWriteState({ kind: 'result', ok: outcome.ok, text: outcome.text })
    setArmed(null)
    if (outcome.ok) {
      if (kind !== 'push') setCommitMessage('')
      setAmend(false)
      refresh()
    }
  }, [cwd, running, commitMessage, stageAll, amend, refresh, t])

  /** One SCM row action from the file menu (stage/unstage/discard): the
   *  error text to show, or null on success (the menu closes and the
   *  worktree refreshes — the row's badges/staged halves may have changed). */
  const runGitAction = useCallback(async (action: 'stage' | 'unstage' | 'discard', path: string): Promise<string | null> => {
    if (running) return t('commit.running')
    if (cwd === undefined) return t('state.hostUnavailable')
    const payload = await hostCall<GitWritePayload>(action, { cwd, paths: [path], confirm: true })
    if (payload === null) return t('state.hostUnavailable')
    if (!payload.ok) return payload.error ?? 'unknown error'
    setSelected(null)
    refresh()
    return null
  }, [cwd, running, refresh, t])

  /** One conflict resolution (ours/theirs + stage): the error text or null. */
  const runConflictResolve = useCallback(async (side: 'ours' | 'theirs', path: string): Promise<string | null> => {
    if (running) return t('commit.running')
    if (cwd === undefined) return t('state.hostUnavailable')
    const payload = await hostCall<GitWritePayload>('conflict-resolve', { cwd, path, side, confirm: true })
    if (payload === null) return t('state.hostUnavailable')
    if (!payload.ok) return payload.error ?? 'unknown error'
    refresh()
    return null
  }, [cwd, running, refresh, t])

  /** The stash list refresh (cheap; runs when the popover or section opens
   *  and after every stash mutation). */
  const loadStashes = useCallback(() => {
    if (cwd === undefined) return
    const cwdAtCall = cwd
    void hostCall<GitStashPayload>('stash', { cwd, action: 'list' }).then(payload => {
      if (cwdAtCall !== cwdRef.current) return
      setStashList(payload !== null && payload.ok ? payload.stashes : [])
    })
  }, [cwd])

  /** One stash mutation (push/apply/pop/drop); the answer surfaces in the
   *  branch popover's shared note area, like the branch actions' output. */
  const runStash = useCallback(async (action: 'push' | 'apply' | 'pop' | 'drop', index?: number) => {
    if (cwd === undefined) return
    setBranchBusy(true)
    setBranchResult(null)
    const payload = await hostCall<GitWritePayload>('stash', { cwd, action, index, includeUntracked: stashIncludeUntracked, confirm: true })
    setBranchBusy(false)
    if (payload === null) {
      setBranchResult({ ok: false, text: t('state.hostUnavailable') })
      return
    }
    setBranchResult({ ok: payload.ok, text: payload.ok ? (payload.output ?? '') : (payload.error ?? 'unknown error') })
    if (payload.ok) {
      setStashArmed(null)
      loadStashes()
      refresh()
    }
  }, [cwd, stashIncludeUntracked, loadStashes, refresh, t])

  /** Fetch all remotes; the answer surfaces like the branch actions'. */
  const executeFetch = useCallback(async () => {
    if (cwd === undefined) return
    setBranchBusy(true)
    setBranchResult(null)
    const payload = await hostCall<GitWritePayload>('fetch', { cwd, confirm: true })
    setBranchBusy(false)
    if (payload === null) {
      setBranchResult({ ok: false, text: t('state.hostUnavailable') })
      return
    }
    setBranchResult({ ok: payload.ok, text: payload.ok ? ((payload.output ?? '').trim() === '' ? t('branch.fetchDone') : payload.output!) : (payload.error ?? 'unknown error') })
    if (payload.ok) refresh()
  }, [cwd, refresh, t])

  /** Flip the amend checkbox; checking it prefills the tip's message once
   *  (host `last-commit`) unless the user already typed one. */
  const toggleAmend = useCallback((next: boolean) => {
    setAmend(next)
    if (next && cwd !== undefined && commitMessage.trim() === '') {
      const cwdAtCall = cwd
      void hostCall<GitLastCommitPayload>('last-commit', { cwd }).then(payload => {
        if (cwdAtCall !== cwdRef.current) return
        if (payload !== null && payload.ok && payload.message !== '') {
          setCommitMessage(previous => (previous.trim() === '' ? payload.message : previous))
        }
      })
    }
  }, [cwd, commitMessage])

  if (status.kind === 'notRepo') {
    if (cwd === undefined) return <CenteredState t={t} status={{ kind: 'noWorkspace' }} onRetry={refresh} />
    return <NotRepoView cwd={cwd} root={status.root} t={t} onDidInit={refresh} />
  }
  if (status.kind === 'noWorkspace' || status.kind === 'hostUnavailable' || status.kind === 'error') {
    return <CenteredState t={t} status={status} onRetry={refresh} />
  }

  const data = ready
  // Ref-range order guard: base...target is empty exactly when the target
  // adds nothing beyond the base. Both feeds combine for maximum ancestry
  // coverage; anything outside the loaded window stays selectable and falls
  // through to the empty-direction hint below.
  const rangeCommits = useMemo(() => {
    const out = new Map<string, GitCommitSummary>()
    if (logState.kind === 'ready') for (const commit of logState.commits) out.set(commit.hash, commit)
    for (const commit of (pickerCommits ?? [])) if (!out.has(commit.hash)) out.set(commit.hash, commit)
    return [...out.values()]
  }, [logState, pickerCommits])
  const rangeParents = useMemo(() => new Map(rangeCommits.map(commit => [commit.hash, commit.parents] as const)), [rangeCommits])
  const headTipHash = useMemo(() => findBranchTip(rangeCommits, data?.branch ?? null), [rangeCommits, data])
  const baseHash = baseRef === null ? null : resolveRangeHash(baseRef, rangeCommits, headTipHash)
  const targetHash = targetRef === null ? null : resolveRangeHash(targetRef, rangeCommits, headTipHash)
  const invalidTargetHashes = useMemo(() => {
    if (baseHash === null) return null
    const out = new Set<string>()
    for (const commit of rangeCommits) {
      if (commit.hash === baseHash || isAncestorOrSelf(rangeParents, commit.hash, baseHash)) out.add(commit.hash)
    }
    return out
  }, [rangeCommits, rangeParents, baseHash])
  const invalidBaseHashes = useMemo(() => {
    if (targetHash === null) return null
    const out = new Set<string>()
    for (const commit of rangeCommits) {
      if (commit.hash === targetHash || isAncestorOrSelf(rangeParents, targetHash, commit.hash)) out.add(commit.hash)
    }
    return out
  }, [rangeCommits, rangeParents, targetHash])
  return (
    <div ref={rootRef} tabIndex={-1} onKeyDown={onRootKeyDown} className={css.root} data-conversation-composer-overlay="">
      {/* One wrapping row, single-line-first: every control is flex:none
          except the search box, which grows into spare width and shrinks
          down to its min-width before the row wraps — so wide views read
          one line and narrow views (side-by-side session, right-side panel)
          fall to two lines only when the search can no longer shrink. The
          graph view drops the compare cluster — its base/target picks only
          drive the changes view, so showing them there invited picks that
          visibly did nothing. */}
      <header className={css.toolbar} data-git-review-toolbar="">
        <div className={css.toolbarRow}>
          <button
            type="button"
            className={css.branchBtn}
            title={t('branch.manage')}
            ref={branchBtnRef}
            onClick={() => { setBranchOpen(value => !value); setDeleteArmed(null); setRenameTarget(null); setTagDeleteArmed(null); setBranchResult(null); loadStashes() }}
          >
            <BranchIcon />
            <span>{data?.branch ?? 'HEAD'}</span>
            {data?.ahead !== undefined && data.behind !== undefined && data.ahead + data.behind > 0 && (
              <span className={css.abCount} title={t('aheadBehind.title', { ahead: data.ahead, behind: data.behind })}>
                {data.ahead > 0 ? '\u2191' + String(data.ahead) : ''}
                {data.behind > 0 ? '\u2193' + String(data.behind) : ''}
              </span>
            )}
            <PopupIcon open={branchOpen} />
          </button>
          {/* separator only when the compare cluster follows — in the graph
              view the branch chip is the whole left group, a dangling
              divider there reads as a stray mark */}
          {viewTab === 'changes' && <span className={css.tbDivider} aria-hidden="true" />}
          {viewTab === 'changes' && (
            <span className={css.compareCluster} title={t('compare.pickHint')}>
              <span className={css.scopeSwitch} role="group" aria-label={t('compare.mode')}>
                {(['worktree', 'refs'] as const).map(candidate => (
                  <button
                    key={candidate}
                    type="button"
                    className={css.scopeBtn + (compareMode === candidate ? ' ' + css.scopeBtnActive : '')}
                    title={t(('compare.' + candidate + 'Hint') as ReviewKey)}
                    onClick={() => { changeCompareMode(candidate) }}
                  >
                    {t(('compare.' + candidate) as ReviewKey)}
                  </button>
                ))}
              </span>
              {/* The comparison sides: worktree mode picks the base the
                  worktree is diffed against (current branch by default);
                  refs mode picks both ends of a base…target range. One
                  themed picker per side with branch/remote/tag/commit
                  groups + search — the native <select> is gone: its OS
                  popup ignored the theme and mixed every kind. */}
              {!refsMode ? (
                <span className={css.compareRow} title={t('base.label')}>
                  <RefPicker
                    value={baseRef}
                    headLabel={data?.branch ?? 'HEAD'}
                    refs={refs}
                    commits={pickerCommits}
                    placeholder={t('compare.pickBase')}
                    onPick={changeBase}
                    onOpen={wantPickerFeed}
                    t={t}
                  />
                  <span className={css.compareArrow}>{'\u2192'}</span>
                  <span className={css.compareFixed} title={t('base.worktree')}>
                    <FileIcon />
                    <span>{t('base.worktree')}</span>
                  </span>
                </span>
              ) : (
                <span className={css.compareRow + ' ' + css.rangeChip}>
                  <RefPicker
                    value={baseRef}
                    headLabel={data?.branch ?? 'HEAD'}
                    refs={refs}
                    commits={pickerCommits}
                    exclude={targetRef ?? undefined}
                    disabledHashes={invalidBaseHashes ?? undefined}
                    headHash={headTipHash}
                    placeholder={t('compare.pickBase')}
                    // The HEAD entry picks null, but a null end means "not
                    // picked yet" (rangeReady) — in refs mode remap it to the
                    // literal HEAD ref, which resolves like any other ref.
                    onPick={value => { changeBase(refsMode ? (value ?? 'HEAD') : value) }}
                    onOpen={wantPickerFeed}
                    t={t}
                  />
                  <button
                    type="button"
                    className={css.swapBtn}
                    title={t('compare.swap')}
                    aria-label={t('compare.swap')}
                    onClick={swapEnds}
                  >
                    <SwapIcon />
                  </button>
                  <RefPicker
                    value={targetRef}
                    headLabel={data?.branch ?? 'HEAD'}
                    refs={refs}
                    commits={pickerCommits}
                    exclude={baseRef ?? undefined}
                    disabledHashes={invalidTargetHashes ?? undefined}
                    headHash={headTipHash}
                    placeholder={t('compare.pickTarget')}
                    onPick={value => { changeTarget(value ?? 'HEAD') }}
                    onOpen={wantPickerFeed}
                    t={t}
                  />
                </span>
              )}
              {data !== null && (
                <span className={css.tbDivider} aria-hidden="true" />
              )}
              {data !== null && (
                <span className={css.totals}>
                  <span className={css.totalAdded}>{'+' + fmtCount(data.totals.added)}</span>
                  <span className={css.totalDeleted}>{'\u2212' + fmtCount(data.totals.deleted)}</span>
                  <span className={css.fileCount}>{'\u00b7 ' + t('filesChanged', { count: data.files.length })}</span>
                </span>
              )}
            </span>
          )}
          <span className={css.scopeSwitch} role="group" aria-label={t('view.label')}>
            {(['changes', 'graph'] as const).map(candidate => (
              <button
                key={candidate}
                type="button"
                className={css.scopeBtn + (viewTab === candidate ? ' ' + css.scopeBtnActive : '')}
                onClick={() => { changeViewTab(candidate) }}
              >
                {candidate === 'changes' ? <FileIcon /> : <GraphIcon />}
                <span>{t(('viewTab.' + candidate) as ReviewKey)}</span>
              </button>
            ))}
          </span>
          {pluginOpenReturn !== null && viewTab === 'changes' && (
            <button
              type="button"
              className={css.toolBtn}
              title={t('graph.backToGraph') + ': ' + pluginOpenReturn.commit.slice(0, 7)}
              onClick={backToGraphCommit}
            >
              {'← ' + t('graph.backToGraph')}
            </button>
          )}
          <span className={css.searchWrap}>
            <label className={css.searchBox}>
              {viewTab === 'changes' && (
                // Scope segment INSIDE the box: "what to search" is the leading
                // section of one bounded search control (segment | hairline |
                // input), instead of two adjacent naked controls. The popover
                // still anchors to the segment — only the DOM parent changed.
                <span className={css.searchScope} ref={searchOptionsRef}>
                  <button
                    type="button"
                    className={css.searchScopeBtn}
                    title={t('search.scope')}
                    aria-haspopup="menu"
                    aria-expanded={searchOptionsOpen}
                    onClick={() => { setSearchOptionsOpen(value => !value) }}
                  >
                    <span>{t(('search.scope.' + searchScope) as ReviewKey)}</span>
                    <PopupIcon size={10} open={searchOptionsOpen} />
                  </button>
                  {searchOptionsOpen && (
                    <div className={css.searchOptionsPop} role="menu">
                      <div className={css.searchOptionsGroup}>{t('search.scope')}</div>
                      {(['diff', 'content', 'path'] as const).map(candidate => (
                        <button
                          key={candidate}
                          type="button"
                          className={css.pickerItem + (searchScope === candidate ? ' ' + css.pickerItemActive : '')}
                          onClick={() => { changeSearchScope(candidate) }}
                        >
                          <span className={css.pickerItemName}>{t(('search.scope.' + candidate) as ReviewKey)}</span>
                          {searchScope === candidate && <span className={css.pickerItemCheck}><CheckIcon /></span>}
                        </button>
                      ))}
                      <div className={css.fileMenuDivider} />
                      <div className={css.searchOptionsGroup}>{t('search.matching')}</div>
                      <button
                        type="button"
                        className={css.pickerItem + (searchCS ? ' ' + css.pickerItemActive : '')}
                        onClick={() => { toggleSearchCS() }}
                      >
                        <span className={css.pickerItemName}>{t('search.caseSensitive')}</span>
                        {searchCS && <span className={css.pickerItemCheck}><CheckIcon /></span>}
                      </button>
                      <button
                        type="button"
                        className={css.pickerItem + (searchRegex ? ' ' + css.pickerItemActive : '')}
                        onClick={() => { toggleSearchRegex() }}
                      >
                        <span className={css.pickerItemName}>{t('search.regex')}</span>
                        {searchRegex && <span className={css.pickerItemCheck}><CheckIcon /></span>}
                      </button>
                    </div>
                  )}
                </span>
              )}
              <SearchIcon />
              <input
                ref={searchInputRef}
                className={css.searchInput}
                value={searchDraft}
                onChange={event => { setSearchDraft(event.target.value) }}
                onKeyDown={event => { if (event.key === 'Escape') setSearchDraft('') }}
                placeholder={viewTab === 'changes'
                  ? (searchScope === 'path' ? t('search.placeholderPath') : searchScope === 'content' ? t('search.placeholderContent') : t('search.placeholder'))
                  : t('graph.search')}
                spellCheck={false}
              />
              {viewTab === 'changes' && searchScope !== 'path' && search !== '' && (
                <span className={css.searchMeta}>{searchMatches === null ? '\u2026' : t('search.files', { count: searchMatches.size })}</span>
              )}
              {viewTab === 'changes' && searchCS && <span className={css.searchFlag} title={t('search.caseSensitive')}>{t('search.flagCS')}</span>}
              {viewTab === 'changes' && searchRegex && <span className={css.searchFlag} title={t('search.regex')}>{t('search.flagRegex')}</span>}
            </label>
          </span>
          <button
            type="button"
            className={css.iconBtn + (status.kind === 'loading' ? ' ' + css.iconBtnSpinning : '')}
            onClick={refresh}
            title={t('refresh')}
            aria-label={t('refresh')}
          >
            <RefreshIcon />
          </button>
          <button
            type="button"
            className={css.iconBtn}
            disabled={useInput === undefined || inputActions === undefined}
            title={t('comment.draftsTitle')}
            aria-label={t('comment.draftsTitle')}
            ref={draftBtnRef}
            aria-expanded={draftOpen}
            onClick={() => { setDraftOpen(value => !value) }}
          >
            <CommentIcon />
            {draftList.length > 0 && <span className={css.iconBtnBadge}>{draftList.length > 9 ? '9+' : String(draftList.length)}</span>}
          </button>
          <button
            type="button"
            className={css.iconBtn}
            title={t('guide.reopen')}
            aria-label={t('guide.reopen')}
            onClick={reopenGuide}
          >
            <span aria-hidden="true">{'?'}</span>
          </button>
          <button
            type="button"
            className={css.commitToggle}
            disabled={data === null || running}
            title={running ? t('commit.running') : t('commit.title') + ' \u00b7 ' + t('commit.commitHint')}
            ref={commitBtnRef}
            onClick={() => { setCommitOpen(value => !value); setArmed(null); setAmend(false) }}
          >
            <CommitIcon />
            <span>{t('commit.title')}</span>
          </button>
        </div>
      {draftOpen && useInput !== undefined && inputActions !== undefined && (
        <DraftPopover
          items={draftList}
          useInput={useInput}
          inputActions={inputActions}
          popRef={draftPopRef}
          onRemove={index => {
            draftBox?.remove(index)
            setDraftList(draftBox?.list() ?? [])
          }}
          onClear={() => {
            draftBox?.clear()
            setDraftList([])
          }}
          onClose={() => { setDraftOpen(false) }}
          t={t}
        />
      )}
      {commitOpen && data !== null && (
        <div className={css.commitPop} ref={commitPopRef}>
          <textarea
            className={css.commitInput}
            value={commitMessage}
            onChange={event => { setCommitMessage(event.target.value) }}
            onKeyDown={event => {
              if (event.key === 'Escape') setCommitOpen(false)
              // The Ctrl/Cmd+Enter submit: the message is typed, the intent
              // is explicit — commit (never push) without the arm step.
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)
                && commitMessage.trim() !== '' && !running && writeState.kind !== 'busy') {
                void executeWrite('commit')
              }
            }}
            placeholder={t('commit.message')}
            rows={3}
            autoFocus
          />
          <label className={css.commitCheck}>
            <input type="checkbox" checked={stageAll} onChange={event => { setStageAll(event.target.checked) }} />
            <span>{t('commit.stageAll')}</span>
          </label>
          <label className={css.commitCheck}>
            <input type="checkbox" checked={amend} onChange={event => { toggleAmend(event.target.checked) }} />
            <span>{t('commit.amend')}</span>
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
        <div className={css.branchPop} ref={branchPopRef}>
          <div className={css.branchFetchRow}>
            <button
              type="button"
              className={css.commitBtn}
              disabled={branchBusy || running}
              title={t('branch.pull')}
              onClick={() => { void executePull(false) }}
            >
              {t('branch.pull')}
            </button>
            <button
              type="button"
              className={css.commitBtn}
              disabled={branchBusy || running}
              title={t('branch.fetch')}
              onClick={() => { void executeFetch() }}
            >
              {t('branch.fetch')}
            </button>
          </div>
          <div className={css.branchCreateRow}>
            <input
              className={css.branchNameInput}
              value={branchName}
              onChange={event => { setBranchName(event.target.value) }}
              onKeyDown={event => { if (event.key === 'Escape') setBranchOpen(false) }}
              placeholder={t('branch.newName')}
              spellCheck={false}
            />
            <RefPicker
              value={branchStart === '' ? null : branchStart}
              headLabel={data.branch ?? 'HEAD'}
              refs={refs}
              commits={pickerCommits}
              placeholder={t('branch.fromHead')}
              onPick={value => { setBranchStart(value ?? '') }}
              onOpen={wantPickerFeed}
              t={t}
            />
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
                    title={t('branch.merge')}
                    disabled={isCurrent || branchBusy || running}
                    onClick={() => { void executeMerge(ref.name, false) }}
                  >
                    {'\u21e5'}
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
                    <span className={css.branchNameBtn} title={ref.name}>{ref.name}</span>
                    <button
                      type="button"
                      className={css.branchIconBtn}
                      disabled={branchBusy || running}
                      title={t('branch.trackHint')}
                      onClick={() => { void executeTrack(ref.name) }}
                    >
                      {t('branch.track')}
                    </button>
                  </div>
                ))}
              </details>
            )}
            <div className={css.branchGroupLabel}>{t('tag.title')}</div>
            <div className={css.branchCreateRow}>
              <input
                className={css.branchNameInput}
                value={tagName}
                onChange={event => { setTagName(event.target.value) }}
                onKeyDown={event => { if (event.key === 'Escape') setBranchOpen(false) }}
                placeholder={t('tag.newName')}
                spellCheck={false}
              />
              <RefPicker
                value={tagTarget === '' ? null : tagTarget}
                headLabel={data.branch ?? 'HEAD'}
                refs={refs}
                commits={pickerCommits}
                placeholder={t('tag.fromTarget')}
                onPick={value => { setTagTarget(value ?? '') }}
              onOpen={wantPickerFeed}
                t={t}
              />
              <button
                type="button"
                className={css.commitBtn}
                disabled={tagName.trim() === '' || branchBusy || running}
                onClick={() => { void executeTag('create', { name: tagName.trim(), target: tagTarget === '' ? undefined : tagTarget }) }}
              >
                {t('tag.create')}
              </button>
            </div>
            <div className={css.branchListScroll}>
              {(refs ?? []).filter(ref => ref.kind === 'tag').length === 0
                ? <div className={css.draftEmpty}>{t('tag.empty')}</div>
                : (refs ?? []).filter(ref => ref.kind === 'tag').map(ref => (
                  <div key={ref.name} className={css.branchRow}>
                    <span className={css.branchNameBtn} title={ref.name}>{ref.name}</span>
                    <button
                      type="button"
                      className={css.branchIconBtn}
                      disabled={branchBusy || running}
                      title={t('tag.push')}
                      onClick={() => { void executeTag('push', { name: ref.name }) }}
                    >
                      {t('tag.push')}
                    </button>
                    {tagDeleteArmed === ref.name
                      ? (
                        <button
                          type="button"
                          className={css.branchIconBtn + ' ' + css.branchDanger}
                          disabled={branchBusy || running}
                          title={t('tag.confirmDelete')}
                          onClick={() => { void executeTag('delete', { name: ref.name }) }}
                        >
                          {t('tag.confirmDelete')}
                        </button>
                        )
                      : (
                        <button
                          type="button"
                          className={css.branchIconBtn + ' ' + css.branchDanger}
                          disabled={branchBusy || running}
                          title={t('tag.delete')}
                          onClick={() => { setTagDeleteArmed(ref.name) }}
                        >
                          {'\u2715'}
                        </button>
                        )}
                  </div>
                ))}
            </div>
          </div>
          <div className={css.stashSection}>
            <button
              type="button"
              className={css.stashToggle}
              onClick={() => { setStashOpen(value => !value); if (!stashOpen) loadStashes() }}
            >
              <ChevronIcon size={10} rotated={stashOpen} />
              <span>{t('stash.title')}</span>
            </button>
            <button
              type="button"
              className={css.commitBtn}
              disabled={branchBusy || running}
              title={t('stash.push')}
              onClick={() => { void runStash('push') }}
            >
              {t('stash.push')}
            </button>
            <label className={css.commitCheck}>
              <input type="checkbox" checked={stashIncludeUntracked} onChange={event => { setStashIncludeUntracked(event.target.checked) }} />
              <span>{t('stash.includeUntracked')}</span>
            </label>
          </div>
          {stashOpen && (
            <div className={css.stashList}>
              {(stashList ?? []).length === 0 ? (
                <div className={css.draftEmpty}>{t('stash.empty')}</div>
              ) : (
                (stashList ?? []).map(entry => (
                  <div key={entry.index} className={css.stashRow}>
                    <div className={css.stashRowText}>
                      <span className={css.draftRowPath}>{'stash@{' + String(entry.index) + '}'}</span>
                      <span className={css.draftRowBody}>{entry.subject}</span>
                    </div>
                    {stashArmed === entry.index ? (
                      <>
                        <button
                          type="button"
                          className={css.branchIconBtn + ' ' + css.branchDanger}
                          disabled={branchBusy || running}
                          onClick={() => { void runStash('drop', entry.index) }}
                        >
                          {t('stash.confirmDrop')}
                        </button>
                        <button type="button" className={css.branchIconBtn} onClick={() => { setStashArmed(null) }}>
                          {'\u2715'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={css.branchIconBtn}
                          disabled={branchBusy || running}
                          onClick={() => { void runStash('apply', entry.index) }}
                        >
                          {t('stash.apply')}
                        </button>
                        <button
                          type="button"
                          className={css.branchIconBtn}
                          disabled={branchBusy || running}
                          onClick={() => { void runStash('pop', entry.index) }}
                        >
                          {t('stash.pop')}
                        </button>
                        <button
                          type="button"
                          className={css.branchIconBtn + ' ' + css.branchDanger}
                          disabled={branchBusy || running}
                          title={t('stash.drop')}
                          onClick={() => { setStashArmed(entry.index) }}
                        >
                          {'\u2715'}
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          {branchBusy && <div className={css.commitNote}>{t('branch.busy')}</div>}
          {branchResult !== null && (
            <div className={css.commitNote + (branchResult.ok ? '' : ' ' + css.errorText)}>{branchResult.text}</div>
          )}
        </div>
      )}
      </header>
      {!guideSeen && (
        <div className={css.guideBubble} role="status">
          <div className={css.guideTitle}>{t('guide.title')}</div>
          <ul className={css.guideList}>
            <li>{t('guide.step1')}</li>
            <li>{t('guide.step2')}</li>
            <li>{t('guide.step3')}</li>
          </ul>
          <button type="button" className={css.commitBtn} onClick={dismissGuide}>
            {t('guide.dismiss')}
          </button>
        </div>
      )}
      {inProgress !== null && (
        <div className={css.conflictBar} data-git-review-conflict="">
          <span className={css.conflictText}>
            {t('conflict.inProgress', { kind: t(('conflict.kind.' + inProgress) as ReviewKey), count: conflictCount })}
          </span>
          <button type="button" className={css.commitBtn} disabled={branchBusy || running} onClick={() => { void conflictFinish('continue') }}>
            {t('conflict.continue', { kind: t(('conflict.kind.' + inProgress) as ReviewKey) })}
          </button>
          {conflictAbortArmed ? (
            <>
              <button type="button" className={css.commitBtn + ' ' + css.branchDanger} disabled={branchBusy || running} onClick={() => { void conflictFinish('abort') }}>
                {t('conflict.abortConfirm')}
              </button>
              <button type="button" className={css.commitBtn} onClick={() => { setConflictAbortArmed(false) }}>
                {t('menu.cancel')}
              </button>
            </>
          ) : (
            <button type="button" className={css.commitBtn + ' ' + css.branchDanger} disabled={branchBusy || running} onClick={() => { setConflictAbortArmed(true) }}>
              {t('conflict.abort', { kind: t(('conflict.kind.' + inProgress) as ReviewKey) })}
            </button>
          )}
        </div>
      )}
      {commitMenu !== null && (
        <CommitMenu
          state={commitMenu}
          running={running}
          onClose={() => { setCommitMenu(null) }}
          run={runHistory}
          t={t}
        />
      )}
      {fileMenu !== null && (
        <FileMenu
          key={fileMenu.path + '@' + fileMenu.x + ':' + fileMenu.y}
          state={fileMenu}
          apps={openApps}
          // Graph-mode rows are historical files, not worktree files: no
          // rename/delete/stage there (they would act on the worktree copy).
          writable={!running}
          refsMode={refsMode || viewTab === 'graph'}
          useInput={useInput}
          inputActions={inputActions}
          onClose={() => { setFileMenu(null) }}
          openApp={openFileApp}
          copyPath={copyFilePath}
          copyName={copyFileName}
          rename={renameFile}
          remove={removeFile}
          gitAction={!refsMode && viewTab === 'changes' ? runGitAction : undefined}
          conflictResolve={runConflictResolve}
          openInPlugin={openCommitFileInPlugin}
          t={t}
        />
      )}
      {historyState.kind === 'open' && (
        // Fixed-position card (the graph hover-card pattern): the diff pane's
        // scroll container would clip an absolute popover.
        <div
          ref={historyPopRef}
          className={css.historyPop}
          style={{ top: historyState.y, left: Math.max(8, historyState.x - 340) }}
          onClick={event => { event.stopPropagation() }}
          onKeyDown={event => { if (event.key === 'Escape') setHistoryState({ kind: 'closed' }) }}
        >
          <div className={css.pickerGroupLabel}>{t('history.title')}</div>
          <div className={css.historyScroll}>
            {historyState.commits.length === 0 && <div className={css.pickerEmpty}>{t('history.empty')}</div>}
            {historyState.commits.map(commit => {
              const known = logState.kind === 'ready' && logState.commits.some(item => item.hash === commit.hash)
              return (
                <button key={commit.hash} type="button" className={css.pickerItem} title={known ? t('history.jumpHint') : t('history.unknownHint')} onClick={() => { jumpToCommit(commit.hash) }}>
                  <span className={css.pickerItemName}>{commit.subject}</span>
                  <span className={css.pickerItemMeta}>{commit.hash.slice(0, 7) + ' \u00b7 ' + fmtGraphDate(commit.timestamp)}</span>
                </button>
              )
            })}
            {historyState.truncated && <div className={css.pickerEmpty}>{t('history.truncated')}</div>}
          </div>
        </div>
      )}
      <div className={css.body}>
        {data?.truncated === true && viewTab === 'changes' && <div className={css.noticeRow}>{t('status.truncated')}</div>}
        {refsMode && rangeReady && viewTab === 'changes' && data !== null && data.files.length === 0 && data.totals.added === 0 && data.totals.deleted === 0 && (
          <div className={css.noticeRow}>
            <span>{t('compare.emptyDirection')}</span>
            {' '}
            <button type="button" className={css.scopeBtn} title={t('compare.swap')} onClick={swapEnds}>{t('compare.swap')}</button>
          </div>
        )}
        {viewTab === 'graph' ? (
          <>
            <section
              ref={graphListRef as React.Ref<HTMLElement>}
              className={css.graphList + (graphListCollapsed ? ' ' + css.graphListNarrow : '')}
              style={!graphListCollapsed && graphListWidth !== null ? { width: graphListWidth, minWidth: graphListWidth } : undefined}
              data-git-review-graph=""
            >
              <div className={css.graphToggleRow}>
                <button
                  type="button"
                  className={css.graphToggle}
                  title={graphListCollapsed ? t('graph.expandList') : t('graph.collapseList')}
                  onClick={toggleGraphList}
                >
                  {graphListCollapsed ? '\u25b8' : '\u25c2'}
                </button>
              </div>
              {logState.kind === 'loading' && <div className={css.paneNotice}>{t('graph.loading')}</div>}
              {logState.kind === 'failed' && <div className={css.paneNotice + ' ' + css.errorText}>{logState.message}</div>}
              {logState.kind === 'ready' && graphCommits.length === 0 && (
                <div className={css.paneNotice}>{t('graph.empty')}</div>
              )}
              {logState.kind === 'ready' && graphCommits.length > 0 && (
                <>
                  {logState.truncated && (
                    <button type="button" className={css.gapBar} disabled={graphLoadingMore} onClick={loadGraphMore}>
                      {graphLoadingMore ? t('graph.loading') : t('graph.loadMore', { count: graphCommits.length })}
                    </button>
                  )}
                  {visibleGraph.length === 0
                    ? <div className={css.paneNotice}>{t('graph.noMatches')}</div>
                    : (
                      <CommitGraph
                        commits={visibleGraph.map(row => row.commit)}
                        lanes={visibleGraph.map(row => row.lane)}
                        selected={selectedCommit}
                        onSelect={selectCommit}
                        collapsed={graphListCollapsed}
                        density={graphDensity as 0 | 1 | 2 | 3 | 4}
                        worktree={refsMode === false && ready !== null && ready.files.length > 0 ? { files: ready.files.length } : null}
                        worktreeSelected={graphWorktree}
                        onSelectWorktree={selectGraphWorktree}
                        onCommitMenu={(hash, subject, x, y) => { setCommitMenu({ hash, subject, x, y }) }}
                        t={t}
                      />
                    )}
                </>
              )}
            </section>
            {!graphListCollapsed && (
              <div
                className={css.graphResizeHandle}
                role="separator"
                aria-orientation="vertical"
                aria-label={t('graph.resizeHint')}
                aria-valuemin={180}
                aria-valuemax={900}
                aria-valuenow={graphListWidth === null ? undefined : graphListWidth}
                tabIndex={0}
                title={t('graph.resizeHint')}
                onMouseDown={startGraphResize}
                onDoubleClick={resetGraphWidth}
                onKeyDown={onGraphResizeKey}
              />
            )}
            <main className={css.mainPane}>
              {graphWorktree ? (
                <div className={css.commitDetail} data-git-review-diff="">
                  <div className={css.commitInfo}>
                    <div className={css.commitInfoTop}>
                      <span className={css.commitInfoLabel}>{t('graph.col.subject')}</span>
                      <div className={css.commitInfoSubjectArea}>
                        <span className={css.commitInfoSubject}>{t('graph.worktree', { count: ready?.files.length ?? 0 })}</span>
                        {ready !== null && (
                          <span className={css.totals}>
                            <span className={css.totalAdded}>{'+' + fmtCount(ready.totals.added)}</span>
                            <span className={css.totalDeleted}>{'−' + fmtCount(ready.totals.deleted)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={css.commitSplit}>
                    <div className={css.commitTreePanel} data-git-review-tree="">
                      {ready === null || ready.files.length === 0
                        ? <div className={css.paneNotice}>{t('tree.noChanges')}</div>
                        : (
                          <TreePanel
                            files={ready.files}
                            selected={graphWorktreeFile}
                            onSelect={setGraphWorktreeFile}
                            filter=""
                            onFilterChange={() => { /* no filter in this pane yet */ }}
                            collapsed={graphCollapsed}
                            onToggleDir={toggleGraphDir}
                            mode="changes"
                            onModeChange={() => { /* pinned */ }}
                            showModeRow={false}
                            showFilter={false}
                            listFailed={false}
                            onFileMenu={(path, x, y) => { setFileMenu({ path, x, y }) }}
                            t={t}
                          />
                        )}
                    </div>
                    <div className={css.commitDiffArea}>
                      {graphWorktreeFile !== null && diff.kind !== 'idle' && (
                        <DiffPane
                          file={ready?.files.find(item => item.path === graphWorktreeFile) ?? { path: graphWorktreeFile, x: '?', y: '?', added: 0, deleted: 0, binary: false, untracked: false }}
                          diff={diff.kind === 'text' ? diff.diff : diff.kind === 'content' ? '' : ''}
                          truncated={diff.kind === 'text' && diff.truncated}
                          loading={diff.kind === 'loading'}
                          binary={diff.kind === 'binary'}
                          size={diff.kind === 'binary' || diff.kind === 'content' ? diff.size : 0}
                          full={diffFull}
                          onToggleFull={() => { setDiffFull(value => !value) }}
                          scope={diffScope}
                          onScopeChange={setDiffScope}
                          view={effectiveView}
                          onViewChange={changeViewMode}
                          showViewSwitch
                          wsIgnore={wsIgnore}
                          syntaxHighlight={syntaxHighlight}
                          onToggleWs={toggleWsIgnore}
                          search={searchSpec}
                          baseActive={false}
                          useInput={useInput}
                          inputActions={inputActions}
                          onDraftAdd={addDraft}
                          t={t}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : selectedCommit === null || commitInfo === null ? (
                <div className={css.emptyState}>
                  <div className={css.emptyTitle}>{t('graph.selectCommit')}</div>
                  <div className={css.emptyHint}>{t('graph.selectHint')}</div>
                  {blameReturn !== null && (
                    <button
                      type="button"
                      className={css.toolBtn}
                      title={t('blame.backToFile') + ': ' + blameReturn.path + ':' + blameReturn.line}
                      onClick={backToBlameFile}
                    >
                      {'← ' + t('blame.backToFile')}
                    </button>
                  )}
                </div>
              ) : (
                <div className={css.commitDetail} data-git-review-diff="">
                  <div className={css.commitInfo}>
                    <div className={css.commitInfoTop}>
                      <button
                        type="button"
                        className={css.infoToggle}
                        aria-expanded={infoOpenHash === commitInfo.hash}
                        title={infoOpenHash === commitInfo.hash ? t('graph.detailCollapse') : t('graph.detailExpand')}
                        aria-label={infoOpenHash === commitInfo.hash ? t('graph.detailCollapse') : t('graph.detailExpand')}
                        onClick={() => { setInfoOpenHash(current => (current === commitInfo.hash ? null : commitInfo.hash)) }}
                      >
                        <span className={css.infoToggleIcon + (infoOpenHash === commitInfo.hash ? ' ' + css.infoToggleOpen : '')}>
                          <ChevronIcon size={12} />
                        </span>
                      </button>
                      <span className={css.commitInfoLabel}>{t('graph.col.subject')}</span>
                      <div className={css.commitInfoSubjectArea}>
                        <span className={css.commitInfoSubject}>{commitInfo.subject}</span>
                        {commitInfo.refs.map(ref => (
                          <span
                            key={ref.kind + ':' + ref.name}
                            className={ref.name === 'HEAD' ? css.refBadgeHeadState : ref.kind === 'head' ? css.refBadgeHead : ref.kind === 'tag' ? css.refBadgeTag : css.refBadgeOther}
                          >
                            {ref.name}
                          </span>
                        ))}
                      </div>
                      {commitTotals !== null && commitFiles !== null && (
                        <span className={css.commitStats}>
                          <span className={css.totalAdded}>{'+' + fmtCount(commitTotals.added)}</span>
                          <span className={css.totalDeleted}>{'\u2212' + fmtCount(commitTotals.deleted)}</span>
                          <span className={css.fileCount}>{'\u00b7 ' + t('graph.filesCount', { count: commitFiles.length })}</span>
                        </span>
                      )}
                    </div>
                    {infoOpenHash === commitInfo.hash && commitInfo.body !== '' && (
                      <div className={css.commitBody}>{commitInfo.body}</div>
                    )}
                    <div className={css.commitActions}>
                      {blameReturn !== null && (
                        <button
                          type="button"
                          className={css.toolBtn}
                          title={t('blame.backToFile') + ': ' + blameReturn.path + ':' + blameReturn.line}
                          onClick={backToBlameFile}
                        >
                          {'← ' + t('blame.backToFile')}
                        </button>
                      )}
                      <button
                        type="button"
                        className={css.toolBtn}
                        disabled={running}
                        title={t('history.reset')}
                        onClick={event => {
                          const r = (event.currentTarget as HTMLElement).getBoundingClientRect()
                          setCommitMenu({ hash: commitInfo.hash, subject: commitInfo.subject, x: r.left, y: r.bottom })
                        }}
                      >
                        {t('history.reset')}
                      </button>
                      <button type="button" className={css.toolBtn} disabled={running} title={t('history.revert')} onClick={() => { void runHistory('revert', commitInfo.hash) }}>
                        {t('history.revert')}
                      </button>
                      <button type="button" className={css.toolBtn} disabled={running} title={t('history.cherryPick')} onClick={() => { void runHistory('cherry-pick', commitInfo.hash) }}>
                        {t('history.cherryPick')}
                      </button>
                    </div>
                    {infoOpenHash === commitInfo.hash && (
                      <div className={css.commitInfoGrid}>
                        <span className={css.commitInfoLabel}>{t('graph.col.commit')}</span>
                        <button
                          type="button"
                          className={css.commitHashBtn}
                          title={copiedHash ? t('graph.copied') : t('graph.copyHash')}
                          onClick={copyCommitHash}
                        >
                          {commitInfo.hash}
                        </button>
                        <span className={css.commitInfoLabel}>{t('graph.field.author')}</span>
                        <span>{commitInfo.authorName}</span>
                        <span className={css.commitInfoLabel}>{t('graph.col.date')}</span>
                        <span>{fmtGraphDate(commitInfo.timestamp)}</span>
                        <span className={css.commitInfoLabel}>{t('graph.parent')}</span>
                        <span>{commitInfo.parents.length === 0 ? '\u2014' : commitInfo.parents.map(parent => parent.slice(0, 7)).join(', ')}</span>
                      </div>
                    )}
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
                              filter={commitFilesFilter}
                              onFilterChange={setCommitFilesFilter}
                              collapsed={graphCollapsed}
                              onToggleDir={toggleGraphDir}
                              mode="changes"
                              onModeChange={() => { /* pinned in graph view */ }}
                              showModeRow={false}
                              listFailed={false}
                              onFileMenu={(path, x, y) => { setFileMenu({ path, x, y, from: 'commit' }) }}
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
                          // 'file' belongs to the worktree pane only; the
                          // commit diff falls back to side-by-side.
                          view={viewMode}
                          onViewChange={changeViewMode}
                          showViewSwitch
                          allowFileView={false}
                          wsIgnore={wsIgnore}
                          syntaxHighlight={syntaxHighlight}
                          onToggleWs={toggleWsIgnore}
                          search={searchSpec}
                          baseActive
                          useInput={useInput}
                          inputActions={inputActions}
                          onDraftAdd={addDraft}
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
                {pluginOpenReturn !== null && selected !== null && selectedFile === null && (
                  <div className={css.emptyHint}>{t('graph.notInWorkspace')}</div>
                )}
              </div>
            )
            : diff.kind === 'failed'
              ? <div className={css.paneNotice + ' ' + css.errorText}>{diff.message}</div>
              : effectiveView === 'file'
                ? (showPreview && previewKind !== null
                  ? (
                    <PreviewPane
                      file={selectedFile}
                      kind={previewKind}
                      text={previewKind === 'markdown' ? mdText : (diff.kind === 'content' ? diff.content : '')}
                      textLoading={diff.kind === 'loading'}
                      textTruncated={previewKind === 'markdown' && diff.kind === 'content' && diff.truncated}
                      dataUrl={previewDataUrl}
                      bytesFailed={previewBytesFailed}
                      bytesTruncated={previewBytes.kind === 'ready' && previewBytes.truncated}
                      onShowSource={() => { setPreviewSource(true) }}
                      t={t}
                    />
                  )
                  : (
                    <FilePane
                      file={selectedFile}
                      content={diff.kind === 'content' ? diff.content : ''}
                      truncated={diff.kind === 'content' && diff.truncated}
                      binary={diff.kind === 'binary'}
                      size={diff.kind === 'binary' || diff.kind === 'content' ? diff.size : 0}
                      loading={diff.kind === 'loading'}
                      canShowDiff={selectedFile.unchanged !== true}
                      view={effectiveView}
                      onViewChange={changeViewMode}
                      syntaxHighlight={syntaxHighlight}
                      search={searchSpec}
                      blameOn={blameOn}
                      onToggleBlame={() => { setBlameOn(value => !value) }}
                      blameState={blameState}
                      onBlameJump={jumpFromBlame}
                      focusLine={blameFocus !== null && blameFocus.path === selected ? blameFocus.line : null}
                      previewAvailable={previewAvailable}
                      onShowPreview={() => { setPreviewSource(false) }}
                      t={t}
                    />
                  )
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
                          onViewChange={changeViewMode}
                          showViewSwitch
                          wsIgnore={wsIgnore}
                          syntaxHighlight={syntaxHighlight}
                          onToggleWs={toggleWsIgnore}
                          search={searchSpec}
                          baseActive={baseRef !== null || refsMode}
                    hunkOps={!refsMode && baseRef === null && !running && selectedFile.untracked !== true
                      ? (diffScope === 'staged' ? 'unstage' : diffScope === 'unstaged' ? 'stage-revert' : undefined)
                      : undefined}
                    onHunkOp={(action, hi) => { void executeHunkOp(action, hi, selectedFile.path, diff.kind === 'text' ? diff.diff : '') }}
                    hunkBusy={hunkBusy}
                    onFileHistory={openFileHistory}
                    historyLoading={historyState.kind === 'loading'}
                    hunkNotice={hunkNotice}
                    useInput={useInput}
                    inputActions={inputActions}
                    onDraftAdd={addDraft}
                    t={t}
                  />
                )}
        </main>
        {data !== null && (
          <>
            <span
              className={css.treeDivider}
              role="separator"
              aria-orientation="vertical"
              aria-label={t('tree.resizeHint')}
              aria-valuemin={200}
              aria-valuemax={460}
              aria-valuenow={treeWidth === null ? undefined : treeWidth}
              tabIndex={0}
              title={t('tree.resizeHint')}
              onMouseDown={startTreeResize}
              onDoubleClick={() => { setTreeWidth(null); try { localStorage.removeItem('dsh-git-review.treeWidth') } catch { /* ignore */ } }}
              onKeyDown={onTreeResizeKey}
            />
            <TreePanel
              width={treeWidth ?? undefined}
              files={allRows ?? data.files}
              selected={selected}
              onSelect={selectFile}
              filter={searchScope === 'path' ? search : ''}
            onFilterChange={() => { /* the toolbar search drives the tree filter in path mode */ }}
            collapsed={collapsed}
            onToggleDir={toggleDir}
            mode={treeMode}
            onModeChange={changeTreeMode}
            showModeRow={!refsMode}
            showFilter={false}
            listFailed={allFilesFailed}
            matchCounts={searchMatches ?? undefined}
            viewedHas={refsMode ? undefined : viewedHas}
            onToggleViewed={refsMode ? undefined : toggleViewed}
            pendingCount={pendingCount}
            onFileMenu={(path, x, y, file) => {
              setFileMenu({
                path, x, y,
                git: {
                  staged: !file.untracked && file.x !== ' ',
                  unstaged: file.y !== ' ',
                  untracked: file.untracked,
                  conflicted: isUnmerged(file.x, file.y),
                },
              })
            }}
            t={t}
            />
            </>
          )}
            </>
          )}
      </div>
    </div>
  )
}

/** Non-repository workspace: file browsing + preview with git disabled,
 *  plus a confirm-gated `git init` that hands back to the review tab. */
function NotRepoView({ cwd, root, t, onDidInit }: { cwd: string; root: string; t: T; onDidInit: () => void }) {
  const [dir, setDir] = useState('.')
  const [entries, setEntries] = useState<GitFsEntry[] | null>(null)
  const [listFailed, setListFailed] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState<DiffState>({ kind: 'idle' })
  const [initArmed, setInitArmed] = useState(false)
  const [initBusy, setInitBusy] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  /** Preview bytes for raster images and PDFs (markdown stays source-only here). */
  const [previewBytes, setPreviewBytes] = useState<PreviewBytesState>({ kind: 'idle' })
  const [previewSource, setPreviewSource] = useState(false)
  useEffect(() => {
    let alive = true
    setEntries(null)
    setListFailed(false)
    setSelected(null)
    setContent({ kind: 'idle' })
    void hostCall<GitFsListPayload>('fs-list', { cwd, path: dir }).then(payload => {
      if (!alive) return
      if (payload === null || !payload.ok) { setEntries([]); setListFailed(true); return }
      setEntries(payload.entries)
    })
    return () => { alive = false }
  }, [cwd, dir])
  useEffect(() => {
    if (selected === null) { setContent({ kind: 'idle' }); return }
    let alive = true
    setContent({ kind: 'loading' })
    void hostCall<GitFileContentPayload & { error?: string }>('file-content', { cwd, path: selected }).then(payload => {
      if (!alive) return
      if (payload === null || !payload.ok) { setContent({ kind: 'failed', message: (payload as { error?: string } | null)?.error ?? 'unknown error' }); return }
      setContent(payload.binary ? { kind: 'binary', size: payload.size } : { kind: 'content', content: payload.content, truncated: payload.truncated, size: payload.size })
    })
    return () => { alive = false }
  }, [cwd, selected])
  const nrKind = selected !== null ? previewKindForPath(selected) : null
  const nrSvg = selected !== null && selected.toLowerCase().endsWith('.svg')
  /** Previewable without the changes view (markdown stays source-only: its
   *  asset inliner needs the worktree diff pipeline). */
  const nrPreviewKind = nrKind === 'image' || nrKind === 'pdf' || nrKind === 'html' ? nrKind : null
  useEffect(() => {
    setPreviewSource(false)
    if (selected === null) { setPreviewBytes({ kind: 'idle' }); return }
    const kind = previewKindForPath(selected)
    if (kind !== 'image' && kind !== 'pdf') { setPreviewBytes({ kind: 'idle' }); return }
    if (kind === 'image' && selected.toLowerCase().endsWith('.svg')) { setPreviewBytes({ kind: 'idle' }); return }
    let alive = true
    setPreviewBytes({ kind: 'loading' })
    void loadPreviewBytes(cwd, selected).then(next => { if (alive) setPreviewBytes(next) })
    return () => { alive = false }
  }, [cwd, selected])
  const segments = dir === '.' ? [] : dir.split('/')
  const goUp = (): void => {
    if (segments.length === 0) return
    setDir(segments.slice(0, -1).join('/') || '.')
  }
  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])
  const init = (): void => {
    if (!initArmed) { setInitArmed(true); return }
    setInitBusy(true)
    setInitError(null)
    void hostCall<GitWritePayload>('git-init', { cwd, confirm: true }).then(payload => {
      if (!mountedRef.current) return
      setInitBusy(false)
      if (payload === null || !payload.ok) { setInitError(payload === null ? t('state.hostUnavailable') : (payload.error ?? t('state.error'))); return }
      setInitArmed(false)
      onDidInit()
    })
  }
  const syntheticFile: ChangedFile | null = selected !== null ? { path: selected, x: '?', y: '?', added: 0, deleted: 0, binary: content.kind === 'binary', untracked: true } : null
  return (
    <div className={css.root} data-conversation-composer-overlay="">
      <header className={css.toolbar} data-git-review-toolbar="">
        <div className={css.toolbarRow}>
          <span className={css.emptyTitle} style={{ fontSize: 14 }}>{t('state.notRepo.title')}</span>
          <span className={css.tbDivider} aria-hidden="true" />
          <span style={{ fontSize: 12, opacity: 0.75 }}>{t('state.notRepo.gitDisabled')}</span>
          <span style={{ flex: 1 }} />
          <button type="button" className={css.toolBtn} disabled={initBusy} onClick={init} title={t('state.notRepo.initHint')}>
            <span>{initArmed ? t('state.notRepo.confirmInit') : t('state.notRepo.init')}</span>
          </button>
          {initArmed && (
            <button type="button" className={css.toolBtn} disabled={initBusy} onClick={() => { setInitArmed(false); setInitError(null) }}>
              <span>{t('menu.cancel')}</span>
            </button>
          )}
        </div>
        {(initError !== null) && <div className={css.noticeRow + ' ' + css.noticeError}>{initError}</div>}
      </header>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ width: 280, maxWidth: '40%', borderRight: '1px solid var(--dsw-alias-border, #e5e5e5)', overflowY: 'auto', padding: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, opacity: 0.8 }}>
            <button type="button" className={css.toolBtn} disabled={segments.length === 0} onClick={goUp} title={t('state.notRepo.up')}>
              <span>{t('state.notRepo.up')}</span>
            </button>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={root + (dir === '.' ? '' : ' / ' + dir)}>
              {dir === '.' ? root : dir}
            </span>
          </div>
          {entries === null && <div className={css.paneNotice}>{t('state.notRepo.listLoading')}</div>}
          {entries !== null && listFailed && <div className={css.noticeRow + ' ' + css.noticeError}>{t('state.notRepo.listFailed')}</div>}
          {entries !== null && !listFailed && entries.length === 0 && <div className={css.paneNotice}>{t('state.notRepo.dirEmpty')}</div>}
          {entries !== null && !listFailed && entries.map(entry => (
            <button
              key={entry.path}
              type="button"
              onClick={() => { if (entry.kind === 'dir') setDir(entry.path); else setSelected(entry.path) }}
              onDoubleClick={() => { if (entry.kind === 'dir') setDir(entry.path) }}
              style={{ display: 'flex', width: '100%', textAlign: 'left', padding: '4px 6px', borderRadius: 6, background: selected === entry.path ? 'var(--dsw-alias-fill-selected, #e8eefc)' : 'transparent', border: 'none', cursor: 'pointer', fontSize: 13 }}
              title={entry.path}
            >
              <span style={{ marginRight: 6 }}>{entry.kind === 'dir' ? '📁' : '📄'}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
            </button>
          ))}
          {segments.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <button type="button" className={css.toolBtn} onClick={() => setDir('.')}><span>~</span></button>
              {segments.map((segment, index) => (
                <button key={segments.slice(0, index + 1).join('/')} type="button" className={css.toolBtn} onClick={() => setDir(segments.slice(0, index + 1).join('/'))}>
                  <span>{segment}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {selected === null && <div className={css.paneNotice}>{t('state.notRepo.hint') + ' ' + t('state.notRepo.initHint')}</div>}
          {selected !== null && content.kind === 'loading' && nrPreviewKind === null && <div className={css.paneNotice}>{t('file.loading')}</div>}
          {selected !== null && content.kind === 'failed' && <div className={css.noticeRow + ' ' + css.noticeError}>{content.message}</div>}
          {selected !== null && content.kind === 'binary' && (nrPreviewKind === null || nrKind === 'html' || nrSvg) && <div className={css.paneNotice}>{t('diff.binary')}</div>}
          {selected !== null && syntheticFile !== null && nrPreviewKind !== null && !previewSource && content.kind !== 'failed' && (
            nrPreviewKind === 'html' || nrSvg
              ? content.kind === 'content' ? (
                <PreviewPane
                  file={syntheticFile}
                  kind={nrPreviewKind}
                  text={content.content}
                  textLoading={false}
                  textTruncated={content.truncated}
                  dataUrl={nrSvg ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(content.content) : null}
                  bytesFailed={false}
                  bytesTruncated={false}
                  onShowSource={() => { setPreviewSource(true) }}
                  t={t}
                />
              ) : null
              : previewBytes.kind === 'ready' && !previewBytes.truncated &&
                (nrPreviewKind === 'pdf' ? previewBytes.mime === 'application/pdf' : previewBytes.mime.startsWith('image/')) ? (
                <PreviewPane
                  file={syntheticFile}
                  kind={nrPreviewKind}
                  text=""
                  textLoading={false}
                  dataUrl={'data:' + previewBytes.mime + ';base64,' + previewBytes.base64}
                  bytesFailed={false}
                  bytesTruncated={false}
                  onShowSource={() => { setPreviewSource(true) }}
                  t={t}
                />
              ) : previewBytes.kind === 'failed' || (previewBytes.kind === 'ready' && (previewBytes.truncated ||
                (nrPreviewKind === 'pdf' ? previewBytes.mime !== 'application/pdf' : !previewBytes.mime.startsWith('image/')))) ? (
                <div className={css.paneNotice}>{
                  previewBytes.kind === 'ready' && previewBytes.truncated ? t('preview.tooLarge') : t('preview.loadFailed')}</div>
              ) : content.kind === 'loading' || previewBytes.kind === 'loading' ? (
                <div className={css.paneNotice}>{t('preview.loading')}</div>
              ) : null
          )}
          {selected !== null && content.kind === 'content' && syntheticFile !== null && (nrPreviewKind === null || previewSource) && (
            <FilePane
              file={syntheticFile}
              search={{ query: '' }}
              content={content.content}
              truncated={content.truncated}
              binary={false}
              size={content.size}
              loading={false}
              canShowDiff={false}
              view="file"
              onViewChange={() => {}}
              syntaxHighlight
              blameOn={false}
              onToggleBlame={() => {}}
              blameState={{ kind: 'idle', lines: null, message: null }}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/** Full-surface state for the non-ready cases (degradation with guidance). */
function CenteredState({ status, t, onRetry }: { status: Exclude<StatusState, { kind: 'ready' } | { kind: 'loading' } | { kind: 'notRepo' }>; t: T; onRetry: () => void }) {
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

/**
 * The pending-comment popover: per-workspace drafts with remove controls and
 * one bulk send into the composer draft (reads the composer draft INSIDE this
 * tiny component, per the diff-pane comment editor's same rule). Sending
 * clears the box; the entries keep their original `path:line — text` shape.
 */
function DraftPopover({ items, useInput, inputActions, popRef, onRemove, onClear, onClose, t }: {
  items: readonly CommentDraft[]
  useInput: NonNullable<SessionStandardProps['useInput']>
  inputActions: NonNullable<SessionStandardProps['inputActions']>
  popRef: RefObject<HTMLDivElement>
  onRemove: (index: number) => void
  onClear: () => void
  onClose: () => void
  t: T
}) {
  const draft = useInput((s: InputState) => s.draft)
  const sendAll = (): void => {
    if (items.length === 0) return
    const block = items.map(entry => entry.path + ':' + entry.line + ' \u2014 ' + entry.text).join('\n\n')
    const current = draft.replace(/\s+$/, '')
    inputActions.setDraft(current === '' ? block : current + '\n\n' + block)
    onClear()
    onClose()
  }
  return (
    <div className={css.commitPop + ' ' + css.draftPop} ref={popRef}>
      <div className={css.draftHead}>
        <span>{t('comment.draftsTitle')}</span>
        {items.length > 0 && (
          <button type="button" className={css.draftClear} onClick={onClear}>{t('comment.clearDrafts')}</button>
        )}
      </div>
      {items.length === 0 ? (
        <div className={css.draftEmpty}>{t('comment.emptyDrafts')}</div>
      ) : (
        <div className={css.draftList}>
          {items.map((entry, index) => (
            <div key={entry.path + ':' + entry.line + ':' + index} className={css.draftRow}>
              <div className={css.draftRowText}>
                <span className={css.draftRowPath}>{entry.path + ':' + entry.line}</span>
                <span className={css.draftRowBody}>{entry.text}</span>
              </div>
              <button
                type="button"
                className={css.branchIconBtn + ' ' + css.branchDanger}
                title={t('comment.removeDraft')}
                aria-label={t('comment.removeDraft')}
                onClick={() => { onRemove(index) }}
              >
                {'\u2715'}
              </button>
            </div>
          ))}
        </div>
      )}
      <div className={css.commitActions}>
        <button
          type="button"
          className={css.commitBtn}
          disabled={items.length === 0}
          onClick={sendAll}
        >
          {t('comment.sendAll')}
        </button>
      </div>
    </div>
  )
}
