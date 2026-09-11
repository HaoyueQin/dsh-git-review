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
  const cut = (start: number, end: number): ReactNode => {
    const nodes: ReactNode[] = []
    let cursor = start
    for (const [from, to] of ranges) {
      if (to <= start || from >= end) continue
      const left = Math.max(from, start)
      const right = Math.min(to, end)
      if (left > cursor) nodes.push(text.slice(cursor, left))
      nodes.push(<mark key={left} className={css.matchMark}>{text.slice(left, right)}</mark>)
      cursor = right
    }
    if (cursor < end) nodes.push(text.slice(cursor, end))
    return nodes.length === 0 ? null : nodes
  }
  return splitLineByTokens(text, tokens).map((seg, index) => {
    const inner = cut(seg.start, seg.end)
    return seg.kind === null ? <span key={index}>{inner}</span> : <span key={index} className={tokenClass(seg.kind)}>{inner}</span>
  })
}
