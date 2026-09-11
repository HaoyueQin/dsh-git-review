// Static consistency checks the compilers cannot see (node scripts/check-meta.mjs):
// CSS class references vs definitions (css-modules.d.ts is Record<string,
// string, so tsc is blind to typos), dynamic locale keys vs dictionaries,
// the cordis manifest vs package.json, the client inject list vs the build's
// platform table, the prefs/schema field lock, and the ReviewView hook order
// (no hooks past the non-ready early return). Requires Node >= 23.6.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_PREFS } from '../src/client/prefs.ts'
import { REVIEW_SETTINGS_FIELDS } from '../src/settings-schema.ts'

const ROOT = join(import.meta.dirname, '..')
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8')

// 1. css.* references in TSX/TS must all be defined in review.module.css.
// Any class occurrence in a selector counts (child/descendant combinators
// like `.rowDel > .cellText` never sit directly before the brace).
// Comments lie about classes (file names like review.module.css in prose),
// so they are stripped before matching; the strict head ([A-Za-z_]) keeps
// numeric fragments (.5px, .04em) out of the definition set.
const cssText = read('src/client/review.module.css')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  // An `.ext` inside url(...) is a file name, not a class (url(logo.svg)).
  .replace(/url\([^)]*\)/g, 'url()')
const cssDef = new Set(
  [...cssText.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)(?![A-Za-z0-9_-])/g)]
    .map(m => m[1]),
)
const refs = new Set()
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { walk(full); continue }
    if (!/\.(tsx|ts)$/.test(entry.name) || entry.name.endsWith('.d.ts')) continue
    for (const m of readFileSync(full, 'utf8').matchAll(/css\.([A-Za-z0-9_]+)/g)) refs.add(m[1])
  }
}
walk(join(ROOT, 'src'))
const undefinedRefs = [...refs].filter(name => !cssDef.has(name))
assert.deepEqual(undefinedRefs, [], 'undefined css.* references: ' + undefinedRefs.join(', '))
// Dead classes (defined but never referenced) only grow: fail on them too.
const deadClasses = [...cssDef].filter(name => !refs.has(name))
assert.deepEqual(deadClasses, [], 'dead css classes: ' + deadClasses.join(', '))

// 2. Dynamic t() keys (built by concatenation, invisible to the ReviewKey
//    union) must exist in the zh dictionary.
const zh = read('src/client/locales.ts')
const dynamicKeys = [
  'scope.all', 'scope.staged', 'scope.unstaged', 'scope.label',
  'tree.mode.changes', 'tree.mode.all', 'tree.mode.label',
  'compare.worktree', 'compare.refs', 'compare.worktreeHint', 'compare.refsHint',
  'compare.pickHint', 'compare.swap', 'compare.pickBase', 'compare.pickTarget',
  'viewTab.changes', 'viewTab.graph',
  'search.scope.diff', 'search.scope.content', 'search.scope.path',
  'badge.added', 'badge.modified', 'badge.deleted', 'badge.renamed',
  'badge.copied', 'badge.untracked', 'badge.conflict', 'badge.staged',
  'conflict.kind.merge', 'conflict.kind.rebase', 'conflict.kind.cherry-pick', 'conflict.kind.revert',
  'picker.truncated',
]
const missingKeys = dynamicKeys.filter(key => !zh.includes("'" + key + "'"))
assert.deepEqual(missingKeys, [], 'missing locale keys: ' + missingKeys.join(', '))

// 3. Cordis manifest: the patch file exists and names this package.
const pkg = JSON.parse(read('package.json'))
const patchFile = pkg.dsh.bundle.patch.replace(/^\.\//, '')
const patch = read(patchFile)
assert.ok(patch.includes('id: ' + pkg.name), 'patch id matches package name')
assert.ok(patch.includes("name: '" + pkg.name + "'"), 'patch name matches package name')

// 4. Client inject list ⊆ the build's platform module table (a declared but
//    unshared module would resolve to undefined at runtime).
const tsdown = read('tsdown.config.ts')
// Read the PLATFORM_MODULES array itself, not every '@deepseek-ai/…' literal
// in the file: the host half's LIB_EXTERNALS and the purity gate's prefix
// string would otherwise pass as shared modules.
const platformBlock = tsdown.slice(tsdown.indexOf('const PLATFORM_MODULES'))
const platform = [...platformBlock.slice(0, platformBlock.indexOf(']')).matchAll(/'(@deepseek-ai\/[^']+)'/g)].map(m => m[1])
const outside = pkg.dsh.client.inject.filter((id) => !platform.includes(id))
assert.deepEqual(outside, [], 'inject entries outside the platform table: ' + outside.join(', '))
// And the reverse direction: depending on a module being shared without
// declaring it would leave the bundle requiring a slot the loader never
// seeds. react is exempt — the shell provides it without an inject entry.
const undeclared = platform.filter(id => id !== 'react' && id !== 'react/jsx-runtime' && !pkg.dsh.client.inject.includes(id))
assert.deepEqual(undeclared, [], 'platform modules missing from dsh.client.inject: ' + undeclared.join(', '))

// 5. Prefs/schema field lock: DEFAULT_PREFS keys == schema fields.
assert.deepEqual([...Object.keys(DEFAULT_PREFS)].sort(), [...REVIEW_SETTINGS_FIELDS].sort())

// 6. Dispatch coverage: every GitActionArgs key has a dispatch branch.
const contract = read('src/contract.ts')
const mapBody = contract.slice(contract.indexOf('export interface GitActionArgs {'), contract.indexOf('\n}', contract.indexOf('export interface GitActionArgs {')))
const argKeys = [...mapBody.matchAll(/^\s{2}'?([\w-]+)'?:/gm)].map(m => m[1])
// Pinned at 40 with the contract's own count comment (contract.ts): adding
// or removing an action updates both places deliberately.
assert.equal(argKeys.length, 40, 'expected the full action map, got ' + argKeys.length)
const dispatch = read('src/index.ts')
// Top-level dispatch only (exactly 8 spaces): stash/file-op sub-actions live
// at 2/4 spaces and are covered by check-git's negative paths instead.
const branchHits = [...dispatch.matchAll(/^ {8}if \(action === '([\w-]+)'\)/gm)].map(m => m[1])
const missingBranches = argKeys.filter(key => !branchHits.includes(key))
assert.deepEqual(missingBranches, [], 'actions without dispatch: ' + missingBranches.join(', '))
const extraBranches = [...new Set(branchHits)].filter(key => !argKeys.includes(key))
assert.deepEqual(extraBranches, [], 'dispatch branches without contract: ' + extraBranches.join(', '))

// 7. Hook order: ReviewView's non-ready early returns must sit after every
//    hook (2026-09-07: returns before the range memos threw 'rendered fewer
//    hooks', blanking non-repository tabs and contaminating repository tabs
//    in the same mount until a page refresh).
const reviewView = read('src/client/review-view.tsx')
const earlyReturnAt = reviewView.indexOf("if (status.kind === 'notRepo')")
assert.ok(earlyReturnAt !== -1, 'ReviewView non-ready early return exists')
const notRepoViewAt = reviewView.indexOf('function NotRepoView')
assert.ok(notRepoViewAt > earlyReturnAt, 'NotRepoView follows ReviewView')
const lateHooks = [...reviewView.slice(earlyReturnAt, notRepoViewAt).matchAll(/\buse[A-Z][A-Za-z]*\s*[<(]/g)].map(m => m[0])
assert.deepEqual(lateHooks, [], 'hooks after the non-ready early return: ' + lateHooks.join(', '))

// 8. Host half: a service may only be read as a property inside a scope that
//    declares it. cordis throws `cannot get property "X" without inject` from
//    inside apply when a property is read in an undeclared scope, and the
//    loader applies a patch list as one group — so one such read fails the
//    entire plugin tree and dsh cannot boot (2026-09-10: `ctx.webServer !==
//    undefined` with `inject = []` did exactly this and v0.1.3 was
//    unpublished). Receivers named `<something>Ctx` are the injected child
//    scopes — the ctx.inject callbacks, where the read is the intended API —
//    so only those are allowed, and `ctx.inject(['x'], …)` / `ctx.get('x')`
//    stay legal because naming the service there is how you declare it. The
//    match covers the forms the first version missed (ctx?.x, ctx['x'],
//    Reflect.get) after comments are stripped (comments describe the trap).
const HOST_FILES = readdirSync(join(ROOT, 'src')).filter(file => file.endsWith('.ts'))
const INJECTED_RECEIVER = /\b(?!ctx\b)[A-Za-z_$][\w$]*[Cc]tx\b/
const SANCTIONED_CALL = /(?:\.\s*(?:inject|get)|Reflect\s*\.\s*get)\s*\([^()]*$/
const SERVICE_READ = /\.\s*(webServer|settings|settingsScope)\b|\[\s*['"](webServer|settings|settingsScope)['"]\s*\]|Reflect\s*\.\s*get\(\s*([A-Za-z_$][\w$]*)\s*,\s*['"](webServer|settings|settingsScope)['"]/g
const undeclaredReads = []
for (const file of HOST_FILES) {
  const source = read(join('src', file))
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
  for (const match of source.matchAll(SERVICE_READ)) {
    const before = source.slice(Math.max(0, match.index - 80), match.index)
    if (SANCTIONED_CALL.test(before)) continue
    // Reflect.get(recv, 'x') carries its receiver in group 3; the others are
    // judged by the expression that precedes the access.
    if (INJECTED_RECEIVER.test(match[3] ?? before)) continue
    undeclaredReads.push(file + ':' + (match[1] ?? match[2] ?? match[4]))
  }
}
assert.deepEqual(undeclaredReads, [], 'service property reads outside an injected scope: ' + undeclaredReads.join(', '))

// 9. Font tokens resolve against real theme variables. ui-theme ships
//    --dsw-font-family (base.css) and --ds-font-family-code (the code stack,
//    deliberately without a bare `monospace` tail — Windows CJK would fall back
//    to SimSun); there is no --dsw-font-mono, and a phantom name here silently
//    degraded one call site to the system monospace stack (2026-09-10 audit:
//    five call sites already used the real name, the sixth did not).
const cssFiles = []
const walkCss = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { walkCss(full); continue }
    if (entry.name.endsWith('.css')) cssFiles.push(full)
  }
}
walkCss(join(ROOT, 'src'))
// The scan must see EVERY font variable, not just the --dsw-font-* prefix:
// the code stack is --ds-font-family-code, so a prefix-limited pattern found
// nothing and the assertion compared two empty sets — the lock was vacuous
// from the day it landed. The allow-list below is the harness's real set.
const FONT_VAR = /var\(\s*(--[A-Za-z0-9-]*font[A-Za-z0-9-]*)/g
const ALLOWED_FONT_TOKENS = new Set(['--dsw-font-family', '--ds-font-family-code'])
const fontTokens = [...new Set(cssFiles.flatMap(file =>
  [...readFileSync(file, 'utf8').matchAll(FONT_VAR)].map(m => m[1])))]
assert.ok(fontTokens.length > 0, 'font variables were actually found (not a vacuous pass)')
const unknownFontTokens = fontTokens.filter(token => !ALLOWED_FONT_TOKENS.has(token))
assert.deepEqual(unknownFontTokens, [], 'font tokens the harness does not define: ' + unknownFontTokens.join(', '))

console.log('check-meta: all assertions passed (' + refs.size + ' css refs, ' + cssDef.size + ' css defs, ' + dynamicKeys.length + ' locale keys, ' + argKeys.length + ' actions)')
