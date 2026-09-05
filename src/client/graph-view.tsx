/**
 * The review tab's graph view: a lane-drawn commit list — SVG topology
 * column, decoration badges before the subject, then date/author/hash in
 * aligned columns under a header row (the reference git-graph window's
 * layout). The lane layout itself lives in git-graph.ts (pure, check-script
 * tested); this file only draws it.
 */
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

/** Short local timestamp, the reference graphs' MM/DD HH:mm. */
export function fmtGraphDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return pad(date.getMonth() + 1) + '/' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
}

/** One row's SVG topology cell (pass lines, half-row arcs, node dot). The
 *  canvas width is the WHOLE list's max lane count so grid columns align. */
function GraphCell({ row, width }: { row: GraphLaneRow | undefined; width: number }) {
  if (row === undefined) return <span className={css.graphCell} style={{ width, height: ROW_H }} />
  const mid = ROW_H / 2
  const x = (lane: number): number => lane * LANE_W + LANE_W / 2
  return (
    <svg className={css.graphCell} width={width} height={ROW_H} aria-hidden="true">
      {row.pass.map((line, index) => (
        <line
          key={'p' + index}
          x1={x(line.lane)} y1={0} x2={x(line.lane)} y2={ROW_H}
          stroke={laneColor(line.color)} strokeWidth={1.5}
        />
      ))}
      {row.inEdges.map((edge, index) => (
        <path
          key={'i' + index}
          d={'M ' + x(edge.from) + ' 0 Q ' + x(edge.from) + ' ' + mid + ' ' + x(edge.to) + ' ' + mid}
          fill="none" stroke={laneColor(edge.color)} strokeWidth={1.5}
        />
      ))}
      {row.outEdges.map((edge, index) => (
        <path
          key={'o' + index}
          d={'M ' + x(edge.from) + ' ' + mid + ' Q ' + x(edge.to) + ' ' + mid + ' ' + x(edge.to) + ' ' + ROW_H}
          fill="none" stroke={laneColor(edge.color)} strokeWidth={1.5}
        />
      ))}
      <circle cx={x(row.lane)} cy={mid} r={3.5} fill={laneColor(row.color)} />
    </svg>
  )
}

/** One decoration badge (HEAD/branch/tag/remote), placed before the subject. */
function RefBadge({ ref: decoration }: { ref: { name: string; kind: 'head' | 'tag' | 'other' } }) {
  const className = decoration.name === 'HEAD'
    ? css.refBadgeHeadState
    : decoration.kind === 'head' ? css.refBadgeHead
      : decoration.kind === 'tag' ? css.refBadgeTag
        : css.refBadgeOther
  return <span className={className}>{decoration.name}</span>
}

/** Props of the commit list. */
export interface CommitGraphProps {
  commits: readonly GitCommitSummary[]
  /** One lane row per commit (same order; from computeGraphLanes). */
  lanes: ReadonlyArray<GraphLaneRow | undefined>
  selected: string | null
  onSelect: (hash: string) => void
  t: T
}

/** The scrollable commit list: a header row, then one grid row per commit
 *  (topology | badges+subject | date | author | hash), all columns aligned
 *  via the shared --graph-w variable (the widest lane canvas). */
export function CommitGraph({ commits, lanes, selected, onSelect, t }: CommitGraphProps) {
  const maxLanes = lanes.reduce((width, row) => Math.max(width, row !== undefined ? row.laneCount : 1), 1)
  const graphWidth = Math.max(maxLanes * LANE_W, LANE_W * 2)
  const columns = 'calc(var(--graph-w) + 6px) minmax(0, 1fr) 86px minmax(76px, 110px) 64px'
  return (
    <div className={css.commitList} style={{ '--graph-w': graphWidth + 'px' } as CSSProperties}>
      <div className={css.commitHeader} style={{ gridTemplateColumns: columns }} aria-hidden="true">
        <span>{t('graph.col.graph')}</span>
        <span>{t('graph.col.subject')}</span>
        <span>{t('graph.col.date')}</span>
        <span>{t('graph.col.author')}</span>
        <span>{t('graph.col.commit')}</span>
      </div>
      {commits.map((commit, index) => (
        <button
          key={commit.hash}
          type="button"
          className={css.commitRow + (selected === commit.hash ? ' ' + css.commitRowActive : '')}
          style={{ gridTemplateColumns: columns }}
          onClick={() => { onSelect(commit.hash) }}
          title={commit.subject}
        >
          <GraphCell row={lanes[index]} width={graphWidth} />
          <span className={css.commitMain}>
            {commit.refs.map(ref => <RefBadge key={ref.kind + ':' + ref.name} ref={ref} />)}
            <span className={css.commitSubject}>{commit.subject}</span>
          </span>
          <span className={css.commitDate}>{fmtGraphDate(commit.timestamp)}</span>
          <span className={css.commitAuthor}>{commit.authorName}</span>
          <span className={css.commitHash}>{commit.hash.slice(0, 7)}</span>
        </button>
      ))}
    </div>
  )
}
