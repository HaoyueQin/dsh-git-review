/**
 * The review tab's graph view: a lane-drawn commit list — SVG topology
 * column, subject, decoration badges, author/date/hash — like gitk or VS
 * Code's Git Graph panel. The lane layout itself lives in git-graph.ts
 * (pure, check-script tested); this file only draws it.
 */
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

/** One row's SVG topology cell (pass lines, half-row arcs, node dot). */
function GraphCell({ row }: { row: GraphLaneRow }) {
  const width = row.laneCount * LANE_W
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

/** Props of the commit list. */
export interface CommitGraphProps {
  commits: readonly GitCommitSummary[]
  /** One lane row per commit (same order; from computeGraphLanes). */
  lanes: ReadonlyArray<GraphLaneRow | undefined>
  selected: string | null
  onSelect: (hash: string) => void
  t: T
}

/** The scrollable commit list with its topology column. */
export function CommitGraph({ commits, lanes, selected, onSelect, t }: CommitGraphProps) {
  return (
    <div className={css.commitList}>
      {commits.map((commit, index) => {
        const row = lanes[index]
        return (
          <button
            key={commit.hash}
            type="button"
            className={css.commitRow + (selected === commit.hash ? ' ' + css.commitRowActive : '')}
            onClick={() => { onSelect(commit.hash) }}
            title={commit.subject}
          >
            {row !== undefined && <GraphCell row={row} />}
            <span className={css.commitSubject}>{commit.subject}</span>
            {commit.refs.map(ref => (
              <span
                key={ref.kind + ':' + ref.name}
                className={ref.kind === 'head' ? css.refBadgeHead : ref.kind === 'tag' ? css.refBadgeTag : css.refBadgeOther}
                title={ref.kind === 'head' ? t('graph.headRef') : ref.kind === 'tag' ? t('graph.tagRef') : ref.name}
              >
                {ref.name}
              </span>
            ))}
            <span className={css.commitSpacer} />
            <span className={css.commitAuthor}>{commit.authorName}</span>
            <span className={css.commitDate}>{fmtGraphDate(commit.timestamp)}</span>
            <span className={css.commitHash}>{commit.hash.slice(0, 7)}</span>
          </button>
        )
      })}
    </div>
  )
}
