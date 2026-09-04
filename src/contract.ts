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

/** `commit`/`push` answer. Failures carry git's own human-readable words
 *  (stderr, or stdout for commit's "nothing to commit") verbatim. */
export interface GitWritePayload {
  ok: boolean
  /** Git's stdout on success (e.g. the commit summary). */
  output?: string
  /** Failure reason, verbatim from git. */
  error?: string
}
