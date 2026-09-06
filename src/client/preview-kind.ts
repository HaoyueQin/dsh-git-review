/** In-tab preview kinds by file extension (the extension only gates;
 *  the server mime wins on conflict — a lying extension falls back to the
 *  source view or the binary notice). CSS-free so the check script can
 *  import it under native TS stripping. */
export type PreviewKind = 'markdown' | 'image' | 'pdf' | 'html'

export function previewKindForPath(path: string): PreviewKind | null {
  const lower = path.toLowerCase()
  if (/\.(md|markdown|mdown)$/.test(lower)) return 'markdown'
  if (/\.(png|jpe?g|gif|webp|bmp|avif|svg)$/.test(lower)) return 'image'
  if (/\.pdf$/.test(lower)) return 'pdf'
  if (/\.(html?|xhtml)$/.test(lower)) return 'html'
  return null
}
