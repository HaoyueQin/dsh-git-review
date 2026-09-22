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

// 10. Network timeouts read from ONE table (src/action-timeouts.ts). The
//     client used to keep its own slow-action list and missed tag-push: the
//     host allowed it 120s while the browser aborted at 10s, so a slow tag
//     push surfaced as "host unavailable" while git ran on. Both directions
//     are locked here — the host's uses of NETWORK_TIMEOUT_MS must cover
//     exactly the declared actions, and the client must keep no second list.
const timeouts = read('src/action-timeouts.ts')
// Read the declaration LINE: `readonly string[]` carries a `]` of its own, so
// slicing to the first `]` stopped before the array and the lock was vacuous.
const listLine = timeouts.split('\n').find(line => line.includes('export const NETWORK_ACTIONS'))
assert.ok(listLine !== undefined, 'NETWORK_ACTIONS is exported')
const declaredActions = [...listLine.matchAll(/'([\w-]+)'/g)].map(m => m[1])
assert.ok(declaredActions.length > 0, 'NETWORK_ACTIONS is not empty')
const apiSource = read('src/client/api.ts')
assert.ok(/hostTimeoutMs\(action\)/.test(apiSource), 'the client derives its timeout from the shared table')
assert.ok(!/SLOW_ACTIONS/.test(apiSource), 'the client keeps no private slow-action list')
// `export` is optional: gitPush is a plain `async function`, and a pattern
// requiring `export` silently attributed its timeout to the previous handler.
const hostFns = [...dispatch.matchAll(/(?:export )?async function (\w+)/g)].map(m => ({ name: m[1], at: m.index }))
const networkFns = new Set()
for (const use of dispatch.matchAll(/NETWORK_TIMEOUT_MS\)/g)) {
  const owner = hostFns.filter(fn => fn.at < use.index).at(-1)
  assert.ok(owner !== undefined, 'every NETWORK_TIMEOUT_MS use sits inside a host handler')
  networkFns.add(owner.name)
}
const actionByFn = new Map([...dispatch.matchAll(/if \(action === '([\w-]+)'\) \{\s*respond\(res, 200, await (\w+)\(/g)].map(m => [m[2], m[1]]))
const hostNetworkActions = [...networkFns].map(fn => actionByFn.get(fn))
assert.ok(hostNetworkActions.every(name => typeof name === 'string'), 'every network handler is dispatched by name')
assert.deepEqual([...hostNetworkActions].sort(), [...declaredActions].sort(), 'host NETWORK_TIMEOUT_MS actions == NETWORK_ACTIONS')

// 11. Settings seam generations (2026-09-23). The harness REPLACED this seam
//     in 0.1.7-alpha.1 — `settings.register` became a plugin's own volatile
//     Config plus `settings.configure` — and the loss is SILENT: the inject
//     callback parks or throws with no log, the Plugins page drops the whole
//     configuration section, and preferences fall back to localStorage. Three
//     things therefore have to stay true in source:
//       a) no direct `.settings.register(...)` — going through a local alias
//          forces every call site through the capability probe;
//       b) both capability probes exist (register for ≤0.1.6, configure for
//          ≥0.1.7), so one generation can never be dropped silently;
//       c) `.volatile()` is never called directly: it exists only from
//          schemastery 3.18.4 (the 0.1.7 host). On a 0.1.5/0.1.6 host an
//          unguarded call throws while the module is evaluated, which fails the
//          whole plugin tree (the v0.1.3 accident); the `live()` helper is the
//          only sanctioned caller, and it probes first.
//     The namespace, the loader entry id and the package name are one key on
//     every host generation (patch id ↔ package name is lock 3).
const settingsSource = read('src/settings-schema.ts')
const hostSources = new Map(readdirSync(join(ROOT, 'src'))
  .filter(file => file.endsWith('.ts'))
  .map(file => [file, read(join('src', file)).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')]))
const directRegister = [...hostSources].filter(([, source]) => /\.settings\s*\.\s*register\s*\(/.test(source)).map(([file]) => file)
assert.deepEqual(directRegister, [], 'direct settings.register call sites (probe the capability through an alias instead): ' + directRegister.join(', '))
assert.ok(/typeof\s+register\s*===\s*'function'/.test(settingsSource), 'the ≤0.1.6 register probe is present')
assert.ok(/typeof\s+configure\s*===\s*'function'/.test(settingsSource), 'the ≥0.1.7 configure probe is present')
assert.ok(/VolatileCapable/.test(settingsSource) && /typeof\s+marker\s*===\s*'function'/.test(settingsSource), 'the .volatile() capability probe is present')
const sourceFiles = []
const walkSource = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { walkSource(full); continue }
    if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) sourceFiles.push(full)
  }
}
walkSource(join(ROOT, 'src'))
const volatileCalls = sourceFiles.filter((file) => {
  // Comments describe the trap (and this lock), so they are stripped first —
  // the same discipline lock 8 uses.
  const source = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
  return /\.volatile\s*\(/.test(source)
})
assert.deepEqual(volatileCalls, [], 'unguarded .volatile() call sites (use the live() helper): ' + volatileCalls.map(f => f.slice(ROOT.length + 1)).join(', '))
const namespaceLiteral = settingsSource.match(/SETTINGS_NAMESPACE\s*=\s*'([^']+)'/)?.[1]
assert.equal(namespaceLiteral, pkg.name, 'the settings namespace equals the package name (0.1.7 keys the config form by the entry id)')
// 11d. The entry module must RE-EXPORT that schema: cordis reads plugin Config
//      off the module, so a schema that only exists in a sibling file is never
//      seen — the namespace silently drops out of the served set (no form, no
//      error). Found exactly that way against a real 0.1.7-alpha.2 host.
const entrySource = read('src/index.ts')
assert.ok(
  /export\s*\{[^}]*\bConfig\b[^}]*\}\s*from\s*'\.\/settings-schema\.ts'/.test(entrySource),
  'src/index.ts re-exports Config (0.1.7 reads the schema off the plugin module)',
)

// 12. Both settings generations reach the built CLIENT bundle. The client half
//     binds `configForms` on 0.1.7+ and `settingsScope` up to 0.1.6, and
//     publishes its preference UI on two slots (the ≤0.1.6-alpha.1 settings
//     card and the ≥0.1.6-alpha.2 Plugins-page entry). A refactor that drops
//     one leaves the other host generation with no preference surface at all
//     and no error anywhere, so the artifact itself is asserted — rebuild lib/
//     before trusting this lock.
//
//     The markers are the inject's service READS, not the bare names: the
//     legacy branch probes `ctx.get('configForms')`, so asserting the string
//     alone passed with the whole 0.1.7 path deleted (caught by deliberate
//     sabotage, 2026-09-23 — the reason this lock reads property accesses).
const clientBundle = read('lib/client.js')
const BUNDLE_MARKERS = [
  [/\w+\.configForms\b/, 'the ≥0.1.7 ctx.configForms binding'],
  [/\w+\.settingsScope\b/, 'the ≤0.1.6 ctx.settingsScope binding'],
  [/settings\.plugin\.item/, 'the settings-modal preference card slot'],
  [/plugins\.bundle\.config/, 'the Plugins-page preference entry slot'],
]
for (const [pattern, label] of BUNDLE_MARKERS) {
  assert.ok(pattern.test(clientBundle), 'built client bundle is missing ' + label + ' (rebuild lib/ after refactors)')
}

console.log('check-meta: all assertions passed (' + refs.size + ' css refs, ' + cssDef.size + ' css defs, ' + dynamicKeys.length + ' locale keys, ' + argKeys.length + ' actions)')
