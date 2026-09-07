/**
 * The review tab's graph view: a lane-drawn commit list — SVG topology
 * column, decoration badges before the subject, then date/author/hash in
 * aligned columns under a header row (the reference git-graph window's
 * layout). The lane layout itself lives in git-graph.ts (pure, check-script
 * tested); this file only draws it.
 */
import { useRef } from 'react'
import type { CSSProperties } from 'react'
import type { GitCommitSummary } from '../contract.ts'
import type { GraphLaneRow } from './git-graph.ts'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import css from './review.module.css'

type T = PropsLocale<typeof NS>['t']

const LANE_W = 12
const ROW_H = 27

/** Stable hue per branch-line color id (theme-neutral visibility, the same
 *  trick gitk uses — semantic tokens don't stretch to 8 distinguishable
 *  hues, and topology colors are decoration, not state). */
function laneColor(id: number): string {
  return 'hsl(' + String((id * 67) % 360) + ' 62% 52%)'
}

/** Short local timestamp, the reference graphs' MM/DD HH:mm (with the
 *  year once the commit leaves the current calendar year). */
export function fmtGraphDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const pad = (value: number): string => String(value).padStart(2, '0')
  const year = date.getFullYear() === new Date().getFullYear() ? '' : date.getFullYear() + '/'
  return year + pad(date.getMonth() + 1) + '/' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
}

/** One row's SVG topology cell (pass lines, half-row arcs, node dot). The
 *  canvas width is the WHOLE list's max lane count so grid columns align.
 *  Cross-lane moves are cubic S-curves whose control points keep BOTH end
 *  tangents vertical — lines fall into and out of every node straight down
 *  (the vscode-git-graph shape), never hooking in sideways. */
function GraphCell({ row, width }: { row: GraphLaneRow | undefined; width: number }) {
  if (row === undefined) return <span className={css.graphCell} style={{ width, height: ROW_H }} />
  const mid = ROW_H / 2
  const halfUp = mid / 2
  const halfDown = mid + (ROW_H - mid) / 2
  const x = (lane: number): number => lane * LANE_W + LANE_W / 2
  const curve = (x1: number, y0: number, x2: number, y1: number, ym: number): string =>
    x1 === x2
      ? 'M ' + x1 + ' ' + y0 + ' L ' + x1 + ' ' + y1
      : 'M ' + x1 + ' ' + y0 + ' C ' + x1 + ' ' + ym + ' ' + x2 + ' ' + ym + ' ' + x2 + ' ' + y1
  return (
    <svg className={css.graphCell} width={width} height={ROW_H} aria-hidden="true">
      {row.pass.map((line, index) => (
        <line
          key={'p' + index}
          data-color={String(line.color)}
          x1={x(line.lane)} y1={0} x2={x(line.lane)} y2={ROW_H}
          stroke={laneColor(line.color)} strokeWidth={1.5}
        />
      ))}
      {row.inEdges.map((edge, index) => (
        <path
          key={'i' + index}
          data-color={String(edge.color)}
          d={curve(x(edge.from), 0, x(edge.to), mid, halfUp)}
          fill="none" stroke={laneColor(edge.color)} strokeWidth={1.5}
        />
      ))}
      {row.outEdges.map((edge, index) => (
        <path
          key={'o' + index}
          data-color={String(edge.color)}
          d={curve(x(edge.from), mid, x(edge.to), ROW_H, halfDown)}
          fill="none" stroke={laneColor(edge.color)} strokeWidth={1.5}
        />
      ))}
      <circle data-color={String(row.color)} cx={x(row.lane)} cy={mid} r={row.inEdges.length > 1 ? 4.2 : 3.5} fill={laneColor(row.color)} />
    </svg>
  )
}

/** One decoration badge (HEAD/branch/tag/remote), placed before the subject.
 *  The prop must NOT be named `ref` — React consumes that reserved prop and
 *  the component would crash reading a name off undefined. */
function RefBadge({ decoration }: { decoration: { name: string; kind: 'head' | 'tag' | 'other' } }) {
  const className = decoration.name === 'HEAD'
    ? css.refBadgeHeadState
    : decoration.kind === 'head' ? css.refBadgeHead
      : decoration.kind === 'tag' ? css.refBadgeTag
        : css.refBadgeOther
  return <span className={className}>{decoration.name}</span>
}

/** Visible-column density of the full list.
 *  From narrow to wide the list gains subject → date → hash → author. */
export type GraphDensity = 1 | 2 | 3 | 4

/** Props of the commit list. */
export interface CommitGraphProps {
  commits: readonly GitCommitSummary[]
  /** One lane row per commit (same order; from computeGraphLanes). */
  lanes: ReadonlyArray<GraphLaneRow | undefined>
  selected: string | null
  onSelect: (hash: string) => void
    /** Visible-column density of the full list. */
  density?: GraphDensity
  /** Uncommitted worktree changes (the virtual row above the tip); absent
   *  when the worktree is clean or the status is not loaded. */
  worktree?: { files: number } | null
  worktreeSelected?: boolean
  onSelectWorktree?: () => void
  /** Right-click a commit row: the history-operations menu anchor. */
  onCommitMenu?: (hash: string, subject: string, x: number, y: number) => void
  t: T
}

/** The uncommitted-changes virtual row: a hollow dashed node dropping a
 *  dashed line toward the tip below — the agent's in-flight work drawn INTO
 *  the graph (the git-status/dock-git convention). Columns mirror the full
 *  list's grid. */
function WorktreeRow({ width, label, selected, onSelect, columns, density }: { width: number; label: string; selected: boolean; onSelect: () => void; columns: string; density: GraphDensity }) {
  const mid = ROW_H / 2
  const cx = LANE_W / 2
  return (
    <button
      type="button"
      className={css.commitRow + (selected ? ' ' + css.commitRowActive : '')}
      style={{ gridTemplateColumns: columns }}
      onClick={onSelect}
    >
      <svg className={css.graphCell} width={width} height={ROW_H} aria-hidden="true">
        <circle cx={cx} cy={mid} r={3.5} fill="none" stroke="var(--dsw-alias-label-tertiary)" strokeWidth={1.5} strokeDasharray="2 2" />
        <line x1={cx} y1={mid + 4} x2={cx} y2={ROW_H} stroke="var(--dsw-alias-label-tertiary)" strokeWidth={1.2} strokeDasharray="2 3" />
      </svg>
      {density >= 1 && (
        <span className={css.commitMain}>
          <span className={css.chip}>{label}</span>
        </span>
      )}
      {density >= 2 && <span className={css.commitDate} />}
      {density >= 3 && <span className={css.commitHash} />}
      {density >= 4 && <span className={css.commitAuthor} />}
    </button>
  )
}

/** The scrollable commit list: a header row, then one grid row per commit
 *  (topology | badges+subject | date | author | hash), all columns aligned
 *  via the shared --graph-w variable (the widest lane canvas). */
/** Full-list grid columns (topology | subject | date | hash | author) — one
 *  shared template so header, rows and the worktree row never drift apart.
 *  Densities 1-3 are leading prefixes of the full template, so narrowing
 *  the list drops author, then hash, then date, in that order. */
const GRAPH_COLUMNS = 'calc(var(--graph-w) + 6px) minmax(0, 1fr) 86px 64px minmax(76px, 110px)'
const GRAPH_DENSITY_COLUMNS: Record<GraphDensity, string> = {
  1: 'calc(var(--graph-w) + 6px) minmax(0, 1fr)',
  2: 'calc(var(--graph-w) + 6px) minmax(0, 1fr) 86px',
  3: 'calc(var(--graph-w) + 6px) minmax(0, 1fr) 86px 64px',
  4: GRAPH_COLUMNS,
}

export function CommitGraph({ commits, lanes, selected, onSelect, density = 4, worktree, worktreeSelected = false, onSelectWorktree, onCommitMenu, t }: CommitGraphProps) {
  const maxLanes = lanes.reduce((width, row) => Math.max(width, row !== undefined ? row.laneCount : 1), 1)
  const graphWidth = Math.max(maxLanes * LANE_W, LANE_W * 2)
  const columns = GRAPH_DENSITY_COLUMNS[density]
  // Branch-line highlight on hover: dim every SVG element whose color id is
  // not the hovered row's, via native style toggling on the list container —
  // a React state re-render of 500 SVG rows per mouse move would stutter,
  // and the DOM sweep is one querySelectorAll.
  const listRef = useRef<HTMLDivElement | null>(null)
  /** Lane currently lit (skips the O(N) DOM sweep on same-lane moves). */
  const litColorRef = useRef<number | null>(null)
  const litLine = (color: number): void => {
    if (litColorRef.current === color) return
    const rootEl = listRef.current
    if (rootEl === null) return
    litColorRef.current = color
    rootEl.querySelectorAll<SVGElement>('[data-color]').forEach(el => {
      el.style.opacity = el.dataset.color === String(color) ? '1' : '0.22'
    })
  }
  const unlitLine = (): void => {
    litColorRef.current = null
    const rootEl = listRef.current
    if (rootEl === null) return
    rootEl.querySelectorAll<SVGElement>('[data-color]').forEach(el => { el.style.opacity = '1' })
  }
  return (
    <div ref={listRef} className={css.commitList} style={{ '--graph-w': graphWidth + 'px' } as CSSProperties}>
      <div className={css.commitHeader} style={{ gridTemplateColumns: columns }} aria-hidden="true">
        <span>{t('graph.col.graph')}</span>
        {density >= 1 && <span>{t('graph.col.subject')}</span>}
        {density >= 2 && <span>{t('graph.col.date')}</span>}
        {density >= 3 && <span>{t('graph.col.commit')}</span>}
        {density >= 4 && <span>{t('graph.col.author')}</span>}
      </div>
      {worktree !== null && worktree !== undefined && (
        <WorktreeRow
          width={graphWidth}
          label={t('graph.worktree', { count: worktree.files })}
          selected={worktreeSelected}
          onSelect={() => { onSelectWorktree?.() }}
          columns={columns}
          density={density}
        />
      )}
      {commits.map((commit, index) => (
        <button
          key={commit.hash}
          type="button"
          className={css.commitRow + (selected === commit.hash ? ' ' + css.commitRowActive : '')}
          style={{ gridTemplateColumns: columns }}
          onClick={() => { onSelect(commit.hash) }}
          onContextMenu={onCommitMenu === undefined ? undefined : event => {
            event.preventDefault()
            onCommitMenu(commit.hash, commit.subject, event.clientX, event.clientY)
          }}
          onMouseEnter={() => { const row = lanes[index]; if (row !== undefined) litLine(row.color) }}
          onMouseLeave={() => { unlitLine() }}
          title={commit.subject}
        >
          <GraphCell row={lanes[index]} width={graphWidth} />
          {density >= 1 && (
            <span className={css.commitMain}>
              {commit.refs.map(ref => <RefBadge key={ref.kind + ':' + ref.name} decoration={ref} />)}
              <span className={css.commitSubject}>{commit.subject}</span>
            </span>
          )}
          {density >= 2 && <span className={css.commitDate}>{fmtGraphDate(commit.timestamp)}</span>}
          {density >= 3 && <span className={css.commitHash}>{commit.hash.slice(0, 7)}</span>}
          {density >= 4 && <span className={css.commitAuthor}>{commit.authorName}</span>}
        </button>
      ))}
    </div>
  )
}
