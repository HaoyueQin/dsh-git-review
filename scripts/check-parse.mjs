// Minimal runnable check for dsh-git-review's parsers and pure client logic
// (node scripts/check-parse.mjs). Requires Node >= 23.6 (native TS type
// stripping; verified on v24) — older LTS fail with 'Unknown file extension
// ".ts"'. No build step, no test framework. NUL in fixtures is written
// '\x00' (a '\0' before a digit would parse as an octal escape).
import assert from 'node:assert/strict'
import { countMatches, countOccurrences, EMPTY_TREE_ID, mergeDiffRows, mergeStatus, normalizeBaseRef, numstatIndex, parseLogLines, parseNameStatusZ, parseNumstatZ, parsePorcelainV1, refRange, splitDiffSections } from '../src/git-parse.ts'
import { countMatchRows, countUnifiedMatches, makeSearchEngine, makeWordHighlighter, parseUnifiedDiff, splitByMatch, unifyHunkRows } from '../src/client/diff-parse.ts'
import { computeGraphLanes } from '../src/client/git-graph.ts'
import { badgeFor, badgesFor, buildFileTree, filterFiles, mergeAllFiles } from '../src/client/file-tree.ts'
import { DEFAULT_PREFS, normalizePrefs } from '../src/client/prefs.ts'
import { migrationFields, prefsFromSection, sectionIsDefault } from '../src/client/review-settings.ts'
import { createViewedStore, parseViewed } from '../src/client/viewed.ts'
import { createDraftBox, draftsKey, parseDrafts } from '../src/client/comment-drafts.ts'

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

// 19. countOccurrences: case-insensitive, non-overlapping, empty needle = 0.
assert.equal(countOccurrences('aBc AbC abc', 'abc'), 3)
assert.equal(countOccurrences('abc', ''), 0)
assert.equal(countOccurrences('', 'abc'), 0)

// 20. splitDiffSections: path from +++ (b/ stripped), deletion falls back to
//     --- (a/ stripped), body starts at @@ (headers never match queries).
const fullDiff = [
  'diff --git a/one.ts b/one.ts',
  'index 111..222 100644',
  '--- a/one.ts',
  '+++ b/one.ts',
  '@@ -1 +1 @@',
  '-alpha',
  '+ALPHA beta',
  'diff --git a/gone.md b/gone.md',
  '--- a/gone.md',
  '+++ /dev/null',
  '@@ -1 +0,0 @@',
  '-gamma',
].join('\n')
const sections = splitDiffSections(fullDiff)
assert.deepEqual(sections.map(s => s.path), ['one.ts', 'gone.md'])
assert.equal(countOccurrences(sections[0].body, 'alpha'), 2)
assert.equal(countOccurrences(sections[0].body, 'index'), 0)
assert.equal(countOccurrences(sections[1].body, 'gamma'), 1)

// 21. splitByMatch: odd indices are the matched substrings; no match = [text].
assert.deepEqual(splitByMatch('x Foo y FOO z', 'foo'), ['x ', 'Foo', ' y ', 'FOO', ' z'])
assert.deepEqual(splitByMatch('nothing', 'foo'), ['nothing'])

// 22. normalizeBaseRef: rejects option/range/metacharacter injection, keeps
//     plain names (dots, dashes, slashes, CJK).
assert.equal(normalizeBaseRef('feature/foo-1.2'), 'feature/foo-1.2')
assert.equal(normalizeBaseRef('中文分支'), '中文分支')
assert.equal(normalizeBaseRef('  main  '), 'main')
assert.equal(normalizeBaseRef('-oProxyCommand=evil'), null)
assert.equal(normalizeBaseRef('a..b'), null)
assert.equal(normalizeBaseRef('a b'), null)
assert.equal(normalizeBaseRef('a~1'), null)
assert.equal(normalizeBaseRef('a^2'), null)
assert.equal(normalizeBaseRef('a:b'), null)
assert.equal(normalizeBaseRef('a{b'), null)
assert.equal(normalizeBaseRef(42), null)
assert.equal(normalizeBaseRef(''), null)

// 23. parseNameStatusZ: plain records take one path token; R/C records take
//     source then destination (with the score kept from the letter token).
let nsRows = parseNameStatusZ('M\x00a.ts\x00D\x00b.ts\x00')
assert.deepEqual(nsRows, [
  { letter: 'M', path: 'a.ts' },
  { letter: 'D', path: 'b.ts' },
])
nsRows = parseNameStatusZ('R100\x00old.ts\x00new.ts\x00')
assert.deepEqual(nsRows, [{ letter: 'R', score: '100', path: 'new.ts', origPath: 'old.ts' }])
assert.deepEqual(parseNameStatusZ(''), [])

// 24. refRange: three-dot for two commits (merge-base view); two-dot when
//     the base end is the empty tree (a tree id has no merge-base).
assert.deepEqual(refRange('a'.repeat(40), 'b'.repeat(40)), ['a'.repeat(40) + '...' + 'b'.repeat(40)])
assert.deepEqual(refRange(EMPTY_TREE_ID, 'b'.repeat(40)), [EMPTY_TREE_ID, 'b'.repeat(40)])

// 25. mergeDiffRows: name-status letters become x with a blank y; counts come
//     from the numstat index (destination path); binary follows the dashes;
//     rows without a numstat entry are zero-count, not binary.
const rangeRows = mergeDiffRows(
  parseNameStatusZ('A\x00added.ts\x00M\x00mod.ts\x00R100\x00old.ts\x00ren.ts\x00D\x00gone.bin\x00'),
  numstatIndex(parseNumstatZ('5\t0\tadded.ts\x001\t2\tmod.ts\x000\t0\t\x00old.ts\x00ren.ts\x00-\t-\tgone.bin\x00')),
)
assert.deepEqual(rangeRows.map(r => [r.path, r.x, r.y, r.added, r.deleted, r.binary, r.untracked]), [
  ['added.ts', 'A', ' ', 5, 0, false, false],
  ['mod.ts', 'M', ' ', 1, 2, false, false],
  ['ren.ts', 'R', ' ', 0, 0, false, false],
  ['gone.bin', 'D', ' ', 0, 0, true, false],
])
assert.deepEqual(mergeDiffRows([], new Map()), [])

// 26. parseLogLines + parseDecorations: \x1e-record/\x1f-field wire format,
//     leading newlines trimmed, root commits have no parents, decorations
//     classify head/tag/other, malformed records are skipped.
const H1 = 'a'.repeat(40)
const H2 = 'b'.repeat(40)
const H3 = 'c'.repeat(40)
const logLines = parseLogLines([
  '',
  H1 + '\x1f' + H2 + ' ' + H3 + '\x1fAlice\x1f1700000000\x1fHEAD -> main, origin/main, tag: v1.0\x1fsubject one\x1e',
  H2 + '\x1f\x1fBob\x1f1700000001\x1f\x1froot commit\x1e',
  'zz' + '\x1fshort\x1e',
].join('\x1e'))
assert.equal(logLines.length, 2)
assert.deepEqual(logLines[0], {
  hash: H1,
  parents: [H2, H3],
  authorName: 'Alice',
  timestamp: 1700000000,
  refs: [
    { name: 'HEAD', kind: 'head' },
    { name: 'main', kind: 'head' },
    { name: 'origin/main', kind: 'other' },
    { name: 'v1.0', kind: 'tag' },
  ],
  subject: 'subject one',
})
assert.deepEqual(logLines[1].parents, [])
assert.equal(logLines[1].subject, 'root commit')

// 27. computeGraphLanes, straight history: one lane, in/out segments chain.
const straight = computeGraphLanes([
  { hash: H1, parents: [H2] },
  { hash: H2, parents: [H3] },
  { hash: H3, parents: [] },
])
assert.equal(straight.length, 3)
assert.ok(straight.every(row => row.lane === 0 && row.laneCount === 1 && row.pass.length === 0))
assert.deepEqual(straight[0].inEdges, [])
assert.deepEqual(straight[0].outEdges, [{ from: 0, to: 0, color: 0 }])
assert.deepEqual(straight[1].inEdges, [{ from: 0, to: 0, color: 0 }])
assert.deepEqual(straight[2].outEdges, [])

// 28. computeGraphLanes, branch: a second tip claims a new lane and folds
//     into the main line at the shared parent (the fold keeps its color);
//     the main line passes straight through the branch tip's row.
const branched = computeGraphLanes([
  { hash: H1, parents: [H3] },
  { hash: H2, parents: [H3] },
  { hash: H3, parents: [] },
])
assert.deepEqual(branched.map(r => r.lane), [0, 1, 0])
assert.deepEqual(branched[1].inEdges, [])
assert.deepEqual(branched[1].outEdges, [{ from: 1, to: 0, color: branched[1].color }])
assert.deepEqual(branched[1].pass, [{ lane: 0, color: 0 }])
assert.deepEqual(branched[2].inEdges, [{ from: 0, to: 0, color: 0 }])
assert.deepEqual(branched[2].pass, [])

// 29. computeGraphLanes, merge: the merge commit branches out, the merged
//     line folds sideways into it at its row, and the untouched line passes
//     straight through the middle row.
const mergeBase = computeGraphLanes([
  { hash: H1, parents: [H2, H3] },
  { hash: H2, parents: [H3] },
  { hash: H3, parents: [] },
])
assert.deepEqual(mergeBase[0].outEdges, [{ from: 0, to: 0, color: 0 }, { from: 0, to: 1, color: 1 }])
assert.deepEqual(mergeBase[1].inEdges, [{ from: 0, to: 0, color: 0 }])
assert.deepEqual(mergeBase[1].pass, [{ lane: 1, color: 1 }])
assert.deepEqual(mergeBase[2].inEdges, [{ from: 1, to: 1, color: 1 }])

// 30. countMatches: literal case-insensitive default; the optional case and
//     regex toggles; an invalid regex counts 0 (never throws).
assert.equal(countMatches('aBc AbC abc', 'abc'), 3)
assert.equal(countMatches('aBc AbC abc', 'abc', { caseSensitive: true }), 1)
assert.equal(countMatches('aBc AbC abc', 'a.c', { regex: true }), 3)
assert.equal(countMatches('aBc AbC abc', 'a.c', { regex: true, caseSensitive: true }), 2) // aBc + abc (AbC has an uppercase A)
assert.equal(countMatches('abc', '['), 0)
assert.equal(countMatches('aaa', 'aa'), 1) // non-overlapping, like countOccurrences

// 31. makeSearchEngine: parts/count/test under case/regex options; an invalid
//     regex produces an inactive engine.
const engine = makeSearchEngine({ query: 'foo' })
assert.ok(engine.active)
assert.equal(engine.count('Foo fOo foo'), 3)
assert.deepEqual(engine.parts('x Foo y'), ['x ', 'Foo', ' y'])
assert.ok(engine.test('xxFOO'))
const csEngine = makeSearchEngine({ query: 'Foo', caseSensitive: true })
assert.equal(csEngine.count('Foo FOO'), 1)
const rxEngine = makeSearchEngine({ query: 'f.o', regex: true })
assert.equal(rxEngine.count('Foo foo fuo'), 3)
const badEngine = makeSearchEngine({ query: '[' , regex: true })
assert.equal(badEngine.active, false)
assert.equal(badEngine.count('anything'), 0)
const emptyEngine = makeSearchEngine({ query: '   ' })
assert.equal(emptyEngine.active, false)

// 32. rowHasMatch/countMatchRows with an engine (side-by-side navigation).
const parseDiff = parseUnifiedDiff([
  'diff --git a/a.txt b/a.txt',
  '--- a/a.txt',
  '+++ b/a.txt',
  '@@ -1,2 +1,2 @@',
  ' keep',
  '-old Foo',
  '+new bar',
].join('\n'))
assert.equal(countMatchRows(parseDiff, makeSearchEngine({ query: 'foo' })), 1)

// 33. unifyHunkRows: context stays one line; a replacement (pair) renders as
//     deletion line then addition line; one-sided rows pass through.
const unified = unifyHunkRows(parseDiff.hunks[0].rows)
assert.deepEqual(unified.map(line => line.kind), ['ctx', 'del', 'add'])
assert.deepEqual(unified.map(line => line.no), [1, 2, 2]) // ctx=old1, del=old2, add=new2
assert.equal(unified[2].text, 'new bar')

// 34. countUnifiedMatches: a replacement pair with a match on BOTH lines
//     counts twice (the unified navigation walks lines, not rows).
const pairDiff = parseUnifiedDiff([
  'diff --git a/b.txt b/b.txt',
  '--- a/b.txt',
  '+++ b/b.txt',
  '@@ -1 +1 @@',
  '-alpha & beta',
  '+alpha & gamma',
].join('\n'))
const pairEngine = makeSearchEngine({ query: 'alpha' })
assert.equal(countUnifiedMatches(pairDiff, pairEngine), 2)

// 34. Preferences normalization: junk store falls back to defaults, valid
// values survive, unknown keys drop (a hand-edited localStorage must never
// crash the tab).
assert.deepEqual(normalizePrefs(null), DEFAULT_PREFS)
assert.deepEqual(normalizePrefs('not json'), DEFAULT_PREFS)
assert.deepEqual(normalizePrefs({ viewMode: 'unified', searchScope: 'path', graphCollapsed: true, searchCS: true, searchRegex: true, wsIgnore: true, junk: 1 }),
  { viewMode: 'unified', searchScope: 'path', graphCollapsed: true, searchCS: true, searchRegex: true, wsIgnore: true })
assert.deepEqual(normalizePrefs({ viewMode: 'bogus', searchScope: 'nope' }), DEFAULT_PREFS)

// 35. Settings-scope store helpers: section reads normalize, a default
//     section reads as default, and the legacy-store migration carries only
//     a user-written store (defaults or junk stay put; shapes clean up).
assert.deepEqual(prefsFromSection({ viewMode: 'unified', junk: 1 }),
  { viewMode: 'unified', searchScope: 'diff', graphCollapsed: false, searchCS: false, searchRegex: false, wsIgnore: false })
assert.equal(sectionIsDefault({ viewMode: 'split', searchScope: 'diff', graphCollapsed: false, searchCS: false, searchRegex: false, wsIgnore: false }), true)
assert.equal(sectionIsDefault({ viewMode: 'unified', searchScope: 'diff', graphCollapsed: false, searchCS: false, searchRegex: false, wsIgnore: false }), false)
assert.equal(migrationFields(null), null)
assert.equal(migrationFields('not json'), null)
assert.equal(migrationFields(JSON.stringify(DEFAULT_PREFS)), null)
const legacy = JSON.stringify({ viewMode: 'unified', searchScope: 'content' })
assert.deepEqual(migrationFields(legacy),
  { viewMode: 'unified', searchScope: 'content', graphCollapsed: false, searchCS: false, searchRegex: false, wsIgnore: false })

// 36. Word-level highlight: a replacement pair's changed spans come out of a
//     character-level LCS; non-pairs, rewrites (low similarity) and exhausted
//     budget all degrade to null (plain row rendering).
const words = makeWordHighlighter()
assert.equal(words.pair({ kind: 'ctx', left: { no: 1, text: 'a' }, right: { no: 1, text: 'a' } }), null)
const wordPair = words.pair({
  kind: 'pair',
  left: { no: 3, text: 'const x = foo(a, b);' },
  right: { no: 3, text: 'const x = foo(a, c);' },
})
assert.ok(wordPair !== null)
assert.deepEqual(wordPair.old, [[17, 18]])
assert.deepEqual(wordPair.new, [[17, 18]])
assert.equal(words.pair({
  kind: 'pair',
  left: { no: 4, text: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
  right: { no: 4, text: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
}), null)
const tiny = makeWordHighlighter(1)
assert.equal(tiny.pair({ kind: 'pair', left: { no: 1, text: 'ab' }, right: { no: 1, text: 'ax' } }), null)

// 37. Viewed store: toggling round-trips through a memory storage, junk
//     stored values degrade to empty, and the cap evicts the oldest.
function memoryStorage(initial) {
  const map = new Map(Object.entries(initial ?? {}))
  return {
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => { map.set(key, value) },
    removeItem: key => { map.delete(key) },
  }
}
assert.deepEqual(parseViewed(null), [])
assert.deepEqual(parseViewed('not json'), [])
assert.deepEqual(parseViewed('{"a":1}'), [])
assert.deepEqual(parseViewed(JSON.stringify(['b1', 2, '', 'b2', 'b1'])), ['b1', 'b2'])
const viewedStorage = memoryStorage()
const viewed = createViewedStore(viewedStorage)
assert.equal(viewed.toggle('hash1'), true)
assert.equal(viewed.toggle('hash2'), true)
assert.ok(viewed.has('hash1'))
assert.ok(viewed.has('hash2'))
assert.equal(viewed.toggle('hash1'), false)
assert.ok(!viewed.has('hash1'))
assert.deepEqual(parseViewed(viewedStorage.getItem('dsh-git-review.viewed')), ['hash2'])
const capped = createViewedStore(memoryStorage({ 'dsh-git-review.viewed': JSON.stringify(Array.from({ length: 2000 }, (_, i) => 'h' + i)) }))
capped.toggle('newest')
assert.ok(capped.has('newest'))
assert.ok(!capped.has('h1999'))

// 38. Comment draft box: per-workspace key, junk degrades to empty, and the
//     add/remove/clear round-trips persist into the storage.
assert.equal(draftsKey('D:\\repo'), 'dsh-git-review.drafts:' + encodeURIComponent('D:\\repo'))
assert.deepEqual(parseDrafts(null), [])
assert.deepEqual(parseDrafts('nope'), [])
assert.deepEqual(parseDrafts('[{"path":"a.ts","line":3,"text":"hi"},{"path":"","line":1,"text":"x"},{"bad":1}]'),
  [{ path: 'a.ts', line: 3, text: 'hi' }])
const draftStorage = memoryStorage()
const box = createDraftBox('D:\\repo', draftStorage)
box.add({ path: 'src/a.ts', line: 12, text: 'rename this' })
box.add({ path: 'src/b.ts', line: 4, text: 'check null' })
assert.deepEqual(box.list(), [
  { path: 'src/a.ts', line: 12, text: 'rename this' },
  { path: 'src/b.ts', line: 4, text: 'check null' },
])
box.remove(0)
assert.deepEqual(box.list(), [{ path: 'src/b.ts', line: 4, text: 'check null' }])
assert.deepEqual(parseDrafts(draftStorage.getItem(draftsKey('D:\\repo'))), [{ path: 'src/b.ts', line: 4, text: 'check null' }])
box.clear()
assert.deepEqual(box.list(), [])
assert.deepEqual(parseDrafts(draftStorage.getItem(draftsKey('D:\\repo'))), [])

console.log('check-parse: all assertions passed')
