/**
 * dsh-git-review — pure parsers for the git wire formats the review API is
 * built on: `status --porcelain=v1 -z` and `diff --numstat -z`, plus the
 * merge into the ChangedFile rows the browser half renders. No I/O — the
 * check script imports this file directly under Node's native TS type
 * stripping (Node >= 23.6).
 *
 * Why -z everywhere: NUL separation is the only git output form that never
 * quotes or munges paths, so CJK/space/quote filenames arrive verbatim
 * (paired with `-c core.quotepath=false` at the call site for other outputs).
 */
import type { ChangedFile } from './contract.ts'

/** One `status --porcelain=v1 -z` record. */
export interface PorcelainEntry {
  x: string
  y: string
  path: string
  origPath?: string | undefined
}

/**
 * Parse porcelain v1 with NUL separation. Record shape: `XY <path>`; a
 * rename/copy record (`X` = 'R'|'C') carries the original path as ONE extra
 * NUL-terminated token immediately after its path token — every other record
 * is a single token, which is what makes the walk unambiguous.
 */
export function parsePorcelainV1(raw: string): PorcelainEntry[] {
  if (raw === '') return []
  const tokens = raw.split('\0')
  const entries: PorcelainEntry[] = []
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    // The final NUL yields one empty trailing token; shorter remnants are
    // malformed and skipped rather than mis-parsed.
    if (token === undefined || token.length < 4 || token[2] !== ' ') continue
    const x = token[0]!
    const y = token[1]!
    const path = token.slice(3)
    if (x === 'R' || x === 'C') {
      const origPath = tokens[i + 1]
      // Consume the companion token whether present or not: a rename without
      // it is malformed, and treating its path as a new record would corrupt
      // every following entry.
      i += 1
      entries.push({ x, y, path, origPath: origPath === '' ? undefined : origPath })
    } else {
      entries.push({ x, y, path })
    }
  }
  return entries
}

/** One `diff --numstat -z` record. added/deleted are null for binary ('-'). */
export interface NumstatRow {
  added: number | null
  deleted: number | null
  path: string
  origPath?: string | undefined
}

/**
 * Parse numstat with NUL separation. Plain records are `added\tdeleted\tpath`
 * (binary rows use '-'; a path may contain tabs, so the path is everything
 * after the SECOND tab). Rename/copy records are `added\tdeleted\t` with an
 * EMPTY third field, followed by TWO extra NUL tokens: source path, then
 * destination path (verified against git 2.55: `1\t0\t\0old\0new\0` — the
 * destination lands AFTER the NUL, not in the tab field).
 */
export function parseNumstatZ(raw: string): NumstatRow[] {
  if (raw === '') return []
  const tokens = raw.split('\0')
  const rows: NumstatRow[] = []
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token === undefined || token === '') continue
    const firstTab = token.indexOf('\t')
    const secondTab = firstTab === -1 ? -1 : token.indexOf('\t', firstTab + 1)
    if (secondTab === -1) continue
    const added = token.slice(0, firstTab)
    const deleted = token.slice(firstTab + 1, secondTab)
    const rest = token.slice(secondTab + 1)
    const counts = {
      added: added === '-' ? null : Number(added),
      deleted: deleted === '-' ? null : Number(deleted),
    }
    if (rest === '') {
      // Rename/copy record: source and destination as two NUL tokens.
      const origPath = tokens[i + 1]
      const path = tokens[i + 2]
      i += 2
      if (path !== undefined && path !== '') {
        rows.push({ ...counts, path, origPath: origPath === '' ? undefined : origPath })
      }
    } else {
      rows.push({ ...counts, path: rest })
    }
  }
  return rows
}

/** Index numstat rows by their destination path (rename rows land under the
 *  NEW path — the same path porcelain reports). */
export function numstatIndex(rows: readonly NumstatRow[]): Map<string, NumstatRow> {
  const index = new Map<string, NumstatRow>()
  for (const row of rows) index.set(row.path, row)
  return index
}

/** Case-insensitive occurrence count of `needle` in `haystack` (empty needle → 0). */
export function countOccurrences(haystack: string, needle: string): number {
  if (needle === '') return 0
  const lower = haystack.toLowerCase()
  const q = needle.toLowerCase()
  let count = 0
  let at = lower.indexOf(q)
  while (at !== -1) {
    count += 1
    at = lower.indexOf(q, at + q.length)
  }
  return count
}

/** Search-match options (the optional toggles of the toolbar search). */
export interface MatchOptions {
  caseSensitive?: boolean
  regex?: boolean
}

/** Heuristic ReDoS guard: a group that both contains a quantifier and is
 *  itself quantified ((a+)+$, (x*)*, (a|aa)+) backtracks inside ONE exec
 *  call — no iteration cap can stop it, and the host loop is shared by the
 *  whole harness. Escapes and character classes are stripped first (neither
 *  can hide a group quantifier); suspects degrade to literal matching.
 *  Conservative by design: false positives only lose regex, never hang. */
export function isPathologicalRegex(source: string): boolean {
  const stripped = source.replace(/\\./g, '').replace(/\[([^\]\\]|\\.)*\]/g, '')
  return /\([^()]*[+*{][^()]*\)[+*?{]/.test(stripped) || /\([^()]*\|[^()]*\)[+*?{]/.test(stripped)
}

/** Occurrence count honoring the optional case-sensitivity / regex toggles.
 *  An invalid regex counts as 0 (never throws); a non-regex query is a
 *  literal, non-overlapping scan — the same contract `countOccurrences`
 *  established. */
export function countMatches(haystack: string, needle: string, options: MatchOptions = {}): number {
  if (needle === '') return 0
  if (options.regex === true) {
    // Fail safe: a pathological pattern counts literally instead of hanging.
    if (isPathologicalRegex(needle)) return countMatches(haystack, needle, { ...options, regex: false })
    try {
      const re = new RegExp(needle, options.caseSensitive ? 'g' : 'gi')
      let count = 0
      let match: RegExpExecArray | null
      while ((match = re.exec(haystack)) !== null) {
        count += 1
        if (match.index === re.lastIndex) re.lastIndex += 1
      }
      return count
    } catch {
      return 0
    }
  }
  // The insensitive scan is exactly countOccurrences' contract — one
  // implementation, not two drifting copies.
  if (options.caseSensitive) {
    let count = 0
    let at = haystack.indexOf(needle)
    while (at !== -1) {
      count += 1
      at = haystack.indexOf(needle, at + needle.length)
    }
    return count
  }
  return countOccurrences(haystack, needle)
}

/**
 * Normalize a request-supplied diff-base ref, or null when it is absent or
 * unsafe. ExecFile passes argv literally, so git would otherwise parse a
 * leading '-' as its own option and '..' as a range; this blacklist keeps
 * every accepted value a plain single ref name (CJK/space-free names only —
 * space-containing branch names are rejected rather than escaped).
 */
export function normalizeBaseRef(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const ref = value.trim()
  if (ref === '' || ref.length > 256) return null
  if (ref.startsWith('-') || ref.includes('..') || ref.includes('@{')) return null
  if (/[\s~^:?*\[\\{}]/.test(ref)) return null
  // NUL/control bytes never belong in a ref name (argv smuggling paranoia).
  if (/[\0-\x1f\x7f]/.test(ref)) return null
  return ref
}

/** The well-known empty-tree object id (sha1) — a fresh repository's diff
 *  baseline and the parent stand-in for root commits. */
export const EMPTY_TREE_ID = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

/**
 * The `git diff` range arguments comparing two validated object ids. Both
 * inputs arrive as 40-hex ids the host resolved itself (never raw user
 * text), so concatenation is injection-free. Three-dot (`base...target`)
 * compares the merge-base against target — the GitHub-Compare convention;
 * the empty-tree end (tree object, no commits to merge) falls back to
 * two-dot, which git accepts for a tree-vs-commit comparison.
 */
export function refRange(baseCommit: string, targetCommit: string): string[] {
  return baseCommit === EMPTY_TREE_ID
    ? [baseCommit, targetCommit]
    : [baseCommit + '...' + targetCommit]
}

/**
 * Merge one range's name-status rows with its numstat index into the
 * rendered rows (the ref-range counterpart of mergeStatus): every row is a
 * committed change, so there is no untracked half and `y` is always blank.
 */
export function mergeDiffRows(
  rows: readonly NameStatusRow[],
  numstat: ReadonlyMap<string, NumstatRow>,
): ChangedFile[] {
  return rows.map(row => {
    const stat = numstat.get(row.path)
    // Mirror mergeStatus: a corrupt count (NaN) renders as 0, never NaN.
    const added = stat?.added ?? 0
    const deleted = stat?.deleted ?? 0
    return {
      path: row.path,
      origPath: row.origPath,
      x: row.letter,
      y: ' ',
      added: Number.isFinite(added) ? added : 0,
      deleted: Number.isFinite(deleted) ? deleted : 0,
      binary: stat !== undefined && (stat.added === null || stat.deleted === null),
      untracked: false,
    }
  })
}

/** One `diff --name-status -z` record. */
export interface NameStatusRow {
  /** Status letter: A | C | D | M | R | T (U/X never reach a clean diff). */
  letter: string
  /** Rename/copy similarity score (e.g. '100' from 'R100'), when present. */
  score?: string
  path: string
  origPath?: string
}

/**
 * Parse `git diff --name-status -z`: records are `X<score?>\0path\0`, with
 * rename/copy records carrying TWO paths (source, then destination) — the
 * same companion-token shape porcelain renames use.
 */
export function parseNameStatusZ(raw: string): NameStatusRow[] {
  if (raw === '') return []
  const tokens = raw.split('\0')
  const rows: NameStatusRow[] = []
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token === undefined || token === '') continue
    const letter = token[0]!
    const score = token.length > 1 ? token.slice(1) : undefined
    const firstPath = tokens[i + 1]
    if (firstPath === undefined || firstPath === '') continue
    if (letter === 'R' || letter === 'C') {
      const newPath = tokens[i + 2]
      i += 2
      if (newPath !== undefined && newPath !== '') {
        rows.push(score === undefined
          ? { letter, path: newPath, origPath: firstPath }
          : { letter, score, path: newPath, origPath: firstPath })
      }
    } else {
      i += 1
      rows.push(score === undefined
        ? { letter, path: firstPath }
        : { letter, score, path: firstPath })
    }
  }
  return rows
}

/** One decoration in a `%D` list: the ref name and its display class. */
export interface DecorationEntry {
  name: string
  /** 'head' = local branch (incl. the name behind 'HEAD -> '), 'tag' = a
   *  tag, 'other' = remote/secondary refs. */
  kind: 'head' | 'tag' | 'other'
}

/**
 * Parse the `%D` decorations string (`HEAD -> main, origin/main, tag: v1.0`).
 * 'HEAD -> X' yields TWO entries — the HEAD pointer itself and the branch it
 * names (both heads, matching how graph UIs badge them separately); 'tag: X'
 * becomes a tag; everything else passes through as 'other'.
 */
export function parseDecorations(raw: string): DecorationEntry[] {
  const out: DecorationEntry[] = []
  // Split on ', ' — a ref name may itself contain a comma (git allows one),
  // and splitting on the bare comma fabricated a phantom 'other' entry.
  for (const piece of raw.split(', ')) {
    const item = piece.trim()
    if (item === '') continue
    if (item.startsWith('HEAD -> ')) {
      out.push({ name: 'HEAD', kind: 'head' })
      out.push({ name: item.slice('HEAD -> '.length), kind: 'head' })
    } else if (item.startsWith('tag: ')) {
      out.push({ name: item.slice('tag: '.length), kind: 'tag' })
    } else {
      out.push({ name: item, kind: 'other' })
    }
  }
  return out
}

/** One `git log` record (the wire format `parseLogLines` reads). */
export interface LogLine {
  hash: string
  /** Parent hashes, first-parent first; empty for a root commit. */
  parents: string[]
  authorName: string
  /** Author time, unix seconds (0 when unparseable). */
  timestamp: number
  refs: DecorationEntry[]
  subject: string
  /** Commit-message body (`%b`: everything after the subject line), '' when
   *  the message is subject-only. */
  body: string
}

/** A full object id: SHA-1 (40 hex) or SHA-256 (64 hex). Pinning 40 silently
 *  blanked the graph and blame in a sha256 repository while porcelain and
 *  name-status kept working, so nothing looked broken. */
export const OBJECT_ID_RE = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/
const HASH_RE = OBJECT_ID_RE

/**
 * Parse `git log --all --format=%H%x1f%P%x1f%an%x1f%at%x1f%D%x1f%s%x1f%b%x1e`
 * output: records end with \x1e, fields separate on \x1f. The subject is
 * field 6, the body (which may itself span lines, but never records) is
 * everything after it, joined again; malformed or short records are
 * skipped rather than mis-parsed. Pre-body formats (subject-last, no %b)
 * still parse with body ''. The leading newline git inserts between
 * records is trimmed off the hash field.
 */
/** One blame row parsed from `git blame --porcelain`. */
export interface BlameRow {
  hash: string
  origLine: number
  finalLine: number
  author: string
  timestamp: number
  summary: string
}

/**
 * Parse `git blame --porcelain` output line by line. Each final line's
 * record is `<hash> <origLine> <finalLine>[ <numLines>]` followed (FIRST
 * occurrence of the commit only) by author/summary metadata and (always)
 * by a tab-prefixed content line that closes the record. Commit metadata
 * is cached so rows of repeated commits fill from the cache. A byte-truncated
 * tail record without its content line still yields its row.
 */
export function parseBlamePorcelain(raw: string): BlameRow[] {
  const rows: BlameRow[] = []
  const meta = new Map<string, { author: string; timestamp: number; summary: string }>()
  const HEADER = /^([0-9a-f]{40}(?:[0-9a-f]{24})?) (\d+) (\d+)(?: \d+)?$/
  let current: { hash: string; origLine: number; finalLine: number } | null = null
  const flush = (): void => {
    if (current === null) return
    const cached = meta.get(current.hash) ?? { author: '', timestamp: 0, summary: '' }
    rows.push({ hash: current.hash, origLine: current.origLine, finalLine: current.finalLine, author: cached.author, timestamp: cached.timestamp, summary: cached.summary })
    current = null
  }
  for (const line of raw.split('\n')) {
    if (line === '') continue
    if (line.startsWith('\t')) { flush(); continue }
    const header = HEADER.exec(line)
    if (header !== null) {
      flush()
      current = { hash: header[1]!, origLine: Number(header[2]), finalLine: Number(header[3]) }
      continue
    }
    if (current === null) continue
    const cached = meta.get(current.hash) ?? { author: '', timestamp: 0, summary: '' }
    if (line.startsWith('author ')) {
      cached.author = line.slice(7)
    } else if (line.startsWith('author-time ')) {
      const t = Number(line.slice(12))
      cached.timestamp = Number.isFinite(t) ? t : 0
    } else if (line.startsWith('summary ')) {
      cached.summary = line.slice(8)
    } else {
      continue
    }
    meta.set(current.hash, cached)
  }
  flush()
  return rows
}

export function parseLogLines(raw: string): LogLine[] {
  const out: LogLine[] = []
  for (const record of raw.split('\x1e')) {
    if (record.trim() === '') continue
    const fields = record.split('\x1f')
    if (fields.length < 6) continue
    const hash = fields[0]!.trim()
    if (!HASH_RE.test(hash)) continue
    const parentField = fields[1]!.trim()
    const timestamp = Number(fields[3]!.trim())
    out.push({
      hash,
      parents: parentField === '' ? [] : parentField.split(' '),
      authorName: fields[2]!,
      timestamp: Number.isFinite(timestamp) ? timestamp : 0,
      refs: parseDecorations(fields[4]!),
      subject: (fields[5] ?? '').trim(),
      body: fields.slice(6).join('\x1f').trim(),
    })
  }
  return out
}

/** One `git stash list` entry (the wire format `parseStashLines` reads). */
export interface StashLine {
  /** Stash selector index n (renders as `stash@{n}`; the host validated it). */
  index: number
  /** Author time, unix seconds (0 when unparseable). */
  timestamp: number
  /** The stash's message line (git's default "WIP on …" or a custom one). */
  subject: string
}

/**
 * Parse `git stash list --format=%gd%x1f%at%x1f%gs%x1e` output: same record
 * shape as the log feed. `%gd` is `stash@{N}` — the integer between the
 * braces is the selector the apply/pop/drop calls echo back. Malformed
 * records (or a non-numeric selector) are skipped rather than mis-parsed.
 */
export function parseStashLines(raw: string): StashLine[] {
  const out: StashLine[] = []
  for (const record of raw.split('\x1e')) {
    if (record.trim() === '') continue
    const fields = record.split('\x1f')
    if (fields.length < 3) continue
    const selector = fields[0]!.trim()
    const match = /^stash@\{(\d+)\}$/.exec(selector)
    if (match === null) continue
    const timestamp = Number(fields[1]!.trim())
    out.push({
      index: Number(match[1]),
      timestamp: Number.isFinite(timestamp) ? timestamp : 0,
      subject: fields.slice(2).join('\x1f').trim(),
    })
  }
  return out
}

/** Undo git's header quoting for ---/+++ fields. A quoted field keeps its
 *  inner spaces verbatim (verified against real git: space-padded names are
 *  NOT quoted, so trimming them corrupts the path). C-quoted escapes are
 *  restored at the BYTE level (git quotes raw bytes: an octal run may be
 *  one UTF-8 sequence split across escapes). Unquoted fields keep the
 *  historical trim (some drivers trail a tab after the path).
 *
 *  `core.quotepath=false` only exempts non-ASCII: a path with a quote,
 *  backslash or control byte stays C-quoted, so every reader of a header
 *  path (the diff pane and the search sections both) must come through
 *  here or the counts land on a quoted phantom path. */
export function unquoteHeaderPath(field: string): string {
  const trimmed = field.trim()
  if (trimmed.length < 2 || !trimmed.startsWith('"') || !trimmed.endsWith('"')) return trimmed
  const body = trimmed.slice(1, -1)
  if (!body.includes('\\')) return body
  const encoder = new TextEncoder()
  const bytes: number[] = []
  const pushUtf8 = (text: string): void => {
    for (const byte of encoder.encode(text)) bytes.push(byte)
  }
  for (let i = 0; i < body.length;) {
    if (body[i] !== '\\') {
      pushUtf8(body[i]!)
      i += 1
      continue
    }
    const next = body[i + 1] ?? ''
    if (next === 'n') { bytes.push(0x0a); i += 2; continue }
    if (next === 't') { bytes.push(0x09); i += 2; continue }
    if (next === '\\' || next === '"') { bytes.push(next.charCodeAt(0)); i += 2; continue }
    const octal = /^[0-7]{1,3}/.exec(body.slice(i + 1))
    if (octal !== null) {
      bytes.push(parseInt(octal[0], 8) & 0xff)
      i += 1 + octal[0].length
      continue
    }
    pushUtf8('\\')
    i += 1
  }
  return new TextDecoder().decode(new Uint8Array(bytes))
}

/** One per-file section of a full `git diff` text. */
export interface DiffSection {
  /** Path parsed from the +++ (or ---) header line; null when unclear. */
  path: string | null
  /** Hunk body (everything from the first @@ of the section onward). */
  body: string
}

/**
 * Split a full `git diff` output into per-file sections. The path comes from
 * the `+++ b/<path>` line (deletions fall back to `--- a/<path>`); the body
 * starts at the section's first `@@` so header noise (index/mode lines) never
 * matches a user query.
 */
export function splitDiffSections(diffText: string): DiffSection[] {
  const sections: DiffSection[] = []
  let current: (DiffSection & { started: boolean }) | null = null
  const flush = (): void => {
    if (current !== null) sections.push({ path: current.path, body: current.body })
    current = null
  }
  for (const line of diffText.split('\n')) {
    if (line.startsWith('diff --git ')) {
      flush()
      current = { path: null, body: '', started: false }
      continue
    }
    if (current === null) continue
    if (!current.started) {
      if (line.startsWith('+++ ')) {
        const field = unquoteHeaderPath(line.slice(4))
        if (field !== '/dev/null') current.path = field.startsWith('b/') ? field.slice(2) : field
      } else if (line.startsWith('--- ') && current.path === null) {
        const field = unquoteHeaderPath(line.slice(4))
        if (field !== '/dev/null') current.path = field.startsWith('a/') ? field.slice(2) : field
      } else if (line.startsWith('@@')) {
        current.started = true
        current.body = line + '\n'
      }
      continue
    }
    current.body += line + '\n'
  }
  flush()
  return sections
}

/**
 * Merge porcelain entries with the numstat index into the rendered rows.
 * Untracked files never appear in `diff HEAD` output — their callers pass
 * line counts in through `untrackedCounts` (host reads the files); everything
 * else takes its counts from numstat (0 when the path has no textual diff,
 * e.g. a mode-only change).
 */
export function mergeStatus(
  entries: readonly PorcelainEntry[],
  numstat: ReadonlyMap<string, NumstatRow>,
  untrackedCounts: ReadonlyMap<string, { added: number; binary: boolean }> = new Map(),
): ChangedFile[] {
  return entries.map(entry => {
    const untracked = entry.x === '?'
    const row = numstat.get(entry.path)
    const counted = untrackedCounts.get(entry.path)
    // Binary is an explicit numstat '-' (or the untracked probe's verdict) —
    // a tracked file with NO numstat row is a content-identical change
    // (mode/permission only), which is not binary but "no textual change".
    const binary = untracked
      ? counted?.binary === true
      : row !== undefined && (row.added === null || row.deleted === null)
    const added = untracked ? counted?.added ?? 0 : row?.added ?? 0
    const deleted = untracked ? 0 : row?.deleted ?? 0
    return {
      path: entry.path,
      origPath: entry.origPath,
      x: entry.x,
      y: entry.y,
      added: Number.isFinite(added) ? added : 0,
      deleted: Number.isFinite(deleted) ? deleted : 0,
      binary,
      untracked,
    }
  })
}

/** Previewable content types the file-bytes endpoint serves: raster images
 *  browsers decode natively, SVG (as text), and PDF (sandboxed iframe).
 *  Office formats are deliberately absent — mammoth (~2.2MB unpacked) and
 *  xlsx (~7.5MB) buy megabytes for poor fidelity; those open externally. */
export type PreviewMime =
  | 'image/png'
  | 'image/jpeg'
  | 'image/gif'
  | 'image/webp'
  | 'image/bmp'
  | 'image/avif'
  | 'image/x-icon'
  | 'image/svg+xml'
  | 'application/pdf'

/** Sniff a file's preview mime from its leading bytes — magic, never the
 *  extension (an attacker-controlled `.png` that is really HTML must not
 *  become a content-type). Strict prefix lengths: a truncated signature is
 *  null, not a guess. SVG is text: no NUL anywhere in the probe and,
 *  after whitespace plus one optional XML prolog, a literal `<svg`. */
export function sniffPreviewMime(bytes: Uint8Array): PreviewMime | null {
  const ascii = (at: number, text: string): boolean => {
    if (at + text.length > bytes.length) return false
    for (let k = 0; k < text.length; k++) {
      if (bytes[at + k] !== text.charCodeAt(k)) return false
    }
    return true
  }
  if (bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47
    && bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A) {
    return 'image/png'
  }
  if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg'
  }
  if (bytes.length >= 6 && (ascii(0, 'GIF87a') || ascii(0, 'GIF89a'))) {
    return 'image/gif'
  }
  if (bytes.length >= 12 && ascii(0, 'RIFF') && ascii(8, 'WEBP')) {
    return 'image/webp'
  }
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4D) {
    return 'image/bmp'
  }
  if (bytes.length >= 12 && ascii(4, 'ftyp') && ascii(8, 'avif')) {
    return 'image/avif'
  }
  // ICO: reserved(0) + type(1) — every favicon starts with these 4 bytes.
  if (bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) {
    return 'image/x-icon'
  }
  if (bytes.length >= 5 && ascii(0, '%PDF-')) {
    return 'application/pdf'
  }
  // SVG is text: any NUL in the whole input disqualifies (binary magics
  // already returned above, so only text reaches here).
  for (let n = 0; n < bytes.length; n++) {
    if (bytes[n] === 0) return null
  }
  // Byte-scan the probe (stays binary-safe — no string decoding). XML allows
  // a prolog before the root element and real exporters use it: skip the
  // `<?xml?>` declaration, `<!DOCTYPE …>` declarations and comments in any
  // order. Without this an Inkscape/Illustrator SVG answers "not previewable"
  // and the picture diff shows a load failure.
  let at = 0
  while (at < bytes.length && (bytes[at] === 0x20 || bytes[at] === 0x09 || bytes[at] === 0x0A || bytes[at] === 0x0D)) at += 1
  // Bounded: every branch advances `at`; the guard only stops a pathological
  // prolog from scanning forever.
  for (let prolog = 0; prolog < 16; prolog++) {
    if (ascii(at, '<!--')) {
      at += 4
      while (at < bytes.length && !ascii(at, '-->')) at += 1
      at = Math.min(bytes.length, at + 3)
    } else if (ascii(at, '<!') || ascii(at, '<?')) {
      // DOCTYPE (or any other declaration / processing instruction) runs to
      // the next '>'.
      while (at < bytes.length && bytes[at] !== 0x3E) at += 1
      at += 1
    } else {
      break
    }
    while (at < bytes.length && (bytes[at] === 0x20 || bytes[at] === 0x09 || bytes[at] === 0x0A || bytes[at] === 0x0D)) at += 1
  }
  // '<svg' must end at a tag delimiter — '<svgx…' is not SVG.
  if (ascii(at, '<svg') && (at + 4 >= bytes.length || [0x20, 0x09, 0x0a, 0x0d, 0x3e, 0x2f].includes(bytes[at + 4]!))) {
    return 'image/svg+xml'
  }
  return null
}
