/**
 * The picture half of one file's diff: both ends of an image comparison in
 * four modes — side by side (the split/unified choice picks the axis), swipe,
 * onion skin and a difference blend — plus a placeholder for an end with no
 * file (an added or deleted picture). The ends arrive as decoded `data:`
 * URLs; the overlay modes draw both into one shared frame sized by the
 * GitHub Desktop rule (each end aspect-fitted, never upscaled, the largest
 * wins) so the two pictures line up.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import css from './review.module.css'

type T = PropsLocale<typeof NS>['t']

/** The four ways to read an image comparison. */
export type ImageCompareMode = 'side' | 'swipe' | 'onion' | 'difference'

/** One end's load state (a null dataUrl while loading/failed/absent). */
export interface ImageEndState {
  /** Decoded `data:` URL, or null while loading or when no file exists here. */
  dataUrl: string | null
  /** True when the source carries no file at this end (added/deleted). */
  missing: boolean
  /** True when the host served only a prefix — nothing decodable. */
  truncated: boolean
  /** True when the read failed for a reason other than absence. */
  failed: boolean
}

/** The mode buttons' dictionary keys (static so the union stays typed). */
const MODE_LABEL = {
  side: 'image.mode.side',
  swipe: 'image.mode.swipe',
  onion: 'image.mode.onion',
  difference: 'image.mode.difference',
} as const

/** The mode buttons in display order. */
const MODES: readonly ImageCompareMode[] = ['side', 'swipe', 'onion', 'difference']

export interface ImageDiffPaneProps {
  before: ImageEndState
  after: ImageEndState
  mode: ImageCompareMode
  onModeChange: (mode: ImageCompareMode) => void
  /** Side-by-side axis: true stacks the two ends (the unified column). */
  stacked: boolean
  /** End captions (a ref name, or the worktree/base wording). */
  beforeLabel: string
  afterLabel: string
  t: T
}

/** Natural pixel size of one end (null until its `<img>` reports it). */
interface Natural {
  w: number
  h: number
}

/** The comparison body of the diff pane (the header stays DiffPane's). */
export function ImageDiffPane({ before, after, mode, onModeChange, stacked, beforeLabel, afterLabel, t }: ImageDiffPaneProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const dragging = useRef(false)
  const [availW, setAvailW] = useState(0)
  const [natural, setNatural] = useState<{ before: Natural | null; after: Natural | null }>({ before: null, after: null })
  /** Swipe divider position and onion-skin top-layer opacity, both 0–100. */
  const [swipe, setSwipe] = useState(50)
  const [opacity, setOpacity] = useState(50)
  // The pane instance survives a selection change, so a new pair of ends
  // starts from the neutral gesture state.
  useEffect(() => {
    setNatural({ before: null, after: null })
    setSwipe(50)
    setOpacity(50)
  }, [before.dataUrl, after.dataUrl])
  // Overlay modes need the width actually available (the tree divider can be
  // dragged at any time), so follow the scroll box's size.
  useEffect(() => {
    const el = scrollRef.current
    if (el === null) return
    // clientWidth includes the scroll box's own padding, so measuring it
    // whole lets the frame overflow the content box by that padding.
    const update = (): void => {
      const style = getComputedStyle(el)
      const padding = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)
      setAvailW(Math.max(0, el.clientWidth - (Number.isFinite(padding) ? padding : 0)))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => { observer.disconnect() }
  }, [])
  /** The shared frame: each end aspect-fitted into the available width, the
   *  largest of the two wins, and nothing is ever upscaled. */
  const frame = useMemo(() => {
    const fits: Natural[] = []
    for (const naturalEnd of [natural.before, natural.after]) {
      if (naturalEnd === null || naturalEnd.w <= 0 || naturalEnd.h <= 0) continue
      const scale = availW > 0 ? Math.min(1, availW / naturalEnd.w) : 1
      fits.push({ w: Math.max(1, Math.round(naturalEnd.w * scale)), h: Math.max(1, Math.round(naturalEnd.h * scale)) })
    }
    if (fits.length === 0) return null
    return { w: Math.max(...fits.map(fit => fit.w)), h: Math.max(...fits.map(fit => fit.h)) }
  }, [natural, availW])
  const learn = (key: 'before' | 'after', size: Natural): void => {
    setNatural(current => (current[key]?.w === size.w && current[key]?.h === size.h ? current : { ...current, [key]: size }))
  }
  /** The notice one end shows instead of a picture (null = a picture). */
  const endNotice = (end: ImageEndState): string | null => {
    if (end.dataUrl !== null) return null
    if (end.missing) return t('image.missingSide')
    if (end.truncated) return t('preview.tooLarge')
    if (end.failed) return t('preview.loadFailed')
    return t('preview.loading')
  }
  /** One end as a captioned figure (the side-by-side layout and the single
   *  -sided fallback both use it). */
  const endFigure = (key: 'before' | 'after', label: string, end: ImageEndState): ReactNode => {
    const notice = endNotice(end)
    const size = natural[key]
    return (
      <figure className={css.imageEnd} key={key}>
        <figcaption className={css.imageEndCap}>
          <span className={css.imageEndLabel}>{label}</span>
          {size !== null && <span className={css.imageEndSize}>{size.w + ' \u00d7 ' + size.h}</span>}
        </figcaption>
        {notice !== null || end.dataUrl === null
          ? <div className={css.imageEndBlank}>{notice}</div>
          : <img
              className={css.imageEndImg}
              src={end.dataUrl}
              alt={label}
              onLoad={event => { learn(key, { w: event.currentTarget.naturalWidth, h: event.currentTarget.naturalHeight }) }}
            />}
      </figure>
    )
  }
  const swipeAt = (clientX: number): void => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (rect === undefined || rect.width <= 0) return
    setSwipe(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)))
  }
  const bothLoaded = before.dataUrl !== null && after.dataUrl !== null
  /** True while an end has neither arrived nor been decided (absent / too
   *  large / failed) — the "one side only" notice must not fire mid-load. */
  const endLoading = (end: ImageEndState): boolean => end.dataUrl === null && !end.missing && !end.truncated && !end.failed
  const oneSided = !endLoading(before) && !endLoading(after) && (before.missing || after.missing)
  const overlay = mode !== 'side' && bothLoaded && frame !== null
  return (
    <div className={css.imageCompareScroll} ref={scrollRef}>
      <div className={css.imageToolRow}>
        <span className={css.scopeSwitch} role="group" aria-label={t('image.mode.label')}>
          {MODES.map(candidate => (
            <button
              key={candidate}
              type="button"
              className={css.scopeBtn + (mode === candidate ? ' ' + css.scopeBtnActive : '')}
              aria-pressed={mode === candidate}
              title={t(MODE_LABEL[candidate])}
              onClick={() => { onModeChange(candidate) }}
            >
              {t(MODE_LABEL[candidate])}
            </button>
          ))}
        </span>
        <span className={css.imageHint}>{
          mode === 'swipe' ? t('image.swipeHint') : mode === 'onion' ? t('image.onionHint') : mode === 'difference' ? t('image.diffHint') : ''
        }</span>
      </div>
      {mode !== 'side' && oneSided && (
        <div className={css.noticeRow}>{t('image.oneSide')}</div>
      )}
      {overlay
        ? (
          <>
            <div className={css.imageOverlayWrap}>
              <div className={css.imageFrame} ref={frameRef} style={{ width: frame.w, height: frame.h }}>
                {/* Bottom layer: the new picture. Swipe clips the old one over
                    the left half, onion fades it in, difference blends it. */}
                <img className={css.imageLayer} src={after.dataUrl!} alt={afterLabel} />
                {mode === 'swipe' && (
                  <>
                    <div className={css.imageClip} style={{ width: swipe + '%' }}>
                      <img
                        className={css.imageLayerFixed}
                        style={{ width: frame.w, height: frame.h }}
                        src={before.dataUrl!}
                        alt={beforeLabel}
                      />
                    </div>
                    <div
                      className={css.imageSwipeBar}
                      style={{ left: swipe + '%' }}
                      role="slider"
                      tabIndex={0}
                      aria-label={t('image.swipeHint')}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(swipe)}
                      onPointerDown={event => {
                        dragging.current = true
                        event.currentTarget.setPointerCapture(event.pointerId)
                      }}
                      onPointerMove={event => { if (dragging.current) swipeAt(event.clientX) }}
                      onPointerUp={event => {
                        dragging.current = false
                        event.currentTarget.releasePointerCapture(event.pointerId)
                      }}
                      // A cancelled gesture (touch lost, context menu, mode
                      // switch) must clear the flag too, or the divider starts
                      // following the bare pointer.
                      onPointerCancel={() => { dragging.current = false }}
                      onLostPointerCapture={() => { dragging.current = false }}
                      onKeyDown={event => {
                        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
                        event.preventDefault()
                        const step = event.shiftKey ? 10 : 1
                        setSwipe(current => Math.min(100, Math.max(0, current + (event.key === 'ArrowRight' ? step : -step))))
                      }}
                    />
                  </>
                )}
                {mode === 'onion' && (
                  <img
                    className={css.imageLayer + ' ' + css.imageLayerOnion}
                    style={{ opacity: opacity / 100 }}
                    src={before.dataUrl!}
                    alt={beforeLabel}
                  />
                )}
                {mode === 'difference' && (
                  // Blended against the bottom layer (the new picture), so the
                  // top one must be the OLD end — blending after onto after
                  // would difference the picture with itself (a black frame).
                  <img
                    className={css.imageLayer + ' ' + css.imageLayerBlend}
                    src={before.dataUrl!}
                    alt={beforeLabel}
                  />
                )}
              </div>
            </div>
            {mode === 'onion' && (
              <div className={css.imageSliderRow}>
                <span className={css.imageEndLabel}>{beforeLabel}</span>
                <input
                  className={css.imageSlider}
                  type="range"
                  min={0}
                  max={100}
                  value={opacity}
                  aria-label={t('image.onionHint')}
                  title={t('image.onionHint')}
                  onChange={event => { setOpacity(Number(event.currentTarget.value)) }}
                />
                <span className={css.imageEndLabel}>{afterLabel}</span>
              </div>
            )}
          </>
        )
        : (
          <div className={stacked ? css.imagePairStack : css.imagePairRow}>
            {endFigure('before', beforeLabel, before)}
            {endFigure('after', afterLabel, after)}
          </div>
        )}
      <div className={css.diffBottomReserve} />
    </div>
  )
}
