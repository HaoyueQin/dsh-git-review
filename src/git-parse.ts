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
