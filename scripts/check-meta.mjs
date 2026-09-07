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
const cssText = read('src/client/review.module.css').replace(/\/\*[\s\S]*?\*\//g, '')
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
const table = [...tsdown.matchAll(/'(@deepseek-ai\/[^']+)'/g)].map(m => m[1])
const platform = table.filter((value, index) => table.indexOf(value) === index && value !== '@deepseek-ai/cordis' && value !== '@deepseek-ai/schemastery')
const outside = pkg.dsh.client.inject.filter((id) => !platform.includes(id))
assert.deepEqual(outside, [], 'inject entries outside the platform table: ' + outside.join(', '))

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
const lateHooks = [...reviewView.slice(earlyReturnAt, notRepoViewAt).matchAll(/\buse[A-Z][A-Za-z]*\s*\(/g)].map(m => m[0])
assert.deepEqual(lateHooks, [], 'hooks after the non-ready early return: ' + lateHooks.join(', '))

console.log('check-meta: all assertions passed (' + refs.size + ' css refs, ' + cssDef.size + ' css defs, ' + dynamicKeys.length + ' locale keys, ' + argKeys.length + ' actions)')
