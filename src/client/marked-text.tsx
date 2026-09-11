/** Shared search-match + syntax-token text composition for the diff and
 *  file panes (one implementation — the panes used to duplicate it with
 *  drifting semantics; the file pane once dropped token colors on hits).
 *  Gap-preserving: tokens cover only kw/str/num/com, so every segment
 *  (plain gaps included) must render, or identifiers/whitespace vanish. */
import type { ReactNode } from 'react'
import type { SearchEngine } from './diff-parse.ts'
import { splitLineByTokens, type TokenSpan } from './highlight.ts'
import css from './review.module.css'

/** One cell's text with search matches wrapped in <mark> (odd split parts). */
export function searchParts(text: string, engine: SearchEngine): ReactNode {
  const parts = engine.parts(text)
  if (parts.length === 1) return parts[0]
  return parts.map((part, index) =>
    index % 2 === 1 ? <mark key={index} className={css.matchMark}>{part}</mark> : part,
  )
}

function tokenClass(kind: TokenSpan['kind']): string {
  return kind === 'kw' ? css.tokKw : kind === 'str' ? css.tokStr : kind === 'num' ? css.tokNum : css.tokCom
}

/** The match ranges of one whole line, as [start, end) pairs. */
function matchRanges(text: string, engine: SearchEngine): Array<readonly [number, number]> {
  const ranges: Array<readonly [number, number]> = []
  const parts = engine.parts(text)
  let at = 0
  for (let i = 0; i < parts.length; i++) {
    const length = parts[i]!.length
    if (i % 2 === 1) ranges.push([at, at + length] as const)
    at += length
  }
  return ranges
}

/** One cell's text: syntax tokens color the plain stretches, search matches
 *  wrap in marks. `tokens` null/empty renders the plain search text.
 *
 *  Matches are computed on the WHOLE line and then cut into each token
 *  segment: searching every segment on its own missed a query that spans a
 *  token boundary ('const foo'), which still counted as a hit (and stayed
 *  navigable) while nothing on the row was marked. */
export function renderMarkedText(text: string, engine: SearchEngine, tokens: TokenSpan[] | null): ReactNode {
  if (tokens === null || tokens.length === 0) return searchParts(text, engine)
  const ranges = matchRanges(text, engine)
  /** Cut the matches overlapping [start, end). `from` is the first range that
   *  can still reach into this segment — walk past it and a long match spanning
   *  a token boundary would be lost. */
  const cut = (start: number, end: number, from: number): ReactNode => {
    const nodes: ReactNode[] = []
    let cursor = start
    for (let i = from; i < ranges.length; i++) {
      const [rangeStart, rangeEnd] = ranges[i]!
      if (rangeStart >= end) break
      const left = Math.max(rangeStart, start)
      const right = Math.min(rangeEnd, end)
      if (right <= left) continue
      if (left > cursor) nodes.push(text.slice(cursor, left))
      nodes.push(<mark key={left} className={css.matchMark}>{text.slice(left, right)}</mark>)
      cursor = right
    }
    if (cursor < end) nodes.push(text.slice(cursor, end))
    return nodes.length === 0 ? null : nodes
  }
  // Segments and ranges are both position-ordered, so one forward cursor skips
  // the ranges each segment has already passed: O(segments + ranges) instead
  // of re-scanning every match for every token of the line.
  let rangeAt = 0
  return splitLineByTokens(text, tokens).map((seg, index) => {
    while (rangeAt < ranges.length && ranges[rangeAt]![1] <= seg.start) rangeAt += 1
    const inner = cut(seg.start, seg.end, rangeAt)
    return seg.kind === null ? <span key={index}>{inner}</span> : <span key={index} className={tokenClass(seg.kind)}>{inner}</span>
  })
}
