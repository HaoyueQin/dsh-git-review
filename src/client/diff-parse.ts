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

/** Strip the a/ b/ prefix git prepends to diff paths. */
function stripPrefix(field: string): string {
  return field.startsWith('a/') || field.startsWith('b/') ? field.slice(2) : field
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
  if (text === '') return EMPTY_DIFF
  const lines = text.split('\n')
  // A trailing '' from the final newline is a split artifact, not a line.
  if (lines[lines.length - 1] === '') lines.pop()
  const result: ParsedDiff = { ...EMPTY_DIFF, hunks: [] }
  let oldNo = 0
  let newNo = 0
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
  const startHunk = (match: RegExpMatchArray, current: ParsedHunk | null): ParsedHunk => {
    flushRun(current)
    const created: ParsedHunk = {
      oldStart: Number(match[1]),
      oldCount: match[2] === undefined ? 1 : Number(match[2]),
      newStart: Number(match[3]),
      newCount: match[4] === undefined ? 1 : Number(match[4]),
      section: (match[5] ?? '').trim(),
      rows: [],
    }
    result.hunks.push(created)
    oldNo = created.oldStart
    newNo = created.newStart
    return created
  }
  let hunk: ParsedHunk | null = null
  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      flushRun(hunk)
      hunk = null
      continue
    }
    if (hunk === null) {
      const hunkMatch = HUNK_RE.exec(line)
      if (hunkMatch !== null) {
        hunk = startHunk(hunkMatch, hunk)
      } else if (line.startsWith('--- ')) {
        const field = line.slice(4).trim()
        if (field === '/dev/null') result.newFile = true
        else result.oldPath = stripPrefix(field)
      } else if (line.startsWith('+++ ')) {
        const field = line.slice(4).trim()
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
      const hunkMatch = HUNK_RE.exec(line)
      hunk = hunkMatch !== null ? startHunk(hunkMatch, hunk) : (flushRun(hunk), hunk)
      continue
    }
    if (line.startsWith('\\')) {
      // "\ No newline at end of file" annotates the cell right before it.
      if (lastCell !== null) lastCell.noNewline = true
      continue
    }
    if (line.startsWith('-')) {
      lastCell = { no: oldNo++, text: line.slice(1) }
      runDels.push(lastCell)
      continue
    }
    if (line.startsWith('+')) {
      lastCell = { no: newNo++, text: line.slice(1) }
      runAdds.push(lastCell)
      continue
    }
    if (line.startsWith(' ') || line === '') {
      flushRun(hunk)
      const text = line === '' ? '' : line.slice(1)
      hunk.rows.push({ kind: 'ctx', left: { no: oldNo++, text }, right: { no: newNo++, text } })
      continue
    }
    // Unknown body line: end the hunk (safety against malformed input).
    flushRun(hunk)
    hunk = null
  }
  flushRun(hunk)
  return result
}
