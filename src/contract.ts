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
  files: ChangedFile[]
  totals: { added: number; deleted: number }
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
