/**
 * In-tab file preview: markdown (the shell's shared renderer), HTML
 * (sandboxed iframe, scripts dead), raster images + SVG (image context,
 * scripts never run), and PDF (sandboxed iframe). Office formats stay out
 * on purpose — mammoth (~2.2MB unpacked) and xlsx (~7.5MB) buy megabytes
 * for poor fidelity; those open externally through the tree's context menu.
 */
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import type { MarkdownLabels } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ChangedFile } from '../contract.ts'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import { FileTypeIcon } from './file-type-icon.tsx'
import { FileCounts } from './file-counts.tsx'
import css from './review.module.css'
import type { PreviewKind } from './preview-kind.ts'

type T = PropsLocale<typeof NS>['t']

/** Zoom ladder for image previews (the −/+ buttons walk these ratios of
 *  natural size; the input accepts any value in between, clamped). */
const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8]

/** Step a zoom ratio along the ladder (exact hits move to the neighbour). */
function stepZoom(current: number, dir: 1 | -1): number {
  let at = 0
  while (at < ZOOM_LEVELS.length - 1 && ZOOM_LEVELS[at]! < current) at += 1
  if (dir > 0) return ZOOM_LEVELS[Math.min(at + (ZOOM_LEVELS[at]! > current ? 0 : 1), ZOOM_LEVELS.length - 1)]!
  return ZOOM_LEVELS[Math.max(at - (ZOOM_LEVELS[at]! < current ? 0 : 1), 0)]!
}

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
  /** True when served markdown text is a capped prefix (same notice as source). */
  textTruncated?: boolean
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
export function PreviewPane({ file, kind, text, textLoading, textTruncated = false, dataUrl, bytesFailed, bytesTruncated, onShowSource, t }: PreviewPaneProps) {
  const labels = useMemo<MarkdownLabels>(() => ({
    code: { copyLabel: t('preview.copy'), copiedLabel: t('preview.copied') },
    footnotes: t('preview.footnotes'),
  }), [t])
  const Markdown = kind === 'markdown' ? markdownRenderer() : null
  /** Image zoom: 'fit' (container width) or an exact ratio of natural size.
   *  Plain wheel keeps scrolling the pane — only Ctrl/Cmd+wheel zooms, so
   *  the control never traps a reader's scroll; the pane instance survives
   *  selection changes, hence the per-file reset. */
  const [zoom, setZoom] = useState<number | 'fit'>('fit')
  const [natW, setNatW] = useState(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => { setZoom('fit'); setNatW(0) }, [file.path])
  /** Fitted ratio (fit never upscales: min 1 with the container width). */
  const fittedRatio = (): number => {
    const el = scrollRef.current
    if (natW <= 0 || el === null || el.clientWidth <= 0) return 1
    return Math.min(1, el.clientWidth / natW)
  }
  const step = (dir: 1 | -1): void => {
    setZoom(current => stepZoom(current === 'fit' ? fittedRatio() : current, dir))
  }
  useEffect(() => {
    const el = scrollRef.current
    if (el === null || kind !== 'image') return
    const onWheel = (event: WheelEvent): void => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const dir: 1 | -1 = event.deltaY < 0 ? 1 : -1
      setZoom(current => stepZoom(current === 'fit' ? fittedRatio() : current, dir))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => { el.removeEventListener('wheel', onWheel) }
  }, [kind, natW])
  const zoomLabel = zoom === 'fit' ? t('preview.zoomFit') : String(Math.round(zoom * 100)) + '%'
  /** Commit a typed percentage (Enter or blur); garbage restores the label. */
  const commitZoom = (input: HTMLInputElement): void => {
    const value = Number(input.value.replace('%', '').trim()) / 100
    if (!Number.isFinite(value) || value < 0.1 || value > 8) {
      input.value = zoomLabel
      return
    }
    setZoom(value)
  }
  const imageReady = kind === 'image' && dataUrl !== null && !bytesTruncated
  return (
    <div className={css.diffPane} data-git-review-diff="">
      <div className={css.diffHeader}>
        <FileTypeIcon path={file.path} />
        <span className={css.diffPath}>{file.path}</span>
        <FileCounts file={file} />
        <span className={css.diffHeaderSpacer} />
        {imageReady && (
          <span className={css.zoomGroup} role="group" aria-label={t('preview.zoomHint')}>
            <button type="button" className={css.zoomBtn} title={t('preview.zoomOut')} aria-label={t('preview.zoomOut')} onClick={() => { step(-1) }}>
              {'\u2212'}
            </button>
            <input
              className={css.zoomInput}
              key={zoomLabel}
              defaultValue={zoomLabel}
              title={t('preview.zoomHint')}
              aria-label={t('preview.zoomHint')}
              spellCheck={false}
              onKeyDown={event => { if (event.key === 'Enter') commitZoom(event.currentTarget) }}
              onBlur={event => { commitZoom(event.currentTarget) }}
            />
            <button type="button" className={css.zoomBtn} title={t('preview.zoomIn')} aria-label={t('preview.zoomIn')} onClick={() => { step(1) }}>
              {'+'}
            </button>
          </span>
        )}
        <span className={css.scopeSwitch} role="group" aria-label={t('preview.toggle')}>
          <button type="button" className={css.scopeBtn + ' ' + css.scopeBtnActive}>
            {t('preview.toggle')}
          </button>
          <button type="button" className={css.scopeBtn} onClick={onShowSource}>
            {t('preview.source')}
          </button>
        </span>
      </div>
      <div className={css.previewScroll} ref={scrollRef}>
        {kind === 'markdown' && (textLoading
          ? <div className={css.paneNotice}>{t('file.loading')}</div>
          : Markdown !== null
            ? <><div className={css.previewMd}><Markdown text={text} labels={labels} /></div>{textTruncated && <div className={css.noticeRow}>{t('file.truncated')}</div>}</>
            : <div className={css.paneNotice}>{t('preview.loadFailed')}</div>)}
        {kind === 'image' && (imageReady
          ? <img
              className={css.previewImg}
              style={zoom === 'fit' ? undefined : { width: Math.max(1, Math.round(natW * zoom)), maxWidth: 'none' }}
              src={dataUrl}
              alt={file.path}
              title={t('preview.zoomHint')}
              onLoad={event => { setNatW(event.currentTarget.naturalWidth) }}
              onDoubleClick={() => { setZoom(current => (current === 'fit' ? 1 : 'fit')) }}
            />
          : <div className={css.paneNotice}>{
            bytesFailed ? t('preview.loadFailed') : bytesTruncated ? t('preview.tooLarge') : t(textLoading ? 'file.loading' : 'preview.loading')}</div>)}
        {kind === 'pdf' && (dataUrl !== null && !bytesTruncated
          ? <iframe className={css.previewPdf} src={dataUrl} sandbox="" title={file.path} />
          : <div className={css.paneNotice}>{
            bytesFailed ? t('preview.loadFailed') : bytesTruncated ? t('preview.tooLarge') : t('preview.loading')}</div>)}
        {kind === 'html' && (textLoading
          ? <div className={css.paneNotice}>{t('file.loading')}</div>
          : <iframe className={css.previewPdf} srcDoc={text} sandbox="" title={file.path} />)}
        <div className={css.diffBottomReserve} />
      </div>
    </div>
  )
}
