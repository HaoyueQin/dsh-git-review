/**
 * dsh-git-review — wire contract shared by both halves.
 *
 * The host half builds these payloads; the browser half consumes them. Pure
 * types: bundling the file into each half costs nothing at runtime.
 */

/** One changed file as the status payload reports it. */
export interface ChangedFile {
  /** Repo-root-relative path with '/' separators (git's wire form). */
  path: string
  /** Rename/copy source path, present only for porcelain X = 'R' | 'C'. */
  origPath?: string | undefined
  /** Porcelain status code, staged (index vs HEAD) column. */
  x: string
  /** Porcelain status code, unstaged (worktree vs index) column. */
  y: string
  /** Lines added vs the diff base (0 for binary files). */
  added: number
  /** Lines deleted vs the diff base (0 for binary files). */
  deleted: number
  /** The file's diff is binary (numstat '-'). */
  binary: boolean
  /** The file is untracked (porcelain '??'). */
  untracked: boolean
  /** Worktree blob hash (status worktree mode only, existing files only):
   *  the reviewed-marker's identity — the marker rides the hash, so an
   *  agent's new edit (new hash) auto-unmarks the file. */
  blob?: string
  /** Client-synthesis marker for all-files tree mode (the host never sets it):
   *  the row stands for a repository file with no local changes. */
  unchanged?: boolean
}

/** Successful `status` payload: everything the tab needs in one shot. */
export interface GitStatusPayload {
  ok: true
  /** realpath of the repository root; every file path is relative to it. */
  root: string
  /** Current branch name, or null when it could not be read (detached etc.). */
  branch: string | null
  /** Diff base: the HEAD commit id, or the empty-tree id on an unborn HEAD. */
  base: string
  /** True when HEAD points at no commit yet (fresh repository). */
  unbornHead: boolean
  /** Active diff-base override ref name (absent/null = compare against HEAD). */
  baseRef?: string | null
  files: ChangedFile[]
  totals: { added: number; deleted: number }
  /** Local commits the upstream lacks (worktree mode only; absent = no upstream). */
  ahead?: number
  /** Upstream commits the local branch lacks (worktree mode only). */
  behind?: number
  /** A history operation is mid-flight (its continue/abort UI shows). */
  inProgress?: 'merge' | 'rebase' | 'cherry-pick' | 'revert' | null
}

/** One selectable ref for the diff-base dropdown. */
export interface GitRefEntry {
  /** Short ref name ('main', 'origin/dev', 'v1.0'). */
  name: string
  kind: 'branch' | 'remote' | 'tag'
}

/** Successful `refs` payload: selectable diff-base refs, capped. */
export interface GitRefsPayload {
  ok: true
  refs: GitRefEntry[]
  /** True when the list was cut at the host's ref cap. */
  truncated: boolean
}

/** Failed `status` payload; `isRepository` drives the tab's guidance copy. */
export interface GitStatusFailure {
  ok: false
  isRepository: boolean
  error: string
}

/** Successful `file-diff` payload (text form). */
export interface GitFileDiffText {
  ok: true
  binary: false
  /** Unified diff of one file vs the diff base ('' when no textual change). */
  diff: string
  /** True when `diff` was cut at the size cap (at a line boundary). */
  truncated: boolean
}

/** Successful `file-diff` payload (binary form). */
export interface GitFileDiffBinary {
  ok: true
  binary: true
  diff: ''
  truncated: false
  /** File size in bytes, when known. */
  size: number
}

export type GitFileDiffPayload = GitFileDiffText | GitFileDiffBinary

/** Failed `file-diff` payload. */
export interface GitFileDiffFailure {
  ok: false
  error: string
}

/** Successful `file-content` payload (text form): the whole file for the file view. */
export interface GitFileContentText {
  ok: true
  binary: false
  content: string
  /** True when the file exceeds the host's read cap (content is a prefix). */
  truncated: boolean
  /** File size in bytes. */
  size: number
}

/** Successful `file-content` payload (binary form): no text is served. */
export interface GitFileContentBinary {
  ok: true
  binary: true
  content: ''
  truncated: boolean
  size: number
}

export type GitFileContentPayload = GitFileContentText | GitFileContentBinary

/** Successful `file-bytes` payload: raw preview bytes (image/PDF) as base64.
 *  The mime is magic-sniffed server-side, never trusted from the extension;
 *  an unsniffable file answers ok:false and the tab keeps its binary notice. */
export interface GitFileBytesPayload {
  ok: true
  /** Raw bytes, base64 (the route stays POST+JSON per the CSRF posture). */
  base64: string
  /** Magic-sniffed content type (see PreviewMime in git-parse.ts). */
  mime: string
  /** File size in bytes (may exceed the served prefix when truncated). */
  size: number
  /** True when only a capped prefix was served (no full preview). */
  truncated: boolean
}

/** One blame row: the commit that last touched that final line. */
export interface GitBlameLine {
  /** 40-hex commit that introduced the line. */
  hash: string
  /** Line number in the originating commit (1-based). */
  origLine: number
  /** Line number in the final (blamed) file (1-based). */
  finalLine: number
  /** Author name; empty for lines whose commit metadata was capped. */
  author: string
  /** Author time, unix seconds (0 when unparseable). */
  timestamp: number
  /** Commit subject; empty when metadata was capped. */
  summary: string
}

/** Successful blame payload: one row per final file line (order = lines). */
export interface GitBlamePayload {
  ok: true
  lines: GitBlameLine[]
  /** True when the file has more lines than the host blames. */
  truncated: boolean
}

/** Successful file-history payload: commits that touched one file. */
export interface GitFileHistoryPayload {
  ok: true
  commits: GitCommitSummary[]
  /** True when the log was cut at the host's commit cap. */
  truncated: boolean
}

/** Successful `list-files` payload: every repository file for all-files mode. */
export interface GitListFilesPayload {
  ok: true
  files: string[]
  /** True when the list was cut at the host's entry cap. */
  truncated: boolean
}

/** One per-file content-search result. */
export interface GitSearchMatch {
  path: string
  count: number
}

/** Successful `search` payload: per-file case-insensitive match counts, loudest first. */
export interface GitSearchPayload {
  ok: true
  matches: GitSearchMatch[]
  /** True when part of the workspace was skipped (untracked cap) — results partial. */
  truncated: boolean
}

/** One commit in the graph log. */
export interface GitCommitSummary {
  hash: string
  /** Parent hashes, first-parent first; empty for a root commit. */
  parents: string[]
  authorName: string
  /** Author time, unix seconds. */
  timestamp: number
  /** Decorations on this commit (branch/tag pointers). */
  refs: { name: string; kind: 'head' | 'tag' | 'other' }[]
  subject: string
  /** Commit-message body (everything after the subject line); '' when the
   *  message is subject-only. Rendered under the subject in the detail. */
  body: string
}

/** Successful `log` payload: the commit-graph feed, newest first. */
export interface GitLogPayload {
  ok: true
  commits: GitCommitSummary[]
  /** True when the feed was cut at the host's commit cap. */
  truncated: boolean
}

/** Successful `commit-files` payload: one commit's changed files (vs its
 *  first parent; a root commit diffs against the empty tree). */
export interface GitCommitFilesPayload {
  ok: true
  files: ChangedFile[]
  totals: { added: number; deleted: number }
}

/** `commit`/`push` answer. Failures carry git's own human-readable words
 *  (stderr, or stdout for commit's "nothing to commit") verbatim. */
export interface GitWritePayload {
  ok: boolean
  /** Git's stdout on success (e.g. the commit summary). */
  output?: string
  /** Failure reason, verbatim from git. */
  error?: string
}

/** One selectable open-with app (the file tree's context menu). */
export interface OpenApp {
  id: 'default' | 'explorer' | 'notepad' | 'code' | 'code-insiders'
  /** Availability probed by the host (where/which); the list keeps missing
   *  editors visible but marked, so the reason the item is disabled is clear. */
  available: boolean
}

/** Successful `apps` payload: the open-with candidates. */
export interface OpenAppsPayload {
  ok: true
  apps: OpenApp[]
}

/** One entry of the stash list (`git stash list`, oldest `stash@{n}` last). */
export interface GitStashEntry {
  /** Stash selector index n (the client renders `stash@{n}`). */
  index: number
  /** Author time, unix seconds. */
  timestamp: number
  /** The stash's subject line (git's default "WIP on …" or a custom message). */
  subject: string
}

/** Successful `stash` payload (action 'list'). */
export interface GitStashPayload {
  ok: true
  stashes: GitStashEntry[]
}

/** Successful `last-commit` payload: the current branch's tip, for the
 *  commit popover's amend prefill. */
export interface GitLastCommitPayload {
  ok: true
  hash: string
  subject: string
  /** Full commit message body (the textarea prefill). */
  message: string
}
