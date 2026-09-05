/**
 * The inline-comment draft box — a review's comments collect into a pending
 * list (editable, removable) instead of each one immediately landing in the
 * conversation composer; one action then writes them all into the composer
 * draft. Reviewable's own admission: per-comment send is notification spam.
 *
 * Drafts are client-local (localStorage), keyed per workspace path so two
 * repositories never mix their pending comments. Pure module — the check
 * script imports it directly under Node's native TS stripping.
 */
import type { PrefsStorage } from './prefs.ts'

/** One pending comment. */
export interface CommentDraft {
  /** Repo-root-relative path the comment anchors to. */
  path: string
  /** New-side line number the comment anchors to. */
  line: number
  /** Comment body. */
  text: string
}

/** localStorage key suffix for one workspace (encodeURIComponent keeps it a
 *  single key segment for any path shape/drive letter). */
export function draftsKey(cwd: string): string {
  return 'dsh-git-review.drafts:' + encodeURIComponent(cwd)
}

/** Parse a stored raw value into drafts; junk degrades to an empty list. */
export function parseDrafts(raw: string | null): CommentDraft[] {
  if (raw === null) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  const out: CommentDraft[] = []
  for (const item of parsed) {
    if (item === null || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    if (typeof record['path'] !== 'string' || record['path'] === '') continue
    if (typeof record['text'] !== 'string') continue
    if (typeof record['line'] !== 'number' || !Number.isFinite(record['line'])) continue
    out.push({ path: record['path'], line: Math.trunc(record['line']), text: record['text'] })
  }
  return out
}

/** The per-workspace pending-comment box. */
export interface DraftBox {
  /** Current drafts (a fresh array; mutating it does not touch the box). */
  list(): CommentDraft[]
  add(draft: CommentDraft): void
  remove(index: number): void
  clear(): void
}

export function createDraftBox(
  cwd: string,
  storage: PrefsStorage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
): DraftBox {
  const key = draftsKey(cwd)
  let items: CommentDraft[]
  try {
    items = parseDrafts(storage?.getItem(key) ?? null)
  } catch {
    items = []
  }
  const persist = (): void => {
    if (storage === undefined) return
    try {
      storage.setItem(key, JSON.stringify(items))
    } catch {
      // Private-mode quota errors keep the in-memory list authoritative.
    }
  }
  return {
    list: () => [...items],
    add(draft) {
      items.push(draft)
      persist()
    },
    remove(index) {
      if (index < 0 || index >= items.length) return
      items.splice(index, 1)
      persist()
    },
    clear() {
      items = []
      persist()
    },
  }
}
