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
import { countMatchRows, parseUnifiedDiff, rowHasMatch, splitByMatch, MAX_RENDER_ROWS, type DiffCell, type PairRow, type ParsedDiff } from './diff-parse.ts'
import { CommentIcon, ExpandIcon, CollapseIcon } from './icons.tsx'
import { FileTypeIcon } from './file-type-icon.tsx'
import { ViewSwitch, type FileViewMode } from './file-pane.tsx'
import type { ChangedFile } from '../contract.ts'
import type { InputActions, InputState } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { PropsLocale, SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS, ReviewKey } from './locales.ts'
import css from './review.module.css'

type T = PropsLocale<typeof NS>['t']

export { MAX_RENDER_ROWS }

/** Which half of a file's changes the diff covers (mirrors the host param). */
export type DiffScope = 'all' | 'staged' | 'unstaged'

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
  /** Active main view ('diff' here); the header hosts the switch. */
  view: FileViewMode
  onViewChange: (next: FileViewMode) => void
  /** Active content search query ('' = none); highlights rows + navigation. */
  search: string
  /** True while a base-branch override is active (scope chips are hidden). */
  baseActive: boolean
  /** Session input channels for inline comments (absent = feature hidden). */
  useInput: SnapshotSelectorHook<InputState> | undefined
  inputActions: InputActions | undefined
  t: T
}

/** One cell's text with search matches wrapped in <mark> (odd split parts). */
function renderCellText(cell: DiffCell | null, search: string): ReactNode {
  if (cell === null) return ''
  const parts = splitByMatch(cell.text, search)
  if (parts.length === 1) return parts[0]
  return parts.map((part, index) =>
    index % 2 === 1 ? <mark key={index} className={css.matchMark}>{part}</mark> : part,
  )
}

/** One side-by-side row: FOUR direct grid children (old no, old text,
 *  new no, new text) — the CSS grid template addresses them by position, so
 *  the row must not wrap them in any intermediate element. Rows containing a
 *  search match carry data-diff-match (the navigation target), in document
 *  order equal to their match ordinal. */
function Row({ row, search, matchOrdinal, active, commentTitle, onComment }: { row: PairRow; search: string; matchOrdinal: number | undefined; active: boolean; commentTitle: string; onComment: ((line: number) => void) | undefined }) {
  const kindClass = row.kind === 'ctx' ? css.rowCtx
    : row.kind === 'del' ? css.rowDel
      : row.kind === 'add' ? css.rowAdd
        : css.rowPair
  const matched = matchOrdinal !== undefined
  return (
    <div
      className={css.row + ' ' + kindClass + (matched && active ? ' ' + css.rowMatchActive : '')}
      data-diff-match={matched ? '' : undefined}
    >
      <span className={css.cellNo + (row.left === null ? ' ' + css.cellHatched : '')}>{row.left?.no ?? ''}</span>
      <span className={css.cellText + (row.left === null ? ' ' + css.cellHatched : '')}>
        {renderCellText(row.left, search)}
        {row.left?.noNewline === true && <em className={css.noNewline}>{'\u21a9'}</em>}
      </span>
      <span className={css.cellNo + (row.right === null ? ' ' + css.cellHatched : '')}>{row.right?.no ?? ''}</span>
      <span className={css.cellText + (row.right === null ? ' ' + css.cellHatched : '')}>
        {renderCellText(row.right, search)}
        {row.right?.noNewline === true && <em className={css.noNewline}>{'\u21a9'}</em>}
      </span>
      {onComment !== undefined && (
        <button
          type="button"
          className={css.rowCommentBtn}
          title={commentTitle}
          aria-label={commentTitle}
          onClick={() => { onComment(row.right !== null ? row.right.no : 0) }}
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
 * would re-render the whole diff on every composer keystroke).
 */
function CommentEditor({ path, line, useInput, inputActions, onClose, t }: {
  path: string
  line: number
  useInput: SnapshotSelectorHook<InputState>
  inputActions: InputActions
  onClose: () => void
  t: T
}) {
  const [text, setText] = useState('')
  const draft = useInput((s: InputState) => s.draft)
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
          onClick={() => {
            const comment = path + ':' + line + ' \u2014 ' + text.trim()
            const current = draft.replace(/\s+$/, '')
            inputActions.setDraft(current === '' ? comment : current + '\n\n' + comment)
            onClose()
          }}
        >
          {t('comment.write')}
        </button>
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
export function DiffPane({ file, diff, truncated, loading, binary, size, full, onToggleFull, scope, onScopeChange, view, onViewChange, search, baseActive, useInput, inputActions, t }: DiffPaneProps) {
  const parsed = useMemo<ParsedDiff>(() => parseUnifiedDiff(diff), [diff])
  const showBinary = binary || parsed.binary
  const notice = showBinary
    ? (size > 0 ? t('diff.binarySize', { size }) : t('diff.binary'))
    : truncated
      ? t('diff.truncated')
      : null
  // In-file search navigation: matched rows are ordinals in document order;
  // prev/next cycles and scrolls the active row into view.
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [activeMatch, setActiveMatch] = useState(0)
  const matchRowCount = useMemo(() => countMatchRows(parsed, search), [parsed, search])
  useEffect(() => {
    setActiveMatch(0)
  }, [search, file.path])
  useEffect(() => {
    if (search === '' || matchRowCount === 0) return
    const nodes = scrollRef.current?.querySelectorAll('[data-diff-match]')
    nodes?.[activeMatch]?.scrollIntoView({ block: 'center' })
  }, [activeMatch, search, matchRowCount])
  const gotoMatch = useCallback((delta: number) => {
    setActiveMatch(previous => {
      if (matchRowCount === 0) return 0
      return ((previous + delta) % matchRowCount + matchRowCount) % matchRowCount
    })
  }, [matchRowCount])
  // Inline comment editor target: hunk/row coordinates plus the new-side line.
  const [commentTarget, setCommentTarget] = useState<{ hi: number; ri: number; line: number } | null>(null)
  return (
    <div className={css.diffPane} data-git-review-diff="">
      <div className={css.diffHeader}>
        <FileTypeIcon path={file.path} />
        <span className={css.diffPath}>{file.path}</span>
        {file.untracked && <span className={css.chip}>{t('badge.untracked')}</span>}
        {parsed.newFile && <span className={css.chip}>{t('diff.newFile')}</span>}
        {parsed.deletedFile && <span className={css.chip}>{t('diff.deletedFile')}</span>}
        {file.origPath !== undefined && (
          <span className={css.diffRename}>{t('diff.renamedFrom', { path: file.origPath })}</span>
        )}
        <span className={css.diffHeaderSpacer} />
        {matchRowCount > 0 && (
          <span className={css.matchNav}>
            <button type="button" className={css.toolBtn} onClick={() => { gotoMatch(-1) }} title={t('search.prev')} aria-label={t('search.prev')}>
              {'\u2039'}
            </button>
            <span className={css.matchCount}>{(activeMatch + 1) + ' / ' + matchRowCount}</span>
            <button type="button" className={css.toolBtn} onClick={() => { gotoMatch(1) }} title={t('search.next')} aria-label={t('search.next')}>
              {'\u203a'}
            </button>
          </span>
        )}
        <ViewSwitch active={view} onViewChange={onViewChange} t={t} />
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
        <button type="button" className={css.toolBtn} onClick={onToggleFull} title={full ? t('collapseAll') : t('expandAll')}>
          {full ? <CollapseIcon /> : <ExpandIcon />}
          <span>{full ? t('collapseAll') : t('expandAll')}</span>
        </button>
      </div>
      {notice !== null && <div className={css.noticeRow}>{notice}</div>}
      <div className={css.diffScroll}>
        {loading && <div className={css.paneNotice}>{t('diff.loading')}</div>}
        {!loading && !showBinary && parsed.hunks.length === 0 && (
          <div className={css.paneNotice}>{t('diff.noTextChanges')}</div>
        )}
        {!loading && renderHunks(parsed, {
          full,
          onToggleFull,
          t,
          search,
          activeMatch,
          file,
          commentTarget,
          onCommentStart: useInput !== undefined && inputActions !== undefined
            ? (hi, ri, line) => { setCommentTarget({ hi, ri, line }) }
            : undefined,
          onCommentClose: () => { setCommentTarget(null) },
          useInput,
          inputActions,
        })}
        {/* Seat overlay reserve: the composer card floats over the pane's bottom. */}
        <div className={css.diffBottomReserve} />
      </div>
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
    search: string
    activeMatch: number
    file: ChangedFile
    commentTarget: { hi: number; ri: number; line: number } | null
    onCommentStart: ((hi: number, ri: number, line: number) => void) | undefined
    onCommentClose: () => void
    useInput: SnapshotSelectorHook<InputState> | undefined
    inputActions: InputActions | undefined
  },
): readonly ReactNode[] {
  let budget = MAX_RENDER_ROWS
  let matchCounter = 0
  const out: React.ReactNode[] = []
  parsed.hunks.forEach((hunk, hi) => {
    if (budget <= 0) return
    const previous = parsed.hunks[hi - 1]
    const skipped = previous === undefined
      ? 0
      : Math.max(
        0,
        hunk.oldStart - (previous.oldStart + previous.oldCount),
        hunk.newStart - (previous.newStart + previous.newCount),
      )
    const rows = hunk.rows.slice(0, budget)
    budget -= rows.length
    out.push(
      <Fragment key={hi}>
        {skipped > 0 && !ui.full && (
          <button type="button" className={css.gapBar} onClick={ui.onToggleFull} title={ui.t('diff.expandHint')}>
            {'\u22ef ' + ui.t('diff.unmodifiedLines', { count: skipped }) + ' \u22ef'}
          </button>
        )}
        <div className={css.hunkHeader}>
          {'@@ -' + hunk.oldStart + ',' + hunk.oldCount + ' +' + hunk.newStart + ',' + hunk.newCount + ' @@' + (hunk.section === '' ? '' : ' ' + hunk.section)}
        </div>
        {rows.map((row, ri) => {
          const matched = rowHasMatch(row, ui.search)
          const ordinal = matched ? matchCounter++ : undefined
          return (
            <Fragment key={ri}>
              <Row
                row={row}
                search={ui.search}
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
  if (budget <= 0) {
    out.push(<div key="capped" className={css.noticeRow}>{ui.t('diff.renderCapped', { count: MAX_RENDER_ROWS })}</div>)
  }
  return out
}
