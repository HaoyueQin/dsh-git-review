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
import { CLIENT_TIMEOUT_MARGIN_MS, hostTimeoutMs } from '../action-timeouts.ts'

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
  // One shared table (src/action-timeouts.ts) decides both ends: the client
  // waits a margin past whatever the host allows that action, so a slow push
  // (or a slow read on a huge repository) reports git's own answer instead of
  // aborting early — an abort never stops the host, and the caller's busy
  // latch would stay set behind a bogus "host unavailable".
  const timeoutMs = hostTimeoutMs(action) + CLIENT_TIMEOUT_MARGIN_MS
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
