/**
 * The review tab's diff pane: one file's side-by-side diff. Rows render as a
 * four-column grid (old no, old text, new no, new text); a missing side
 * shows a hatched placeholder. Long unmodified runs between hunks collapse
 * into bars that expand the full context (a single re-fetch with a huge -U,
 * which makes git merge every hunk). Row rendering is capped so a paged-in
 * giant diff cannot take the tab down.
 */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { countMatchRows, countUnifiedMatches, makeSearchEngine, makeWordHighlighter, parseUnifiedDiff, rowHasMatch, unifyHunkRows, MAX_RENDER_ROWS, type DiffCell, type PairRow, type ParsedDiff, type SearchEngine, type SearchSpec, type WordHighlighter, type WordSpans } from './diff-parse.ts'
import { makeLineHighlighter, sliceTokens, type TokenSpan } from './highlight.ts'
import { renderMarkedText, searchParts } from './marked-text.tsx'
import { CommentIcon, ExpandIcon, CollapseIcon, HistoryIcon } from './icons.tsx'
import { FileTypeIcon } from './file-type-icon.tsx'
import { FileCounts } from './file-counts.tsx'
import { ViewSwitch, type FileViewMode } from './file-pane.tsx'
import { ImageDiffPane, type ImageCompareMode, type ImageEndState } from './image-diff-pane.tsx'
import type { CommentDraft } from './comment-drafts.ts'
import type { ChangedFile } from '../contract.ts'
import type { InputActions, InputState } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { PropsLocale, SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS, ReviewKey } from './locales.ts'
import css from './review.module.css'

type T = PropsLocale<typeof NS>['t']

export { MAX_RENDER_ROWS }

/** Which half of a file's changes the diff covers (mirrors the host param). */
export type DiffScope = 'all' | 'staged' | 'unstaged'

/** Picture-diff wiring, handed to the pane when the selected file is an
 *  image (image-sides.ts decides which end reads which byte source). */
export interface ImageDiffConfig {
  before: ImageEndState
  after: ImageEndState
  mode: ImageCompareMode
  onModeChange: (mode: ImageCompareMode) => void
  /** 'compare' draws the pictures, 'source' the textual diff/binary notice. */
  view: 'compare' | 'source'
  onViewChange: (view: 'compare' | 'source') => void
  /** End captions (a ref name, or the worktree/base wording). */
  beforeLabel: string
  afterLabel: string
}

/** Props of the diff pane. */
export interface DiffPaneProps {
  file: ChangedFile
  /** Raw unified diff text ('' while loading / for non-text states). */
  diff: string
  /** Transport-level truncation (the host cut the diff at its size cap). */
  truncated: boolean
  loading: boolean
  binary: boolean
  /** File size for the binary notice (0 when unknown). */
  size: number
  /** Whether the pane currently shows expanded (full) context. */
  full: boolean
  onToggleFull: () => void
  /** Active staged/unstaged scope (tracked files only). */
  scope: DiffScope
  onScopeChange: (next: DiffScope) => void
  /** Active main view ('split' or 'unified' here); the header hosts the switch. */
  view: FileViewMode
  onViewChange: (next: FileViewMode) => void
  /** False hides the layout switch entirely. */
  showViewSwitch?: boolean
  /** False drops the file option from the switch (a commit diff has no
   *  worktree copy to read); split/unified stay available. */
  allowFileView?: boolean
  /** Whether whitespace-only edits are hidden (host `--ignore-all-space`). */
  wsIgnore: boolean
  onToggleWs: () => void
  /** Whether diff lines get lightweight syntax coloring (the preference). */
  syntaxHighlight: boolean
  /** Active content search spec (query '' = none); highlights + navigation. */
  search: SearchSpec
  /** True while a base-branch override is active (scope chips are hidden). */
  baseActive: boolean
  /** Session input channels for inline comments (absent = feature hidden). */
  useInput: SnapshotSelectorHook<InputState> | undefined
  inputActions: InputActions | undefined
  /** Park a comment in the pending draft box (absent = draft entry hidden). */
  onDraftAdd: ((draft: CommentDraft) => void) | undefined
  /** Per-hunk operations the view offers: 'stage-revert' on the unstaged
   *  half, 'unstage' on the staged half; undefined hides the buttons
   *  (refs/commit diffs, 'all' scope, untracked and binary files). */
  hunkOps?: 'stage-revert' | 'unstage'
  /** Fire one hunk operation (the view cuts the patch and runs host
   *  `hunk-op`, then refreshes the diff). */
  onHunkOp?: (action: 'stage' | 'unstage' | 'revert', hunkIndex: number) => void
  /** True while a hunk op is in flight (buttons disable). */
  hunkBusy?: boolean
  /** Verbatim failure of the last hunk op (null/undefined hides the row). */
  hunkNotice?: string | null
  /** Open the per-file history popover at the button's screen position
   *  (absent hides the button — worktree semantics only). */
  onFileHistory?: ((path: string, x: number, y: number) => void) | undefined
  /** True while the history fetch is in flight (button shows busy). */
  historyLoading?: boolean
  /** Image comparison wiring (absent for any non-picture file). */
  image?: ImageDiffConfig
  t: T
}

/** One cell's text: word-level changed spans (when the row is a replacement
 *  pair the highlighter computed) wrapped in a tinted span, each span still
 *  searchable. `spans` null renders the plain (search-highlighted) text.
 *  `tokens` (the line's syntax spans) color the plain stretches; inside a
 *  changed-word span the strong tint wins, so syntax is skipped there. */

function renderCellText(cell: DiffCell | null, engine: SearchEngine, spans: WordSpans | null, changedClass: string, tokens: TokenSpan[] | null): ReactNode {
  if (cell === null) return ''
  const text = cell.text
  if (spans === null || spans.length === 0) return renderMarkedText(text, engine, tokens)
  const nodes: ReactNode[] = []
  let cursor = 0
  for (const [start, end] of spans) {
    if (start > cursor) nodes.push(renderMarkedText(text.slice(cursor, start), engine, sliceTokens(tokens, cursor, start)))
    if (end > start) {
      nodes.push(<span key={start} className={changedClass}>{searchParts(text.slice(start, end), engine)}</span>)
    }
    cursor = Math.max(cursor, end)
  }
  if (cursor < text.length) nodes.push(renderMarkedText(text.slice(cursor), engine, sliceTokens(tokens, cursor, text.length)))
  return nodes
}

/** One unified (single-column) line: gutter number + sign + text. */
function UnifiedRow({ line, engine, words, highlighter, ordinal, active, commentTitle, onComment }: {
  line: { kind: 'ctx' | 'del' | 'add'; no: number; text: string; noNewline?: boolean; pair: PairRow }
  engine: SearchEngine
  words: WordHighlighter
  highlighter: { line(text: string): TokenSpan[] | null } | null
  ordinal: number | undefined
  active: boolean
  commentTitle: string
  onComment: ((line: number) => void) | undefined
}) {
  const kindClass = line.kind === 'ctx' ? css.rowUCtx : line.kind === 'del' ? css.rowUDel : css.rowUAdd
  const regions = line.kind === 'ctx' ? null : words.pair(line.pair)
  const spans = regions === null ? null
    : line.kind === 'del' ? regions.old : regions.new
  const changedClass = line.kind === 'del' ? css.wordDel : css.wordAdd
  const matched = ordinal !== undefined
  return (
    <div
      className={css.rowU + ' ' + kindClass + (matched && active ? ' ' + css.rowMatchActive : '')}
      data-diff-match={matched ? '' : undefined}
    >
      <span className={css.cellNoU + (line.kind !== 'ctx' ? ' ' + css.cellNoUSign : '')}>
        {line.kind === 'del' ? '−' : line.kind === 'add' ? '+' : ''} {line.no}
      </span>
      <span className={css.cellText}>
        {renderCellText({ no: line.no, text: line.text, noNewline: line.noNewline }, engine, spans, changedClass, highlighter?.line(line.text) ?? null)}
        {line.noNewline === true && <em className={css.noNewline}>{'↩'}</em>}
      </span>
      {onComment !== undefined && (line.kind === 'ctx' || line.kind === 'add')
        && line.pair.right !== null && (
        <button
          type="button"
          className={css.rowCommentBtn}
          title={commentTitle}
          aria-label={commentTitle}
          onClick={() => { onComment(line.pair.right!.no) }}
        >
          <CommentIcon />
        </button>
      )}
    </div>
  )
}

/** One side-by-side row: FOUR direct grid children (old no, old text,
 *  new no, new text) — the CSS grid template addresses them by position, so
 *  the row must not wrap them in any intermediate element. Rows containing a
 *  search match carry data-diff-match (the navigation target), in document
 *  order equal to their match ordinal. */
function Row({ row, engine, words, highlighter, matchOrdinal, active, commentTitle, onComment }: { row: PairRow; engine: SearchEngine; words: WordHighlighter; highlighter: { line(text: string): TokenSpan[] | null } | null; matchOrdinal: number | undefined; active: boolean; commentTitle: string; onComment: ((line: number) => void) | undefined }) {
  const kindClass = row.kind === 'ctx' ? css.row
    : row.kind === 'del' ? css.rowDel
      : row.kind === 'add' ? css.rowAdd
        : css.rowPair
  const regions = words.pair(row)
  const matched = matchOrdinal !== undefined
  return (
    <div
      className={css.row + ' ' + kindClass + (matched && active ? ' ' + css.rowMatchActive : '')}
      data-diff-match={matched ? '' : undefined}
    >
      <span className={css.cellNo + (row.left === null ? ' ' + css.cellHatched : '')}>{row.left?.no ?? ''}</span>
      <span className={css.cellText + (row.left === null ? ' ' + css.cellHatched : '')}>
        {renderCellText(row.left, engine, regions?.old ?? null, css.wordDel, row.left === null ? null : highlighter?.line(row.left.text) ?? null)}
        {row.left?.noNewline === true && <em className={css.noNewline}>{'\u21a9'}</em>}
      </span>
      <span className={css.cellNo + (row.right === null ? ' ' + css.cellHatched : '')}>{row.right?.no ?? ''}</span>
      <span className={css.cellText + (row.right === null ? ' ' + css.cellHatched : '')}>
        {renderCellText(row.right, engine, regions?.new ?? null, css.wordAdd, row.right === null ? null : highlighter?.line(row.right.text) ?? null)}
        {row.right?.noNewline === true && <em className={css.noNewline}>{'\u21a9'}</em>}
      </span>
      {onComment !== undefined && row.right !== null && (
        <button
          type="button"
          className={css.rowCommentBtn}
          title={commentTitle}
          aria-label={commentTitle}
          onClick={() => { onComment(row.right!.no) }}
        >
          <CommentIcon />
        </button>
      )}
    </div>
  )
}

/**
 * One row's inline comment editor: appending reads the composer draft INSIDE
 * this tiny component's render (a draft subscription at the review-view level
 * would re-render the whole diff on every composer keystroke). Two exits:
 * write straight into the composer, or park in the pending draft box.
 */
function CommentEditor({ path, line, useInput, inputActions, onDraftAdd, onClose, t }: {
  path: string
  line: number
  useInput: SnapshotSelectorHook<InputState>
  inputActions: InputActions
  onDraftAdd: ((draft: CommentDraft) => void) | undefined
  onClose: () => void
  t: T
}) {
  const [text, setText] = useState('')
  const draft = useInput((s: InputState) => s.draft)
  const comment = path + ':' + line + ' \u2014 ' + text.trim()
  const write = (): void => {
    const current = draft.replace(/\s+$/, '')
    inputActions.setDraft(current === '' ? comment : current + '\n\n' + comment)
    onClose()
  }
  return (
    <div className={css.commentEditor}>
      <textarea
        className={css.commentTextarea}
        value={text}
        onChange={event => { setText(event.target.value) }}
        onKeyDown={event => { if (event.key === 'Escape') onClose() }}
        placeholder={t('comment.placeholder')}
        rows={2}
        autoFocus
      />
      <div className={css.commentActions}>
        <button
          type="button"
          className={css.commitBtn}
          disabled={text.trim() === ''}
          onClick={write}
        >
          {t('comment.write')}
        </button>
        {onDraftAdd !== undefined && (
          <button
            type="button"
            className={css.commitBtn}
            disabled={text.trim() === ''}
            onClick={() => {
              onDraftAdd({ path, line, text: text.trim() })
              onClose()
            }}
          >
            {t('comment.saveDraft')}
          </button>
        )}
        <button type="button" className={css.commitBtn} onClick={onClose}>{t('comment.cancel')}</button>
        <span className={css.commentLine}>{path + ':' + line}</span>
      </div>
    </div>
  )
}

/**
 * The pane for one selected file.
 * @param props - the file, its diff text/state and the context toggle.
 */
export function DiffPane({ file, diff, truncated, loading, binary, size, full, onToggleFull, scope, onScopeChange, view, onViewChange, showViewSwitch = true, allowFileView = true, wsIgnore, onToggleWs, syntaxHighlight, search, baseActive, useInput, inputActions, onDraftAdd, hunkOps, onHunkOp, hunkBusy, hunkNotice, onFileHistory, historyLoading, image, t }: DiffPaneProps) {
  const parsed = useMemo<ParsedDiff>(() => parseUnifiedDiff(diff), [diff])
  /** The picture comparison replaces the hunks unless the header switched
   *  this file back to its source view. */
  const showImage = image !== undefined && image.view === 'compare'
  const showBinary = binary || parsed.binary
  const notice = showBinary
    ? (size > 0 ? t('diff.binarySize', { size }) : t('diff.binary'))
    : truncated
      ? t('diff.truncated')
      : null
  // In-file search navigation: matched rows (side-by-side) or lines
  // (unified) are ordinals in document order; prev/next cycles and scrolls
  // the active one into view. The engine honors case/regex options.
  const engine = useMemo(() => makeSearchEngine(search), [search])
  // Word-level highlight: one budgeted pass per parse (re-renders never
  // recompute a row — the highlighter memoizes by row identity).
  const words = useMemo(() => makeWordHighlighter(), [parsed])
  // Line syntax highlighter: one budgeted instance per parsed diff (a very
  // large diff degrades to plain text mid-render, never stalls; a spent
  // budget must not leak into the next file's diff on the same path).
  const highlighter = useMemo(() => (syntaxHighlight ? makeLineHighlighter(file.path) : null), [file.path, syntaxHighlight, parsed])
  const unified = view === 'unified'
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [activeMatch, setActiveMatch] = useState(0)
  const matchRowCount = useMemo(
    () => (unified ? countUnifiedMatches(parsed, engine) : countMatchRows(parsed, engine)),
    [parsed, engine, unified],
  )
  useEffect(() => {
    setActiveMatch(0)
  }, [search, file.path, unified])
  // The count can shrink under a live selection (view switch, scope change):
  // clamp for display and scrolling instead of showing an impossible n/m.
  const shownMatch = matchRowCount === 0 ? 0 : Math.min(activeMatch, matchRowCount - 1)
  useEffect(() => {
    if (!engine.active || matchRowCount === 0) return
    const nodes = scrollRef.current?.querySelectorAll('[data-diff-match]')
    nodes?.[shownMatch]?.scrollIntoView({ block: 'center' })
  }, [shownMatch, engine, matchRowCount])
  const gotoMatch = useCallback((delta: number) => {
    setActiveMatch(previous => {
      if (matchRowCount === 0) return 0
      return ((previous + delta) % matchRowCount + matchRowCount) % matchRowCount
    })
  }, [matchRowCount])
  // Inline comment editor target: hunk/row coordinates plus the new-side line.
  const [commentTarget, setCommentTarget] = useState<{ hi: number; ri: number; line: number } | null>(null)
  // Two-step revert confirm per hunk: the first click arms the button, the
  // second (or arming another hunk) resolves it. Reset when the file/scope
  // changes so a stale arm never outlives the diff it belongs to.
  const [armedHunk, setArmedHunk] = useState<number | null>(null)
  useEffect(() => {
    setArmedHunk(null)
  }, [file.path, scope, hunkOps, diff, full])
  useEffect(() => {
    setCommentTarget(null)
  }, [file.path, diff])
  return (
    <div className={css.diffPane} data-git-review-diff="">
      <div className={css.diffHeader}>
        <FileTypeIcon path={file.path} />
        <span className={css.diffPath}>{file.path}</span>
        <FileCounts file={file} />
        {file.untracked && <span className={css.chip}>{t('badge.untracked')}</span>}
        {parsed.newFile && <span className={css.chip}>{t('diff.newFile')}</span>}
        {parsed.deletedFile && <span className={css.chip}>{t('diff.deletedFile')}</span>}
        {file.origPath !== undefined && (
          <span className={css.diffRename}>{t('diff.renamedFrom', { path: file.origPath })}</span>
        )}
        <span className={css.diffHeaderSpacer} />
        {matchRowCount > 0 && !showImage && (
          <span className={css.matchNav}>
            <button type="button" className={css.toolBtn} onClick={() => { gotoMatch(-1) }} title={t('search.prev')} aria-label={t('search.prev')}>
              {'\u2039'}
            </button>
            <span className={css.matchCount}>{(shownMatch + 1) + ' / ' + matchRowCount}</span>
            <button type="button" className={css.toolBtn} onClick={() => { gotoMatch(1) }} title={t('search.next')} aria-label={t('search.next')}>
              {'\u203a'}
            </button>
          </span>
        )}
        {image !== undefined && (
          <span className={css.scopeSwitch} role="group" aria-label={t('image.compare')}>
            <button
              type="button"
              className={css.scopeBtn + (image.view === 'compare' ? ' ' + css.scopeBtnActive : '')}
              aria-pressed={image.view === 'compare'}
              onClick={() => { image.onViewChange('compare') }}
            >
              {t('image.compare')}
            </button>
            <button
              type="button"
              className={css.scopeBtn + (image.view === 'source' ? ' ' + css.scopeBtnActive : '')}
              aria-pressed={image.view === 'source'}
              onClick={() => { image.onViewChange('source') }}
            >
              {t('image.source')}
            </button>
          </span>
        )}
        {showViewSwitch && <ViewSwitch active={view} onViewChange={onViewChange} allowFileView={allowFileView} t={t} />}
        {/* Whitespace toggle: the loudest review noise (formatting-only hunks)
            hides behind it; active state follows the persisted preference.
            Pictures have no whitespace, so it stands down there. */}
        {!showImage && (
        <button
          type="button"
          className={css.toolBtn + (wsIgnore ? ' ' + css.toolBtnActive : '')}
          aria-pressed={wsIgnore}
          onClick={onToggleWs}
          title={t('diff.wsHint')}
        >
          <span>{t('diff.ws')}</span>
        </button>
        )}
        {!file.untracked && !baseActive && (
          <span className={css.scopeSwitch} role="group" aria-label={t('scope.label')}>
            {(['all', 'staged', 'unstaged'] as const).map(candidate => (
              <button
                key={candidate}
                type="button"
                className={css.scopeBtn + (scope === candidate ? ' ' + css.scopeBtnActive : '')}
                onClick={() => { onScopeChange(candidate) }}
              >
                {t(('scope.' + candidate) as ReviewKey)}
              </button>
            ))}
          </span>
        )}
        {onFileHistory !== undefined && !baseActive && (
          <button
            type="button"
            className={css.toolBtn}
            disabled={historyLoading === true}
            title={t('history.hint')}
            onClick={event => {
              const rect = event.currentTarget.getBoundingClientRect()
              onFileHistory(file.path, Math.round(rect.right), Math.round(rect.bottom + 6))
            }}
          >
            <HistoryIcon />
            <span>{t('history.toggle')}</span>
          </button>
        )}
        {!showImage && (
        <button type="button" className={css.toolBtn} onClick={onToggleFull} title={full ? t('collapseAll') : t('expandAll')}>
          {full ? <CollapseIcon /> : <ExpandIcon />}
          <span>{full ? t('collapseAll') : t('expandAll')}</span>
        </button>
        )}
      </div>
      {notice !== null && !showImage && <div className={css.noticeRow}>{notice}</div>}
      {hunkNotice != null && hunkNotice !== '' && (
        <div className={css.noticeRow + ' ' + css.noticeError}>{hunkNotice}</div>
      )}
      {showImage && image !== undefined
        ? (
          <ImageDiffPane
            before={image.before}
            after={image.after}
            mode={image.mode}
            onModeChange={image.onModeChange}
            stacked={unified}
            beforeLabel={image.beforeLabel}
            afterLabel={image.afterLabel}
            t={t}
          />
        )
        : (
      <div className={css.diffScroll} ref={scrollRef}>
        {loading && <div className={css.paneNotice}>{t('diff.loading')}</div>}
        {!loading && !showBinary && parsed.hunks.length === 0 && (
          <div className={css.paneNotice}>{t('diff.noTextChanges')}</div>
        )}
        {!loading && renderHunks(parsed, {
          full,
          onToggleFull,
          t,
          engine,
          words,
          highlighter,
          unified,
          activeMatch,
          file,
          commentTarget,
          onCommentStart: useInput !== undefined && inputActions !== undefined
            ? (hi, ri, line) => { setCommentTarget({ hi, ri, line }) }
            : undefined,
          onCommentClose: () => { setCommentTarget(null) },
          useInput,
          inputActions,
          onDraftAdd,
          hunkOps,
          onHunkOp,
          hunkBusy: hunkBusy === true,
          armedHunk,
          onRevertArm: hi => { setArmedHunk(current => (current === hi ? null : hi)) },
        })}
        {/* Seat overlay reserve: the composer card floats over the pane's bottom. */}
        <div className={css.diffBottomReserve} />
      </div>
        )}
    </div>
  )
}

/** Render the hunks (with inter-hunk collapse bars) under the global row cap. */
function renderHunks(
  parsed: ParsedDiff,
  ui: {
    full: boolean
    onToggleFull: () => void
    t: T
    engine: SearchEngine
    words: WordHighlighter
    highlighter: { line(text: string): TokenSpan[] | null } | null
    unified: boolean
    activeMatch: number
    file: ChangedFile
    commentTarget: { hi: number; ri: number; line: number } | null
    onCommentStart: ((hi: number, ri: number, line: number) => void) | undefined
    onCommentClose: () => void
    useInput: SnapshotSelectorHook<InputState> | undefined
    inputActions: InputActions | undefined
    onDraftAdd: ((draft: CommentDraft) => void) | undefined
    hunkOps: 'stage-revert' | 'unstage' | undefined
    onHunkOp: ((action: 'stage' | 'unstage' | 'revert', hunkIndex: number) => void) | undefined
    hunkBusy: boolean
    armedHunk: number | null
    onRevertArm: (hunkIndex: number) => void
  },
): readonly ReactNode[] {
  let budget = MAX_RENDER_ROWS
  // True only when rows were actually dropped (a diff of exactly MAX rows
  // renders whole — the old `budget <= 0` check cried capped for that).
  let cut = false
  let matchCounter = 0
  const out: React.ReactNode[] = []
  parsed.hunks.forEach((hunk, hi) => {
    if (budget <= 0) { cut = true; return }
    const previous = parsed.hunks[hi - 1]
    const skipped = previous === undefined
      ? 0
      : Math.max(
        0,
        hunk.oldStart - (previous.oldStart + previous.oldCount),
        hunk.newStart - (previous.newStart + previous.newCount),
      )
    const rows = hunk.rows.slice(0, budget)
    if (rows.length < hunk.rows.length) cut = true
    budget -= rows.length
    out.push(
      <Fragment key={hi}>
        {skipped > 0 && !ui.full && (
          <button type="button" className={css.gapBar} onClick={ui.onToggleFull} title={ui.t('diff.expandHint')}>
            {'\u22ef ' + ui.t('diff.unmodifiedLines', { count: skipped }) + ' \u22ef'}
          </button>
        )}
        <div className={css.hunkHeader}>
          <span className={css.hunkHeaderText}>
            {'@@ -' + hunk.oldStart + ',' + hunk.oldCount + ' +' + hunk.newStart + ',' + hunk.newCount + ' @@' + (hunk.section === '' ? '' : ' ' + hunk.section) + (hunk.damaged ? ' \u00b7 ' + ui.t('diff.truncated') : '')}
          </span>
          {ui.hunkOps !== undefined && ui.onHunkOp !== undefined && (
            <span className={css.hunkActions}>
              {ui.hunkOps === 'unstage' ? (
                <button
                  type="button"
                  className={css.hunkOpBtn}
                  disabled={ui.hunkBusy}
                  title={ui.t('hunk.unstageHint')}
                  onClick={() => { ui.onHunkOp!('unstage', hi) }}
                >
                  {ui.t('hunk.unstage')}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={css.hunkOpBtn}
                    disabled={ui.hunkBusy}
                    title={ui.t('hunk.stageHint')}
                    onClick={() => { ui.onHunkOp!('stage', hi) }}
                  >
                    {ui.t('hunk.stage')}
                  </button>
                  <button
                    type="button"
                    className={css.hunkOpBtn + ' ' + css.hunkOpDanger + (ui.armedHunk === hi ? ' ' + css.hunkOpArmed : '')}
                    disabled={ui.hunkBusy}
                    title={ui.t('hunk.revertHint')}
                    onClick={() => {
                      if (ui.armedHunk === hi) {
                        ui.onHunkOp!('revert', hi)
                        ui.onRevertArm(hi)
                      } else {
                        ui.onRevertArm(hi)
                      }
                    }}
                  >
                    {ui.armedHunk === hi ? ui.t('hunk.revertConfirm') : ui.t('hunk.revert')}
                  </button>
                </>
              )}
            </span>
          )}
        </div>
        {ui.unified
          ? unifyHunkRows(rows).map((line, li) => {
            const matched = ui.engine.test(line.text)
            const ordinal = matched ? matchCounter++ : undefined
            return (
              <Fragment key={li}>
                <UnifiedRow
                  line={line}
                  engine={ui.engine}
                  words={ui.words}
                  highlighter={ui.highlighter}
                  ordinal={ordinal}
                  active={ordinal === ui.activeMatch}
                  commentTitle={ui.t('comment.add')}
                  onComment={ui.onCommentStart !== undefined && line.pair.right !== null
                    ? (num: number) => { ui.onCommentStart!(hi, li, num) }
                    : undefined}
                />
                {ui.commentTarget !== null && ui.commentTarget.hi === hi && ui.commentTarget.ri === li
                  && ui.useInput !== undefined && ui.inputActions !== undefined && (
                  <CommentEditor
                    path={ui.file.path}
                    line={ui.commentTarget.line}
                    useInput={ui.useInput}
                    inputActions={ui.inputActions}
                    onDraftAdd={ui.onDraftAdd}
                    onClose={ui.onCommentClose}
                    t={ui.t}
                  />
                )}
              </Fragment>
            )
          })
          : rows.map((row, ri) => {
            const matched = rowHasMatch(row, ui.engine)
            const ordinal = matched ? matchCounter++ : undefined
            return (
              <Fragment key={ri}>
                <Row
                  row={row}
                  engine={ui.engine}
                  words={ui.words}
                  highlighter={ui.highlighter}
                matchOrdinal={ordinal}
                active={ordinal === ui.activeMatch}
                commentTitle={ui.t('comment.add')}
                onComment={ui.onCommentStart !== undefined && row.right !== null
                  ? (line: number) => { ui.onCommentStart!(hi, ri, line) }
                  : undefined}
              />
              {ui.commentTarget !== null && ui.commentTarget.hi === hi && ui.commentTarget.ri === ri
                && ui.useInput !== undefined && ui.inputActions !== undefined && (
                <CommentEditor
                  path={ui.file.path}
                  line={ui.commentTarget.line}
                  useInput={ui.useInput}
                  inputActions={ui.inputActions}
                  onDraftAdd={ui.onDraftAdd}
                  onClose={ui.onCommentClose}
                  t={ui.t}
                />
              )}
            </Fragment>
          )
        })}
      </Fragment>,
    )
  })
  if (cut) {
    out.push(<div key="capped" className={css.noticeRow}>{ui.t('diff.renderCapped', { count: MAX_RENDER_ROWS })}</div>)
  }
  return out
}
