/**
 * In-tab file preview: markdown (the shell's shared renderer), raster
 * images + SVG (image context, scripts never run), and PDF (sandboxed
 * iframe). Office formats stay out on purpose — mammoth (~2.2MB unpacked)
 * and xlsx (~7.5MB) buy megabytes for poor fidelity; those open externally
 * through the tree's context menu.
 */
import { useMemo, type ComponentType } from 'react'
import type { MarkdownLabels } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ChangedFile } from '../contract.ts'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import { FileTypeIcon } from './file-type-icon.tsx'
import css from './review.module.css'
import type { PreviewKind } from './preview-kind.ts'

type T = PropsLocale<typeof NS>['t']

type MarkdownComponent = ComponentType<{ text: string; labels: MarkdownLabels }>

/**
 * The shell's shared Markdown renderer, guarded: ui-primitives rides the
 * frozen module table (web seed.ts), so settled shells resolve it at zero
 * bundle cost — but aresolver miss must degrade to the source view, never
 * kill the tab factory. Module-cached after the first call.
 */
let cachedMarkdown: MarkdownComponent | null | undefined
export function markdownRenderer(): MarkdownComponent | null {
  if (cachedMarkdown !== undefined) return cachedMarkdown
  try {
    const mod = require('@deepseek-ai/dsh-client-ui-primitives') as { MarkdownText?: MarkdownComponent }
    cachedMarkdown = mod.MarkdownText ?? null
  } catch {
    cachedMarkdown = null
  }
  return cachedMarkdown
}

export interface PreviewPaneProps {
  file: ChangedFile
  kind: PreviewKind
  /** Source text for markdown/SVG ('' while loading). */
  text: string
  textLoading: boolean
  /** data: URL for raster images and PDFs (null while loading/failed). */
  dataUrl: string | null
  bytesFailed: boolean
  /** The host served only a capped prefix — no partial image/PDF render. */
  bytesTruncated: boolean
  onShowSource: () => void
  t: T
}

/**
 * The preview half of the file view (the source half stays FilePane).
 * @param props - the file, its kind, loaded payloads and the way back.
 */
export function PreviewPane({ file, kind, text, textLoading, dataUrl, bytesFailed, bytesTruncated, onShowSource, t }: PreviewPaneProps) {
  const labels = useMemo<MarkdownLabels>(() => ({
    code: { copyLabel: t('preview.copy'), copiedLabel: t('preview.copied') },
    footnotes: t('preview.footnotes'),
  }), [t])
  const Markdown = kind === 'markdown' ? markdownRenderer() : null
  return (
    <div className={css.diffPane} data-git-review-diff="">
      <div className={css.diffHeader}>
        <FileTypeIcon path={file.path} />
        <span className={css.diffPath}>{file.path}</span>
        <span className={css.diffHeaderSpacer} />
        <span className={css.scopeSwitch} role="group" aria-label={t('preview.toggle')}>
          <button type="button" className={css.scopeBtn + ' ' + css.scopeBtnActive}>
            {t('preview.toggle')}
          </button>
          <button type="button" className={css.scopeBtn} onClick={onShowSource}>
            {t('preview.source')}
          </button>
        </span>
      </div>
      <div className={css.previewScroll}>
        {kind === 'markdown' && (textLoading
          ? <div className={css.paneNotice}>{t('file.loading')}</div>
          : Markdown !== null
            ? <div className={css.previewMd}><Markdown text={text} labels={labels} /></div>
            : <div className={css.paneNotice}>{t('preview.loadFailed')}</div>)}
        {kind === 'image' && (dataUrl !== null && !bytesTruncated
          ? <img className={css.previewImg} src={dataUrl} alt={file.path} />
          : <div className={css.paneNotice}>{
            bytesFailed ? t('preview.loadFailed') : bytesTruncated ? t('preview.tooLarge') : t(textLoading ? 'file.loading' : 'preview.loading')}</div>)}
        {kind === 'pdf' && (dataUrl !== null && !bytesTruncated
          ? <iframe className={css.previewPdf} src={dataUrl} sandbox="" title={file.path} />
          : <div className={css.paneNotice}>{
            bytesFailed ? t('preview.loadFailed') : bytesTruncated ? t('preview.tooLarge') : t('preview.loading')}</div>)}
        <div className={css.diffBottomReserve} />
      </div>
    </div>
  )
}
