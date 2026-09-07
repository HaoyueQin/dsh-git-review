/**
 * Unified diff parser + side-by-side row pairing for the review pane.
 *
 * Input is one file's `git diff` text (the host fetches it; untracked files
 * arrive as a synthesized /dev/null pseudo diff with the same shape). The
 * hunk structure comes from git itself, so pairing needs no LCS: within one
 * changed run the i-th deletion pairs with the i-th addition and leftovers
 * render one-sided — the same convention GitHub/Codex side-by-side views use.
 *
 * No I/O and no React — the check script imports this file directly under
 * Node's native TS type stripping (Node >= 23.6).
 */
/** Pure diff parsing: no I/O, no React. */
import { isPathologicalRegex } from '../git-parse.ts'

/** Above this row count any pane renders a prefix (with a notice). */
export const MAX_RENDER_ROWS = 20_000

/** One side's cell: 1-based file line number, content, EOF-newline flag. */
export interface DiffCell {
  no: number
  text: string
  /** True when git's "\ No newline at end of file" follows this line. */
  noNewline?: boolean
}

/** One rendered side-by-side row; `left` is the old side, `right` the new. */
export interface PairRow {
  /** 'ctx' both sides equal · 'del' left only · 'add' right only · 'pair' both, changed. */
  kind: 'ctx' | 'del' | 'add' | 'pair'
  left: DiffCell | null
  right: DiffCell | null
}

/** One @@ hunk with its paired body rows. */
export interface ParsedHunk {
  oldStart: number
  oldCount: number
  newStart: number
  newCount: number
  /** Trailing section heading git appends after the @@ marker ('' when none). */
  section: string
  /** True when the consumed rows disagree with the @@ counts (a cut or
   *  corrupt hunk — the renderer says so instead of silently short-showing). */
  damaged: boolean
  rows: PairRow[]
}

/** Parse result for one file's unified diff. */
export interface ParsedDiff {
  hunks: ParsedHunk[]
  binary: boolean
  /** Paths with a/ b/ prefixes stripped; null for /dev/null sides. */
  oldPath: string | null
  newPath: string | null
  /** `--- /dev/null` (creation). */
  newFile: boolean
  /** `+++ /dev/null` (deletion). */
  deletedFile: boolean
  /** git emitted `rename from/to` headers. */
  rename: boolean
}

const EMPTY_DIFF: ParsedDiff = {
  hunks: [],
  binary: false,
  oldPath: null,
  newPath: null,
  newFile: false,
  deletedFile: false,
  rename: false,
}

const HUNK_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/

/**
 * Cut one hunk (with the enclosing file header) out of a raw unified diff
 * as a standalone patch `git apply` accepts — the wire form of the per-hunk
 * stage/unstage/revert operations. The text is sliced verbatim (never
 * re-rendered from the parsed rows, whose pairing order is a display
 * concept), so line numbers, context and \\-markers stay byte-identical to
 * what git produced. Returns null for an out-of-range index or a diff with
 * no hunks (binary/empty).
 */
export function buildHunkPatch(raw: string, hunkIndex: number): string | null {
  if (raw === '' || hunkIndex < 0) return null
  const lines = raw.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  const hunkStarts: number[] = []
  let firstHunk = -1
  let fileCount = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]!.startsWith('diff --git ')) fileCount += 1
    if (HUNK_RE.test(lines[i]!)) {
      hunkStarts.push(i)
      if (firstHunk < 0) firstHunk = i
    }
  }
  if (hunkIndex >= hunkStarts.length) return null
  // Multi-file raws would mix file1's header into file2's patch (git apply
  // would mis-apply): the only caller serves single-file diffs, so fail.
  if (fileCount > 1) return null
  const headEnd = firstHunk
  const bodyStart = hunkStarts[hunkIndex]!
  const bodyEnd = hunkIndex + 1 < hunkStarts.length ? hunkStarts[hunkIndex + 1]! : lines.length
  return [...lines.slice(0, headEnd), ...lines.slice(bodyStart, bodyEnd), ''].join('\n')
}

/** Undo git's header quoting for ---/+++ fields. A quoted field keeps its
 *  inner spaces verbatim (verified against real git: space-padded names are
 *  NOT quoted, so trimming them corrupts the path). C-quoted escapes are
 *  restored at the BYTE level (git quotes raw bytes: an octal run may be
 *  one UTF-8 sequence split across escapes). Unquoted fields keep the
 *  historical trim (some drivers trail a tab after the path). */
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

/** Strip the a/ b/ prefix git prepends to diff paths (runs after
 *  unquoteHeaderPath: a quoted 'a/...' is a prefix, a literal leading
 *  quote is pathological input). */
function stripPrefix(field: string): string {
  const unquoted = field.length >= 2 && field.startsWith('"') && field.endsWith('"') ? field.slice(1, -1) : field
  return unquoted.startsWith('a/') || unquoted.startsWith('b/') ? unquoted.slice(2) : unquoted
}

/** Pair one changed run: i-th deletion with i-th addition, extras one-sided. */
function pairRun(dels: readonly DiffCell[], adds: readonly DiffCell[], rows: PairRow[]): void {
  const paired = Math.min(dels.length, adds.length)
  for (let i = 0; i < paired; i++) rows.push({ kind: 'pair', left: dels[i]!, right: adds[i]! })
  for (let i = paired; i < dels.length; i++) rows.push({ kind: 'del', left: dels[i]!, right: null })
  for (let i = paired; i < adds.length; i++) rows.push({ kind: 'add', left: null, right: adds[i]! })
}

/**
 * Parse one file's unified diff text.
 *
 * Robust to the header zoo git emits (index/similarity/mode/rename lines):
 * anything before the first @@ that is not recognized is ignored, and an
 * unknown line inside a hunk ends it (hunks resume on the next @@).
 */
export function parseUnifiedDiff(text: string): ParsedDiff {
  // Fresh copy: the shared base must never escape mutably (a caller pushing
  // into .hunks would poison every later empty parse).
  if (text === '') return { ...EMPTY_DIFF, hunks: [] }
  const lines = text.split('\n')
  // A trailing '' from the final newline is a split artifact, not a line.
  if (lines[lines.length - 1] === '') lines.pop()
  const result: ParsedDiff = { ...EMPTY_DIFF, hunks: [] }
  let oldNo = 0
  let newNo = 0
  let consumedOld = 0
  let consumedNew = 0
  let runDels: DiffCell[] = []
  let runAdds: DiffCell[] = []
  let lastCell: DiffCell | null = null
  // Hunk state flows through parameters/returns (not closures): TypeScript's
  // control-flow analysis cannot see assignments made inside arrow functions,
  // so closure-held `hunk` narrows to `null`/`never` in the loop body.
  const flushRun = (current: ParsedHunk | null): void => {
    if (current !== null && (runDels.length > 0 || runAdds.length > 0)) {
      pairRun(runDels, runAdds, current.rows)
    }
    runDels = []
    runAdds = []
  }
  // Close the open hunk, flagging it when the consumed rows disagree with
  // its @@ counts (a mid-hunk truncation or corrupt input).
  const finishHunk = (): void => {
    flushRun(hunk)
    if (hunk !== null && (consumedOld !== hunk.oldCount || consumedNew !== hunk.newCount)) hunk.damaged = true
    hunk = null
  }
  const startHunk = (match: RegExpMatchArray): ParsedHunk => {
    const created: ParsedHunk = {
      oldStart: Number(match[1]),
      oldCount: match[2] === undefined ? 1 : Number(match[2]),
      newStart: Number(match[3]),
      newCount: match[4] === undefined ? 1 : Number(match[4]),
      section: (match[5] ?? '').trim(),
      damaged: false,
      rows: [],
    }
    result.hunks.push(created)
    oldNo = created.oldStart
    newNo = created.newStart
    consumedOld = 0
    consumedNew = 0
    // A new hunk owns its cells: a stale marker must not leak across.
    lastCell = null
    return created
  }
  let hunk: ParsedHunk | null = null
  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      finishHunk()
      // A later '\ No newline' marker must not annotate the previous
      // file's last cell (multi-file texts share this walk).
      lastCell = null
      continue
    }
    if (hunk === null) {
      const hunkMatch = HUNK_RE.exec(line)
      if (hunkMatch !== null) {
        finishHunk()
        hunk = startHunk(hunkMatch)
      } else if (line.startsWith('--- ')) {
        const field = unquoteHeaderPath(line.slice(4))
        if (field === '/dev/null') result.newFile = true
        else result.oldPath = stripPrefix(field)
      } else if (line.startsWith('+++ ')) {
        const field = unquoteHeaderPath(line.slice(4))
        if (field === '/dev/null') result.deletedFile = true
        else result.newPath = stripPrefix(field)
      } else if (line.startsWith('rename from ') || line.startsWith('rename to ')) {
        result.rename = true
      } else if (line.startsWith('Binary files ') || line === 'GIT binary patch') {
        result.binary = true
      }
      // index/similarity/old mode/new mode/... : deliberately ignored.
      continue
    }
    if (line.startsWith('@')) {
      // A non-hunk '@' line is malformed input: end the hunk (per the
      // docstring above), never silently continue it.
      const hunkMatch = HUNK_RE.exec(line)
      if (hunkMatch !== null) {
        finishHunk()
        hunk = startHunk(hunkMatch)
      } else {
        finishHunk()
      }
      lastCell = null
      continue
    }
    if (line.startsWith('\\')) {
      // "\ No newline at end of file" annotates the cell right before it.
      if (lastCell !== null) lastCell.noNewline = true
      continue
    }
    if (line.startsWith('-')) {
      lastCell = { no: oldNo++, text: line.slice(1) }
      if (hunk !== null) consumedOld += 1
      runDels.push(lastCell)
      continue
    }
    if (line.startsWith('+')) {
      lastCell = { no: newNo++, text: line.slice(1) }
      if (hunk !== null) consumedNew += 1
      runAdds.push(lastCell)
      continue
    }
    if (line.startsWith(' ') || line === '') {
      flushRun(hunk)
      // A context-looking line outside any hunk is stray input, not a row:
      // without this guard `hunk.rows` would throw on null.
      if (hunk === null) continue
      const text = line === '' ? '' : line.slice(1)
      consumedOld += 1
      consumedNew += 1
      hunk.rows.push({ kind: 'ctx', left: { no: oldNo++, text }, right: { no: newNo++, text } })
      continue
    }
    // Unknown body line: end the hunk (safety against malformed input).
    flushRun(hunk)
    hunk = null
  }
  finishHunk()
  return result
}

/**
 * Split `text` around case-insensitive occurrences of `search`: odd-index
 * entries are the matched substrings, even-index the gaps between them.
 * An empty query (or no match) yields `[text]`.
 */
export function splitByMatch(text: string, search: string): string[] {
  if (search === '') return [text]
  const q = search.toLowerCase()
  const lower = text.toLowerCase()
  const parts: string[] = []
  let cursor = 0
  let at = lower.indexOf(q)
  while (at !== -1) {
    parts.push(text.slice(cursor, at), text.slice(at, at + q.length))
    cursor = at + q.length
    at = lower.indexOf(q, cursor)
  }
  parts.push(text.slice(cursor))
  return parts
}

/** Whether either side of the row contains a match. */
export function rowHasMatch(row: PairRow, engine: SearchEngine): boolean {
  if (!engine.active) return false
  return (row.left !== null && engine.test(row.left.text))
    || (row.right !== null && engine.test(row.right.text))
}

/** Rows (across all hunks) containing at least one match — the side-by-side
 *  navigation count. */
export function countMatchRows(parsed: ParsedDiff, engine: SearchEngine): number {
  if (!engine.active) return 0
  let count = 0
  for (const hunk of parsed.hunks) {
    for (const row of hunk.rows) {
      if (rowHasMatch(row, engine)) count += 1
    }
  }
  return count
}

/* ── search engine (regex / case options, optional) ─────────────────── */

/** The options the toolbar search offers (off by default). */
export interface SearchSpec {
  query: string
  /** Case-sensitive matching (default: insensitive). */
  caseSensitive?: boolean
  /** Treat the query as a regular expression (default: literal). */
  regex?: boolean
}

export interface SearchEngine {
  /** Split into unmatched/matched parts (odd indices are the matches). */
  parts(text: string): string[]
  /** Match count (0 for an empty query, an invalid regex, or 'no matches'). */
  count(text: string): number
  /** Whether the text contains at least one match. */
  test(text: string): boolean
  /** True when the spec is active and the query itself compiled. */
  active: boolean
}

/** Build the search engine for one spec. A regex that fails to compile
 *  degrades to an engine that matches nothing (never throws). */
export function makeSearchEngine(spec: SearchSpec): SearchEngine {
  const query = spec.query
  const empty: SearchEngine = {
    parts: (text: string) => [text],
    count: () => 0,
    test: () => false,
    active: false,
  }
  if (query.trim() === '') return empty
  const flags = (spec.caseSensitive ? '' : 'i') + 'g'
  // A nested-quantifier pattern backtracks inside ONE exec call and would
  // hang the tab on long lines: degrade to literal like the host matcher.
  if (spec.regex === true && !isPathologicalRegex(query)) {
    let re: RegExp
    try {
      re = new RegExp(query, flags)
    } catch {
      return empty
    }
    return {
      parts: (text: string) => {
        const out: string[] = []
        let cursor = 0
        re.lastIndex = 0
        let match: RegExpExecArray | null
        while ((match = re.exec(text)) !== null) {
          if (match.index === re.lastIndex) re.lastIndex += 1
          out.push(text.slice(cursor, match.index), match[0])
          cursor = match.index + match[0].length
        }
        out.push(text.slice(cursor))
        return out
      },
      count: (text: string) => {
        let countValue = 0
        re.lastIndex = 0
        let match: RegExpExecArray | null
        while ((match = re.exec(text)) !== null) {
          countValue += 1
          if (match.index === re.lastIndex) re.lastIndex += 1
        }
        return countValue
      },
      test: (text: string) => { re.lastIndex = 0; return re.test(text) },
      active: true,
    }
  }
  const q = spec.caseSensitive ? query : query.toLowerCase()
  const lowerCached = new Map<string, string>()
  const lower = (text: string): string => {
    // Long lines skip the cache: they are the memory hogs (full text kept
    // twice per entry) and the least likely to repeat.
    if (text.length > 1024) return spec.caseSensitive ? text : text.toLowerCase()
    const cached = lowerCached.get(text)
    if (cached !== undefined) return cached
    const value = spec.caseSensitive ? text : text.toLowerCase()
    if (lowerCached.size < 2000) lowerCached.set(text, value)
    return value
  }
  return {
    parts: (text: string) => {
      const haystack = lower(text)
      const parts: string[] = []
      let cursor = 0
      let at = haystack.indexOf(q)
      while (at !== -1) {
        parts.push(text.slice(cursor, at), text.slice(at, at + q.length))
        cursor = at + q.length
        at = haystack.indexOf(q, cursor)
      }
      parts.push(text.slice(cursor))
      return parts
    },
    count: (text: string) => {
      const haystack = lower(text)
      let countValue = 0
      let at = haystack.indexOf(q)
      while (at !== -1) {
        countValue += 1
        at = haystack.indexOf(q, at + q.length)
      }
      return countValue
    },
    test: (text: string) => lower(text).includes(q),
    active: true,
  }
}

/* ── unified (single-column) rendering model ────────────────────────── */

/** One rendered line of the unified (single-column) view. */
export interface UnifiedLine {
  /** 'ctx' unchanged · 'del' old side only · 'add' new side only. */
  kind: 'ctx' | 'del' | 'add'
  /** The side's line number (left for ctx/del, right for add). */
  no: number
  text: string
  noNewline?: boolean
  /** The source side-by-side row (search/comment stats derive from it). */
  pair: PairRow
}

/** Expand one hunk's side-by-side rows into unified lines: a replacement
 *  (pair) renders as its deletion line followed by its addition line —
 *  the conventional unified-diff shape. */
export function unifyHunkRows(rows: readonly PairRow[]): UnifiedLine[] {
  const out: UnifiedLine[] = []
  for (const row of rows) {
    if (row.kind === 'pair') {
      if (row.left !== null) out.push({ kind: 'del', no: row.left.no, text: row.left.text, noNewline: row.left.noNewline, pair: row })
      if (row.right !== null) out.push({ kind: 'add', no: row.right.no, text: row.right.text, noNewline: row.right.noNewline, pair: row })
      continue
    }
    if (row.kind === 'ctx') {
      if (row.left !== null) out.push({ kind: 'ctx', no: row.left.no, text: row.left.text, noNewline: row.left.noNewline, pair: row })
    } else if (row.kind === 'del') {
      if (row.left !== null) out.push({ kind: 'del', no: row.left.no, text: row.left.text, noNewline: row.left.noNewline, pair: row })
    } else if (row.kind === 'add') {
      if (row.right !== null) out.push({ kind: 'add', no: row.right.no, text: row.right.text, noNewline: row.right.noNewline, pair: row })
    }
  }
  return out
}

/** Matched unified lines across all hunks — the navigation count when the
 *  pane renders single-column (a replacement pair counts twice). */
export function countUnifiedMatches(parsed: ParsedDiff, engine: SearchEngine): number {
  if (!engine.active) return 0
  let count = 0
  for (const hunk of parsed.hunks) {
    for (const line of unifyHunkRows(hunk.rows)) {
      if (engine.test(line.text)) count += 1
    }
  }
  return count
}

/* ── word-level (in-line) highlight ──────────────────────────────────── */

/** Half-open [start, end) changed spans of one side's text, ascending. */
export type WordSpans = ReadonlyArray<readonly [number, number]>

/** Changed spans of a replacement pair: `old` indexes the deletion side,
 *  `new` the addition side. */
export interface WordRegions {
  old: WordSpans
  new: WordSpans
}

/** Rows longer than this skip the word highlight (LCS cost grows with the
 *  product of the lengths; real rewrites are usually single long lines). */
export const WORD_HIGHLIGHT_MAX_LEN = 240

/** Total character-pair DP budget one parsed diff may spend (roughly 300
 *  typical replacement rows) — the hard bound that keeps a 20k-row diff's
 *  worst case off the render path. */
export const WORD_HIGHLIGHT_BUDGET = 2_000_000

/** Whether a pair is worth a DP: quick shared-character ratio over the
 *  multiset intersection (O(n+m)), below it the line is a rewrite and
 *  intra-line spans would render nearly everything as changed anyway. */
const WORD_HIGHLIGHT_MIN_RATIO = 0.3

/** Shared-character ratio over the multiset intersection, in O(n+m) time
 *  (code-point aware). Must run BEFORE any DP: it is the cheap rejection. */
function sharedCharRatio(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0
  const [short, long] = a.length <= b.length ? [a, b] : [b, a]
  const counts = new Map<string, number>()
  for (const ch of short) counts.set(ch, (counts.get(ch) ?? 0) + 1)
  let shared = 0
  for (const ch of long) {
    const left = counts.get(ch) ?? 0
    if (left > 0) {
      counts.set(ch, left - 1)
      shared += 1
    }
  }
  return shared / Math.max(a.length, b.length)
}

/** Dissolve trivial interior equalities in a changed-marks array, in place.
 *
 *  Borrowed from google/diff-match-patch `Diff_cleanupSemantic`: an equality
 *  is eliminated when it is "smaller or equal to the edits on both sides of
 *  it" — there, `max(insertions, deletions)` before AND after; here, the
 *  adjacent changed-run lengths on this side. A dissolved gap merges its
 *  neighbours, so the scan repeats until no gap qualifies (the original
 *  rewinds its pointer the same way). O(n) per pass, a pass dissolves at
 *  least one gap, gaps are finite — always terminates. */
function dissolveTrivialEqualities(marks: Uint8Array): void {
  for (;;) {
    let dissolved = false
    let k = 0
    while (k < marks.length) {
      if (marks[k] === 1) { k += 1; continue }
      let end = k
      while (end < marks.length && marks[end] === 0) end += 1
      // The runs touching the string edges anchor the change and stay.
      if (k > 0 && end < marks.length) {
        let left = k - 1
        while (left >= 0 && marks[left] === 1) left -= 1
        const leftLen = k - 1 - left
        let right = end
        while (right < marks.length && marks[right] === 1) right += 1
        const rightLen = right - end
        if (end - k <= leftLen && end - k <= rightLen) {
          marks.fill(1, k, end)
          dissolved = true
        }
      }
      k = end
    }
    if (!dissolved) return
  }
}

/** Character-level LCS changed spans for one replacement pair, or null when
 *  the pair is too long, too dissimilar, or budget is exhausted — null means
 *  "render the plain row" and is always safe. */
function lcsWordRegions(a: string, b: string): WordRegions | null {
  if (a.length === 0 || b.length === 0) return null
  if (a.length > WORD_HIGHLIGHT_MAX_LEN || b.length > WORD_HIGHLIGHT_MAX_LEN) return null
  if (a === b) return null
  if (sharedCharRatio(a, b) < WORD_HIGHLIGHT_MIN_RATIO) return null
  const rows = a.length + 1
  const cols = b.length + 1
  const dp = new Uint16Array(rows * cols)
  for (let i = 1; i < rows; i++) {
    const ca = a.charCodeAt(i - 1)
    for (let j = 1; j < cols; j++) {
      dp[i * cols + j] = ca === b.charCodeAt(j - 1)
        ? dp[(i - 1) * cols + j - 1] + 1
        : Math.max(dp[(i - 1) * cols + j], dp[i * cols + j - 1])
    }
  }
  // Walk the DP backwards marking changed characters per side, then sweep
  // the marks into ascending half-open spans. (The similarity gate already
  // ran up front as an O(n+m) precheck — an LCS ratio here could only agree.)
  const oldMarks = new Uint8Array(a.length)
  const newMarks = new Uint8Array(b.length)
  let i = a.length
  let j = b.length
  while (i > 0 && j > 0) {
    if (a.charCodeAt(i - 1) === b.charCodeAt(j - 1)) {
      i -= 1
      j -= 1
      continue
    }
    if (dp[(i - 1) * cols + j] >= dp[i * cols + j - 1]) {
      oldMarks[i - 1] = 1
      i -= 1
    } else {
      newMarks[j - 1] = 1
      j -= 1
    }
  }
  while (i > 0) {
    oldMarks[i - 1] = 1
    i -= 1
  }
  while (j > 0) {
    newMarks[j - 1] = 1
    j -= 1
  }
  // Semantic cleanup (google/diff-match-patch Diff_cleanupSemantic): an
  // interior equality no longer than the edits on BOTH sides of it is a
  // coincidental single-letter match, not shared content — dissolve it into
  // the surrounding change so unrelated lines render as a few big spans
  // instead of alphabet salad. Leading/trailing equalities are kept (they
  // anchor the change, the common-prefix/suffix the eye scans for). Runs to
  // a fixpoint like the original's rewind: one dissolve can expose the next.
  dissolveTrivialEqualities(oldMarks)
  dissolveTrivialEqualities(newMarks)
  const spansOf = (marks: Uint8Array): WordSpans => {
    const spans: [number, number][] = []
    let start = -1
    for (let k = 0; k < marks.length; k++) {
      if (marks[k] === 1 && start === -1) start = k
      if (marks[k] === 0 && start !== -1) {
        spans.push([start, k])
        start = -1
      }
    }
    if (start !== -1) spans.push([start, marks.length])
    return spans
  }
  return { old: spansOf(oldMarks), new: spansOf(newMarks) }
}

/**
 * Budgeted, memoized word-highlight pass over one parsed diff.
 *
 * Created once per parse (DiffPane), consumed per row: `pair(row)` returns
 * the pair's regions (or null) and never recomputes a row (WeakSet guard),
 * so re-renders — search flutters, selection changes — stay DP-free. When
 * the budget runs out later rows degrade to plain rendering, the same
 * philosophy that caps render rows.
 */
export interface WordHighlighter {
  /** Changed spans for one replacement row (null = render plain). */
  pair(row: PairRow): WordRegions | null
}

export function makeWordHighlighter(budget: number = WORD_HIGHLIGHT_BUDGET): WordHighlighter {
  let remaining = budget
  const memo = new WeakMap<PairRow, WordRegions | null>()
  return {
    pair(row: PairRow): WordRegions | null {
      if (row.kind !== 'pair' || row.left === null || row.right === null) return null
      const cached = memo.get(row)
      if (cached !== undefined) return cached
      let regions: WordRegions | null = null
      const left = row.left.text
      const right = row.right.text
      // Cheap rejection before any DP: empty side, oversized side, or the
      // quick shared-character ratio (inside lcsWordRegions). The budget
      // pays only for pairs that actually render highlighted — a discarded
      // pair must not starve the rows after it.
      if (left.length <= WORD_HIGHLIGHT_MAX_LEN && right.length <= WORD_HIGHLIGHT_MAX_LEN
        && left.length > 0 && right.length > 0 && left !== right) {
        const cost = left.length * right.length
        if (cost <= remaining) {
          const candidate = lcsWordRegions(left, right)
          if (candidate !== null) {
            remaining -= cost
            regions = candidate
          }
        }
      }
      memo.set(row, regions)
      return regions
    },
  }
}

