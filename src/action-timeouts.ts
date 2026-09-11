/**
 * One table of git time budgets, shared by both halves.
 *
 * The host kills a git child at its own timeout; the browser aborts the HTTP
 * call at host + margin. When the client kept its own shorter budget, a
 * slow-but-healthy operation surfaced as "host unavailable" while git ran on
 * behind the notice and the caller's busy latch stayed set. tag-push was the
 * last action stranded that way: it reaches the network like push and the host
 * already allowed it 120s, but the client's hand-written list gave it 10s.
 * Both halves now read this module, and check-meta asserts the two directions.
 *
 * No imports — safe to bundle into the host (ESM) and the browser half.
 */

/** Local git work (status, diff, log, blame, grep, …); local repos answer far
 *  under this. */
export const GIT_TIMEOUT_MS = 30_000

/** Actions whose host handler waits on a remote and may legitimately run for
 *  minutes: push, fetch, pull, conflict-finish (rebase/merge continue) and
 *  tag-push. */
export const NETWORK_TIMEOUT_MS = 120_000

/**
 * Every action the host runs with {@link NETWORK_TIMEOUT_MS} — by name, in the
 * order the client used to list them. check-meta cross-checks this against the
 * host's own uses of NETWORK_TIMEOUT_MS and fails on either direction, so
 * adding a network action cannot silently leave one half on the short budget.
 */
export const NETWORK_ACTIONS: readonly string[] = ['push', 'fetch', 'pull', 'conflict-finish', 'tag-push']

/** How long the host may spend on one dispatched action before giving up. */
export function hostTimeoutMs(action: string): number {
  return NETWORK_ACTIONS.includes(action) ? NETWORK_TIMEOUT_MS : GIT_TIMEOUT_MS
}

/** The client waits this much longer than the host: the operation's own
 *  answer (git's stderr, or the structured error body) reaches the UI before
 *  the abort does, and the abort only ever fires when the host truly stopped
 *  answering. */
export const CLIENT_TIMEOUT_MARGIN_MS = 30_000
