/**
 * The review tab's file panel: a filterable directory tree of the changed
 * files with per-file status badges. Directories collapse individually
 * (all start expanded); an active filter degrades the panel to a flat
 * matching list, like Codex's file panel. Collapse state is owned by the
 * review view so a status refresh preserves it.
 */
import { useEffect, useMemo, useState } from 'react'
import type { ChangedFile } from '../contract.ts'
import { badgesFor, buildFileTree, collectDirFiles, filterFiles, type TreeDir, type TreeEntry } from './file-tree.ts'
import { ChevronIcon, SearchIcon } from './icons.tsx'
import { FileTypeIcon } from './file-type-icon.tsx'
import { FileCounts } from './file-counts.tsx'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS, ReviewKey } from './locales.ts'
import css from './review.module.css'

/** Flat-list page size: bounds the mounted rows in all-files mode. */
const TREE_PAGE = 300

type T = PropsLocale<typeof NS>['t']

/** Props of the file panel. */
export interface TreePanelProps {
  files: readonly ChangedFile[]
  selected: string | null
  onSelect: (path: string) => void
  filter: string
  onFilterChange: (next: string) => void
  /** Collapsed directory paths (repo-relative). */
  collapsed: ReadonlySet<string>
  onToggleDir: (path: string) => void
  /** 'changes' = uncommitted files only; 'all' = the whole repository list. */
  mode: 'changes' | 'all'
  onModeChange: (next: 'changes' | 'all') => void
  /** False hides the changes/all switch (ref-range mode pins to changes). */
  showModeRow?: boolean
  /** False hides the panel's own filter input (the toolbar search drives
   *  path filtering in the worktree view; the graph tree keeps its own). */
  showFilter?: boolean
  /** True when the all-files list fetch failed. */
  listFailed: boolean
  /** Content-search match counts per file path (absent = no active search). */
  matchCounts?: ReadonlyMap<string, number>
  /** Reviewed-marker callbacks (absent = markers hidden, e.g. ref-range or
   *  graph mode where rows have no worktree blob hash). */
  viewedHas?: (blob: string) => boolean
  onToggleViewed?: (blob: string) => void
  /** Files whose blob hash is not marked reviewed yet (the tree's header chip). */
  pendingCount?: number
  /** Right-click one file row: called with the path + viewport coords and
   *  the row's file record (the menu derives the SCM actions from it). */
  onFileMenu?: (path: string, x: number, y: number, file: ChangedFile) => void
  /** Right-click one directory row: called with the dir path + viewport
   *  coords and every changed file beneath it (the menu aggregates the SCM
   *  actions from those rows; absent = directories have no menu). */
  onDirMenu?: (path: string, x: number, y: number, files: ChangedFile[]) => void
  /** Dragged width override in px (absent = the CSS clamp default). */
  width?: number
  t: T
}

function badgeClass(tone: 'Success' | 'Business' | 'Error' | 'Muted'): string {
  return tone === 'Success' ? css.badgeSuccess
    : tone === 'Business' ? css.badgeBusiness
      : tone === 'Error' ? css.badgeError
        : css.badgeMuted
}

/** Render one file row. */
function FileRow({ entry, depth, selected, onSelect, matchCount, viewedHas, onToggleViewed, onFileMenu, t }: {
  entry: TreeEntry & { kind: 'file' }
  depth: number
  selected: string | null
  onSelect: (path: string) => void
  /** Search match count for this file (no chip when 0/undefined). */
  matchCount: number | undefined
  viewedHas?: (blob: string) => boolean
  onToggleViewed?: (blob: string) => void
  onFileMenu?: (path: string, x: number, y: number, file: ChangedFile) => void
  t: T
}) {
  const badges = badgesFor(entry.file)
  // The reviewed marker: a span (the row itself is a <button>; nested
  // buttons are illegal), toggled with stopPropagation so it never selects.
  const blob = entry.file.blob
  const viewed = blob !== undefined && viewedHas !== undefined && viewedHas(blob)
  const viewedTitle = viewed ? t('viewed.marked') : t('viewed.mark')
  return (
    <button
      type="button"
      className={css.fileRow + (selected === entry.path ? ' ' + css.fileRowActive : '')}
      style={{ paddingLeft: 8 + depth * 12 }}
      onClick={() => { onSelect(entry.path) }}
      onContextMenu={onFileMenu === undefined ? undefined : (event) => {
        event.preventDefault()
        onFileMenu(entry.path, event.clientX, event.clientY, entry.file)
      }}
      title={entry.file.origPath === undefined ? entry.path : entry.path + ' \u2190 ' + entry.file.origPath}
    >
      {blob !== undefined && viewedHas !== undefined && onToggleViewed !== undefined && (
        <span
          role="checkbox"
          aria-checked={viewed}
          aria-label={viewedTitle}
          title={viewedTitle}
          tabIndex={0}
          className={css.viewedDot + (viewed ? ' ' + css.viewedDotDone : '')}
          onClick={(event) => {
            event.stopPropagation()
            onToggleViewed(blob)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              event.stopPropagation()
              onToggleViewed(blob)
            }
          }}
        >
          {viewed ? '\u2713' : ''}
        </span>
      )}
      <FileTypeIcon path={entry.path} />
      <span className={css.fileName}>{entry.name}</span>
      <FileCounts file={entry.file} />
      {badges.map((badge, index) => (
        <span
          key={index}
          className={css.badge + ' ' + badgeClass(badge.tone)}
          title={(badge.staged === true ? t('badge.staged') + ' \u00b7 ' : badge.staged === false ? t('scope.unstaged') + ' \u00b7 ' : '') + t(('badge.' + badge.key) as ReviewKey)}
        >
          {badge.glyph}
        </span>
      ))}
      {(matchCount ?? 0) > 0 && <span className={css.matchChip}>{matchCount}</span>}
    </button>
  )
}

/** Render one tree node (dir or file) at its depth. */
function Node({ entry, depth, selected, onSelect, collapsed, onToggleDir, matchCounts, viewedHas, onToggleViewed, onFileMenu, onDirMenu, t }: {
  entry: TreeEntry
  depth: number
  selected: string | null
  onSelect: (path: string) => void
  collapsed: ReadonlySet<string>
  onToggleDir: (path: string) => void
  matchCounts: ReadonlyMap<string, number> | undefined
  viewedHas?: (blob: string) => boolean
  onToggleViewed?: (blob: string) => void
  onFileMenu?: (path: string, x: number, y: number, file: ChangedFile) => void
  onDirMenu?: (path: string, x: number, y: number, files: ChangedFile[]) => void
  t: T
}) {
  if (entry.kind === 'file') {
    return <FileRow entry={entry} depth={depth} selected={selected} onSelect={onSelect} matchCount={matchCounts?.get(entry.path)} viewedHas={viewedHas} onToggleViewed={onToggleViewed} onFileMenu={onFileMenu} t={t} />
  }
  const dir: TreeDir = entry
  const isCollapsed = collapsed.has(dir.path)
  return (
    <div>
      <button
        type="button"
        className={css.dirRow}
        style={{ paddingLeft: 6 + depth * 12 }}
        onClick={() => { onToggleDir(dir.path) }}
        onContextMenu={onDirMenu === undefined || dir.path === '' ? undefined : (event) => {
          event.preventDefault()
          event.stopPropagation()
          onDirMenu(dir.path, event.clientX, event.clientY, collectDirFiles(dir))
        }}
        title={dir.path === '' ? undefined : dir.path}
      >
        <ChevronIcon rotated={!isCollapsed} />
        <span className={css.dirName}>{dir.name}</span>
        <span className={css.dirCount}>{dir.fileCount}</span>
      </button>
      {!isCollapsed && dir.children.map(child => (
        <Node
          key={child.kind + ':' + child.path}
          entry={child}
          depth={depth + 1}
          selected={selected}
          onSelect={onSelect}
          collapsed={collapsed}
          onToggleDir={onToggleDir}
          matchCounts={matchCounts}
          viewedHas={viewedHas}
          onToggleViewed={onToggleViewed}
          onFileMenu={onFileMenu}
          onDirMenu={onDirMenu}
          t={t}
        />
      ))}
    </div>
  )
}

/**
 * The panel body: filter box above, tree (or flat filtered list) below.
 * @param props - files, selection, filter/collapse state and callbacks, locale.
 */
export function TreePanel({ files, selected, onSelect, filter, onFilterChange, collapsed, onToggleDir, mode, onModeChange, width, showModeRow = true, showFilter = true, listFailed, matchCounts, viewedHas, onToggleViewed, pendingCount, onFileMenu, onDirMenu, t }: TreePanelProps) {
  const visible = useMemo(() => filterFiles(files, filter), [files, filter])
  // The filtered flat list never needs the tree: skip the O(n log n) rebuild
  // while typing (all-files mode makes this a keystroke cost). A tree wider
  // than one page falls back to that same paged list — recursive rows carry no
  // budget of their own, so a workspace with thousands of untracked files used
  // to mount every one of them at once.
  const flat = filter.trim() !== '' || visible.length > TREE_PAGE
  const tree = useMemo(() => (flat ? null : buildFileTree(visible)), [flat, visible])
  const [shown, setShown] = useState(TREE_PAGE)
  useEffect(() => { setShown(TREE_PAGE) }, [filter, files])
  return (
    <div className={css.treePanel} data-git-review-tree="" style={width !== undefined ? { width } : undefined}>
      {pendingCount !== undefined && pendingCount > 0 && (
        <div className={css.treePending}>{t('tree.pending', { count: pendingCount })}</div>
      )}
      {showModeRow && (
        <div className={css.treeModeRow}>
          <span className={css.scopeSwitch} role="group" aria-label={t('tree.mode.label')}>
            {(['changes', 'all'] as const).map(candidate => (
              <button
                key={candidate}
                type="button"
                className={css.scopeBtn + (mode === candidate ? ' ' + css.scopeBtnActive : '')}
                onClick={() => { onModeChange(candidate) }}
              >
                {t(('tree.mode.' + candidate) as ReviewKey)}
              </button>
            ))}
          </span>
        </div>
      )}
      {showFilter && (
        <label className={css.filterRow}>
          <SearchIcon />
          <input
            className={css.filterInput}
            value={filter}
            onChange={event => { onFilterChange(event.target.value) }}
            placeholder={t('filter')}
            spellCheck={false}
          />
        </label>
      )}
      <div className={css.treeScroll}>
        {visible.length === 0
          ? <div className={css.treeEmpty}>{t(listFailed ? 'tree.listFailed' : mode === 'all' ? 'tree.empty' : files.length === 0 ? 'tree.noChanges' : 'tree.empty')}</div>
          : flat
            ? <>
              {visible.slice(0, shown).map(file => (
              <FileRow
                key={file.path}
                entry={{ kind: 'file', name: file.path, path: file.path, file }}
                depth={0}
                selected={selected}
                onSelect={onSelect}
                matchCount={matchCounts?.get(file.path)}
                viewedHas={viewedHas}
                onToggleViewed={onToggleViewed}
                onFileMenu={onFileMenu}
                t={t}
              />
            ))}
              {visible.length > shown && (
                <button type="button" className={css.scopeBtn} onClick={() => { setShown(value => value + TREE_PAGE) }}>
                  {t('tree.showMore', { count: visible.length - shown })}
                </button>
              )}
            </>
            : (tree?.children ?? []).map(child => (
              <Node
                key={child.kind + ':' + child.path}
                entry={child}
                depth={0}
                selected={selected}
                onSelect={onSelect}
                collapsed={collapsed}
                onToggleDir={onToggleDir}
                matchCounts={matchCounts}
                viewedHas={viewedHas}
                onToggleViewed={onToggleViewed}
                onFileMenu={onFileMenu}
                onDirMenu={onDirMenu}
                t={t}
              />
            ))}
      </div>
    </div>
  )
}
