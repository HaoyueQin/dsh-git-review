// Minimal runnable check for dsh-git-review's parsers and pure client logic
// (node scripts/check-parse.mjs). Requires Node >= 23.6 (native TS type
// stripping; verified on v24) — older LTS fail with 'Unknown file extension
// ".ts"'. No build step, no test framework. NUL in fixtures is written
// '\x00' (a '\0' before a digit would parse as an octal escape).
import assert from 'node:assert/strict'
import { mergeStatus, numstatIndex, parseNumstatZ, parsePorcelainV1 } from '../src/git-parse.ts'
import { parseUnifiedDiff } from '../src/client/diff-parse.ts'
import { badgeFor, badgesFor, buildFileTree, filterFiles, mergeAllFiles } from '../src/client/file-tree.ts'

// ── porcelain v1 -z ───────────────────────────────────────────────────────

// 1. Mixed everyday states: staged modify, unstaged modify, untracked.
let entries = parsePorcelainV1('M  src/a.ts\x00 M src/b.ts\x00?? docs/new.md\x00')
assert.deepEqual(entries, [
  { x: 'M', y: ' ', path: 'src/a.ts' },
  { x: ' ', y: 'M', path: 'src/b.ts' },
  { x: '?', y: '?', path: 'docs/new.md' },
])

// 2. Rename records carry the original path as one extra NUL token, and the
//    walk must NOT mistake that token for the next record.
entries = parsePorcelainV1('R  new-name.ts\x00old-name.ts\x00M  keep.ts\x00')
assert.equal(entries.length, 2)
assert.deepEqual(entries[0], { x: 'R', y: ' ', path: 'new-name.ts', origPath: 'old-name.ts' })
assert.deepEqual(entries[1], { x: 'M', y: ' ', path: 'keep.ts' })

// 3. CJK and spaces arrive verbatim (quotepath=false, NUL separation).
entries = parsePorcelainV1('?? docs/中文 文档.md\x00')
assert.equal(entries[0].path, 'docs/中文 文档.md')

// 4. Empty output → no entries; the trailing NUL's empty token is not one.
assert.deepEqual(parsePorcelainV1(''), [])
assert.equal(parsePorcelainV1('A  x\x00').length, 1)

// ── numstat -z ────────────────────────────────────────────────────────────

// 5. Counts, binary dashes, and a path containing a tab (path = everything
//    after the SECOND tab of the record).
let rows = parseNumstatZ('3\t1\ta.ts\x00-\t-\tpic web.webp\x0012\t0\tweird\tname.ts\x00')
assert.deepEqual(rows, [
  { added: 3, deleted: 1, path: 'a.ts' },
  { added: null, deleted: null, path: 'pic web.webp' },
  { added: 12, deleted: 0, path: 'weird\tname.ts' },
])

// 6. Rename/copy records (-z, real git shape): `added\tdeleted\t` with an
//    EMPTY third field, then TWO NUL tokens — source, then destination.
rows = parseNumstatZ('1\t0\t\x00old-name.ts\x00renamed.ts\x00')
assert.deepEqual(rows, [{ added: 1, deleted: 0, path: 'renamed.ts', origPath: 'old-name.ts' }])
assert.deepEqual(parseNumstatZ(''), [])

// ── status merge ──────────────────────────────────────────────────────────

// 7. Merge: tracked counts come from numstat, untracked from the probe map,
//    binary flags follow dashes/absence, totals-free shape is client-ready.
const index = numstatIndex(parseNumstatZ('10\t2\tm.ts\x00-\t-\tb.webp\x00'))
const files = mergeStatus(
  parsePorcelainV1('M  m.ts\x00A  b.webp\x00?? u.md\x00 M none.ts\x00'),
  index,
  new Map([['u.md', { added: 7, binary: false }]]),
)
assert.deepEqual(files.map(f => [f.path, f.added, f.deleted, f.binary, f.untracked]), [
  ['m.ts', 10, 2, false, false],
  ['b.webp', 0, 0, true, false],
  ['u.md', 7, 0, false, true],
  // No numstat row + not untracked → mode-only style change, not binary.
  ['none.ts', 0, 0, false, false],
])

// ── unified diff ──────────────────────────────────────────────────────────

// 8. Classic two-hunk diff: ctx/del/add rows, 1-based numbering per side
//    restarting at each hunk's @@ starts, section heading captured.
let parsed = parseUnifiedDiff([
  'diff --git a/x.ts b/x.ts',
  'index 111..222 100644',
  '--- a/x.ts',
  '+++ b/x.ts',
  '@@ -1,3 +1,3 @@ import a',
  ' old',
  '-gone',
  '+here',
  ' tail',
  '@@ -10,3 +10,4 @@ fn b',
  ' ctx',
  '+one',
  '+two',
  ' ctx',
].join('\n'))
assert.equal(parsed.hunks.length, 2)
assert.equal(parsed.oldPath, 'x.ts')
assert.equal(parsed.newPath, 'x.ts')
const [h1, h2] = parsed.hunks
assert.equal(h1.section, 'import a')
assert.deepEqual(h1.rows.map(r => r.kind), ['ctx', 'pair', 'ctx'])
assert.equal(h1.rows[0].left.no, 1)
assert.equal(h1.rows[0].right.no, 1)
assert.equal(h1.rows[1].left.text, 'gone')
assert.equal(h1.rows[1].right.text, 'here')
assert.equal(h2.rows.map(r => r.kind).join(','), 'ctx,add,add,ctx')
assert.equal(h2.rows[1].right.no, 11)
assert.equal(h2.rows[1].left, null)

// 9. Pure additions have no old side; counts count.
parsed = parseUnifiedDiff([
  '--- /dev/null',
  '+++ b/new.md',
  '@@ -0,0 +1,2 @@',
  '+first',
  '+second',
].join('\n'))
assert.equal(parsed.newFile, true)
assert.deepEqual(parsed.hunks[0].rows.map(r => r.kind), ['add', 'add'])
assert.equal(parsed.hunks[0].rows[0].right.no, 1)

// 10. Deletion: every row is left-only.
parsed = parseUnifiedDiff([
  '--- a/old.md',
  '+++ /dev/null',
  '@@ -1,2 +0,0 @@',
  '-first',
  '-second',
].join('\n'))
assert.equal(parsed.deletedFile, true)
assert.deepEqual(parsed.hunks[0].rows.map(r => r.kind), ['del', 'del'])

// 11. Unbalanced run: 2 dels + 1 add → one pair plus one left-only leftover.
parsed = parseUnifiedDiff([
  '@@ -1,3 +1,2 @@',
  '-a1',
  '-a2',
  '+b1',
  ' c',
].join('\n'))
assert.deepEqual(parsed.hunks[0].rows.map(r => r.kind), ['pair', 'del', 'ctx'])
assert.equal(parsed.hunks[0].rows[1].left.text, 'a2')
assert.equal(parsed.hunks[0].rows[1].right, null)

// 12. "\ No newline" annotates the cell right before it (both sides).
parsed = parseUnifiedDiff([
  '@@ -1,2 +1,2 @@',
  '-old',
  '\\ No newline at end of file',
  '+new',
  '\\ No newline at end of file',
].join('\n'))
assert.equal(parsed.hunks[0].rows[0].left.noNewline, true)
assert.equal(parsed.hunks[0].rows[0].right.noNewline, true)

// 13. Binary markers and rename headers; empty text parses to no hunks.
parsed = parseUnifiedDiff([
  'diff --git a/p.webp b/p.webp',
  'Binary files a/p.webp and b/p.webp differ',
].join('\n'))
assert.equal(parsed.binary, true)
parsed = parseUnifiedDiff([
  'diff --git a/ren.ts b/ren.ts',
  'similarity index 99%',
  'rename from old.ts',
  'rename to ren.ts',
].join('\n'))
assert.equal(parsed.rename, true)
assert.deepEqual(parseUnifiedDiff(''), { hunks: [], binary: false, oldPath: null, newPath: null, newFile: false, deletedFile: false, rename: false })

// 14. Untracked pseudo diff (host-synthesized shape) parses as a new file.
parsed = parseUnifiedDiff([
  'diff --git a/u.md b/u.md',
  '--- /dev/null',
  '+++ b/u.md',
  '@@ -0,0 +1,1 @@',
  '+hello',
].join('\n'))
assert.equal(parsed.newFile, true)
assert.deepEqual(parsed.hunks[0].rows.map(r => r.kind), ['add'])

// ── file tree / filter / badge ────────────────────────────────────────────

// 15. Tree aggregates by directory, dirs before files, counts recurse;
//     filter degrades to a flat case-insensitive list.
const treeFiles = mergeStatus(
  parsePorcelainV1('M  lib/a.ts\x00M  lib/deep/b.ts\x00?? readme.md\x00'),
  new Map(),
  new Map(),
)
const tree = buildFileTree(treeFiles)
assert.deepEqual(tree.children.map(c => c.kind + ':' + c.name), ['dir:lib', 'file:readme.md'])
const libDir = tree.children[0]
assert.equal(libDir.kind === 'dir' ? libDir.fileCount : -1, 2)
assert.equal(tree.fileCount, 3)
assert.equal(filterFiles(treeFiles, 'DEEP').length, 1)
assert.equal(filterFiles(treeFiles, '  ').length, 3)

// 16. Badge priority: untracked beats added, added beats deleted, renamed
//     and modified map to their own glyphs.
assert.equal(badgeFor({ ...treeFiles[2], untracked: true }).key, 'untracked')
assert.equal(badgeFor({ path: 'x', x: 'A', y: 'D', added: 1, deleted: 1, binary: false, untracked: false }).key, 'added')
assert.equal(badgeFor({ path: 'x', x: 'D', y: ' ', added: 0, deleted: 2, binary: false, untracked: false }).glyph, '\u2212')
assert.equal(badgeFor({ path: 'x', x: 'R', y: ' ', added: 0, deleted: 0, binary: false, untracked: false }).key, 'renamed')
assert.equal(badgeFor({ path: 'x', x: ' ', y: 'M', added: 1, deleted: 1, binary: false, untracked: false }).glyph, '\u00b1')

// 17. badgesFor: staged (X) and unstaged (Y) halves render as ordered badges;
//     untracked stays a single muted '?'; an inactive/inactive row falls back
//     to one modified badge.
const dual = badgesFor({ path: 'x', x: 'M', y: 'M', added: 1, deleted: 1, binary: false, untracked: false })
assert.deepEqual(dual.map(b => [b.glyph, b.staged]), [['\u00b1', true], ['\u00b1', false]])
const addDelete = badgesFor({ path: 'x', x: 'A', y: 'D', added: 1, deleted: 1, binary: false, untracked: false })
assert.deepEqual(addDelete.map(b => b.glyph), ['+', '\u2212'])
assert.deepEqual(addDelete.map(b => b.staged), [true, false])
assert.deepEqual(badgesFor({ path: 'x', x: ' ', y: ' ', added: 0, deleted: 0, binary: false, untracked: false }).map(b => b.key), ['modified'])
assert.deepEqual(badgesFor({ ...treeFiles[2] }).map(b => [b.key, b.staged]), [['untracked', undefined]])

// 18. mergeAllFiles: changed rows pass through, other paths become unchanged
//     rows with no badge; input order is preserved.
const merged = mergeAllFiles(['lib/a.ts', 'other/x.ts', 'readme.md'], treeFiles)
assert.deepEqual(merged.map(f => [f.path, f.unchanged === true]), [
  ['lib/a.ts', false],
  ['other/x.ts', true],
  ['readme.md', false],
])
assert.deepEqual(badgesFor(merged[1]), [])
// treeFiles[2] is the untracked readme.md — its row (x='?') passes through.
assert.equal(merged[2].x, '?')

console.log('check-parse: all assertions passed')
