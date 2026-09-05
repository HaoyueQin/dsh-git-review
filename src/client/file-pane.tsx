/**
 * The review tab's full-file view: one file's complete content with line
 * numbers (no diff), reached from the diff header's diff/file switch or by
 * selecting an unchanged file in all-files tree mode. Rendering is capped by
 * the same global row cap the diff pane uses.
 */
import { useMemo, type ReactNode } from 'react'
import { makeSearchEngine, MAX_RENDER_ROWS, type SearchSpec } from './diff-parse.ts'
import { FileIcon, LineLeftIcon, LinesIcon } from './icons.tsx'
import { FileTypeIcon } from './file-type-icon.tsx'
import type { ChangedFile } from '../contract.ts'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import css from './review.module.css'

type T = PropsLocale<typeof NS>['t']

/** The main pane's view mode: side-by-side, unified (single column) or the
 *  whole file. */
export type FileViewMode = 'split' | 'unified' | 'file'

/** One line with content-search matches wrapped in <mark>. */
function highlightedLine(text: string, engine: ReturnType<typeof makeSearchEngine>): ReactNode {
  const parts = engine.parts(text)
  if (parts.length === 1) return parts[0]
  return parts.map((part, index) =>
    index % 2 === 1 ? <mark key={index} className={css.matchMark}>{part}</mark> : part,
  )
}

/** The layout/view switch shared by both pane headers. */
export function ViewSwitch({ active, onViewChange, allowFileView = true, t }: {
  active: FileViewMode
  onViewChange: (next: FileViewMode) => void
  /** False drops the file option (a commit diff has no worktree to read). */
  allowFileView?: boolean
  t: T
}) {
  const allOptions: ReadonlyArray<{ key: FileViewMode; icon: ReactNode; label: string; fileOnly: boolean }> = [
    { key: 'split', icon: <LineLeftIcon />, label: t('view.split'), fileOnly: false },
    { key: 'unified', icon: <LinesIcon />, label: t('view.unified'), fileOnly: false },
    { key: 'file', icon: <FileIcon />, label: t('view.file'), fileOnly: true },
  ]
  const options = allOptions.filter(option => allowFileView || !option.fileOnly)
  return (
    <span className={css.scopeSwitch} role="group" aria-label={t('view.label')}>
      {options.map(candidate => (
        <button
          key={candidate.key}
          type="button"
          className={css.scopeBtn + (active === candidate.key ? ' ' + css.scopeBtnActive : '')}
          onClick={() => { onViewChange(candidate.key) }}
          title={candidate.label}
        >
          {candidate.icon}
          <span>{candidate.label}</span>
        </button>
      ))}
    </span>
  )
}

/** Props of the full-file pane. */
export interface FilePaneProps {
  file: ChangedFile
  /** Content-search spec (drives the line highlight; query '' = none). */
  search: SearchSpec
  /** Whole-file text ('' while loading / for non-text states). */
  content: string
  /** True when the host served only a prefix (read cap). */
  truncated: boolean
  binary: boolean
  /** File size for the binary notice (0 when unknown). */
  size: number
  loading: boolean
  /** Whether a diff exists for this file (unchanged rows have none). */
  canShowDiff: boolean
  view: FileViewMode
  onViewChange: (next: FileViewMode) => void
  t: T
}

/**
 * The pane showing one file's full content.
 * @param props - the file, its content state and the view switch.
 */
export function FilePane({ file, search, content, truncated, binary, size, loading, canShowDiff, view, onViewChange, t }: FilePaneProps) {
  const engine = useMemo(() => makeSearchEngine(search), [search])
  const lines = useMemo(() => {
    if (content === '') return []
    const rows = content.split('\n')
    if (rows[rows.length - 1] === '') rows.pop()
    return rows
  }, [content])
  const capped = !loading && !binary && lines.length > MAX_RENDER_ROWS
  const visible = capped ? lines.slice(0, MAX_RENDER_ROWS) : lines
  return (
    <div className={css.diffPane} data-git-review-diff="">
      <div className={css.diffHeader}>
        <FileTypeIcon path={file.path} />
        <span className={css.diffPath}>{file.path}</span>
        <span className={css.diffHeaderSpacer} />
        {canShowDiff && <ViewSwitch active={view} onViewChange={onViewChange} t={t} />}
      </div>
      {binary && (
        <div className={css.noticeRow}>{size > 0 ? t('diff.binarySize', { size }) : t('diff.binary')}</div>
      )}
      {!binary && truncated && <div className={css.noticeRow}>{t('file.truncated')}</div>}
      <div className={css.diffScroll}>
        {loading && <div className={css.paneNotice}>{t('file.loading')}</div>}
        {!loading && !binary && lines.length === 0 && (
          <div className={css.paneNotice}>{t('file.empty')}</div>
        )}
        {!loading && !binary && visible.map((line, index) => (
          <div key={index} className={css.fileRowGrid}>
            <span className={css.fileNo}>{index + 1}</span>
            <span className={css.cellText}>{highlightedLine(line, engine)}</span>
          </div>
        ))}
        {capped && <div className={css.noticeRow}>{t('diff.renderCapped', { count: MAX_RENDER_ROWS })}</div>}
        {/* Seat overlay reserve: the composer card floats over the pane's bottom. */}
        <div className={css.diffBottomReserve} />
      </div>
    </div>
  )
}
