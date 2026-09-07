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

/** One cell's text: syntax tokens color the plain stretches, search matches
 *  wrap in marks. `tokens` null/empty renders the plain search text. */
export function renderMarkedText(text: string, engine: SearchEngine, tokens: TokenSpan[] | null): ReactNode {
  if (tokens === null || tokens.length === 0) return searchParts(text, engine)
  return splitLineByTokens(text, tokens).map((seg, index) => {
    const inner = searchParts(text.slice(seg.start, seg.end), engine)
    return seg.kind === null ? <span key={index}>{inner}</span> : <span key={index} className={tokenClass(seg.kind)}>{inner}</span>
  })
}
