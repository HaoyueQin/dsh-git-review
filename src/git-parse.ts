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
    return {
      path: row.path,
      origPath: row.origPath,
      x: row.letter,
      y: ' ',
      added: stat === undefined ? 0 : stat.added ?? 0,
      deleted: stat === undefined ? 0 : stat.deleted ?? 0,
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

/** Index name-status rows by destination path. */
export function nameStatusIndex(rows: readonly NameStatusRow[]): Map<string, NameStatusRow> {
  const index = new Map<string, NameStatusRow>()
  for (const row of rows) index.set(row.path, row)
  return index
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
        const field = line.slice(4).trim()
        if (field !== '/dev/null') current.path = field.startsWith('b/') ? field.slice(2) : field
      } else if (line.startsWith('--- ') && current.path === null) {
        const field = line.slice(4).trim()
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
