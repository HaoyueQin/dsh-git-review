/**
 * dsh-git-review — host half.
 *
 * Read-only git introspection of the session workspace repository, served on
 * this plugin's own prefix route (the same webServer pattern dsh-diff-stat
 * ships):
 *
 *   POST /dsh-git-review/api/status       { cwd, base?, target? }
 *   POST /dsh-git-review/api/file-diff    { cwd, path, untracked?, full?, scope?, base?, target? }
 *   POST /dsh-git-review/api/file-content { cwd, path, ref? }
 *   POST /dsh-git-review/api/blame        { cwd, path }
 *   POST /dsh-git-review/api/file-history { cwd, path }
 *   POST /dsh-git-review/api/list-files   { cwd }
 *   POST /dsh-git-review/api/search       { cwd, query, base?, target? }
 *   POST /dsh-git-review/api/refs         { cwd }
 *   POST /dsh-git-review/api/commit       { cwd, message, mode?, amend?, confirm: true }
 *   POST /dsh-git-review/api/push         { cwd, confirm: true }
 *   POST /dsh-git-review/api/last-commit  { cwd }
 *   POST /dsh-git-review/api/stage        { cwd, paths[], confirm: true }
 *   POST /dsh-git-review/api/unstage      { cwd, paths[], confirm: true }
 *   POST /dsh-git-review/api/discard      { cwd, paths[], confirm: true }   (irreversible)
 *   POST /dsh-git-review/api/hunk-op      { cwd, path, patch, action, confirm: true }  (action stage|unstage|revert)
 *   POST /dsh-git-review/api/fetch        { cwd, confirm: true }
 *   POST /dsh-git-review/api/stash        { cwd, action, index?, includeUntracked?, confirm: true }
 *   POST /dsh-git-review/api/reset        { cwd, commit, mode?, confirm: true }   (mode soft|mixed|hard)
 *   POST /dsh-git-review/api/revert       { cwd, commit, confirm: true }
 *   POST /dsh-git-review/api/cherry-pick  { cwd, commit, confirm: true }
 *   POST /dsh-git-review/api/merge        { cwd, name, noFf?, confirm: true }
 *   POST /dsh-git-review/api/pull         { cwd, rebase?, confirm: true }
 *   POST /dsh-git-review/api/conflict-resolve { cwd, path, side, confirm: true }   (side ours|theirs)
 *   POST /dsh-git-review/api/conflict-finish  { cwd, action, kind, confirm: true } (action continue|abort)
 *   POST /dsh-git-review/api/branch-create  { cwd, name, startPoint?, confirm: true }
 *   POST /dsh-git-review/api/branch-switch  { cwd, name, confirm: true }
 *   POST /dsh-git-review/api/branch-delete  { cwd, name, force?, confirm: true }
 *   POST /dsh-git-review/api/branch-rename  { cwd, name, newName, confirm: true }
 *   GET  /dsh-git-review/api/ping
 *
 * `status`/`file-diff` accept an optional `base` ref name (validated by
 * normalizeBaseRef, re-verified via `rev-parse --verify --end-of-options`):
 * when it resolves to a commit other than HEAD the comparison runs against
 * that commit (worktree vs base) instead of HEAD.
 *
 * Passing `target` as well switches to the ref-range mode (any two refs):
 * base and target both resolve to commit ids and the diff is the three-dot
 * `base...target` (merge-base vs target, the GitHub-Compare convention).
 * `status` then reports the range's rows instead of porcelain ones, and
 * `scope`/untracked probing do not apply.
 *
 * `scope` splits the worktree-vs-HEAD diff into its porcelain halves:
 * 'all' (default) = worktree vs HEAD, 'staged' = index vs HEAD (`--cached`),
 * 'unstaged' = worktree vs index (plain `git diff`).
 *
 * The Remote API was evaluated first and rejected for an external plugin:
 * mounting a new client namespace requires the harness build's generated
 * codecs plus an explicit api-remotes composition choice (docs/api-gateway.md,
 * "Adding a Host Remote package is an explicit choice by the Client
 * composition owner"), so the plugin-served route is the one sanctioned
 * channel left. Trust model follows dsh-diff-stat: same-origin and
 * unauthenticated like every plugin-served Web API, therefore no more
 * powerful than the page that calls it — here, read-only git commands whose
 * every path is fenced inside the session workspace's repository.
 *
 * All git output is NUL/verbatim safe: `--no-optional-locks` (never contend
 * with a running agent's index.lock), `-c core.quotepath=false`, `-z` wire
 * formats (see git-parse.ts). The diff base is HEAD, or the empty-tree id
 * when HEAD is unborn (a fresh repository's staged files must still review).
 * ponytail: the empty-tree literal is sha1-only; sha256 repositories would
 * need `git hash-object -t tree /dev/null` at status time.
 */
import { execFile, spawn } from 'node:child_process'
import { lstat, mkdtemp, open, realpath, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { isAbsolute, join, relative, resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { mergeStatus, numstatIndex, parseNumstatZ, parsePorcelainV1, parseStashLines } from './git-parse.ts'
import { countMatches, EMPTY_TREE_ID, mergeDiffRows, normalizeBaseRef, parseBlamePorcelain, parseLogLines, parseNameStatusZ, refRange, splitDiffSections } from './git-parse.ts'
import { installSettings } from './settings-schema.ts'
import type { ChangedFile, GitBlamePayload, GitCommitFilesPayload, GitFileContentPayload, GitFileDiffPayload, GitFileHistoryPayload, GitLastCommitPayload, GitListFilesPayload, GitLogPayload, GitRefsPayload, GitSearchPayload, GitStashEntry, GitStatusPayload, GitWritePayload, OpenAppsPayload } from './contract.ts'

/** A bare 40-hex object id (the only commit-id form accepted over the wire). */
const HASH_ONLY_RE = /^[0-9a-f]{40}$/

export const name = 'dsh-git-review'

/** The webServer service hosts this plugin's fenced prefix route. */
export const inject = ['webServer']

/** The plugin's own API prefix (package name; '/'-safe in a URL path). */
const API_PREFIX = '/dsh-git-review/api'
/** Request body cap — status/file-diff bodies are tiny. */
const BODY_CAP = 64 * 1024
/** One git invocation's wall clock; local repos answer far under this. */
const GIT_TIMEOUT_MS = 30_000
/** execFile kill-switch; DIFF_CAP below is the real answer-size contract. */
const GIT_MAX_BUFFER = 64 * 1024 * 1024
/** Diff text cap: larger answers truncate at a line boundary (flagged). */
const DIFF_CAP = 2 * 1024 * 1024
/** Untracked pseudo-diff read cap (parity with dsh-diff-stat's READ_CAP). */
const READ_CAP = 512 * 1024
/** Worktree files hashed per status call for the reviewed markers. */
const BLOB_HASH_CAP = 200

/** Structural webServer contract this plugin depends on (inject: 'webServer'). */
interface WebServerService {
  register(registration: {
    kind: 'prefix'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

/**
 * Env vars that would hijack git's repository/index resolution: a harness
 * host process (or its parent shell) may carry GIT_DIR/GIT_WORK_TREE from an
 * unrelated context, and `-C <root>` does NOT override an explicit GIT_DIR.
 * Stripping them pins every invocation to the `-C` workspace (dock-git's
 * env-sanitization precedent).
 */
const GIT_ENV_KEYS = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_COMMON_DIR'] as const

export function gitEnv(): NodeJS.ProcessEnv {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && !GIT_ENV_KEYS.includes(key as (typeof GIT_ENV_KEYS)[number])) env[key] = value
  }
  // History operations (merge/revert/cherry-pick) can spawn an editor for
  // messages even with --no-edit on older gits; pin it non-interactive.
  env['GIT_EDITOR'] = 'true'
  return env
}

/** Run one read-only git command in `root`; resolve stdout, reject with a
 *  message that carries git's stderr (its user-facing diagnostics). */
function runGit(root: string, args: readonly string[]): Promise<string> {
  return new Promise((resolvePromise, rejectPromise) => {
    execFile('git', ['-C', root, '--no-optional-locks', '-c', 'core.quotepath=false', ...args], {
      timeout: GIT_TIMEOUT_MS,
      maxBuffer: GIT_MAX_BUFFER,
      windowsHide: true,
      encoding: 'utf8',
      env: gitEnv(),
    }, (error, stdout, stderr) => {
      if (error !== null) {
        const detail = stderr.trim() || String(error.message ?? error)
        rejectPromise(new Error('git ' + args[0] + ' failed: ' + detail))
      } else {
        resolvePromise(stdout)
      }
    })
  })
}

/** Path containment: candidate is root itself or below it (no .. escape). */
function inside(root: string, candidate: string): boolean {
  const child = relative(root, candidate)
  return child === '' || (!child.startsWith('..') && !isAbsolute(child))
}

/** The repository serving `cwd`, or null when cwd is not inside a worktree. */
async function resolveRepository(cwd: string): Promise<string | null> {
  let workspace: string
  try {
    workspace = await realpath(cwd)
  } catch {
    return null
  }
  try {
    return (await runGit(workspace, ['rev-parse', '--show-toplevel'])).trim() || null
  } catch {
    return null
  }
}

/** Resolve a validated ref to a diff-range endpoint id, or null when it
 *  fails. The empty-tree literal passes through (a tree id, the root-commit
 *  baseline); everything else must resolve to a commit. */
async function resolveRangeRef(repoRoot: string, ref: string): Promise<string | null> {
  if (ref === EMPTY_TREE_ID) return ref
  try {
    const commit = (await runGit(repoRoot, ['rev-parse', '--verify', '--end-of-options', ref + '^{commit}'])).trim()
    return commit === '' ? null : commit
  } catch {
    return null
  }
}

/** Resolve a repo-relative request path to a fenced absolute path. */
function fenceRepoPath(repoRoot: string, requestedPath: string): string {
  if (typeof requestedPath !== 'string' || requestedPath === '') {
    throw new Error('path is required')
  }
  const candidate = resolve(repoRoot, requestedPath)
  if (!inside(repoRoot, candidate) || candidate === repoRoot) {
    throw new Error('path is outside the repository')
  }
  return candidate
}

/** The diff base argument for `git diff`: HEAD, or the empty tree id when
 *  HEAD is unborn (detected once per status; file-diff re-detects cheaply). */
async function diffBase(repoRoot: string): Promise<{ base: string; unbornHead: boolean }> {
  try {
    return { base: (await runGit(repoRoot, ['rev-parse', '--verify', 'HEAD'])).trim(), unbornHead: false }
  } catch {
    return { base: EMPTY_TREE_ID, unbornHead: true }
  }
}

/** Read at most maxBytes of a file (prefix reads only — a huge untracked
 *  file must never enter memory whole just to count its lines). */
async function readPrefix(absPath: string, maxBytes: number): Promise<{ bytes: Buffer; truncated: boolean }> {
  const handle = await open(absPath, 'r')
  try {
    const buf = Buffer.alloc(maxBytes)
    const { bytesRead } = await handle.read(buf, 0, maxBytes, 0)
    return { bytes: buf.subarray(0, bytesRead), truncated: bytesRead === maxBytes }
  } finally {
    await handle.close()
  }
}

/**
 * Line count + binary probe for one untracked file, bounded by READ_CAP:
 * a NUL byte anywhere in the prefix marks binary; otherwise the count is the
 * newline total (a final line without its newline still counts).
 */
async function probeUntracked(repoRoot: string, relPath: string): Promise<{ added: number; binary: boolean } | null> {
  const absPath = resolve(repoRoot, relPath)
  if (!inside(repoRoot, absPath)) return null
  try {
    const stat = await lstat(absPath)
    if (!stat.isFile()) return null
  } catch {
    return null
  }
  try {
    const { bytes } = await readPrefix(absPath, READ_CAP)
    if (bytes.includes(0)) return { added: 0, binary: true }
    let added = 0
    for (let at = bytes.indexOf(0x0a); at !== -1; at = bytes.indexOf(0x0a, at + 1)) added += 1
    if (bytes.length > 0 && bytes[bytes.length - 1] !== 0x0a) added += 1
    return { added, binary: false }
  } catch {
    return null
  }
}

/**
 * Synthesize the /dev/null pseudo diff an untracked file cannot get from
 * `git diff`. Same unified shape the parser expects; text beyond READ_CAP
 * truncates (flagged), NUL bytes route to the binary payload instead.
 */
async function untrackedPseudoDiff(repoRoot: string, relPath: string): Promise<GitFileDiffPayload | null> {
  const absPath = resolve(repoRoot, relPath)
  let size: number
  try {
    const stat = await lstat(absPath)
    if (!stat.isFile()) return null
    size = stat.size
  } catch {
    return null
  }
  let bytes: Buffer
  try {
    bytes = (await readPrefix(absPath, READ_CAP)).bytes
  } catch {
    return null
  }
  if (bytes.includes(0)) return { ok: true, binary: true, diff: '', truncated: false, size }
  let text = bytes.toString('utf8')
  const truncated = text.length > 0 && size > READ_CAP
  const lines = text.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  const header = [
    'diff --git a/' + relPath + ' b/' + relPath,
    '--- /dev/null',
    '+++ b/' + relPath,
  ]
  if (lines.length === 0) return { ok: true, binary: false, diff: header.join('\n'), truncated: false }
  header.push('@@ -0,0 +1,' + lines.length + ' @@')
  text = header.concat(lines.map(line => '+' + line)).join('\n')
  return { ok: true, binary: false, diff: text, truncated }
}

/** Binary markers git writes into an otherwise textual diff. */
function diffSaysBinary(diffText: string): boolean {
  const head = diffText.slice(0, diffText.indexOf('@@') === -1 ? diffText.length : diffText.indexOf('@@'))
  return head.includes('\nBinary files ') || head.startsWith('Binary files ') || head.includes('\nGIT binary patch')
}

/** Cut oversized diff text at a line boundary (a mid-line cut would render a
 *  phantom partial line). */
function capDiff(diffText: string): { diff: string; truncated: boolean } {
  if (diffText.length <= DIFF_CAP) return { diff: diffText, truncated: false }
  const cut = diffText.lastIndexOf('\n', DIFF_CAP)
  return { diff: cut === -1 ? '' : diffText.slice(0, cut), truncated: true }
}

/** The kinds of in-progress history operations the tab can surface. */
type OperationKind = 'merge' | 'rebase' | 'cherry-pick' | 'revert'

/** Detect a mid-operation state (merge/rebase/cherry-pick/revert) by
 *  probing its marker ref: whichever `rev-parse --verify` answers exists. */
async function detectInProgress(repoRoot: string): Promise<OperationKind | null> {
  const probes: ReadonlyArray<[OperationKind, string]> = [
    ['merge', 'MERGE_HEAD'],
    ['rebase', 'REBASE_HEAD'],
    ['cherry-pick', 'CHERRY_PICK_HEAD'],
    ['revert', 'REVERT_HEAD'],
  ]
  for (const [kind, marker] of probes) {
    try {
      await runGit(repoRoot, ['rev-parse', '-q', '--verify', marker])
      return kind
    } catch { // marker absent — next probe
    }
  }
  return null
}

/** One `status` answer: repo detection, porcelain + numstat in one shot.
 *  With a validated `base` override the tracked rows come from a
 *  worktree-vs-base name-status/numstat pair instead (untracked unchanged).
 *  With a `target` too, the ref-range mode reports `base...target` rows and
 *  the worktree (porcelain/untracked) is not consulted at all. */
/** The one git flag behind the toolbar's ignore-whitespace toggle (whitespace-only
 *  edits are the loudest review noise, see the competitor survey). */
const WS_FLAG = ['--ignore-all-space'] as const

export async function gitStatus(cwd: unknown, base: unknown, target: unknown, ws: unknown): Promise<GitStatusPayload | { ok: false; isRepository: boolean; error: string }> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) {
    return { ok: false, isRepository: false, error: 'not a git repository (or git is unavailable)' }
  }
  const baseRef = normalizeBaseRef(base)
  const targetRef = normalizeBaseRef(target)
  if (targetRef !== null) {
    // Ref-range mode: two resolved commit ids, `base...target` (refRange
    // picks two-dot when the base end is the empty-tree id). Untracked rows
    // and staged/unstaged halves are worktree concepts and do not apply.
    const startRef = baseRef ?? 'HEAD'
    const [branchRaw, baseCommit, targetCommit] = await Promise.all([
      runGit(repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD']).catch(() => ''),
      resolveRangeRef(repoRoot, startRef),
      resolveRangeRef(repoRoot, targetRef),
    ])
    if (baseCommit === null || targetCommit === null) {
      return { ok: false, isRepository: true, error: 'cannot resolve diff range: ' + startRef + '...' + targetRef }
    }
    const range = refRange(baseCommit, targetCommit)
    const wsFlags = ws === true ? WS_FLAG : []
    const [numstatRaw, nameStatusRaw] = await Promise.all([
      runGit(repoRoot, ['diff', '--numstat', '-z', '--no-color', '-M', ...wsFlags, ...range]),
      runGit(repoRoot, ['diff', '--name-status', '-z', '--no-color', '-M', ...wsFlags, ...range]),
    ])
    const files = mergeDiffRows(parseNameStatusZ(nameStatusRaw), numstatIndex(parseNumstatZ(numstatRaw)))
    let added = 0
    let deleted = 0
    for (const file of files) {
      added += file.added
      deleted += file.deleted
    }
    const branch = branchRaw.trim()
    return {
      ok: true,
      root: repoRoot,
      branch: branch === '' ? null : branch,
      base: baseCommit,
      unbornHead: false,
      baseRef: startRef,
      files,
      totals: { added, deleted },
    }
  }
  const { base: headCommit, unbornHead } = await diffBase(repoRoot)
  const overrideCommit = baseRef === null
    ? null
    : await resolveRangeRef(repoRoot, baseRef).then(commit => (commit !== null && commit !== headCommit && commit !== EMPTY_TREE_ID ? commit : null))
  const wsFlags = ws === true ? WS_FLAG : []
  const [branchRaw, porcelainRaw, numstatRaw, nameStatusRaw, inProgress] = await Promise.all([
    runGit(repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD']).catch(() => ''),
    runGit(repoRoot, ['status', '--porcelain=v1', '-z', '--untracked-files=all']),
    overrideCommit !== null
      ? runGit(repoRoot, ['diff', '--numstat', '-z', '--no-color', '-M', ...wsFlags, overrideCommit])
      : runGit(repoRoot, ['diff', '--numstat', '-z', '--no-color', '-M', ...wsFlags, unbornHead ? EMPTY_TREE_ID : 'HEAD']),
    overrideCommit !== null
      ? runGit(repoRoot, ['diff', '--name-status', '-z', '--no-color', '-M', ...wsFlags, overrideCommit])
      : Promise.resolve(''),
    detectInProgress(repoRoot),
  ])
  const porcelainEntries = parsePorcelainV1(porcelainRaw)
  const numstat = numstatIndex(parseNumstatZ(numstatRaw))
  // Tracked rows: name-status vs base when overridden, porcelain otherwise —
  // both normalize into PorcelainEntry shapes for mergeStatus. Untracked
  // ('?') rows always come from porcelain: git diff never lists them.
  const finalEntries = overrideCommit !== null
    ? [
      ...parseNameStatusZ(nameStatusRaw).map(row => ({
        x: row.letter,
        y: ' ',
        path: row.path,
        origPath: row.origPath,
      })),
      ...porcelainEntries.filter(entry => entry.x === '?'),
    ]
    : porcelainEntries
  // Untracked files have no numstat row: probe each once (bounded reads).
  const untrackedCounts = new Map<string, { added: number; binary: boolean }>()
  for (const entry of finalEntries) {
    if (entry.x !== '?') continue
    const probe = await probeUntracked(repoRoot, entry.path)
    if (probe !== null) untrackedCounts.set(entry.path, probe)
  }
  const files: ChangedFile[] = mergeStatus(finalEntries, numstat, untrackedCounts)
  // Worktree blob hashes (the reviewed marker rides them): one hash-object
  // process covers every existing worktree file; deleted rows have no file
  // and stay blob-less, which the client renders as "not viewable".
  const hashable = finalEntries
    .filter(entry => entry.x !== 'D' && entry.y !== 'D')
    .map(entry => entry.path)
    .slice(0, BLOB_HASH_CAP)
  if (hashable.length > 0) {
    try {
      const hashesRaw = await runGit(repoRoot, ['hash-object', '--', ...hashable])
      const hashes = hashesRaw.split('\n').filter(line => line !== '')
      const blobByPath = new Map<string, string>()
      for (let i = 0; i < hashable.length && i < hashes.length; i++) {
        if (HASH_ONLY_RE.test(hashes[i]!)) blobByPath.set(hashable[i]!, hashes[i]!)
      }
      for (const file of files) {
        const blob = blobByPath.get(file.path)
        if (blob !== undefined) file.blob = blob
      }
    } catch {
      // hash-object failed (permissions, weird paths): every row stays
      // blob-less and the viewed UI simply hides — status itself is fine.
    }
  }
  let added = 0
  let deleted = 0
  for (const file of files) {
    added += file.added
    deleted += file.deleted
  }
  const branch = branchRaw.trim()
  // Ahead/behind vs the upstream (worktree mode only): `HEAD...@{upstream}`
  // left = local-only commits, right = upstream-only. A branch without an
  // upstream (or an unborn HEAD) simply has no counts — the pill hides.
  let ahead: number | undefined
  let behind: number | undefined
  if (!unbornHead) {
    try {
      const counts = (await runGit(repoRoot, ['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'])).trim().split(/\s+/)
      const parsedAhead = Number(counts[0])
      const parsedBehind = Number(counts[1])
      if (Number.isFinite(parsedAhead) && Number.isFinite(parsedBehind)) {
        ahead = parsedAhead
        behind = parsedBehind
      }
    } catch { /* no upstream configured */ }
  }
  return {
    ok: true,
    root: repoRoot,
    branch: branch === '' ? null : branch,
    base: overrideCommit ?? headCommit,
    unbornHead,
    baseRef: overrideCommit !== null ? baseRef : null,
    files,
    totals: { added, deleted },
    ahead,
    behind,
    inProgress,
  }
}

/**
 * Which half of the changes one `file-diff` answer covers. 'all' compares
 * the worktree against HEAD; 'staged' the index against HEAD; 'unstaged' the
 * worktree against the index.
 */
type DiffScope = 'all' | 'staged' | 'unstaged'

function asScope(value: unknown): DiffScope {
  return value === 'staged' || value === 'unstaged' ? value : 'all'
}

/** One `file-diff` answer: single-file unified diff, lazily fetched. When a
 *  validated `base` override resolves to a non-HEAD commit, the diff runs
 *  worktree-vs-base and the staged/unstaged scope is ignored. With a
 *  validated `target`, the ref-range mode runs `base...target` instead and
 *  neither scope nor untracked probing applies. */
export async function gitFileDiff(cwd: unknown, path: unknown, untracked: unknown, full: unknown, origPath: unknown, scope: unknown, base: unknown, target: unknown, ws: unknown): Promise<GitFileDiffPayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const absPath = fenceRepoPath(repoRoot, typeof path === 'string' ? path : '')
  const relPath = relative(repoRoot, absPath).replaceAll('\\', '/')
  // Renames need BOTH sides in the pathspec or git renders the destination as
  // a plain new file (no `rename from/to`, deletion side lost).
  const pathspecs = [relPath]
  if (typeof origPath === 'string' && origPath !== '') {
    const relOrig = relative(repoRoot, fenceRepoPath(repoRoot, origPath)).replaceAll('\\', '/')
    if (relOrig !== relPath) pathspecs.unshift(relOrig)
  }
  // Expanded view: one huge -U merges every hunk (git folds overlapping
  // context), so "show all context" is a plain re-fetch of the same diff.
  const context = full === true ? 100000 : 3
  const targetRef = normalizeBaseRef(target)
  const wsFlags = ws === true ? WS_FLAG : []
  if (targetRef !== null) {
    const baseCommit = await resolveRangeRef(repoRoot, normalizeBaseRef(base) ?? 'HEAD')
    const targetCommit = await resolveRangeRef(repoRoot, targetRef)
    if (baseCommit === null || targetCommit === null) throw new Error('cannot resolve diff range refs')
    const diffText = await runGit(repoRoot, [
      'diff', '--no-color', '-M', '--no-ext-diff', '--unified=' + String(context), ...wsFlags,
      ...refRange(baseCommit, targetCommit), '--', ...pathspecs,
    ])
    if (diffText === '') return { ok: true, binary: false, diff: '', truncated: false }
    if (diffSaysBinary(diffText)) {
      let size = 0
      try {
        size = (await lstat(absPath)).size
      } catch { /* size stays 0 */ }
      return { ok: true, binary: true, diff: '', truncated: false, size }
    }
    const capped = capDiff(diffText)
    return { ok: true, binary: false, diff: capped.diff, truncated: capped.truncated }
  }
  if (untracked === true) {
    const pseudo = await untrackedPseudoDiff(repoRoot, relPath)
    if (pseudo !== null) return pseudo
  }
  // diffBase already resolves HEAD → hash, falling back to the empty tree id
  // on an unborn HEAD, so `base` alone is the right range argument.
  const { base: headCommit } = await diffBase(repoRoot)
  const diffScope = asScope(scope)
  const baseRef = normalizeBaseRef(base)
  const requestedCommit = baseRef === null ? null : await resolveRangeRef(repoRoot, baseRef)
  // The override applies only when it actually differs from HEAD; otherwise
  // the scope semantics (staged/unstaged halves) stay meaningful.
  const overrideCommit = requestedCommit !== null && requestedCommit !== headCommit ? requestedCommit : null
  // 'unstaged' needs no range (worktree vs index) and therefore no fallback;
  // the staged/all/override ranges hit the empty-tree literal on an unborn HEAD.
  const usesRange = overrideCommit !== null || diffScope !== 'unstaged'
  const rangeArg = overrideCommit ?? headCommit
  const attempt = (range: string): Promise<string> => runGit(repoRoot, [
    'diff',
    ...(overrideCommit === null && diffScope === 'staged' ? ['--cached'] : []),
    '--no-color', '-M', '--no-ext-diff', '--unified=' + String(context), ...wsFlags,
    ...(usesRange ? [range] : []),
    '--', ...pathspecs,
  ])
  let diffText: string
  try {
    diffText = await attempt(rangeArg)
  } catch (error) {
    if (!usesRange) throw error
    // A diff against the empty tree literal is the one sha256-incompatible
    // path; surface git's own words rather than a generic failure.
    diffText = await attempt('HEAD')
  }
  if (diffText === '') {
    // A scoped fetch legitimately answers "nothing in this half" — the
    // pseudo-diff fallback below is only about unclassified worktree drift.
    if (diffScope !== 'all' || overrideCommit !== null) return { ok: true, binary: false, diff: '', truncated: false }
    // No textual diff: either the file drifted untracked after its status
    // read, or the change is non-textual (mode-only). Pseudo-diff when the
    // file exists untracked; otherwise say so honestly.
    const pseudo = await untrackedPseudoDiff(repoRoot, relPath)
    if (pseudo !== null) return pseudo
    return { ok: true, binary: false, diff: '', truncated: false }
  }
  if (diffSaysBinary(diffText)) {
    let size = 0
    try {
      size = (await lstat(absPath)).size
    } catch { /* size stays 0 */ }
    return { ok: true, binary: true, diff: '', truncated: false, size }
  }
  const capped = capDiff(diffText)
  return { ok: true, binary: false, diff: capped.diff, truncated: capped.truncated }
}

/** One `file-content` answer: fenced full-file read for the file view. The
 *  cap matches the untracked pseudo-diff read cap; larger files truncate at
 *  that prefix (flagged via `size`), and a NUL byte routes to the binary form. */
export async function gitFileContent(cwd: unknown, path: unknown, ref: unknown): Promise<GitFileContentPayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const absPath = fenceRepoPath(repoRoot, typeof path === 'string' ? path : '')
  const relPath = relative(repoRoot, absPath).replaceAll('\\', '/')

  // History read: a ref names a commit whose tree serves the content
  // (`cat-file`), so the file view works in ref-range mode where no
  // worktree copy of that version exists.
  if (typeof ref === 'string' && ref !== '') {
    const normalized = normalizeBaseRef(ref)
    if (normalized === null) throw new Error('invalid ref')
    const resolved = await resolveRangeRef(repoRoot, normalized)
    const spec = resolved + ':' + relPath
    const size = Number((await runGit(repoRoot, ['cat-file', '-s', spec])).trim())
    const text = await runGit(repoRoot, ['cat-file', '-p', spec])
    const bytes = Buffer.from(text, 'utf8')
    const truncated = bytes.length > READ_CAP
    const capped = truncated ? bytes.subarray(0, READ_CAP) : bytes
    if (capped.includes(0)) return { ok: true, binary: true, content: '', truncated, size }
    return { ok: true, binary: false, content: capped.toString('utf8'), truncated, size }
  }

  let size: number
  try {
    const stat = await lstat(absPath)
    if (!stat.isFile()) throw new Error('not a regular file')
    size = stat.size
  } catch (error) {
    throw new Error('cannot read file: ' + String((error as Error).message ?? error))
  }
  const { bytes } = await readPrefix(absPath, READ_CAP)
  const truncated = size > READ_CAP
  if (bytes.includes(0)) return { ok: true, binary: true, content: '', truncated, size }
  return { ok: true, binary: false, content: bytes.toString('utf8'), truncated, size }
}

/** Line cap for blame (a review tab is not a history aquarium). */
const BLAME_LINE_CAP = 20_000

/** One `blame` answer: per-final-line last-touched commit (porcelain). */
export async function gitBlame(cwd: unknown, path: unknown): Promise<GitBlamePayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const relPath = relative(repoRoot, fenceRepoPath(repoRoot, typeof path === 'string' ? path : '')).replaceAll('\\', '/')
  const raw = await runGit(repoRoot, ['blame', '--porcelain', '--', relPath])
  const rows = parseBlamePorcelain(raw)
  return { ok: true, lines: rows.slice(0, BLAME_LINE_CAP), truncated: rows.length > BLAME_LINE_CAP }
}

/** Commit cap for the per-file history popover. */
const FILE_HISTORY_CAP = 500

/** One `file-history` answer: commits that touched one path (--follow). */
export async function gitFileHistory(cwd: unknown, path: unknown): Promise<GitFileHistoryPayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const relPath = relative(repoRoot, fenceRepoPath(repoRoot, typeof path === 'string' ? path : '')).replaceAll('\\', '/')
  let raw: string
  try {
    raw = await runGit(repoRoot, [
      'log', '--follow', '--date-order',
      '--max-count=' + String(FILE_HISTORY_CAP),
      '--format=%H%x1f%P%x1f%an%x1f%at%x1f%D%x1f%s%x1e',
      '--', relPath,
    ])
  } catch (error) {
    if (/does not have any commits yet|bad revision/i.test(String((error as Error).message ?? error))) {
      return { ok: true, commits: [], truncated: false }
    }
    throw error
  }
  const commits = parseLogLines(raw)
  return { ok: true, commits, truncated: commits.length >= FILE_HISTORY_CAP }
}

/** Entry cap for the all-files tree (a review tab is not a file manager). */
const LIST_FILES_CAP = 20_000

/** One `list-files` answer: tracked + untracked repository files, sorted, deduped. */
async function gitListFiles(cwd: unknown): Promise<GitListFilesPayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const [trackedRaw, othersRaw] = await Promise.all([
    runGit(repoRoot, ['ls-files', '-z']),
    runGit(repoRoot, ['ls-files', '-z', '--others', '--exclude-standard']),
  ])
  const files = new Set<string>()
  for (const chunk of trackedRaw.split('\0')) if (chunk !== '') files.add(chunk)
  for (const chunk of othersRaw.split('\0')) if (chunk !== '') files.add(chunk)
  const sorted = [...files].sort()
  return { ok: true, files: sorted.slice(0, LIST_FILES_CAP), truncated: sorted.length > LIST_FILES_CAP }
}

/** Untracked files scanned by `search` (bounded: 64 files × 256 KiB). */
const SEARCH_UNTRACKED_CAP = 64
const SEARCH_READ_CAP = 256 * 1024

/** Ref cap for the base-branch dropdown (a review tab is not a ref browser). */
const REFS_CAP = 500

/** One `refs` answer: selectable diff-base refs (branches, remotes, tags).
 *  Remote HEAD aliases (a `/HEAD` suffix) are skipped: they are pointers,
 *  not review targets. */
async function gitRefs(cwd: unknown): Promise<GitRefsPayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const raw = await runGit(repoRoot, [
    'for-each-ref',
    '--format=%(refname)',
    'refs/heads',
    'refs/remotes',
    'refs/tags',
  ])
  const refs: GitRefsPayload['refs'] = []
  for (const refname of raw.split('\n')) {
    if (refname === '') continue
    const entry = refname.startsWith('refs/heads/')
      ? { name: refname.slice('refs/heads/'.length), kind: 'branch' as const }
      : refname.startsWith('refs/remotes/')
        ? { name: refname.slice('refs/remotes/'.length), kind: 'remote' as const }
          : refname.startsWith('refs/tags/')
            ? { name: refname.slice('refs/tags/'.length), kind: 'tag' as const }
              : null
    if (entry === null || entry.name === '' || entry.name.endsWith('/HEAD')) continue
    refs.push(entry)
  }
  const order = { branch: 0, remote: 1, tag: 2 } as const
  refs.sort((a, b) => order[a.kind] !== order[b.kind]
    ? order[a.kind] - order[b.kind]
    : a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
  return { ok: true, refs: refs.slice(0, REFS_CAP), truncated: refs.length > REFS_CAP }
}

/** Commit cap for the graph log (a review tab is not a history browser). */
const LOG_CAP = 500

/** One `log` answer: the commit-graph feed across all refs, newest first,
 *  in date order (minimizes edge crossings in the lane layout). An optional
 *  `limit` feeds the ref picker's commit section; an optional `skip` pages
 *  the graph feed forward ("load more", stable because --date-order is a
 *  total order — earlier rows never shift). */
async function gitLog(cwd: unknown, limit: unknown, skip: unknown): Promise<GitLogPayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  let raw: string
  const maxCount = typeof limit === 'number' && Number.isFinite(limit) && limit >= 1
    ? Math.min(Math.floor(limit), LOG_CAP)
    : LOG_CAP
  const skipCount = typeof skip === 'number' && Number.isFinite(skip) && skip >= 1
    ? Math.min(Math.floor(skip), 100_000)
    : 0
  try {
    raw = await runGit(repoRoot, [
      'log', '--all', '--date-order',
      ...(skipCount > 0 ? ['--skip=' + String(skipCount)] : []),
      '--max-count=' + String(maxCount),
      '--format=%H%x1f%P%x1f%an%x1f%at%x1f%D%x1f%s%x1e',
    ])
  } catch (error) {
    // An unborn HEAD has no commits: an empty graph, not a failure.
    if (/does not have any commits yet|bad revision/i.test(String((error as Error).message ?? error))) {
      return { ok: true, commits: [], truncated: false }
    }
    throw error
  }
  const commits = parseLogLines(raw)
  return { ok: true, commits, truncated: commits.length >= maxCount }
}

/** One `commit-files` answer: a single commit's changed files, diffed
 *  against its first parent (a root commit against the empty tree) — the
 *  same first-parent convention GitHub's commit pages use. */
async function gitCommitFiles(cwd: unknown, commit: unknown): Promise<GitCommitFilesPayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const hash = typeof commit === 'string' ? commit.trim() : ''
  if (!HASH_ONLY_RE.test(hash)) throw new Error('commit id required')
  // `rev-list --parents -n 1` → "<hash> <parent0> ..." on one line.
  const listing = (await runGit(repoRoot, ['rev-list', '--parents', '-n', '1', hash])).trim()
  const parts = listing.split(' ')
  if (parts[0] !== hash) throw new Error('commit not found')
  const parent0 = parts.length > 1 && parts[1] !== undefined ? parts[1] : EMPTY_TREE_ID
  const range = refRange(parent0, hash)
  const [numstatRaw, nameStatusRaw] = await Promise.all([
    runGit(repoRoot, ['diff', '--numstat', '-z', '--no-color', '-M', ...range]),
    runGit(repoRoot, ['diff', '--name-status', '-z', '--no-color', '-M', ...range]),
  ])
  const files = mergeDiffRows(parseNameStatusZ(nameStatusRaw), numstatIndex(parseNumstatZ(numstatRaw)))
  let added = 0
  let deleted = 0
  for (const file of files) {
    added += file.added
    deleted += file.deleted
  }
  return { ok: true, files, totals: { added, deleted } }
}

/** One `search` answer: case-insensitive per-file match counts over the full
 *  worktree-vs-HEAD diff (or a ref-range diff when `target` is given) plus
 *  untracked file content (bounded, worktree mode only). The response sorts
 *  loudest-first so the tree's top hit is the most-changed file. */
async function gitSearch(cwd: unknown, query: unknown, base: unknown, target: unknown, mode: unknown, cs: unknown, rx: unknown): Promise<GitSearchPayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  if (typeof query !== 'string' || query.trim() === '') return { ok: true, matches: [], truncated: false }
  const needle = query.slice(0, 200)
  const options = { caseSensitive: cs === true, regex: rx === true }
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const targetRef = normalizeBaseRef(target)
  const contentMode = mode === 'content'

  // Content mode: per-file matching LINE counts straight from git grep
  // (binary skipped via -I). Worktree mode greps the working tree; refs mode
  // greps the target commit's tree. Untracked files only exist in the worktree.
  if (contentMode) {
    const grepArgs = ['grep', '-c', '-I', ...(options.caseSensitive ? [] : ['-i']),
      ...(options.regex ? ['-e', needle] : ['--fixed-strings', '-e', needle])]
    if (targetRef !== null) {
      const targetCommit = await resolveRangeRef(repoRoot, targetRef)
      if (targetCommit === null) throw new Error('cannot resolve diff range refs')
      const result = await runGitCapture(repoRoot, [...grepArgs, targetCommit])
      if (result.code === 1) return { ok: true, matches: [], truncated: false }
      if (result.code !== 0) {
        throw new Error(result.stderr.trim() || result.stdout.trim() || 'git grep failed')
      }
      return { ok: true, matches: parseGrepCounts(result.stdout, targetCommit).sort((a, b) => b.count - a.count), truncated: false }
    }
    const result = await runGitCapture(repoRoot, grepArgs)
    if (result.code !== 0 && result.code !== 1) {
      throw new Error(result.stderr.trim() || result.stdout.trim() || 'git grep failed')
    }
    const counts = new Map(parseGrepCounts(result.stdout).map(match => [match.path, match.count] as const))
    // Untracked content never appears in git grep — scan bounded prefixes.
    let untracked: string[] = []
    try {
      const porcelain = await runGit(repoRoot, ['status', '--porcelain=v1', '-z', '--untracked-files=all'])
      untracked = parsePorcelainV1(porcelain).filter(entry => entry.x === '?').map(entry => entry.path)
    } catch { /* no untracked scan on status failure */ }
    let truncated = untracked.length > SEARCH_UNTRACKED_CAP
    for (const relPath of untracked.slice(0, SEARCH_UNTRACKED_CAP)) {
      const absPath = resolve(repoRoot, relPath)
      if (!inside(repoRoot, absPath)) continue
      try {
        const { bytes } = await readPrefix(absPath, SEARCH_READ_CAP)
        if (bytes.includes(0)) continue
        const count = countMatches(bytes.toString('utf8'), needle, options)
        if (count > 0) counts.set(relPath, (counts.get(relPath) ?? 0) + count)
      } catch {
        truncated = true
      }
    }
    const matches = [...counts.entries()]
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
    return { ok: true, matches, truncated }
  }

  let diffText: string
  let refsMode = false
  if (targetRef !== null) {
    const baseCommit = await resolveRangeRef(repoRoot, normalizeBaseRef(base) ?? 'HEAD')
    const targetCommit = await resolveRangeRef(repoRoot, targetRef)
    if (baseCommit === null || targetCommit === null) throw new Error('cannot resolve diff range refs')
    diffText = await runGit(repoRoot, ['diff', '--no-color', '-M', '--no-ext-diff', ...refRange(baseCommit, targetCommit)])
    refsMode = true
  } else {
    const { base } = await diffBase(repoRoot)
    try {
      diffText = await runGit(repoRoot, ['diff', '--no-color', '-M', '--no-ext-diff', base])
    } catch {
      // The empty-tree literal is the one sha256-incompatible path; git's own
      // words surface if the retry fails too.
      diffText = await runGit(repoRoot, ['diff', '--no-color', '-M', '--no-ext-diff', 'HEAD'])
    }
  }
  const counts = new Map<string, number>()
  for (const section of splitDiffSections(diffText)) {
    if (section.path === null || section.body === '') continue
    const count = countMatches(section.body, needle, options)
    if (count > 0) counts.set(section.path, count)
  }
  if (refsMode) return { ok: true, matches: [...counts.entries()].map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count), truncated: false }
  // Untracked content never appears in `git diff` — scan bounded prefixes.
  let untracked: string[] = []
  try {
    const porcelain = await runGit(repoRoot, ['status', '--porcelain=v1', '-z', '--untracked-files=all'])
    untracked = parsePorcelainV1(porcelain).filter(entry => entry.x === '?').map(entry => entry.path)
  } catch { /* no untracked scan on status failure */ }
  let truncated = untracked.length > SEARCH_UNTRACKED_CAP
  for (const relPath of untracked.slice(0, SEARCH_UNTRACKED_CAP)) {
    const absPath = resolve(repoRoot, relPath)
    if (!inside(repoRoot, absPath)) continue
    try {
      const { bytes } = await readPrefix(absPath, SEARCH_READ_CAP)
      if (bytes.includes(0)) continue
      const count = countMatches(bytes.toString('utf8'), needle, options)
      if (count > 0) counts.set(relPath, (counts.get(relPath) ?? 0) + count)
    } catch {
      truncated = true
    }
  }
  const matches = [...counts.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
  return { ok: true, matches, truncated }
}

/** Parse `git grep -c` output: one `path:count` line per matching file.
 *  The path is everything before the LAST colon (a path may itself contain
 *  ':' on non-Windows filesystems). When grepping a commit's tree git prefixes
 *  every line with `<commit>:` — stripPrefix removes it so paths match the
 *  file tree the client already knows. */
function parseGrepCounts(raw: string, stripPrefix?: string): GitSearchPayload['matches'] {
  const prefix = stripPrefix !== undefined ? stripPrefix + ':' : ''
  const out: GitSearchPayload['matches'] = []
  for (const line of raw.split('\n')) {
    if (line === '') continue
    const stripped = prefix !== '' && line.startsWith(prefix) ? line.slice(prefix.length) : line
    const colon = stripped.lastIndexOf(':')
    if (colon <= 0) continue
    const count = Number(stripped.slice(colon + 1))
    if (!Number.isFinite(count) || count <= 0) continue
    out.push({ path: stripped.slice(0, colon), count })
  }
  return out
}

/** Push is a network operation: it outlives the local-git timeout. */
const PUSH_TIMEOUT_MS = 120_000

/**
 * Run one git command and resolve BOTH streams plus the exit code — never
 * rejects. Commit's "nothing to commit" lands on stdout with exit 1: that is
 * an answer to surface verbatim, not a transport failure, so the write
 * endpoints need the raw streams rather than runGit's reject-with-stderr.
 */
function runGitCapture(root: string, args: readonly string[], timeoutMs: number = GIT_TIMEOUT_MS): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolvePromise) => {
    execFile('git', ['-C', root, '--no-optional-locks', '-c', 'core.quotepath=false', ...args], {
      timeout: timeoutMs,
      maxBuffer: GIT_MAX_BUFFER,
      windowsHide: true,
      encoding: 'utf8',
      env: gitEnv(),
    }, (error, stdout, stderr) => {
      const code = error === null
        ? 0
        : typeof (error as { code?: unknown }).code === 'number' ? (error as { code: number }).code : 1
      resolvePromise({ code, stdout: String(stdout), stderr: String(stderr) })
    })
  })
}

/** One `commit` answer. Write operation: guarded by the explicit confirm flag
 *  (set by the client's two-step dialog), a non-empty bounded message, and
 *  `mode` ('all' = `git add -A` first; 'staged' = commit the index as-is). */
export async function gitCommit(cwd: unknown, message: unknown, mode: unknown, confirm: unknown, amend: unknown): Promise<GitWritePayload> {
  if (confirm !== true) return { ok: false, error: 'commit requires confirm: true' }
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const trimmed = typeof message === 'string' ? message.trim() : ''
  if (trimmed === '') return { ok: false, error: 'commit message is required' }
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  if (mode === 'all') {
    const staged = await runGitCapture(repoRoot, ['add', '-A'])
    if (staged.code !== 0) {
      return { ok: false, error: staged.stderr.trim() || staged.stdout.trim() || 'git add failed' }
    }
  }
  // A lone '-' message would parse as an option; '-'-leading messages are
  // impossible to pass safely, so normalize one leading dash away.
  const safeMessage = trimmed.startsWith('-') ? ' ' + trimmed : trimmed
  const result = await runGitCapture(repoRoot, ['commit', ...(amend === true ? ['--amend'] : []), '-m', safeMessage.slice(0, 2000)])
  if (result.code !== 0) {
    return { ok: false, error: result.stderr.trim() || result.stdout.trim() || 'git commit failed (exit ' + result.code + ')' }
  }
  return { ok: true, output: result.stdout.trim() }
}

/** One `last-commit` answer: the branch tip's full message, for the commit
 *  popover's amend prefill (no commit yet is an error the client turns into
 *  a disabled amend checkbox). */
export async function gitLastCommit(cwd: unknown): Promise<GitLastCommitPayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const raw = (await runGit(repoRoot, ['log', '-1', '--format=%H%x1f%s%x1f%B']).catch(() => '')).trim()
  if (raw === '') throw new Error('no commit found')
  const fields = raw.split('\x1f')
  const hash = fields[0]!.trim()
  if (!HASH_ONLY_RE.test(hash)) throw new Error('no commit found')
  return { ok: true, hash, subject: fields[1] ?? '', message: fields.slice(2).join('\x1f').trim() }
}

/** One `fetch` answer: `git fetch --all`, a network operation like push. */
export async function gitFetch(cwd: unknown, confirm: unknown): Promise<GitWritePayload> {
  if (confirm !== true) return { ok: false, error: 'fetch requires confirm: true' }
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const result = await runGitCapture(repoRoot, ['fetch', '--all'], PUSH_TIMEOUT_MS)
  if (result.code !== 0) {
    return { ok: false, error: result.stderr.trim() || result.stdout.trim() || 'git fetch failed (exit ' + result.code + ')' }
  }
  return { ok: true, output: result.stdout.trim() }
}

/** Normalize one per-file write request's `paths` array into fenced
 *  repo-relative git pathspecs (a review action touches at most a few files;
 *  even a tree-select-all stays far under this cap). */
function fencePaths(repoRoot: string, raw: unknown): string[] {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 200) {
    throw new Error('paths (1-200 entries) required')
  }
  return raw.map(item => {
    if (typeof item !== 'string' || item === '') throw new Error('paths must be non-empty strings')
    return relative(repoRoot, fenceRepoPath(repoRoot, item)).replaceAll('\\', '/')
  })
}

/** Shared preflight of the per-file write endpoints: confirm flag, cwd, repo. */
async function fileOpGuard(cwd: unknown, confirm: unknown): Promise<string> {
  if (confirm !== true) throw new Error('file operations require confirm: true')
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  return repoRoot
}

/** One `stage` answer: `git add -- <paths>` (untracked files included). */
export async function gitStage(cwd: unknown, paths: unknown, confirm: unknown): Promise<GitWritePayload> {
  const repoRoot = await fileOpGuard(cwd, confirm)
  const specs = fencePaths(repoRoot, paths)
  return writeAnswer(await runGitCapture(repoRoot, ['add', '--', ...specs]), 'add')
}

/** One `unstage` answer: `git restore --staged -- <paths>` (index rows go
 *  back to unstaged; worktree content untouched). An unborn HEAD has no
 *  restore source — git's words surface verbatim. */
export async function gitUnstage(cwd: unknown, paths: unknown, confirm: unknown): Promise<GitWritePayload> {
  const repoRoot = await fileOpGuard(cwd, confirm)
  const specs = fencePaths(repoRoot, paths)
  return writeAnswer(await runGitCapture(repoRoot, ['restore', '--staged', '--', ...specs]), 'restore --staged')
}

/** One `discard` answer: destroy a file's uncommitted changes, restoring it
 *  to HEAD (tracked) or deleting it outright (untracked, `git clean -f`).
 *  IRREVERSIBLE — the client's two-step confirmation gates it, and the
 *  agent-running gate disables it in the first place. Tracked/untracked is
 *  decided by `git ls-files` at call time, never by the request. */
export async function gitDiscard(cwd: unknown, paths: unknown, confirm: unknown): Promise<GitWritePayload> {
  const repoRoot = await fileOpGuard(cwd, confirm)
  const specs = fencePaths(repoRoot, paths)
  const trackedRaw = await runGit(repoRoot, ['ls-files', '-z', '--', ...specs])
  const tracked = new Set(trackedRaw.split('\0').filter(chunk => chunk !== ''))
  const trackedSpecs = specs.filter(spec => tracked.has(spec))
  const untrackedSpecs = specs.filter(spec => !tracked.has(spec))
  if (trackedSpecs.length > 0) {
    // Restore index AND worktree to HEAD: "discard" means back to HEAD
    // (VS Code's Discard semantics — a staged-only change discards the same).
    const restored = await runGitCapture(repoRoot, ['restore', '--source=HEAD', '--staged', '--worktree', '--', ...trackedSpecs])
    if (restored.code !== 0) {
      return { ok: false, error: restored.stderr.trim() || restored.stdout.trim() || 'git restore failed (exit ' + restored.code + ')' }
    }
  }
  if (untrackedSpecs.length > 0) {
    // No -x: ignored files are never touched by a discard.
    const cleaned = await runGitCapture(repoRoot, ['clean', '-f', '--', ...untrackedSpecs])
    if (cleaned.code !== 0) {
      return { ok: false, error: cleaned.stderr.trim() || cleaned.stdout.trim() || 'git clean failed (exit ' + cleaned.code + ')' }
    }
  }
  return { ok: true, output: '' }
}

/** Unified-diff header line prefixes a client-cut hunk patch may carry.
 *  rename/copy lines are deliberately absent — those diffs span two paths
 *  and their apply semantics do not fit a per-hunk operation. */
const HUNK_PATCH_HEADER_PREFIXES: readonly string[] = [
  'diff --git ',
  'index ',
  'old mode ',
  'new mode ',
  'new file mode ',
  'deleted file mode ',
  'similarity index ',
  'dissimilarity index ',
  '--- ',
  '+++ ',
]

/**
 * Validate a client-supplied single-hunk patch before `git apply` eats it.
 * The patch text arrives from the browser, so it is re-checked line by
 * line: exactly one `diff --git` head, exactly one `@@` hunk, every header
 * line whitelisted, the `---`/`+++` paths pinned to the fenced repo path
 * (or /dev/null for creations/deletions), and the hunk body limited to
 * ' ' / '+' / '-' / backslash-prefixed lines. Returns the problem
 * description, or null when the patch is safe.
 */
function validateHunkPatch(patch: string, relPath: string): string | null {
  const lines = patch.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  const gitLines = lines.filter(line => line.startsWith('diff --git '))
  if (gitLines.length !== 1) {
    return 'patch must contain exactly one "diff --git" line'
  }
  // The head names both sides; either side drifting to another path would
  // let a fenced request drive a patch at a different file.
  if (gitLines[0] !== 'diff --git a/' + relPath + ' b/' + relPath) {
    return 'diff --git path does not match the fenced file path'
  }
  let hunkSeen = false
  for (const line of lines) {
    if (hunkSeen) {
      if (line.startsWith('@@')) return 'patch must contain exactly one hunk'
      const isBody = line === '' || line.startsWith(' ') || line.startsWith('+') || line.startsWith('-') || line.startsWith('\\')
      if (!isBody) return 'unexpected line inside the hunk body'
      continue
    }
    if (line.startsWith('@@')) {
      if (!/^@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@/.test(line)) return 'malformed hunk header'
      hunkSeen = true
      continue
    }
    if (!HUNK_PATCH_HEADER_PREFIXES.some(prefix => line.startsWith(prefix))) {
      return 'unexpected line in the patch header'
    }
    if (line === '--- a/' + relPath || line === '+++ b/' + relPath) continue
    if (line === '--- /dev/null' || line === '+++ /dev/null') continue
    if (line.startsWith('--- ') || line.startsWith('+++ ')) {
      return 'patch path does not match the fenced file path'
    }
  }
  if (!hunkSeen) return 'patch must contain exactly one hunk'
  return null
}

/** One `hunk-op` answer: apply a single client-cut hunk patch to the index
 *  (stage / unstage via --reverse --cached) or the worktree (revert via
 *  --reverse). The patch travels through a temp file (git apply reads
 *  paths, not stdin pipes); it is validated against the fenced path before
 *  git ever sees it, and the temp dir is always removed. */
export async function gitHunkOp(cwd: unknown, path: unknown, patch: unknown, action: unknown, confirm: unknown): Promise<GitWritePayload> {
  const repoRoot = await fileOpGuard(cwd, confirm)
  if (typeof patch !== 'string' || patch === '' || patch.length > 512 * 1024) {
    return { ok: false, error: 'invalid patch payload' }
  }
  if (action !== 'stage' && action !== 'unstage' && action !== 'revert') {
    return { ok: false, error: 'unsupported hunk action' }
  }
  // relative + '/'-separated: the wire form git writes into the patch text.
  const relPath = relative(repoRoot, fenceRepoPath(repoRoot, typeof path === 'string' ? path : '')).replaceAll('\\', '/')
  const problem = validateHunkPatch(patch, relPath)
  if (problem !== null) return { ok: false, error: problem }
  const dir = await mkdtemp(join(tmpdir(), 'dsh-git-review-hunk-'))
  try {
    const patchFile = join(dir, 'hunk.patch')
    await writeFile(patchFile, patch, 'utf8')
    // No --whitespace=fix: apply must reproduce the hunk byte-for-byte.
    const args = ['apply']
    if (action === 'stage') args.push('--cached')
    if (action === 'unstage') args.push('--cached', '--reverse')
    if (action === 'revert') args.push('--reverse')
    args.push(patchFile)
    return writeAnswer(await runGitCapture(repoRoot, args), 'git apply')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/** Stash selector cap: real `stash@{n}` indices stay far below this; the
 *  bound keeps a bogus request from address-spoofing other selectors. */
const STASH_INDEX_CAP = 999

/** One `stash` answer. push: `git stash push [-u]` (optionally including
 *  untracked files; the worktree is left clean); list: `git stash list`
 *  parsed; apply/pop/drop: one validated `stash@{n}` selector — apply keeps
 *  the entry on conflict (git's behavior), pop drops it only on success. */
export async function gitStash(cwd: unknown, action: unknown, index: unknown, includeUntracked: unknown, confirm: unknown): Promise<GitWritePayload | { ok: true; stashes: GitStashEntry[] }> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  if (action === 'list') {
    const raw = await runGit(repoRoot, ['stash', 'list', '--format=%gd%x1f%at%x1f%gs%x1e']).catch(() => '')
    return { ok: true, stashes: parseStashLines(raw) }
  }
  if (confirm !== true) return { ok: false, error: 'stash actions require confirm: true' }
  if (action === 'push') {
    return writeAnswer(await runGitCapture(repoRoot, ['stash', 'push', ...(includeUntracked === true ? ['-u'] : [])]), 'stash push')
  }
  if (action === 'apply' || action === 'pop' || action === 'drop') {
    const n = typeof index === 'number' && Number.isInteger(index) && index >= 0 && index <= STASH_INDEX_CAP ? index : null
    if (n === null) return { ok: false, error: 'stash index required (0-' + STASH_INDEX_CAP + ')' }
    return writeAnswer(await runGitCapture(repoRoot, ['stash', action, 'stash@{' + n + '}']), 'stash ' + action)
  }
  return { ok: false, error: 'unknown stash action' }
}

/** One `push` answer: `git push` of the current branch, guarded by the
 *  explicit confirm flag; git's network diagnostics surface verbatim. */
async function gitPush(cwd: unknown, confirm: unknown): Promise<GitWritePayload> {
  if (confirm !== true) return { ok: false, error: 'push requires confirm: true' }
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const result = await runGitCapture(repoRoot, ['push'], PUSH_TIMEOUT_MS)
  if (result.code !== 0) {
    return { ok: false, error: result.stderr.trim() || result.stdout.trim() || 'git push failed (exit ' + result.code + ')' }
  }
  return { ok: true, output: result.stdout.trim() }
}

/** The commit target of a history operation: a bare 40-hex id (the graph
 *  rows and detail bar carry full hashes; nothing else is accepted). */
function historyTarget(raw: unknown): string {
  const hash = typeof raw === 'string' ? raw.trim() : ''
  if (!HASH_ONLY_RE.test(hash)) throw new Error('commit id required (40-hex)')
  return hash
}

/** One `reset` answer: move the current branch to `commit`. 'soft' keeps
 *  index+worktree, 'mixed' (the default) keeps the worktree only, 'hard'
 *  destroys both — the client arms hard with an extra red confirmation. */
export async function gitReset(cwd: unknown, commit: unknown, mode: unknown, confirm: unknown): Promise<GitWritePayload> {
  if (confirm !== true) return { ok: false, error: 'reset requires confirm: true' }
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const hash = historyTarget(commit)
  const flag = mode === 'soft' ? '--soft' : mode === 'hard' ? '--hard' : '--mixed'
  return writeAnswer(await runGitCapture(repoRoot, ['reset', flag, hash]), 'reset --' + (flag.slice(2)))
}

/** One `revert` answer: a new inverse commit on top (`git revert --no-edit`). */
export async function gitRevert(cwd: unknown, commit: unknown, confirm: unknown): Promise<GitWritePayload> {
  if (confirm !== true) return { ok: false, error: 'revert requires confirm: true' }
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const hash = historyTarget(commit)
  return writeAnswer(await runGitCapture(repoRoot, ['revert', '--no-edit', hash]), 'revert')
}

/** One `cherry-pick` answer: apply `commit` onto the current branch. */
export async function gitCherryPick(cwd: unknown, commit: unknown, confirm: unknown): Promise<GitWritePayload> {
  if (confirm !== true) return { ok: false, error: 'cherry-pick requires confirm: true' }
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const hash = historyTarget(commit)
  return writeAnswer(await runGitCapture(repoRoot, ['cherry-pick', hash]), 'cherry-pick')
}

/** One `merge` answer: merge `name` (a branch) into the current branch;
 *  noFf forces a merge commit even when a fast-forward would do. */
export async function gitMerge(cwd: unknown, name: unknown, noFf: unknown, confirm: unknown): Promise<GitWritePayload> {
  if (confirm !== true) return { ok: false, error: 'merge requires confirm: true' }
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const ref = normalizeBaseRef(name)
  if (ref === null) return { ok: false, error: 'invalid branch name' }
  const commit = await resolveRangeRef(repoRoot, ref)
  if (commit === null) return { ok: false, error: 'cannot resolve branch: ' + ref }
  return writeAnswer(await runGitCapture(repoRoot, ['merge', '--no-edit', ...(noFf === true ? ['--no-ff'] : []), commit]), 'merge')
}

/** One `pull` answer: fetch + integrate the upstream (--rebase on request,
 *  --no-rebase otherwise so the config cannot surprise us). */
export async function gitPull(cwd: unknown, rebase: unknown, confirm: unknown): Promise<GitWritePayload> {
  if (confirm !== true) return { ok: false, error: 'pull requires confirm: true' }
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  return writeAnswer(await runGitCapture(repoRoot, ['pull', rebase === true ? '--rebase' : '--no-rebase', '--no-edit'], PUSH_TIMEOUT_MS), 'pull')
}

/** One `conflict-resolve` answer: take one file's ours/theirs half and
 *  stage it (`checkout --ours|--theirs` + `add`) — the manual-edit path
 *  stays outside this plugin by design. */
export async function gitConflictResolve(cwd: unknown, path: unknown, side: unknown, confirm: unknown): Promise<GitWritePayload> {
  if (confirm !== true) return { ok: false, error: 'conflict resolution requires confirm: true' }
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const relPath = relative(repoRoot, fenceRepoPath(repoRoot, typeof path === 'string' ? path : '')).replaceAll('\\', '/')
  const flag = side === 'theirs' ? '--theirs' : '--ours'
  const taken = await runGitCapture(repoRoot, ['checkout', flag, '--', relPath])
  if (taken.code !== 0) {
    return { ok: false, error: taken.stderr.trim() || 'git checkout ' + flag + ' failed (the file may not be in an unmerged state)' }
  }
  return writeAnswer(await runGitCapture(repoRoot, ['add', '--', relPath]), 'add')
}

/** Continue or abort the in-progress operation the client detected from the
 *  status payload (the host re-verifies the marker instead of trusting it). */
export async function gitConflictFinish(cwd: unknown, action: unknown, kind: unknown, confirm: unknown): Promise<GitWritePayload> {
  if (confirm !== true) return { ok: false, error: 'conflict finish requires confirm: true' }
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const op = kind === 'merge' || kind === 'rebase' || kind === 'cherry-pick' || kind === 'revert' ? kind : null
  if (op === null) return { ok: false, error: 'unknown operation kind' }
  const marker = op === 'merge' ? 'MERGE_HEAD' : op === 'rebase' ? 'REBASE_HEAD' : op === 'cherry-pick' ? 'CHERRY_PICK_HEAD' : 'REVERT_HEAD'
  const still = await detectInProgress(repoRoot)
  if (still !== op) {
    return { ok: false, error: 'no ' + op + ' in progress (marker ' + marker + ' absent)' }
  }
  const verb = action === 'abort' ? '--abort' : '--continue'
  return writeAnswer(await runGitCapture(repoRoot, [op, verb], PUSH_TIMEOUT_MS), op + ' ' + verb)
}

/** Guard shared by the branch endpoints: confirm flag + normalizeBaseRef
 *  pre-filter, then git's own rule checker (`check-ref-format --branch`)
 *  has the final say on the name's validity. */
async function branchGuard(repoRoot: string, confirm: unknown, rawName: unknown): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  if (confirm !== true) return { ok: false, error: 'branch actions require confirm: true' }
  const name = normalizeBaseRef(rawName)
  if (name === null) return { ok: false, error: 'invalid branch name' }
  const check = await runGitCapture(repoRoot, ['check-ref-format', '--branch', name])
  if (check.code !== 0) {
    return { ok: false, error: check.stderr.trim() || check.stdout.trim() || 'invalid branch name: ' + name }
  }
  return { ok: true, name }
}

function writeAnswer(result: { code: number; stdout: string; stderr: string }, verb: string): GitWritePayload {
  if (result.code !== 0) {
    return { ok: false, error: result.stderr.trim() || result.stdout.trim() || 'git ' + verb + ' failed (exit ' + result.code + ')' }
  }
  return { ok: true, output: result.stdout.trim() }
}

/** One `branch-create` answer: `git branch <name> [startPoint]`. The start
 *  point accepts any ref and is resolved to a commit id before the call. */
async function gitBranchCreate(cwd: unknown, name: unknown, startPoint: unknown, confirm: unknown): Promise<GitWritePayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const guard = await branchGuard(repoRoot, confirm, name)
  if (!guard.ok) return guard
  let startCommit: string | undefined
  if (typeof startPoint === 'string' && startPoint.trim() !== '') {
    const ref = normalizeBaseRef(startPoint)
    const commit = ref === null ? null : await resolveRangeRef(repoRoot, ref)
    if (commit === null || commit === EMPTY_TREE_ID) {
      return { ok: false, error: 'cannot resolve start point: ' + (ref ?? '(invalid)') }
    }
    startCommit = commit
  }
  return writeAnswer(await runGitCapture(repoRoot, ['branch', guard.name, ...(startCommit !== undefined ? [startCommit] : [])]), 'branch')
}

/** One `branch-switch` answer: `git switch <name>` (branches only; a dirty
 *  worktree is git's own call to refuse, and its words surface verbatim). */
async function gitBranchSwitch(cwd: unknown, name: unknown, confirm: unknown): Promise<GitWritePayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const guard = await branchGuard(repoRoot, confirm, name)
  if (!guard.ok) return guard
  return writeAnswer(await runGitCapture(repoRoot, ['switch', guard.name]), 'switch')
}

/** One `branch-delete` answer: `git branch -d <name>` (force=true upgrades
 *  to `-D` for not-yet-merged branches; the client arms it separately). */
async function gitBranchDelete(cwd: unknown, name: unknown, force: unknown, confirm: unknown): Promise<GitWritePayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const guard = await branchGuard(repoRoot, confirm, name)
  if (!guard.ok) return guard
  return writeAnswer(await runGitCapture(repoRoot, ['branch', force === true ? '-D' : '-d', guard.name]), 'branch -d')
}

/** One `branch-rename` answer: `git branch -m <old> <new>`. */
async function gitBranchRename(cwd: unknown, name: unknown, newName: unknown, confirm: unknown): Promise<GitWritePayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const guard = await branchGuard(repoRoot, confirm, name)
  if (!guard.ok) return guard
  const guardNew = await branchGuard(repoRoot, confirm, newName)
  if (!guardNew.ok) return { ok: false, error: guardNew.error }
  return writeAnswer(await runGitCapture(repoRoot, ['branch', '-m', guard.name, guardNew.name]), 'branch -m')
}

/* ─ file-tree context-menu operations ──────────────────────────── */

/** One workspace file operation the tree's context menu can run. Only
 *  regular files inside the repository are touched; every path goes through
 *  the same fence the read endpoints use. Rename/delete are guarded by the
 *  explicit confirm flag (the client's two-step UI sets it). */
async function gitFileOp(cwd: unknown, path: unknown, action: unknown, newPath: unknown, confirm: unknown): Promise<GitWritePayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  if (confirm !== true) return { ok: false, error: 'file operations require confirm: true' }
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const absPath = fenceRepoPath(repoRoot, typeof path === 'string' ? path : '')
  let stat: { isFile(): boolean } | null = null
  try {
    stat = await lstat(absPath)
  } catch {
    return { ok: false, error: 'file does not exist: ' + String(path) }
  }
  if (stat === null || !stat.isFile()) return { ok: false, error: 'not a regular file' }
  if (action === 'rename') {
    if (typeof newPath !== 'string' || newPath.trim() === '') return { ok: false, error: 'new path is required' }
    const absTarget = fenceRepoPath(repoRoot, newPath.trim())
    if (absTarget === absPath) return { ok: true, output: '' }
    try {
      await lstat(absTarget)
      return { ok: false, error: 'target already exists: ' + newPath }
    } catch { /* free name, proceed */ }
    try {
      await rename(absPath, absTarget)
      return { ok: true, output: '' }
    } catch (error) {
      return { ok: false, error: String((error as Error).message ?? error) }
    }
  }
  if (action === 'delete') {
    try {
      await rm(absPath, { force: false })
      return { ok: true, output: '' }
    } catch (error) {
      return { ok: false, error: String((error as Error).message ?? error) }
    }
  }
  return { ok: false, error: 'unknown file operation' }
}

/** Open one workspace file outside the plugin (read-only launch: the app
 *  gets the path as its argument; no shell is involved, so percent-characters
 *  and spaces need no escaping). The app id is a fixed whitelist. */
async function gitOpenWith(cwd: unknown, path: unknown, app: unknown): Promise<GitWritePayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const absPath = fenceRepoPath(repoRoot, typeof path === 'string' ? path : '')
  try {
    const stat = await lstat(absPath)
    if (!stat.isFile()) return { ok: false, error: 'not a regular file' }
  } catch {
    return { ok: false, error: 'file does not exist (it may only exist in history)' }
  }
  const tool = app === 'explorer' ? 'explorer.exe'
    : app === 'notepad' ? 'notepad.exe'
      : app === 'code' ? 'code'
        : app === 'code-insiders' ? 'code-insiders'
          : undefined
  const run = (): Promise<void> => new Promise((resolvePromise, rejectPromise) => {
    // GUI openers outlive the request (notepad stays open for minutes), and
    // explorer.exe commonly exits non-zero even on success. Spawn detached and
    // resolve as soon as the process exists — exit codes are never consulted.
    const argv = tool !== undefined
      ? [tool, tool === 'explorer.exe' ? '/select,' + absPath : absPath]
      : process.platform === 'win32'
        ? ['cmd.exe', '/c', 'start', '', absPath]
        : ['xdg-open', absPath]
    const child = spawn(argv[0], argv.slice(1), { windowsHide: true, detached: true, stdio: 'ignore' })
    child.once('error', (error: Error) => rejectPromise(error))
    child.once('spawn', () => resolvePromise())
    child.unref()
  })
  try {
    await run()
    return { ok: true, output: '' }
  } catch (error) {
    const message = String((error as Error & { code?: string }).message ?? error)
    const hint = (error as Error & { code?: string }).code === 'ENOENT' ? ' (app not installed or not on PATH)' : ''
    return { ok: false, error: 'cannot open: ' + message + hint }
  }
}

/** The open-with app list: fixed candidates, availability probed per request
 *  via where/which (a missing editor stays listed but marked unavailable). */
async function gitOpenApps(): Promise<OpenAppsPayload> {
  const available = async (name: string): Promise<boolean> => {
    try {
      await new Promise<void>((resolvePromise, rejectPromise) => {
        execFile(process.platform === 'win32' ? 'where' : 'which', [name], { windowsHide: true }, error => {
          if (error !== null) rejectPromise(error)
          else resolvePromise()
        })
      })
      return true
    } catch {
      return false
    }
  }
  const [hasCode, hasInsiders] = await Promise.all([available('code'), available('code-insiders')])
  const apps: OpenAppsPayload['apps'] = [{ id: 'default', available: true }]
  if (process.platform === 'win32') {
    apps.push({ id: 'explorer', available: true }, { id: 'notepad', available: true })
  }
  apps.push({ id: 'code', available: hasCode }, { id: 'code-insiders', available: hasInsiders })
  return { ok: true, apps }
}

/** Read the request body with a hard cap; rejects oversized or non-JSON bodies. */
function readJsonBody(req: IncomingMessage, res: ServerResponse): Promise<Record<string, unknown>> {
  return new Promise((resolvePromise, rejectPromise) => {
    // CSRF hardening (J8-4): a JSON content-type cannot be sent cross-origin
    // by a plain form submit or a navigated <img>, which closes the classic
    // no-cors write vectors. The API is same-origin fenced already; this is
    // belt over the braces.
    const contentType = String(req.headers['content-type'] ?? '')
    if (!contentType.toLowerCase().includes('application/json')) {
      rejectPromise(new Error('content-type must be application/json'))
      res.writeHead(415, { 'content-type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ ok: false, error: 'content-type must be application/json' }))
      // Drain the rest of the upload so the 415 flushes instead of the
      // socket dying mid-response (req.destroy() here reads as a network
      // failure on the browser side, not as a 415).
      req.resume()
      return
    }
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > BODY_CAP) {
        rejectPromise(new Error('request body too large'))
        // Answer before destroying: a bare destroy surfaces as a network
        // failure to the client, indistinguishable from the host being gone.
        res.writeHead(413, { 'content-type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ ok: false, error: 'request body too large' }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        if (parsed === null || typeof parsed !== 'object') rejectPromise(new Error('body must be a JSON object'))
        else resolvePromise(parsed as Record<string, unknown>)
      } catch (error) {
        rejectPromise(new Error('invalid JSON body: ' + String((error as Error).message ?? error)))
      }
    })
    req.on('error', rejectPromise)
  })
}

/** Send one JSON response and end the request. */
function respond(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

export function apply(ctx: Context): void {
  // Per-user preference namespace (the plugins-settings card's join key) —
  // served independently of the review API: a host without webServer still
  // gets the settings card, and a host without the settings domain still
  // gets the API.
  installSettings(ctx)
  const webServer = (ctx as Context & { webServer?: WebServerService }).webServer
  if (webServer === undefined) {
    // Host half is optional by design (the tab degrades to an explicit notice).
    ctx.logger?.warn?.('[dsh-git-review] webServer service absent — review API disabled')
    return
  }
  ctx.effect(() => webServer.register({
    kind: 'prefix',
    path: API_PREFIX,
    handler: async (req, res) => {
      const route = (req.url ?? '/').split('?')[0]
      try {
        if (route === '/ping' || route === API_PREFIX + '/ping') {
          respond(res, 200, { ok: true })
          return
        }
        if (req.method !== 'POST') {
          respond(res, 405, { ok: false, error: 'POST only' })
          return
        }
        const action = route.startsWith(API_PREFIX + '/') ? route.slice(API_PREFIX.length + 1) : (route.startsWith('/') ? route.slice(1) : route)
        const body = await readJsonBody(req, res)
        if (action === 'status') {
          respond(res, 200, await gitStatus(body['cwd'], body['base'], body['target'], body['ws']))
          return
        }
        if (action === 'file-diff') {
          respond(res, 200, await gitFileDiff(body['cwd'], body['path'], body['untracked'], body['full'], body['origPath'], body['scope'], body['base'], body['target'], body['ws']))
          return
        }
        if (action === 'refs') {
          respond(res, 200, await gitRefs(body['cwd']))
          return
        }
        if (action === 'log') {
          respond(res, 200, await gitLog(body['cwd'], body['limit'], body['skip']))
          return
        }
        if (action === 'commit-files') {
          respond(res, 200, await gitCommitFiles(body['cwd'], body['commit']))
          return
        }
        if (action === 'commit') {
          respond(res, 200, await gitCommit(body['cwd'], body['message'], body['mode'], body['confirm'], body['amend']))
          return
        }
        if (action === 'push') {
          respond(res, 200, await gitPush(body['cwd'], body['confirm']))
          return
        }
        if (action === 'stage') {
          respond(res, 200, await gitStage(body['cwd'], body['paths'], body['confirm']))
          return
        }
        if (action === 'unstage') {
          respond(res, 200, await gitUnstage(body['cwd'], body['paths'], body['confirm']))
          return
        }
        if (action === 'discard') {
          respond(res, 200, await gitDiscard(body['cwd'], body['paths'], body['confirm']))
          return
        }
        if (action === 'hunk-op') {
          respond(res, 200, await gitHunkOp(body['cwd'], body['path'], body['patch'], body['action'], body['confirm']))
          return
        }
        if (action === 'fetch') {
          respond(res, 200, await gitFetch(body['cwd'], body['confirm']))
          return
        }
        if (action === 'stash') {
          respond(res, 200, await gitStash(body['cwd'], body['action'], body['index'], body['includeUntracked'], body['confirm']))
          return
        }
        if (action === 'last-commit') {
          respond(res, 200, await gitLastCommit(body['cwd']))
          return
        }
        if (action === 'reset') {
          respond(res, 200, await gitReset(body['cwd'], body['commit'], body['mode'], body['confirm']))
          return
        }
        if (action === 'revert') {
          respond(res, 200, await gitRevert(body['cwd'], body['commit'], body['confirm']))
          return
        }
        if (action === 'cherry-pick') {
          respond(res, 200, await gitCherryPick(body['cwd'], body['commit'], body['confirm']))
          return
        }
        if (action === 'merge') {
          respond(res, 200, await gitMerge(body['cwd'], body['name'], body['noFf'], body['confirm']))
          return
        }
        if (action === 'pull') {
          respond(res, 200, await gitPull(body['cwd'], body['rebase'], body['confirm']))
          return
        }
        if (action === 'conflict-resolve') {
          respond(res, 200, await gitConflictResolve(body['cwd'], body['path'], body['side'], body['confirm']))
          return
        }
        if (action === 'conflict-finish') {
          respond(res, 200, await gitConflictFinish(body['cwd'], body['action'], body['kind'], body['confirm']))
          return
        }
        if (action === 'branch-create') {
          respond(res, 200, await gitBranchCreate(body['cwd'], body['name'], body['startPoint'], body['confirm']))
          return
        }
        if (action === 'branch-switch') {
          respond(res, 200, await gitBranchSwitch(body['cwd'], body['name'], body['confirm']))
          return
        }
        if (action === 'branch-delete') {
          respond(res, 200, await gitBranchDelete(body['cwd'], body['name'], body['force'], body['confirm']))
          return
        }
        if (action === 'branch-rename') {
          respond(res, 200, await gitBranchRename(body['cwd'], body['name'], body['newName'], body['confirm']))
          return
        }
        if (action === 'blame') {
          respond(res, 200, await gitBlame(body['cwd'], body['path']))
          return
        }
        if (action === 'file-history') {
          respond(res, 200, await gitFileHistory(body['cwd'], body['path']))
          return
        }
        if (action === 'file-content') {
          respond(res, 200, await gitFileContent(body['cwd'], body['path'], body['ref']))
          return
        }
        if (action === 'list-files') {
          respond(res, 200, await gitListFiles(body['cwd']))
          return
        }
        if (action === 'search') {
          respond(res, 200, await gitSearch(body['cwd'], body['query'], body['base'], body['target'], body['mode'], body['cs'], body['rx']))
          return
        }
        if (action === 'file-op') {
          respond(res, 200, await gitFileOp(body['cwd'], body['path'], body['action'], body['newPath'], body['confirm']))
          return
        }
        if (action === 'open-with') {
          respond(res, 200, await gitOpenWith(body['cwd'], body['path'], body['app']))
          return
        }
        if (action === 'apps') {
          respond(res, 200, await gitOpenApps())
          return
        }
        respond(res, 404, { ok: false, error: 'unknown action' })
      } catch (error) {
        // A body-cap 413 answers before rejecting; responding again would
        // throw ERR_HTTP_HEADERS_SENT into the awaited handler.
        if (res.headersSent) return
        respond(res, 200, { ok: false, error: String((error as Error).message ?? error) })
      }
    },
  }), 'dsh-git-review: read-only git api')
}
