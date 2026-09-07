/**
 * Browser access to the host half's fenced git API. The host half is
 * optional (a profile can compose this plugin's client without its server
 * route), so every call degrades to null and the tab shows an explicit
 * notice. Availability is probed once per page and cached module-wide.
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

/** Abort a hung host request after this long (git is local; 10s is ample). */
const REQUEST_TIMEOUT_MS = 10_000

/** fetch with a hard abort; rejects on timeout or network failure. */
async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(input, {
      ...init,
      // The module-owned hard timeout always wins over a caller-supplied signal.
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

import type { GitActionArgs } from '../contract.ts'

/**
 * POST one action to the fenced API.
 *
 * The body is checked against the contract's per-action request map, so a
 * renamed/added wire field breaks the build instead of the tab. Actions
 * the client composes dynamically (a `string`-typed key) fall back to
 * unchecked bodies — the four such sites say so explicitly.
 * @returns the parsed payload, or null when the host half is absent/unreachable.
 */
export async function hostCall<T, A extends keyof GitActionArgs>(action: A, body: GitActionArgs[A]): Promise<T | null>;
// Dynamically composed actions ('branch-'+x — a plain string key) bypass
// the map: the two such sites are one line each and covered by check-git.
export async function hostCall<T>(action: string, body: unknown): Promise<T | null>;
export async function hostCall<T>(action: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(BASE + '/' + encodeURIComponent(action), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
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
  }
}

let probe: Promise<boolean> | null = null

/**
 * Whether the host half is serving (cached while healthy). Any failure —
 * a throw OR a non-ok status — clears the cache so the next call
 * re-probes: the host route appears late (hot reload) and can flap, so a
 * stale answer must never hide the tab for the whole page lifetime.
 */
export function hostAvailable(): Promise<boolean> {
  probe ??= (async () => {
    try {
      const res = await fetchWithTimeout(BASE + '/ping')
      if (!res.ok) probe = null
      return res.ok
    } catch {
      // Allow a later call to probe again (the promise this call returned
      // stays false — the tab just re-checks on the next user interaction).
      probe = null
      return false
    }
  })()
  return probe
}
