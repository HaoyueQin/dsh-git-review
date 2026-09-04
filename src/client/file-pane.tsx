/**
 * The review tab's full-file view: one file's complete content with line
 * numbers (no diff), reached from the diff header's diff/file switch or by
 * selecting an unchanged file in all-files tree mode. Rendering is capped by
 * the same global row cap the diff pane uses.
 */
import { useMemo } from 'react'
import { MAX_RENDER_ROWS } from './diff-parse.ts'
import { FileTypeIcon } from './file-type-icon.tsx'
import type { ChangedFile } from '../contract.ts'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS, ReviewKey } from './locales.ts'
import css from './review.module.css'

type T = PropsLocale<typeof NS>['t']

/** The main pane's view mode: side-by-side diff or whole file. */
export type FileViewMode = 'diff' | 'file'

/** The diff/file switch shared by both pane headers. */
export function ViewSwitch({ active, onViewChange, t }: {
  active: FileViewMode
  onViewChange: (next: FileViewMode) => void
  t: T
}) {
  return (
    <span className={css.scopeSwitch} role="group" aria-label={t('view.label')}>
      {(['diff', 'file'] as const).map(candidate => (
        <button
          key={candidate}
          type="button"
          className={css.scopeBtn + (active === candidate ? ' ' + css.scopeBtnActive : '')}
          onClick={() => { onViewChange(candidate) }}
        >
          {t(('view.' + candidate) as ReviewKey)}
        </button>
      ))}
    </span>
  )
}

/** Props of the full-file pane. */
export interface FilePaneProps {
  file: ChangedFile
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
export function FilePane({ file, content, truncated, binary, size, loading, canShowDiff, view, onViewChange, t }: FilePaneProps) {
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
            <span className={css.cellText}>{line}</span>
          </div>
        ))}
        {capped && <div className={css.noticeRow}>{t('diff.renderCapped', { count: MAX_RENDER_ROWS })}</div>}
        {/* Seat overlay reserve: the composer card floats over the pane's bottom. */}
        <div className={css.diffBottomReserve} />
      </div>
    </div>
  )
}
