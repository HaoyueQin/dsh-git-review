/**
 * dsh-git-review — host half.
 *
 * Read-only git introspection of the session workspace repository, served on
 * this plugin's own prefix route (the same webServer pattern dsh-diff-stat
 * ships):
 *
 *   POST /dsh-git-review/api/status       { cwd }
 *   POST /dsh-git-review/api/file-diff    { cwd, path, untracked?, full?, scope? }
 *   POST /dsh-git-review/api/file-content { cwd, path }
 *   POST /dsh-git-review/api/list-files   { cwd }
 *   GET  /dsh-git-review/api/ping
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
import { execFile } from 'node:child_process'
import { lstat, open, realpath } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { mergeStatus, numstatIndex, parseNumstatZ, parsePorcelainV1 } from './git-parse.ts'
import type { ChangedFile, GitFileContentPayload, GitFileDiffPayload, GitListFilesPayload, GitStatusPayload } from './contract.ts'

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
/** Diff base when HEAD is unborn (the well-known empty-tree object id). */
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

/** Structural webServer contract this plugin depends on (inject: 'webServer'). */
interface WebServerService {
  register(registration: {
    kind: 'prefix'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
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
    return { base: EMPTY_TREE, unbornHead: true }
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

/** One `status` answer: repo detection, porcelain + numstat in one shot. */
async function gitStatus(cwd: unknown): Promise<GitStatusPayload | { ok: false; isRepository: false; error: string }> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) {
    return { ok: false, isRepository: false, error: 'not a git repository (or git is unavailable)' }
  }
  const { base, unbornHead } = await diffBase(repoRoot)
  const [branchRaw, porcelainRaw, numstatRaw] = await Promise.all([
    runGit(repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD']).catch(() => ''),
    runGit(repoRoot, ['status', '--porcelain=v1', '-z', '--untracked-files=all']),
    runGit(repoRoot, ['diff', '--numstat', '-z', '--no-color', '-M', unbornHead ? EMPTY_TREE : 'HEAD']),
  ])
  const entries = parsePorcelainV1(porcelainRaw)
  const numstat = numstatIndex(parseNumstatZ(numstatRaw))
  // Untracked files have no numstat row: probe each once (bounded reads).
  const untrackedCounts = new Map<string, { added: number; binary: boolean }>()
  for (const entry of entries) {
    if (entry.x !== '?') continue
    const probe = await probeUntracked(repoRoot, entry.path)
    if (probe !== null) untrackedCounts.set(entry.path, probe)
  }
  const files: ChangedFile[] = mergeStatus(entries, numstat, untrackedCounts)
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
    base,
    unbornHead,
    files,
    totals: { added, deleted },
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

/** One `file-diff` answer: single-file unified diff, lazily fetched. */
async function gitFileDiff(cwd: unknown, path: unknown, untracked: unknown, full: unknown, origPath: unknown, scope: unknown): Promise<GitFileDiffPayload> {
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
  if (untracked === true) {
    const pseudo = await untrackedPseudoDiff(repoRoot, relPath)
    if (pseudo !== null) return pseudo
  }
  // diffBase already resolves HEAD → hash, falling back to the empty tree id
  // on an unborn HEAD, so `base` alone is the right range argument.
  const { base } = await diffBase(repoRoot)
  // Expanded view: one huge -U merges every hunk (git folds overlapping
  // context), so "show all context" is a plain re-fetch of the same diff.
  const context = full === true ? 100000 : 3
  const diffScope = asScope(scope)
  // 'unstaged' needs no range (worktree vs index) and therefore no fallback;
  // the staged/all ranges hit the empty-tree literal on an unborn HEAD.
  const usesBase = diffScope !== 'unstaged'
  const attempt = (rangeArg: string): Promise<string> => runGit(repoRoot, [
    'diff',
    ...(diffScope === 'staged' ? ['--cached'] : []),
    '--no-color', '-M', '--no-ext-diff', '--unified=' + String(context),
    ...(usesBase ? [rangeArg] : []),
    '--', ...pathspecs,
  ])
  let diffText: string
  try {
    diffText = await attempt(base)
  } catch (error) {
    if (!usesBase) throw error
    // A diff against the empty tree literal is the one sha256-incompatible
    // path; surface git's own words rather than a generic failure.
    diffText = await attempt('HEAD')
  }
  if (diffText === '') {
    // A scoped fetch legitimately answers "nothing in this half" — the
    // pseudo-diff fallback below is only about unclassified worktree drift.
    if (diffScope !== 'all') return { ok: true, binary: false, diff: '', truncated: false }
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
async function gitFileContent(cwd: unknown, path: unknown): Promise<GitFileContentPayload> {
  if (typeof cwd !== 'string' || cwd === '') throw new Error('cwd is required')
  const repoRoot = await resolveRepository(cwd)
  if (repoRoot === null) throw new Error('not a git repository')
  const absPath = fenceRepoPath(repoRoot, typeof path === 'string' ? path : '')
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

/** Read the request body with a hard cap; rejects oversized or non-JSON bodies. */
function readJsonBody(req: IncomingMessage, res: ServerResponse): Promise<Record<string, unknown>> {
  return new Promise((resolvePromise, rejectPromise) => {
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
          respond(res, 200, await gitStatus(body['cwd']))
          return
        }
        if (action === 'file-diff') {
          respond(res, 200, await gitFileDiff(body['cwd'], body['path'], body['untracked'], body['full'], body['origPath'], body['scope']))
          return
        }
        if (action === 'file-content') {
          respond(res, 200, await gitFileContent(body['cwd'], body['path']))
          return
        }
        if (action === 'list-files') {
          respond(res, 200, await gitListFiles(body['cwd']))
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
