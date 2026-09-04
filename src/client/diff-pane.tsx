/**
 * The review tab's diff pane: one file's side-by-side diff. Rows render as a
 * four-column grid (old no, old text, new no, new text); a missing side
 * shows a hatched placeholder. Long unmodified runs between hunks collapse
 * into bars that expand the full context (a single re-fetch with a huge -U,
 * which makes git merge every hunk). Row rendering is capped so a paged-in
 * giant diff cannot take the tab down.
 */
import { Fragment, useMemo } from 'react'
import type { ReactNode } from 'react'
import { parseUnifiedDiff, type PairRow, type ParsedDiff } from './diff-parse.ts'
import { ExpandIcon, CollapseIcon } from './icons.tsx'
import { FileTypeIcon } from './file-type-icon.tsx'
import type { ChangedFile } from '../contract.ts'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import css from './review.module.css'

type T = PropsLocale<typeof NS>['t']

/** Above this row count the pane renders a prefix (with a notice). */
export const MAX_RENDER_ROWS = 20_000

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
  t: T
}

/** One side-by-side row: FOUR direct grid children (old no, old text,
 *  new no, new text) — the CSS grid template addresses them by position, so
 *  the row must not wrap them in any intermediate element. */
function Row({ row }: { row: PairRow }) {
  const kindClass = row.kind === 'ctx' ? css.rowCtx
    : row.kind === 'del' ? css.rowDel
      : row.kind === 'add' ? css.rowAdd
        : css.rowPair
  return (
    <div className={css.row + ' ' + kindClass}>
      <span className={css.cellNo + (row.left === null ? ' ' + css.cellHatched : '')}>{row.left?.no ?? ''}</span>
      <span className={css.cellText + (row.left === null ? ' ' + css.cellHatched : '')}>
        {row.left?.text ?? ''}
        {row.left?.noNewline === true && <em className={css.noNewline}>{'\u21a9'}</em>}
      </span>
      <span className={css.cellNo + (row.right === null ? ' ' + css.cellHatched : '')}>{row.right?.no ?? ''}</span>
      <span className={css.cellText + (row.right === null ? ' ' + css.cellHatched : '')}>
        {row.right?.text ?? ''}
        {row.right?.noNewline === true && <em className={css.noNewline}>{'\u21a9'}</em>}
      </span>
    </div>
  )
}

/**
 * The pane for one selected file.
 * @param props - the file, its diff text/state and the context toggle.
 */
export function DiffPane({ file, diff, truncated, loading, binary, size, full, onToggleFull, t }: DiffPaneProps) {
  const parsed = useMemo<ParsedDiff>(() => parseUnifiedDiff(diff), [diff])
  const showBinary = binary || parsed.binary
  const notice = showBinary
    ? (size > 0 ? t('diff.binarySize', { size }) : t('diff.binary'))
    : truncated
      ? t('diff.truncated')
      : null
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
        {!loading && renderHunks(parsed, { full, onToggleFull, t })}
        {/* Seat overlay reserve: the composer card floats over the pane's bottom. */}
        <div className={css.diffBottomReserve} />
      </div>
    </div>
  )
}

/** Render the hunks (with inter-hunk collapse bars) under the global row cap. */
function renderHunks(
  parsed: ParsedDiff,
  ui: { full: boolean; onToggleFull: () => void; t: T },
): readonly ReactNode[] {
  let budget = MAX_RENDER_ROWS
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
        {rows.map((row, ri) => <Row key={ri} row={row} />)}
      </Fragment>,
    )
  })
  if (budget <= 0) {
    out.push(<div key="capped" className={css.noticeRow}>{ui.t('diff.renderCapped', { count: MAX_RENDER_ROWS })}</div>)
  }
  return out
}
