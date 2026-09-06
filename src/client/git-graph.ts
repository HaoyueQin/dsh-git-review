/**
 * Commit-graph lane layout for the review tab's graph view — the same
 * problem gitk / VS Code Git Graph solve: given commits in log order,
 * assign each one a lane (column) and describe the half-row edge segments
 * so a renderer can draw the branch/merge topology. Parents must appear
 * AFTER their children in the input (log order guarantees it).
 *
 * No I/O and no React — the check script imports this file directly under
 * Node's native TS type stripping (Node >= 23.6).
 */

/** The lane-layout input: exactly the log wire rows the layout needs. */
export interface GraphCommit {
  hash: string
  parents: readonly string[]
}

/** One half-row edge segment between lanes. */
export interface GraphEdge {
  /** Source lane (the line's position at the row's top or middle). */
  from: number
  /** Target lane (its position at the middle or bottom). */
  to: number
  /** Color id (stable per branch line; the renderer maps ids to hues). */
  color: number
}

/** One commit row's drawing description. */
export interface GraphLaneRow {
  /** The lane the commit node occupies. */
  lane: number
  /** The node's color id (its own branch line's). */
  color: number
  /** Segments descending INTO the node (upper half of the row). */
  inEdges: readonly GraphEdge[]
  /** Segments leaving the node (lower half of the row). */
  outEdges: readonly GraphEdge[]
  /** Foreign lines passing straight through the whole row. */
  pass: ReadonlyArray<{ lane: number; color: number }>
  /** Number of lanes alive at this row (the drawing's column count). */
  laneCount: number
}

/**
 * Lay out the commit rows. Every lane slot waits for one hash; a commit
 * claims the slot waiting for it (or the first free one), its incoming
 * lines fold into the node, the first parent continues the slot (merging
 * sideways when another slot already waits for it), and further parents
 * either merge into waiting slots or claim new ones — the same convention
 * gitk's --date-order drawing uses.
 */
export function computeGraphLanes(commits: readonly GraphCommit[]): GraphLaneRow[] {
  const rows: GraphLaneRow[] = []
  const tips: Array<{ hash: string | null; color: number }> = []
  let nextColor = 0
  for (const commit of commits) {
    const before = tips.map(tip => ({ ...tip }))
    // 1. Locate this commit's lane: a slot already waiting for it, else the
    //    first free slot (a brand-new tip line gets a fresh color).
    let lane = tips.findIndex(tip => tip.hash === commit.hash)
    const claimed = lane >= 0
    if (lane === -1) {
      lane = tips.findIndex(tip => tip.hash === null)
      if (lane === -1) {
        tips.push({ hash: null, color: 0 })
        lane = tips.length - 1
      }
      tips[lane] = { hash: null, color: nextColor++ }
    }
    const color = tips[lane]!.color
    // 2. Incoming half-rows: every lane waiting for this commit descends
    //    into the node; other slots fold sideways and free themselves.
    const inEdges: GraphEdge[] = []
    for (let i = 0; i < tips.length; i++) {
      if (tips[i]!.hash !== commit.hash) continue
      if (i === lane) {
        if (claimed) inEdges.push({ from: i, to: lane, color })
      } else {
        inEdges.push({ from: i, to: lane, color: tips[i]!.color })
        tips[i] = { hash: null, color: 0 }
      }
    }
    // 3. Outgoing half-rows: first parent continues the line (a straight
    //    lower segment, or a sideways fold into the slot already waiting
    //    for it — the fold keeps the node's own color: it is this branch's
    //    line continuing), further parents merge in (target color: the
    //    merged line continues through the node) or branch out (new color).
    const outEdges: GraphEdge[] = []
    if (commit.parents.length === 0) {
      tips[lane] = { hash: null, color: 0 }
    } else {
      const first = commit.parents[0]!
      const firstTarget = tips.findIndex((tip, i) => i !== lane && tip.hash === first)
      if (firstTarget >= 0) {
        outEdges.push({ from: lane, to: firstTarget, color })
        tips[lane] = { hash: null, color: 0 }
      } else {
        tips[lane] = { hash: first, color }
        outEdges.push({ from: lane, to: lane, color })
      }
      for (const parent of commit.parents.slice(1)) {
        const target = tips.findIndex(tip => tip.hash === parent)
        if (target >= 0) {
          outEdges.push({ from: lane, to: target, color: tips[target]!.color })
          continue
        }
        let free = tips.findIndex(tip => tip.hash === null)
        if (free === -1) {
          tips.push({ hash: null, color: 0 })
          free = tips.length - 1
        }
        tips[free] = { hash: parent, color: nextColor++ }
        outEdges.push({ from: lane, to: free, color: tips[free]!.color })
      }
    }
    // 4. Pass-through lines: slots holding the same hash on both sides of
    //    this row (excluding the node's own lane, drawn via in/out edges).
    const pass: Array<{ lane: number; color: number }> = []
    for (let i = 0; i < tips.length; i++) {
      if (i === lane || tips[i]!.hash === null) continue
      if (before[i] !== undefined && before[i]!.hash === tips[i]!.hash) {
        pass.push({ lane: i, color: tips[i]!.color })
      }
    }
    // Trailing dead slots (freed lanes) must not widen the canvas: count
    // only up to the last live slot, or straight histories after a big
    // merge keep drawing at peak width.
    let live = tips.length
    while (live > 1 && tips[live - 1]!.hash === null) live -= 1
    rows.push({ lane, color, inEdges, outEdges, pass, laneCount: live })
  }
  return rows
}
