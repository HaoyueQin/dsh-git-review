/**
 * The review tab's full-file view: one file's complete content with line
 * numbers (no diff), reached from the diff header's diff/file switch or by
 * selecting an unchanged file in all-files tree mode. Rendering is capped by
 * the same global row cap the diff pane uses.
 */
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { makeSearchEngine, MAX_RENDER_ROWS, type SearchSpec } from './diff-parse.ts'
import { makeLineHighlighter, sliceTokens, splitLineByTokens, type TokenSpan } from './highlight.ts'
import { FileIcon, LineLeftIcon, LinesIcon } from './icons.tsx'
import { FileTypeIcon } from './file-type-icon.tsx'
import { FileCounts } from './file-counts.tsx'
import type { ChangedFile, GitBlameLine } from '../contract.ts'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import css from './review.module.css'

type T = PropsLocale<typeof NS>['t']

/** The main pane's view mode: side-by-side, unified (single column) or the
 *  whole file. */
export type FileViewMode = 'split' | 'unified' | 'file'

/** One line with content-search matches wrapped in <mark>, syntax tokens
 *  colored underneath (the token spans slice the same line). */
function highlightedLine(text: string, engine: ReturnType<typeof makeSearchEngine>, tokens: TokenSpan[] | null): ReactNode {
  // Gap-preserving: tokens are line-level, so each search chunk re-slices
  // them by its own offset before rendering every segment (plain gaps
  // included) — mapping tokens alone drops identifiers/whitespace.
  const render = (chunk: string, offset: number): ReactNode => {
    if (tokens === null || tokens.length === 0) return chunk
    return splitLineByTokens(chunk, sliceTokens(tokens, offset, offset + chunk.length)).map((seg, index) => {
      const inner = chunk.slice(seg.start, seg.end)
      if (seg.kind === null) return <span key={index}>{inner}</span>
      const cls = seg.kind === 'kw' ? css.tokKw : seg.kind === 'str' ? css.tokStr : seg.kind === 'num' ? css.tokNum : css.tokCom
      return <span key={index} className={cls}>{inner}</span>
    })
  }
  const parts = engine.parts(text)
  if (parts.length === 1) return render(parts[0]!, 0)
  let offset = 0
  return parts.map((part, index) => {
    const at = offset
    offset += part.length
    return index % 2 === 1
      ? <mark key={index} className={css.matchMark}>{part}</mark>
      : render(part, at)
  })
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
  /** Whether lines get lightweight syntax coloring (the preference). */
  syntaxHighlight: boolean
  /** Blame mode: per-line last-touched author/hash gutter. */
  blameOn: boolean
  onToggleBlame: () => void
  /** Blame rows (when loaded); same order/length as the file's lines. */
  blameState: { kind: 'idle' | 'loading' | 'ready' | 'failed'; lines: GitBlameLine[] | null; message: string | null }
  /** Jump from a blame gutter commit to the graph detail (absent = gutter stays plain text). */
  onBlameJump?: (hash: string, line: number) => void
  /** 1-based file line to scroll into view after a graph-detail return. */
  focusLine?: number | null
  /** In-tab preview available for this path (the header offers it). */
  previewAvailable?: boolean
  onShowPreview?: () => void
  t: T
}

/**
 * The pane showing one file's full content.
 * @param props - the file, its content state and the view switch.
 */
export function FilePane({ file, search, content, truncated, binary, size, loading, canShowDiff, view, onViewChange, syntaxHighlight, blameOn, onToggleBlame, blameState, onBlameJump, focusLine, previewAvailable, onShowPreview, t }: FilePaneProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (focusLine === undefined || focusLine === null || loading) return
    const root = scrollRef.current
    if (root === null) return
    const target = root.querySelector('[data-file-line="' + focusLine + '"]')
    if (target !== null) (target as HTMLElement).scrollIntoView({ block: 'center' })
  }, [focusLine, loading, content])
  const engine = useMemo(() => makeSearchEngine(search), [search])
  const highlighter = useMemo(() => (syntaxHighlight ? makeLineHighlighter(file.path) : null), [file.path, syntaxHighlight, content])
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
        <FileCounts file={file} />
        <span className={css.diffHeaderSpacer} />
        {canShowDiff && <ViewSwitch active={view} onViewChange={onViewChange} t={t} />}
        {previewAvailable === true && onShowPreview !== undefined && (
          <span className={css.scopeSwitch} role="group" aria-label={t('preview.toggle')}>
            <button type="button" className={css.scopeBtn} onClick={onShowPreview}>
              {t('preview.toggle')}
            </button>
            <button type="button" className={css.scopeBtn + ' ' + css.scopeBtnActive} disabled aria-current="true">
              {t('preview.source')}
            </button>
          </span>
        )}
        {/* Blame toggle: the gutter answers "who last touched this line". */}
        <button
          type="button"
          className={css.toolBtn + (blameOn ? ' ' + css.toolBtnActive : '')}
          aria-pressed={blameOn}
          title={t('blame.hint')}
          onClick={onToggleBlame}
        >
          <span>{t('blame.toggle')}</span>
        </button>
      </div>
      {binary ? (
        <div className={css.noticeRow}>{(size > 0 ? t('diff.binarySize', { size }) : t('diff.binary')) + (previewAvailable === true ? ' \u00b7 ' + t('preview.openHint') : '')}</div>
      ) : null}
      {!binary && truncated && <div className={css.noticeRow}>{t('file.truncated')}</div>}
      {blameOn && blameState.kind === 'loading' && <div className={css.noticeRow}>{t('blame.loading')}</div>}
      {blameOn && blameState.kind === 'failed' && <div className={css.noticeRow + ' ' + css.noticeError}>{blameState.message ?? ''}</div>}
      <div className={css.diffScroll} ref={scrollRef}>
        {loading && <div className={css.paneNotice}>{t('file.loading')}</div>}
        {!loading && !binary && lines.length === 0 && (
          <div className={css.paneNotice}>{t('file.empty')}</div>
        )}
        {!loading && !binary && visible.map((line, index) => (
          <div key={index} data-file-line={index + 1} className={css.fileRowGrid + (blameOn && blameState.kind === 'ready' && blameState.lines !== null ? ' ' + css.fileRowGridBlame : '') + (focusLine === index + 1 ? ' ' + css.fileRowFocus : '')}>
            {blameOn && blameState.kind === 'ready' && blameState.lines !== null && (
              (() => {
                const row = blameState.lines![index] ?? null
                if (row === null) return <span className={css.blameGutter} />
                const previous = index > 0 ? blameState.lines![index - 1] ?? null : null
                const repeated = previous !== null && previous.hash === row.hash
                const short = row.hash.slice(0, 7)
                // Array.from: a naive slice can split a surrogate pair into
                // a lone-surrogate replacement character.
                const authorChars = Array.from(row.author)
                const author = authorChars.length > 10 ? authorChars.slice(0, 9).join('') + '\u2026' : row.author
                const jumpable = onBlameJump !== undefined && !repeated && row.hash !== '' && !/^0+$/.test(row.hash)
                const label = repeated ? '' : author + ' ' + short
                if (!jumpable) {
                  return (
                    <span className={css.blameGutter} title={repeated ? undefined : row.author + ' \u00b7 ' + row.hash + ' \u00b7 ' + row.summary}>
                      {label}
                    </span>
                  )
                }
                return (
                  <button
                    type="button"
                    className={css.blameGutter}
                    style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, font: 'inherit', textAlign: 'left' }}
                    title={t('blame.jump') + ': ' + row.author + ' \u00b7 ' + row.hash + ' \u00b7 ' + row.summary}
                    onClick={() => { onBlameJump(row.hash, index + 1) }}
                  >
                    {label}
                  </button>
                )
              })()
            )}
            <span className={css.fileNo}>{index + 1}</span>
            <span className={css.cellText}>{highlightedLine(line, engine, highlighter?.line(line) ?? null)}</span>
          </div>
        ))}
        {capped && <div className={css.noticeRow}>{t('diff.renderCapped', { count: MAX_RENDER_ROWS })}</div>}
        {/* Seat overlay reserve: the composer card floats over the pane's bottom. */}
        <div className={css.diffBottomReserve} />
      </div>
    </div>
  )
}
