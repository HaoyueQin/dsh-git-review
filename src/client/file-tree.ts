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

/** Sort dirs first, then files, each by name (plain codepoint order). */
function sortChildren(children: TreeEntry[]): TreeEntry[] {
  return children.sort((a, b) => {
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
  sortChildren(root.children)
  return root
}

/** Flat filter over the file list (empty query returns the input order). */
export function filterFiles(files: readonly ChangedFile[], query: string): ChangedFile[] {
  const q = query.trim().toLowerCase()
  if (q === '') return [...files]
  return files.filter(file => file.path.toLowerCase().includes(q))
}

/** The badge the panel shows for one file. */
export interface FileBadge {
  /** Glyph rendered in the badge square. */
  glyph: '+' | '\u00b1' | '\u2212' | 'R' | 'C' | '?'
  /** Locale key under 'badge.*'. */
  key: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'untracked'
  /** CSS tone class suffix in the module (badgeSuccess/badgeBusiness/badgeError/badgeMuted). */
  tone: 'Success' | 'Business' | 'Error' | 'Muted'
  /** true = staged (index) half, false = unstaged (worktree) half; absent for untracked. */
  staged?: boolean
}

/** Map one porcelain status letter to its badge (null = inactive column). */
function badgeForCode(code: string): FileBadge | null {
  switch (code) {
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
  if (file.untracked) return [{ glyph: '?', key: 'untracked', tone: 'Muted' }]
  const out: FileBadge[] = []
  const x = badgeForCode(file.x)
  if (x !== null) out.push({ ...x, staged: true })
  const y = badgeForCode(file.y)
  if (y !== null) out.push({ ...y, staged: false })
  return out.length > 0 ? out : [{ glyph: '\u00b1', key: 'modified', tone: 'Business' }]
}

/** The loudest single badge (first of {@link badgesFor}). */
export function badgeFor(file: ChangedFile): FileBadge {
  return badgesFor(file)[0] ?? { glyph: '\u00b1', key: 'modified', tone: 'Business' }
}
