/**
 * Browser access to the host half's fenced git API. The host half is
 * optional (a profile can compose this plugin's client without its server
 * route), so every call degrades to null and the tab shows an explicit
 * notice.
 */
const BASE = '/dsh-git-review/api'

/** Absolute same-origin URL serving one fenced image for markdown `<img>`
 *  (the shell renderer only paints absolute http(s) images). The bytes
 *  stay magic-sniffed image mimes behind CORP same-origin — no HTML or JS
 *  can ever come back with this content type. */
export function assetUrl(cwd: string, path: string, ref?: string | null): string {
  const query = 'cwd=' + encodeURIComponent(cwd) + '&path=' + encodeURIComponent(path)
    + (ref ? '&ref=' + encodeURIComponent(ref) : '')
  return location.origin + BASE + '/asset?' + query
}

import type { GitActionArgs } from '../contract.ts'

/** Read requests are local git commands: 10s is ample. */
const REQUEST_TIMEOUT_MS = 10_000
/** Actions that reach the network on the host side. The host allows them 120s
 *  (PUSH_TIMEOUT_MS), so aborting at 10s reported "host unavailable" while git
 *  was still working — and an abort does not stop the host, so the operation
 *  completed behind a failure notice while the UI kept its busy latch. */
const WRITE_TIMEOUT_MS = 150_000
const SLOW_ACTIONS = new Set(['push', 'fetch', 'pull', 'conflict-finish'])

/**
 * POST one action to the fenced API.
 *
 * The body is checked against the contract's per-action request map, so a
 * renamed/added wire field breaks the build instead of the tab. Actions the
 * client composes dynamically (a `string`-typed key) fall back to unchecked
 * bodies — those two sites name their own fields and are checked by hand, not
 * by the compiler.
 * @returns the parsed payload, or null when the host half is absent/unreachable.
 */
export async function hostCall<T, A extends keyof GitActionArgs>(action: A, body: GitActionArgs[A]): Promise<T | null>;
// Dynamically composed actions ('branch-'+x / 'tag-'+action — plain string
// keys) bypass the map; their wire fields are checked by hand.
export async function hostCall<T>(action: string, body: unknown): Promise<T | null>;
export async function hostCall<T>(action: string, body: unknown): Promise<T | null> {
  const controller = new AbortController()
  const timeoutMs = SLOW_ACTIONS.has(action) ? WRITE_TIMEOUT_MS : REQUEST_TIMEOUT_MS
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(BASE + '/' + encodeURIComponent(action), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      // The module-owned hard timeout always wins over any caller signal, and
      // the timer outlives the header phase: `fetch` resolves on HEADERS, so a
      // stalled body would otherwise leave this promise pending forever and
      // the caller's busy latch would never clear.
      signal: controller.signal,
    })
    // A structured server error (413 body-too-large, 404 unknown action)
    // must surface as itself — only transport failures degrade to null
    // (the tab's 'host unavailable' notice).
    if (!res.ok) {
      try {
        return (await res.json()) as T
      } catch {
        return null
      }
    }
    return (await res.json()) as T
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
