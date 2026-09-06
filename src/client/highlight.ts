/**
 * Line-oriented syntax highlighting for the diff/file panes: a single-pass,
 * stateless tokenizer good enough for review reading — comments, strings,
 * numbers and keywords in the language families a DSH workspace actually
 * touches. Deliberately NOT an editor-grade parser: no multi-line states
 * (a block comment only colors when it closes on the same line), no scopes,
 * no per-language grammars. Every color comes from the theme's semantic
 * aliases (see .tokKw/.tokStr/.tokCom/.tokNum in the stylesheet).
 *
 * The budget guard mirrors the word highlighter's: a diff is highlighted
 * line by line through one Highlighter instance, and once the accumulated
 * character budget runs out the instance returns null (plain text) — a 20k-row
 * diff of long lines degrades instead of stalling the render.
 */

export type TokenKind = 'kw' | 'str' | 'com' | 'num'

export interface TokenSpan {
  start: number
  end: number
  kind: TokenKind
}

/** Map a file path to its highlighting language family (null = no highlighting). */
export function langOf(path: string): string | null {
  const name = path.split('/').pop() ?? path
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return null
  const ext = name.slice(dot + 1).toLowerCase()
  if (['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'mts', 'cts'].includes(ext)) return 'c'
  if (['json', 'jsonc', 'json5'].includes(ext)) return 'json'
  if (['py', 'pyw', 'pyi'].includes(ext)) return 'py'
  if (['sh', 'bash', 'zsh', 'ps1', 'dockerfile'].includes(ext) || /^dockerfile/i.test(name)) return 'sh'
  if (['css', 'scss', 'less'].includes(ext)) return 'css'
  if (['go', 'rs', 'java', 'kt', 'swift', 'c', 'h', 'cpp', 'hpp', 'cc', 'cs', 'php', 'dart', 'vue'].includes(ext)) return 'c'
  if (ext === 'sql') return 'sql'
  if (['yml', 'yaml', 'toml', 'ini', 'conf'].includes(ext)) return 'sh'
  if (['md', 'markdown'].includes(ext)) return null
  return null
}

/** Keyword set per family (a pragmatic union for 'c' — JS/TS/Go/Rust/Java/C
 *  all review-read fine off one table). */
const KEYWORDS: Record<string, ReadonlySet<string>> = {
  c: new Set(['abstract', 'as', 'async', 'await', 'base', 'break', 'case', 'catch', 'class', 'const', 'const_cast', 'continue', 'crate', 'debugger', 'declare', 'default', 'delete', 'do', 'dyn', 'else', 'enum', 'export', 'extends', 'false', 'final', 'finally', 'fn', 'for', 'from', 'func', 'function', 'get', 'go', 'goto', 'if', 'impl', 'implements', 'import', 'in', 'instanceof', 'interface', 'is', 'let', 'loop', 'match', 'mod', 'mut', 'namespace', 'new', 'not', 'null', 'nullptr', 'operator', 'or', 'package', 'private', 'protected', 'public', 'pub', 'readonly', 'ref', 'require', 'return', 'self', 'set', 'signed', 'static', 'std', 'struct', 'super', 'switch', 'template', 'this', 'throw', 'throws', 'trait', 'true', 'try', 'type', 'typedef', 'typeof', 'union', 'unsigned', 'unsafe', 'use', 'using', 'var', 'virtual', 'void', 'where', 'while', 'with', 'yield']),
  py: new Set(['and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'False', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'None', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try', 'while', 'with', 'yield']),
  sh: new Set(['case', 'do', 'done', 'elif', 'else', 'esac', 'fi', 'for', 'function', 'if', 'in', 'return', 'select', 'then', 'until', 'while', 'export', 'local', 'set', 'source', 'echo', 'cd']),
  sql: new Set(['select', 'from', 'where', 'join', 'left', 'right', 'inner', 'outer', 'on', 'group', 'order', 'by', 'having', 'limit', 'offset', 'insert', 'into', 'values', 'update', 'set', 'delete', 'create', 'table', 'alter', 'drop', 'index', 'view', 'as', 'and', 'or', 'not', 'null', 'true', 'false', 'distinct', 'union', 'all', 'exists', 'in', 'between', 'like', 'is', 'case', 'when', 'then', 'else', 'end', 'primary', 'key', 'foreign', 'references', 'default', 'constraint', 'unique']),
  json: new Set(['true', 'false', 'null']),
  css: new Set(['important', 'inherit', 'initial', 'unset', 'var', 'url', 'calc', 'rgba', 'rgb', 'color-mix']),
}

const LINE_COMMENT: Record<string, readonly string[]> = {
  sql: ['--'],
  c: ['//'],
  py: ['#'],
  sh: ['#'],
  json: ['//'],
  css: ['//'],
}

const STRING_QUOTES: Record<string, readonly string[]> = {
  sql: ["'", '"'],
  c: ['"', "'", '`'],
  py: ['"', "'"],
  sh: ['"', "'"],
  json: ['"'],
  css: ['"', "'"],
}

/** Scan one line into token spans (ascending, non-overlapping). */
export function tokenizeLine(line: string, lang: string): TokenSpan[] {
  const keywords = KEYWORDS[lang]
  const comments = LINE_COMMENT[lang]
  const quotes = STRING_QUOTES[lang]
  if (keywords === undefined || comments === undefined || quotes === undefined) return []
  const out: TokenSpan[] = []
  const push = (start: number, end: number, kind: TokenKind): void => {
    if (end > start) out.push({ start, end, kind })
  }
  let at = 0
  const isWordChar = (ch: string): boolean => /[A-Za-z0-9_$]/.test(ch)
  while (at < line.length) {
    // line comment: everything to EOL
    const hit = comments.find(marker => line.startsWith(marker, at))
    if (hit !== undefined) {
      push(at, line.length, 'com')
      break
    }
    const ch = line[at]!
    // string literal: honor backslash escapes within the quote
    if (quotes.includes(ch)) {
      let end = at + 1
      while (end < line.length) {
        if (line[end] === '\\') { end += 2; continue }
        if (line[end] === ch) { end += 1; break }
        end += 1
      }
      push(at, Math.min(end, line.length), 'str')
      at = Math.min(end, line.length)
      continue
    }
    // number: word-adjacent digits (1.5e3, 0xFF, 1_000)
    if (/[0-9]/.test(ch) && (at === 0 || !isWordChar(line[at - 1]!))) {
      let end = at
      while (end < line.length && /[0-9a-fA-FxXoObB._]/.test(line[end]!)) end += 1
      push(at, end, 'num')
      at = end
      continue
    }
    // identifier: keyword check on word boundaries
    if (isWordChar(ch)) {
      let end = at
      while (end < line.length && isWordChar(line[end]!)) end += 1
      if (keywords.has(line.slice(at, end))) push(at, end, 'kw')
      at = end
      continue
    }
    at += 1
  }
  return out
}

/** Per-diff highlighter: the budget (in scanned characters) degrades to
 *  null after very large diffs, and repeated lines (re-renders) hit the
 *  line cache. One instance per parsed diff — the cache keys are only
 *  unique within one file's diff. */
export function makeLineHighlighter(path: string, budget = 4_000_000): { line(text: string): TokenSpan[] | null } {
  const lang = langOf(path)
  if (lang === null) return { line: () => null }
  let left = budget
  const cache = new Map<string, TokenSpan[] | null>()
  return {
    line(text: string): TokenSpan[] | null {
      if (cache.has(text)) return cache.get(text)!
      if (left <= 0) return null
      left -= text.length
      const tokens = left > 0 ? tokenizeLine(text, lang) : null
      if (cache.size > 8000) cache.clear()
      cache.set(text, tokens)
      return tokens
    },
  }
}

/** The tokens intersecting [from, to) of the original line (word-level
 *  spans slice the line; the syntax spans must follow). */
export function sliceTokens(tokens: TokenSpan[] | null, from: number, to: number): TokenSpan[] | null {
  if (tokens === null) return null
  const out: TokenSpan[] = []
  for (const token of tokens) {
    const start = Math.max(token.start, from)
    const end = Math.min(token.end, to)
    if (end > start) out.push({ start: start - from, end: end - from, kind: token.kind })
  }
  return out
}

/** One gap-preserving segment of a highlighted line: kind null = plain text. */
export interface LineSegment {
  start: number
  end: number
  kind: TokenKind | null
}

/** Split a line into gap-preserving segments (token spans + the plain text
 *  between them), clamped to the line. The segments tile [0, text.length)
 *  exactly, so rendering every segment reproduces the line byte-for-byte —
 *  renderers must never map tokens alone, or the gaps (identifiers,
 *  whitespace, punctuation) silently vanish. */
export function splitLineByTokens(text: string, tokens: TokenSpan[] | null): LineSegment[] {
  if (tokens === null || tokens.length === 0) {
    return text === '' ? [] : [{ start: 0, end: text.length, kind: null }]
  }
  const segs: LineSegment[] = []
  let cursor = 0
  for (const token of tokens) {
    const start = Math.max(0, Math.min(token.start, text.length))
    const end = Math.max(start, Math.min(token.end, text.length))
    if (start > cursor) segs.push({ start: cursor, end: start, kind: null })
    if (end > start) segs.push({ start, end, kind: token.kind })
    cursor = Math.max(cursor, end)
  }
  if (cursor < text.length) segs.push({ start: cursor, end: text.length, kind: null })
  return segs
}
