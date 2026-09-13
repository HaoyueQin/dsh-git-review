/** In-tab preview kinds by file extension (the extension only gates;
 *  the server mime wins on conflict — a lying extension falls back to the
 *  source view or the binary notice). CSS-free so the check script can
 *  import it under native TS stripping. */
export type PreviewKind = 'markdown' | 'image' | 'pdf' | 'html'

export function previewKindForPath(path: string): PreviewKind | null {
  const lower = path.toLowerCase()
  if (/\.(md|markdown|mdown|mkd|mdx|rmd)$/.test(lower)) return 'markdown'
  if (/\.(png|jpe?g|gif|webp|bmp|avif|svg|ico)$/.test(lower)) return 'image'
  if (/\.pdf$/.test(lower)) return 'pdf'
  if (/\.(html?|xhtml)$/.test(lower)) return 'html'
  return null
}

/**
 * True when an HTML document leans on content the preview sandbox cannot
 * run: the `sandbox=""` iframe never executes scripts, so script/canvas
 * pages render blank or frozen (a canvas scene on a dark body reads as a
 * black pane). CSS and SMIL animations need no script and keep playing.
 * The tag names are anchored behind `<` so lookalikes (`<noscript>`,
 * `<scriptless>`) stay clean; inline `on*=` handlers are deliberately not
 * counted — they degrade interactions, not the rendered frame.
 */
export function needsScriptNotice(text: string): boolean {
  return /<(?:script|canvas)\b/i.test(text)
}
