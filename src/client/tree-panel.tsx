/**
 * The review tab's file panel: a filterable directory tree of the changed
 * files with per-file status badges. Directories collapse individually
 * (all start expanded); an active filter degrades the panel to a flat
 * matching list, like Codex's file panel. Collapse state is owned by the
 * review view so a status refresh preserves it.
 */
import { useMemo } from 'react'
import type { ChangedFile } from '../contract.ts'
import { badgesFor, buildFileTree, filterFiles, type TreeEntry } from './file-tree.ts'
import { ChevronIcon, SearchIcon } from './icons.tsx'
import { FileTypeIcon } from './file-type-icon.tsx'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS, ReviewKey } from './locales.ts'
import css from './review.module.css'

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
  /** True when the all-files list fetch failed. */
  listFailed: boolean
  /** Content-search match counts per file path (absent = no active search). */
  matchCounts?: ReadonlyMap<string, number>
  t: T
}

function badgeClass(tone: 'Success' | 'Business' | 'Error' | 'Muted'): string {
  return tone === 'Success' ? css.badgeSuccess
    : tone === 'Business' ? css.badgeBusiness
      : tone === 'Error' ? css.badgeError
        : css.badgeMuted
}

/** Render one file row. */
function FileRow({ entry, depth, selected, onSelect, matchCount, t }: {
  entry: TreeEntry & { kind: 'file' }
  depth: number
  selected: string | null
  onSelect: (path: string) => void
  /** Search match count for this file (no chip when 0/undefined). */
  matchCount: number | undefined
  t: T
}) {
  const badges = badgesFor(entry.file)
  return (
    <button
      type="button"
      className={css.fileRow + (selected === entry.path ? ' ' + css.fileRowActive : '')}
      style={{ paddingLeft: 8 + depth * 12 }}
      onClick={() => { onSelect(entry.path) }}
      title={entry.file.origPath === undefined ? entry.path : entry.path + ' \u2190 ' + entry.file.origPath}
    >
      <FileTypeIcon path={entry.path} />
      <span className={css.fileName}>{entry.name}</span>
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
function Node({ entry, depth, selected, onSelect, collapsed, onToggleDir, matchCounts, t }: {
  entry: TreeEntry
  depth: number
  selected: string | null
  onSelect: (path: string) => void
  collapsed: ReadonlySet<string>
  onToggleDir: (path: string) => void
  matchCounts: ReadonlyMap<string, number> | undefined
  t: T
}) {
  if (entry.kind === 'file') {
    return <FileRow entry={entry} depth={depth} selected={selected} onSelect={onSelect} matchCount={matchCounts?.get(entry.path)} t={t} />
  }
  const isCollapsed = collapsed.has(entry.path)
  return (
    <div>
      <button
        type="button"
        className={css.dirRow}
        style={{ paddingLeft: 6 + depth * 12 }}
        onClick={() => { onToggleDir(entry.path) }}
        title={entry.path === '' ? undefined : entry.path}
      >
        <ChevronIcon rotated={isCollapsed} />
        <span className={css.dirName}>{entry.name}</span>
        <span className={css.dirCount}>{entry.fileCount}</span>
      </button>
      {!isCollapsed && entry.children.map(child => (
        <Node
          key={child.kind + ':' + child.path}
          entry={child}
          depth={depth + 1}
          selected={selected}
          onSelect={onSelect}
          collapsed={collapsed}
          onToggleDir={onToggleDir}
          matchCounts={matchCounts}
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
export function TreePanel({ files, selected, onSelect, filter, onFilterChange, collapsed, onToggleDir, mode, onModeChange, showModeRow = true, listFailed, matchCounts, t }: TreePanelProps) {
  const visible = useMemo(() => filterFiles(files, filter), [files, filter])
  const tree = useMemo(() => buildFileTree(visible), [visible])
  const flat = filter.trim() !== ''
  return (
    <div className={css.treePanel} data-git-review-tree="">
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
      <div className={css.treeScroll}>
        {visible.length === 0
          ? <div className={css.treeEmpty}>{t(listFailed ? 'tree.listFailed' : mode === 'all' ? 'tree.empty' : files.length === 0 ? 'tree.noChanges' : 'tree.empty')}</div>
          : flat
            ? visible.map(file => (
              <FileRow
                key={file.path}
                entry={{ kind: 'file', name: file.path, path: file.path, file }}
                depth={0}
                selected={selected}
                onSelect={onSelect}
                matchCount={matchCounts?.get(file.path)}
                t={t}
              />
            ))
            : tree.children.map(child => (
              <Node
                key={child.kind + ':' + child.path}
                entry={child}
                depth={0}
                selected={selected}
                onSelect={onSelect}
                collapsed={collapsed}
                onToggleDir={onToggleDir}
                matchCounts={matchCounts}
                t={t}
              />
            ))}
      </div>
    </div>
  )
}
