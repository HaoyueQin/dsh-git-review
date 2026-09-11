/**
 * Which byte source each side of an image diff reads. Pure and store-free so
 * the check script can pin every scope/state combination: the base of a
 * staged edit is HEAD, the base of an unstaged edit is the index blob, and
 * the added side of a new file has no source at all (the host answers
 * `missing` for an end that turns out to be absent anyway).
 */

/** Where one side of the comparison reads its bytes. `empty` means the file
 *  does not exist at that end (added or deleted) — the pane draws a
 *  placeholder there. */
export type ImageSide =
  | { kind: 'worktree' }
  | { kind: 'index' }
  | { kind: 'ref'; ref: string }
  | { kind: 'empty' }

/** One side's plan: the source plus the path it reads (a rename differs). */
export interface ImageSidePlan {
  side: ImageSide
  path: string
}

export interface ImageSidesPlan {
  before: ImageSidePlan
  after: ImageSidePlan
  /** Both ends carry a file — only then do swipe/onion/difference apply. */
  comparable: boolean
}

/** The half of a file's changes under review. Structurally identical to
 *  DiffScope (diff-pane) so callers pass theirs unchanged; duplicated here
 *  because the check script must import this module without its CSS. */
export type ImageDiffScope = 'all' | 'staged' | 'unstaged'

export interface ImageSidesInput {
  /** worktree = against HEAD/index; refs = two picked ends; graph = one
   *  commit's parent0 against the commit itself. */
  mode: 'worktree' | 'refs' | 'graph'
  scope: ImageDiffScope
  /** worktree: optional base override (null = HEAD); refs: the left end;
   *  graph: the selected commit's parent0 (null for a root commit). */
  baseRef: string | null
  /** refs: the right end; graph: the selected commit. */
  targetRef: string | null
  /** Porcelain X (index vs HEAD) and Y (worktree vs index) state codes. */
  x?: string
  y?: string
  untracked?: boolean
  path: string
  /** Pre-rename path — the base side reads this one (git rename records). */
  origPath?: string
}

/** HEAD carries the file? X 'A'/'?' means it never did. */
function existsInHead(x: string | undefined, untracked: boolean): boolean {
  if (untracked) return false
  if (x === undefined) return true
  return x !== 'A' && x !== '?'
}

/** The index carries the file? X 'D' means it was staged for removal. A
 *  conflicted (unmerged) file has no stage-0 entry, so its index end answers
 *  `missing` (git: "is in the index, but not at stage 0", exit 128) — the
 *  pane draws an empty side rather than failing. */
function existsInIndex(x: string | undefined, untracked: boolean): boolean {
  if (untracked) return false
  if (x === undefined) return true
  return x !== 'D' && x !== '?'
}

/** The worktree carries the file? Y 'D' means it was deleted on disk. */
function existsInWorktree(y: string | undefined, untracked: boolean): boolean {
  if (untracked) return true
  if (y === undefined) return true
  return y !== 'D'
}

/** One plan entry: `value` null means "no file at this end". */
function plan(path: string, value: ImageSide | null): ImageSidePlan {
  return { side: value ?? { kind: 'empty' }, path }
}

/** A ref source, or null when the end is unset ('' and null both mean none). */
function refOf(ref: string | null): ImageSide | null {
  return ref === null || ref === '' ? null : { kind: 'ref', ref }
}

/**
 * Resolve both ends of an image comparison.
 * @param input - the active mode, scope and the file's state codes.
 * @returns the before/after byte sources, their paths, and whether both
 *  ends carry a file.
 */
export function resolveImageSides(input: ImageSidesInput): ImageSidesPlan {
  const untracked = input.untracked === true
  const beforePath = input.origPath === undefined || input.origPath === '' ? input.path : input.origPath
  if (input.mode !== 'worktree') {
    // Both ends are commits; an added/deleted end comes back flagged by the
    // host (`missing`), so the state codes are not consulted here.
    const before = plan(beforePath, refOf(input.baseRef))
    const after = plan(input.path, refOf(input.targetRef))
    return { before, after, comparable: before.side.kind !== 'empty' && after.side.kind !== 'empty' }
  }
  const headRef = input.baseRef === null || input.baseRef === '' ? 'HEAD' : input.baseRef
  const inHead = existsInHead(input.x, untracked)
  const inIndex = existsInIndex(input.x, untracked)
  const inWorktree = existsInWorktree(input.y, untracked)
  let before: ImageSidePlan
  let after: ImageSidePlan
  if (input.scope === 'staged') {
    // The index half compares the staged blob against HEAD.
    before = plan(beforePath, inHead ? { kind: 'ref', ref: headRef } : null)
    after = plan(input.path, inIndex ? { kind: 'index' } : null)
  } else if (input.scope === 'unstaged') {
    // The unstaged half compares the worktree against the staged blob. Both
    // ends live under the CURRENT path — the index keeps no record of the
    // pre-rename name (only a ref does), so reading origPath here would
    // answer `missing` for every staged rename.
    before = plan(input.path, inIndex ? { kind: 'index' } : null)
    after = plan(input.path, inWorktree ? { kind: 'worktree' } : null)
  } else {
    before = plan(beforePath, inHead ? { kind: 'ref', ref: headRef } : null)
    after = plan(input.path, inWorktree ? { kind: 'worktree' } : null)
  }
  return { before, after, comparable: before.side.kind !== 'empty' && after.side.kind !== 'empty' }
}
