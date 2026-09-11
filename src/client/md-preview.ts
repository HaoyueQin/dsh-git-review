/**
 * Markdown preview assists: two host-renderer limits fixed client-side
 * before the text reaches the shell's shared renderer —
 *
 * 1. Relative links are disabled (the renderer's design, handover
 *    12.8-⑦) and `data:` URLs degrade to alt text (only absolute http(s)
 *    images paint): repo-relative images (`docs/demo.svg`, banner art)
 *    are rewritten to absolute same-origin asset URLs served by the host
 *    (`GET /dsh-git-review/api/asset`, magic-sniffed image mimes behind
 *    CORP same-origin).
 * 2. Raw block HTML is escaped into tag soup (`<p align>`, `<picture>`,
 *    `<img>`, `<a>` show as literal text). Safe wrappers fall back to
 *    markdown equivalents; anything else passes through untouched.
 *
 * Pure functions — the check script imports this file directly under
 * Node's native TS type stripping (Node >= 23.6).
 */

/** Max repo-relative assets inlined into one markdown preview. */
export const MD_ASSET_CAP = 10

function attr(tag: string, name: string): string | null {
  // Double- or single-quoted values (README sources mix both); unquoted
  // values stay unmatched and the tag degrades the same as a missing attr.
  const hit = new RegExp(name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\')', 'i').exec(tag)
  if (hit === null) return null
  return hit[1] ?? hit[2] ?? null
}

/**
 * Fall back safe HTML wrappers to markdown so the preview shows content
 * instead of escaped tags. `<img>` keeps its alt/src (the asset inliner
 * resolves relative src next); `<a>` keeps text + href; layout-only
 * wrappers (`<p>`, `<picture>`, `<source>`) dissolve into blank lines.
 *
 * Non-navigable link schemes (javascript:, data:, …) degrade to plain text:
 * the shell renderer would unwrap them anyway, so the visible result is
 * identical while the text never carries an executable scheme.
 */
function safeLinkText(text: string, href: string): string {
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href) && !/^(?:https?|mailto):/i.test(href)) return text
  return '[' + text + '](' + href + ')'
}
export function htmlFallbackForPreview(text: string): string {
  // NOTE: block-level tags are anchored at line start WITH their leading
  // whitespace: README sources indent nested tags, and 4+ leading spaces
  // would turn the converted `![..](..)` line into an indented code block.
  return text
    .replace(/^[ \t]*<picture[^>]*>[ \t]*$/gim, '')
    .replace(/^[ \t]*<\/picture>[ \t]*$/gim, '')
    .replace(/^[ \t]*<source[^>]*\/?>[ \t]*$/gim, '')
    .replace(/<picture[^>]*>/gi, '')
    .replace(/<\/picture>/gi, '')
    .replace(/<source[^>]*\/?>/gi, '')
    .replace(/^[ \t]*<img\b[^>]*\/?>/gim, tag => {
      const src = attr(tag.trim(), 'src') ?? ''
      return src === '' ? '' : '![' + (attr(tag, 'alt') ?? '') + '](' + src + ')'
    })
    .replace(/<img\b[^>]*\/?>/gi, tag => {
      const src = attr(tag, 'src') ?? ''
      return src === '' ? '' : '![' + (attr(tag, 'alt') ?? '') + '](' + src + ')'
    })
    .replace(/^[ \t]*<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gim,
      (_whole, dbl: string | undefined, sqt: string | undefined, text: string) => safeLinkText(text, dbl ?? sqt ?? ''))
    .replace(/<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi,
      (_whole, dbl: string | undefined, sqt: string | undefined, text: string) => safeLinkText(text, dbl ?? sqt ?? ''))
    .replace(/<\/?p\b[^>]*>/gi, '\n\n')
}

const INLINE_IMG = /!\[([^\]]*)\]\(\s*<?([^\s)>]+)>?((?:\s+["'][^"']*["'])?\s*)\)/g
const REF_USE = /!\[[^\]]*\]\[([^\]]*)\]/g
const REF_DEF = /^( {0,3}\[[^\]]+\]:\s*<?)([^\s>]+)(>?.*)$/gm

/** Collect rewritable asset URLs: inline `![](url)` plus used reference
 *  definitions (`![][id]` + `[id]: url`), first-seen order, de-duplicated. */
export function collectMdAssets(text: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const take = (url: string): void => {
    if (!seen.has(url)) { seen.add(url); out.push(url) }
  }
  INLINE_IMG.lastIndex = 0
  for (let hit = INLINE_IMG.exec(text); hit !== null; hit = INLINE_IMG.exec(text)) take(hit[2]!)
  const usedIds = new Set<string>()
  REF_USE.lastIndex = 0
  for (let hit = REF_USE.exec(text); hit !== null; hit = REF_USE.exec(text)) usedIds.add(hit[1]!)
  if (usedIds.size > 0) {
    REF_DEF.lastIndex = 0
    for (let hit = REF_DEF.exec(text); hit !== null; hit = REF_DEF.exec(text)) {
      const idHit = /^ {0,3}\[([^\]]+)\]/.exec(hit[0])
      if (idHit !== null && usedIds.has(idHit[1]!)) take(hit[2]!)
    }
  }
  return out
}

/** Defang remote images into same-URL links (click-to-load): the shell
 *  renderer fetches absolute http(s) image URLs on sight (tracking pixels,
 *  IP/UA leak), so remote images become links with an external-image title
 *  instead. Local URLs pass through for the asset pipeline, which runs
 *  after this step (rewritten same-origin URLs never see it). */
export function defangRemoteImages(text: string): string {
  INLINE_IMG.lastIndex = 0
  const inline = text.replace(INLINE_IMG,
    (whole, alt: string, url: string, _title: string) => (/^https?:\/\//i.test(url)
      ? '[' + (alt === '' ? url : alt) + '](' + url + ' "external image")'
      : whole))
  REF_DEF.lastIndex = 0
  const remoteIds = new Set<string>()
  for (let hit = REF_DEF.exec(inline); hit !== null; hit = REF_DEF.exec(inline)) {
    const idHit = /^ {0,3}\[([^\]]+)\]/.exec(hit[0])
    if (idHit !== null && /^https?:\/\//i.test(hit[2]!)) remoteIds.add(idHit[1]!.toUpperCase())
  }
  if (remoteIds.size === 0) return inline
  REF_USE.lastIndex = 0
  return inline.replace(REF_USE, (whole, id: string) => (remoteIds.has(id.toUpperCase()) ? whole.slice(1) : whole))
}

/** Rewrite collected URLs via `table` (raw -> absolute same-origin asset URL;
 *  unknown URLs and surrounding titles survive byte-identical). */
export function rewriteMdAssets(text: string, table: ReadonlyMap<string, string>): string {
  INLINE_IMG.lastIndex = 0
  const inline = text.replace(INLINE_IMG,
    (_whole, alt: string, url: string, title: string) => '![' + alt + '](' + (table.get(url) ?? url) + title + ')')
  REF_DEF.lastIndex = 0
  return inline.replace(REF_DEF,
    (_whole, head: string, url: string, tail: string) => head + (table.get(url) ?? url) + tail)
}

function dirOf(path: string): string {
  const slash = path.lastIndexOf('/')
  return slash === -1 ? '' : path.slice(0, slash)
}

/**
 * Resolve a markdown asset URL against the markdown file's repo-relative
 * path. Returns the repo-relative asset path, or null when the URL is
 * external (`scheme:`, `data:`, `#anchor`), root-escaping (`..` past the
 * repo root), or empty. A leading `/` counts as repo-root-relative (the
 * GitHub convention); `?`/`#` suffixes are cut (cache-busters).
 */
export function resolveMdAsset(mdPath: string, url: string): string | null {
  if (/^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|data:|#)/.test(url)) return null
  // A protocol-relative URL (`//host/path`) is external too: reading it as a
  // repo-root path aimed the asset endpoint at a file that cannot exist.
  if (url.startsWith('//')) return null
  const clean = url.split('#')[0]!.split('?')[0]!
  if (clean === '') return null
  const base = clean.startsWith('/') ? '' : dirOf(mdPath)
  const parts: string[] = []
  for (const seg of (base + '/' + clean.replace(/^\/+/, '')).split('/')) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') {
      if (parts.length === 0) return null
      parts.pop()
      continue
    }
    parts.push(seg)
  }
  return parts.length === 0 ? null : parts.join('/')
}
