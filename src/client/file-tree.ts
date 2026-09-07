/**
 * Changed-file tree building and status-badge derivation for the review tab.
 * The tree aggregates the flat porcelain file list by directory (dirs first,
 * plain codepoint order — deterministic across locales); filtering degrades
 * to a flat list, like Codex's file panel. No React — check-script friendly.
 */
import type { ChangedFile } from '../contract.ts'

/** A directory node aggregating changed files beneath it. */
export interface TreeDir {
  kind: 'dir'
  /** Path segment this node contributes ('' only at the root). */
  name: string
  /** Full repo-relative directory path ('' at the root). */
  path: string
  children: TreeEntry[]
  /** Changed files anywhere beneath this directory. */
  fileCount: number
}

/** A changed-file leaf. */
export interface TreeFile {
  kind: 'file'
  /** Path segment this node contributes. */
  name: string
  /** Full repo-relative file path (the ChangedFile.path). */
  path: string
  file: ChangedFile
}

export type TreeEntry = TreeDir | TreeFile

/** Sort dirs first, then files, each by name (plain codepoint order).
 *  Pure: returns a new array — callers assign the result back. */
function sortChildren(children: TreeEntry[]): TreeEntry[] {
  return [...children].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  })
}

/**
 * Build the directory tree from the flat changed-file list. Every directory
 * in the result contains at least one change by construction (the tree is
 * built from changes only), so the panel renders no empty directories.
 */
export function buildFileTree(files: readonly ChangedFile[]): TreeDir {
  const root: TreeDir = { kind: 'dir', name: '', path: '', children: [], fileCount: 0 }
  const dirIndex = new Map<string, TreeDir>([['', root]])
  const ensureDir = (dirPath: string): TreeDir => {
    const existing = dirIndex.get(dirPath)
    if (existing !== undefined) return existing
    const slash = dirPath.lastIndexOf('/')
    const parent = ensureDir(slash === -1 ? '' : dirPath.slice(0, slash))
    const dir: TreeDir = { kind: 'dir', name: dirPath.slice(slash + 1), path: dirPath, children: [], fileCount: 0 }
    parent.children.push(dir)
    dirIndex.set(dirPath, dir)
    return dir
  }
  for (const file of files) {
    const slash = file.path.lastIndexOf('/')
    const dir = ensureDir(slash === -1 ? '' : file.path.slice(0, slash))
    dir.children.push({ kind: 'file', name: file.path.slice(slash + 1), path: file.path, file })
  }
  const countFiles = (dir: TreeDir): number => {
    let total = 0
    for (const child of dir.children) {
      if (child.kind === 'file') total += 1
      else total += countFiles(child)
    }
    dir.fileCount = total
    return total
  }
  countFiles(root)
  const sortDeep = (dir: TreeDir): void => {
    dir.children = sortChildren(dir.children)
    for (const child of dir.children) {
      if (child.kind === 'dir') sortDeep(child)
    }
  }
  sortDeep(root)
  return root
}

/** True when a porcelain X/Y pair is an unmerged conflict state (both sides
 *  touched the path: UU/AA/DD/AU/UA/DU/UD). Single-sided D (staged delete
 *  vs worktree delete is DD; A+D is a normal staged-add + worktree-delete)
 *  never counts — one shared predicate for badges, banner counts and menus. */
export function isUnmerged(x: string, y: string): boolean {
  const pair = x + y
  return pair === 'UU' || pair === 'AA' || pair === 'DD'
    || pair === 'AU' || pair === 'UA' || pair === 'DU' || pair === 'UD'
}

/** Flat filter over the file list (empty query returns the input order). */
export function filterFiles(files: readonly ChangedFile[], query: string): ChangedFile[] {
  const q = query.trim().toLowerCase()
  if (q === '') return [...files]
  return files.filter(file => file.path.toLowerCase().includes(q) || (file.origPath ?? '').toLowerCase().includes(q))
}

/**
 * Merge the whole-repository file list with the changed rows for all-files
 * tree mode: changed files keep their rows, every other path becomes an
 * `unchanged` row (no badge, file view only). Order follows the input list.
 */
export function mergeAllFiles(allFiles: readonly string[], changed: readonly ChangedFile[]): ChangedFile[] {
  const index = new Map(changed.map(file => [file.path, file]))
  return allFiles.map(path => index.get(path) ?? {
    path,
    x: ' ',
    y: ' ',
    added: 0,
    deleted: 0,
    binary: false,
    untracked: false,
    unchanged: true,
  })
}

/** The badge the panel shows for one file. */
export interface FileBadge {
  /** Glyph rendered in the badge square. */
  glyph: '+' | '\u00b1' | '\u2212' | 'R' | 'C' | '?' | 'U'
  /** Locale key under 'badge.*'. */
  key: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'untracked' | 'conflict'
  /** CSS tone class suffix in the module (badgeSuccess/badgeBusiness/badgeError/badgeMuted). */
  tone: 'Success' | 'Business' | 'Error' | 'Muted'
  /** true = staged (index) half, false = unstaged (worktree) half; absent for untracked. */
  staged?: boolean
}

/** Map one porcelain status letter to its badge (null = inactive column). */
function badgeForCode(code: string): FileBadge | null {
  switch (code) {
    case 'U': return { glyph: 'U', key: 'conflict', tone: 'Error' }
    case 'A': return { glyph: '+', key: 'added', tone: 'Success' }
    case 'D': return { glyph: '\u2212', key: 'deleted', tone: 'Error' }
    case 'R': return { glyph: 'R', key: 'renamed', tone: 'Business' }
    case 'C': return { glyph: 'C', key: 'copied', tone: 'Business' }
    case 'M':
    case 'T': return { glyph: '\u00b1', key: 'modified', tone: 'Business' }
    default: return null
  }
}

/**
 * Derive the badges per file from the porcelain columns: porcelain reports
 * staged (X) and unstaged (Y) separately, so a file changed in both halves
 * renders TWO badges (staged first). Untracked renders its single '?'.
 */
export function badgesFor(file: ChangedFile): FileBadge[] {
  if (file.unchanged === true) return []
  if (file.untracked) return [{ glyph: '?', key: 'untracked', tone: 'Muted' }]
  // An unmerged row (UU/AA/DD/AU/UA/DU/UD) shows one red conflict badge;
  // the split staged/unstaged halves have no meaning mid-conflict.
  if (isUnmerged(file.x, file.y)) return [{ glyph: 'U', key: 'conflict', tone: 'Error' }]
  const out: FileBadge[] = []
  const x = badgeForCode(file.x)
  if (x !== null) out.push({ ...x, staged: true })
  const y = badgeForCode(file.y)
  if (y !== null) out.push({ ...y, staged: false })
  // No active half on a changed row is inconsistent data — render no badge
  // rather than a fake "modified" one (the row itself still lists).
  return out
}

/** The loudest single badge (first of {@link badgesFor}). */
export function badgeFor(file: ChangedFile): FileBadge {
  return badgesFor(file)[0] ?? { glyph: '\u00b1', key: 'modified', tone: 'Business' }
}
