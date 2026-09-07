// J1–J9 host-endpoint integration checks against REAL git repositories
// (tempdir fixtures, the dsh-git-status test pattern). Covers the write
// surface — stage/unstage/discard, stash, amend, last-commit, fetch, the
// status ahead/behind counts, history ops, conflict flow, hunk ops, blame /
// history / content, plus J8 tags + remote tracking, J3 log paging, J9 search
// modes, file-op rename/delete — plus the GIT_DIR env sanitization and the
// J9-2 streaming caps. Requires Node >= 23.6 (native TS stripping) and git
// >= 2.28 on PATH (`init -b` fixtures).
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildHunkPatch } from '../src/client/diff-parse.ts'
import { gitBlame, gitBranchCreate, gitBranchDelete, gitBranchRename, gitBranchSwitch, gitBranchTrack, gitCherryPick, gitCommit, gitCommitFiles, gitConflictFinish, gitConflictResolve, gitDiscard, gitEnv, gitFetch, gitFileBytes, gitFileDiff, gitFileHistory, gitFileContent, gitFileOp, gitFsList, gitHunkOp, gitInit, gitLastCommit, gitListFiles, gitLog, gitMerge, gitOpenApps, gitOpenWith, gitPull, gitRefs, gitReset, gitRevert, gitSearch, gitStage, gitStash, gitStatus, gitTagCreate, gitTagDelete, gitTagPush, gitUnstage } from '../src/index.ts'

/** Run one git command in cwd (fixtures only — never on user repos). */
function sh(cwd, ...args) {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' })
}

const ROOT = join(process.cwd(), '.tmp-check-git')
mkdirSync(ROOT, { recursive: true })
const roots = []
function fixture(bare = false) {
  // Under the project (never tmpdir): Windows 8.3 short paths break git's
  // local file transport even through realpathSync.
  const root = mkdtempSync(join(ROOT, 'check-'))
  roots.push(root)
  sh(root, 'init', ...(bare ? ['--bare', '-b', 'main'] : ['-b', 'main']))
  if (!bare) {
    sh(root, 'config', 'user.name', 'tester')
    sh(root, 'config', 'user.email', 'tester@example.com')
    // Pin line endings: the host must behave identically regardless of the
    // machine's global autocrlf (restore/apply paths depend on it).
    sh(root, 'config', 'core.autocrlf', 'false')
    sh(root, 'config', 'core.eol', 'lf')
  }
  return root
}

// 0. Env sanitization: GIT_DIR set to a decoy must not hijack the -C root.
process.env.GIT_DIR = 'Z:/definitely-not-a-repo/.git'
assert.equal(gitEnv()['GIT_DIR'], undefined)
// The fixture `sh` helper speaks plain git (no sanitization by design) —
// clear the decoy before any real repository is created.
delete process.env.GIT_DIR

const repo = fixture()
writeFileSync(join(repo, 'a.txt'), 'one\n')
sh(repo, 'add', '-A')
sh(repo, 'commit', '-m', 'init')

// 1. stage: an untracked file becomes staged (porcelain "A " via status).
writeFileSync(join(repo, 'new.txt'), 'fresh\n')
{
  const before = await gitStatus(repo, null, null, false)
  const row = before.files.find(file => file.path === 'new.txt')
  assert.ok(row?.untracked === true)
}
{
  const staged = await gitStage(repo, ['new.txt'], true)
  assert.equal(staged.ok, true)
  const after = await gitStatus(repo, null, null, false)
  const row = after.files.find(file => file.path === 'new.txt')
  assert.equal(row?.untracked, false)
  assert.equal(row?.x, 'A')
  // unstage puts it back to untracked (worktree content untouched).
  const unstaged = await gitUnstage(repo, ['new.txt'], true)
  assert.equal(unstaged.ok, true)
  const back = await gitStatus(repo, null, null, false)
  assert.equal(back.files.find(file => file.path === 'new.txt')?.untracked, true)
}

// 2. discard: a tracked modification reverts to HEAD; an untracked file is
//    deleted. Irreversible by design — the client gates it.
writeFileSync(join(repo, 'a.txt'), 'one\ntwo\n')
// autocrlf (Windows) writes the restored file back with CRLF — compare LF-normalized.
const readLF = (name) => readFileSync(join(repo, name), 'utf8').replace(/\r\n/g, '\n')
{
  const gone = await gitDiscard(repo, ['a.txt', 'new.txt'], true)
  assert.equal(gone.ok, true)
  assert.equal(readLF('a.txt'), 'one\n')
  assert.equal(existsSync(join(repo, 'new.txt')), false)
}

// 3. stash push (with untracked) empties the worktree; apply brings it back;
//    drop removes the entry. list parses real `git stash list` output.
writeFileSync(join(repo, 'a.txt'), 'one\ntwo\n')
writeFileSync(join(repo, 'b.txt'), 'untracked\n')
{
  const pushed = await gitStash(repo, 'push', undefined, true, true)
  assert.equal(pushed.ok, true)
  const clean = await gitStatus(repo, null, null, false)
  assert.equal(clean.files.length, 0)
  const listed = await gitStash(repo, 'list', undefined, undefined, undefined)
  assert.equal(listed.ok, true)
  assert.equal(listed.stashes.length, 1)
  assert.match(listed.stashes[0].subject, /WIP on main/)
  const applied = await gitStash(repo, 'apply', 0, undefined, true)
  assert.equal(applied.ok, true)
  assert.equal(readLF('a.txt'), 'one\ntwo\n')
  assert.equal(readLF('b.txt'), 'untracked\n')
  // apply kept the entry — drop it, then re-stash and pop once (pop must
  // restore AND remove the entry in one step).
  await gitStash(repo, 'drop', 0, undefined, true)
  const reStash = await gitStash(repo, 'push', undefined, true, true)
  assert.equal(reStash.ok, true)
  const popped = await gitStash(repo, 'pop', 0, undefined, true)
  assert.equal(popped.ok, true)
  assert.equal(readLF('a.txt'), 'one\ntwo\n')
  const listedAfter = await gitStash(repo, 'list', undefined, undefined, undefined)
  assert.equal(listedAfter.stashes.length, 0)
  // leave the changes in the worktree for the amend block (nothing stashed)
  assert.equal((await gitStatus(repo, null, null, false)).files.length, 2)
}

// 4. amend: folds new changes into the tip — one commit, new message, and
//    last-commit answers with the amended body.
writeFileSync(join(repo, 'a.txt'), 'one\ntwo\nthree\n')
{
  const first = await gitCommit(repo, 'add lines', 'all', true, false)
  assert.equal(first.ok, true)
  const before = sh(repo, 'rev-list', '--count', 'HEAD')
  const amended = await gitCommit(repo, 'add lines (amended)', 'all', true, true)
  assert.equal(amended.ok, true)
  assert.equal(sh(repo, 'rev-list', '--count', 'HEAD').trim(), before.trim(), 'amend must not add a commit')
  const last = await gitLastCommit(repo)
  assert.equal(last.ok, true)
  assert.equal(last.message, 'add lines (amended)')
  assert.match(last.hash, /^[0-9a-f]{40}$/)
}

// 5. ahead/behind: push the base, then add one local commit → ahead 1.
{
  const bare = fixture(true)
  // file:// URL: the bare tempdir's 8.3 short path breaks git's local transport.
  sh(repo, 'remote', 'add', 'origin', 'file:///' + bare.replace(/\\/g, '/'))
  sh(repo, 'push', '-u', 'origin', 'main')
  writeFileSync(join(repo, 'c.txt'), 'local only\n')
  sh(repo, 'add', '-A')
  sh(repo, 'commit', '-m', 'local work')
  const status = await gitStatus(repo, null, null, false)
  assert.equal(status.ahead, 1)
  assert.equal(status.behind, 0)
  // 6. fetch sees the remote (no new commits — fetch succeeds silently).
  const fetched = await gitFetch(repo, true)
  assert.equal(fetched.ok, true)
}

// 7. history operations: reset (soft/mixed/hard), revert, cherry-pick,
//    merge (no-ff) and pull — against a scratch branch layout.
writeFileSync(join(repo, 'd.txt'), 'feature\n')
sh(repo, 'add', '-A')
sh(repo, 'commit', '-m', 'feature work')
const featureHash = sh(repo, 'rev-parse', 'HEAD').trim()
sh(repo, 'checkout', '-b', 'side')
writeFileSync(join(repo, 'e.txt'), 'side\n')
sh(repo, 'add', '-A')
sh(repo, 'commit', '-m', 'side work')
const sideHash = sh(repo, 'rev-parse', 'HEAD').trim()
sh(repo, 'checkout', 'main')

// 7a. revert: a NEW commit lands on top; the file's change is undone.
{
  const reverted = await gitRevert(repo, featureHash, true)
  assert.equal(reverted.ok, true)
  assert.equal(sh(repo, 'rev-list', '--count', 'HEAD').trim(), '5', 'revert adds one commit')
  assert.equal(existsSync(join(repo, 'd.txt')), false, 'revert undid the file')
}
// 7b. cherry-pick: apply the side commit onto main.
{
  const picked = await gitCherryPick(repo, sideHash, true)
  assert.equal(picked.ok, true)
  assert.equal(existsSync(join(repo, 'e.txt')), true)
  assert.equal(sh(repo, 'rev-list', '--count', 'HEAD').trim(), '6')
}
// 7c. reset soft/mixed/hard from the feature hash (backward on main):
//     soft keeps the index, mixed keeps only the worktree, hard destroys.
{
  const soft = await gitReset(repo, featureHash, 'soft', true)
  assert.equal(soft.ok, true)
  assert.equal(sh(repo, 'rev-list', '--count', 'HEAD').trim(), '4', 'back at feature work')
  assert.notEqual(sh(repo, 'status', '--porcelain').trim(), '', 'soft keeps the index')
  const mixed = await gitReset(repo, featureHash, 'mixed', true)
  assert.equal(mixed.ok, true)
  assert.notEqual(sh(repo, 'status', '--porcelain').trim(), '', 'mixed keeps the worktree')
  const hard = await gitReset(repo, featureHash, 'hard', true)
  assert.equal(hard.ok, true)
  // reset --hard never deletes files the target commit does not have:
  // the cherry-picked e.txt stays behind as an untracked leftover.
  assert.equal(sh(repo, 'status', '--porcelain').trim(), '?? e.txt', 'hard leaves target-absent files untracked')
  assert.equal(existsSync(join(repo, 'e.txt')), true)
  sh(repo, 'clean', '-f')
}
// 7d. merge --no-ff of the side branch (a merge commit appears).
{
  const merged = await gitMerge(repo, 'side', true, true)
  assert.equal(merged.ok, true)
  assert.equal(sh(repo, 'rev-list', '--count', '--merges', 'HEAD').trim(), '1', 'no-ff produced a merge commit')
}
// 7e. pull: the remote is behind, so pull is a no-op success; a rejected
//     confirm must be refused before any git runs.
{
  const pulled = await gitPull(repo, false, true)
  assert.equal(pulled.ok, true)
  const refused = await gitPull(repo, false, false)
  assert.equal(refused.ok, false)
  assert.match(refused.error, /confirm/)
}

// 8. conflict flow: both branches edit the same line → merge conflicts →
//    in-progress detection + resolve(ours) + continue → clean again.
{
  sh(repo, 'checkout', '-b', 'conflicter')
  writeFileSync(join(repo, 'a.txt'), 'conflicter line\n')
  sh(repo, 'add', '-A')
  sh(repo, 'commit', '-m', 'conflicter work')
  sh(repo, 'checkout', 'main')
  writeFileSync(join(repo, 'a.txt'), 'main line\n')
  sh(repo, 'add', '-A')
  sh(repo, 'commit', '-m', 'main work')
  const merged = await gitMerge(repo, 'conflicter', false, true)
  console.log('MERGE RESULT:', JSON.stringify(merged))
  assert.equal(merged.ok, false, 'merge must conflict')
  const mid = await gitStatus(repo, null, null, false)
  assert.equal(mid.inProgress, 'merge')
  console.log('STATUS:', JSON.stringify({ ip: mid.inProgress, xy: mid.files.map(f => f.x + f.y + ':' + f.path) }))
  const conflicted = mid.files.filter(file => /[UA]{2}|U[AD]|DU/.test(file.x + file.y))
  assert.ok(conflicted.some(file => file.path === 'a.txt'), 'a.txt is unmerged')
  const resolved = await gitConflictResolve(repo, 'a.txt', 'ours', true)
  assert.equal(resolved.ok, true)
  const finished = await gitConflictFinish(repo, 'continue', 'merge', true)
  assert.equal(finished.ok, true)
  const clean = await gitStatus(repo, null, null, false)
  assert.equal(clean.inProgress ?? null, null)
  assert.equal(readLF('a.txt'), 'main line\n')
  // 8b. abort: a fresh conflict pair, then abort restores the pre-merge state.
  sh(repo, 'checkout', '-b', 'conflicter2')
  writeFileSync(join(repo, 'a.txt'), 'conflicter2 line\n')
  sh(repo, 'add', '-A')
  sh(repo, 'commit', '-m', 'conflicter2 work')
  sh(repo, 'checkout', 'main')
  writeFileSync(join(repo, 'a.txt'), 'main2 line\n')
  sh(repo, 'add', '-A')
  sh(repo, 'commit', '-m', 'main2 work')
  try { sh(repo, 'merge', 'conflicter2') } catch { /* the expected conflict */ }
  const mid2 = await gitStatus(repo, null, null, false)
  assert.equal(mid2.inProgress, 'merge')
  const aborted = await gitConflictFinish(repo, 'abort', 'merge', true)
  assert.equal(aborted.ok, true)
  assert.equal((await gitStatus(repo, null, null, false)).inProgress ?? null, null)
  assert.equal(readLF('a.txt'), 'main2 line\n')
}

// 9. hunk-op: a two-hunk diff is cut apart — staging hunk 0 lands only that
//    half in the index, unstaging returns it, reverting hunk 1 restores the
//    worktree text. The validator rejects multi-hunk patches and path swaps.
const HUNK_FILE = 'hunk.txt'
const baseline = Array.from({ length: 20 }, (_, i) => 'line ' + String(i + 1)).join('\n') + '\n'
writeFileSync(join(repo, HUNK_FILE), baseline)
sh(repo, 'add', '-A')
sh(repo, 'commit', '-m', 'hunk baseline')
const lines = baseline.split('\n')
lines[2] = 'line 3 edited'
lines[16] = 'line 17 edited'
const edited = lines.join('\n')
writeFileSync(join(repo, HUNK_FILE), edited)
const worktreeDiff = await gitFileDiff(repo, HUNK_FILE, false, false, undefined, 'unstaged', null, null)
assert.equal(worktreeDiff.ok, true)
if (!('diff' in worktreeDiff) || worktreeDiff.binary === true) throw new Error('expected a text diff')
const rawDiff = worktreeDiff.diff
assert.ok(rawDiff.includes('@@ -1,') && rawDiff.includes('@@ -1'), 'two hunks expected')
assert.ok((rawDiff.match(/^@@ /gm) ?? []).length === 2)
const patch0 = buildHunkPatch(rawDiff, 0)
const patch1 = buildHunkPatch(rawDiff, 1)
assert.ok(patch0 !== null && patch1 !== null)
{
  // stage hunk 0 only: the staged half carries 'line 3 edited', the
  // unstaged half still carries 'line 17 edited'.
  const staged = await gitHunkOp(repo, HUNK_FILE, patch0, 'stage', true)
  assert.equal(staged.ok, true)
  const stagedDiff = await gitFileDiff(repo, HUNK_FILE, false, false, undefined, 'staged', null, null)
  assert.ok(stagedDiff.ok && stagedDiff.diff.includes('line 3 edited'))
  assert.ok(!stagedDiff.diff.includes('line 17 edited'))
  const stillUnstaged = await gitFileDiff(repo, HUNK_FILE, false, false, undefined, 'unstaged', null, null)
  assert.ok(stillUnstaged.ok && stillUnstaged.diff.includes('line 17 edited'))
  // unstage the same hunk: the index is clean again.
  const undone = await gitHunkOp(repo, HUNK_FILE, patch0, 'unstage', true)
  assert.equal(undone.ok, true)
  const emptyStaged = await gitFileDiff(repo, HUNK_FILE, false, false, undefined, 'staged', null, null)
  assert.ok(emptyStaged.ok && emptyStaged.diff === '')
  // revert hunk 1 from the worktree: 'line 17' returns, 'line 3 edited' stays.
  const reverted = await gitHunkOp(repo, HUNK_FILE, patch1, 'revert', true)
  assert.equal(reverted.ok, true)
  assert.equal(readLF(HUNK_FILE), edited.split('line 17 edited').join('line 17'))
  // validator: a two-hunk patch and a path-swapped patch both bounce.
  const twoHunks = patch0 + patch1.replace('diff --git a/' + HUNK_FILE + ' b/' + HUNK_FILE + '\n', '')
  const multi = await gitHunkOp(repo, HUNK_FILE, twoHunks, 'stage', true)
  assert.equal(multi.ok, false)
  const swapped = await gitHunkOp(repo, HUNK_FILE, patch0.replaceAll(HUNK_FILE, 'other.txt'), 'stage', true)
  assert.equal(swapped.ok, false)
  // The shared fileOpGuard throws on a missing confirm (same as stage/discard).
  const unconfirmed = await gitHunkOp(repo, HUNK_FILE, patch0, 'stage', false).catch(error => ({ ok: false, error: String(error && error.message) }))
  assert.equal(unconfirmed.ok, false)
  assert.match(unconfirmed.error, /confirm/)
}

// 10. blame + file-history + file-content@ref: the history-tracing trio.
{
  const blamed = await gitBlame(repo, 'hunk.txt', true)
  assert.equal(blamed.ok, true)
  assert.ok(blamed.lines.length >= 20)
  const authors = new Set(blamed.lines.map(row => row.author))
  // 'Not Committed Yet' = the worktree drift left by the hunk-op tests —
  // git's own label for uncommitted lines.
  assert.ok(authors.has('tester'))
  assert.ok(authors.has('Not Committed Yet'))
  assert.equal(blamed.lines[0].summary, 'hunk baseline')

  const history = await gitFileHistory(repo, 'hunk.txt')
  assert.equal(history.ok, true)
  assert.ok(history.commits.length >= 1)
  assert.equal(history.commits[0].subject, 'hunk baseline')
  assert.ok(/^[0-9a-f]{40}$/.test(history.commits[0].hash))

  const tip = history.commits[0].hash
  const atRef = await gitFileContent(repo, 'hunk.txt', tip)
  assert.equal(atRef.ok, true)
  if (atRef.binary) throw new Error('expected text content')
  assert.ok(atRef.content.startsWith('line 1\n'))
  // a bad ref bounces before git runs
  let rejected = false
  try { await gitFileContent(repo, 'hunk.txt', '../escape') } catch { rejected = true }
  assert.equal(rejected, true)
}

// 11. refs + log paging (J3/J8): branches, remotes, tags all listed; log
//     skip pages forward without shifting (N+1 pagination contract).
{
  sh(repo, 'tag', 'v-test-1')
  const refs = await gitRefs(repo)
  assert.equal(refs.ok, true)
  assert.ok(refs.refs.some(r => r.kind === 'branch' && r.name === 'main'))
  assert.ok(refs.refs.some(r => r.kind === 'tag' && r.name === 'v-test-1'))
  const page0 = await gitLog(repo, 3, 0)
  assert.equal(page0.ok, true)
  assert.ok(page0.commits.length >= 1)
  const page1 = await gitLog(repo, 3, 2)
  assert.equal(page1.ok, true)
  if (page0.commits.length >= 3 && page1.commits.length > 0) {
    assert.ok(!page1.commits.some(c => c.hash === page0.commits[0].hash), 'skip pages forward')
  }
  // streaming cap surfaces as a boolean, never a crash
  assert.equal(typeof page0.truncated, 'boolean')
  // commit-message bodies ride the log feed (subject-only messages: '')
  writeFileSync(join(repo, 'bodied.txt'), 'with body\n')
  sh(repo, 'add', '-A')
  sh(repo, 'commit', '-m', 'bodied subject', '-m', 'first body line\nsecond body line')
  const bodied = await gitLog(repo, 50, 0)
  assert.equal(bodied.ok, true)
  // Same-second commits tie under --date-order (order unstable across
  // machines), so find by subject instead of trusting index 0.
  const bodiedCommit = bodied.commits.find(c => c.subject === 'bodied subject')
  assert.ok(bodiedCommit !== undefined, 'bodied commit rides the feed')
  assert.equal(bodiedCommit.body, 'first body line\nsecond body line')
  assert.equal(typeof page0.commits[0].body, 'string')
}

// 12. search modes (J9-1): diff text, file content, case/regex toggles.
{
  writeFileSync(join(repo, 'searchable.txt'), 'alpha needle beta\n')
  sh(repo, 'add', '-A')
  sh(repo, 'commit', '-m', 'searchable')
  writeFileSync(join(repo, 'searchable.txt'), 'alpha needle beta\nsecond NEEDLE\n')
  const diffHit = await gitSearch(repo, 'needle', null, null, 'diff', false, false)
  assert.equal(diffHit.ok, true)
  assert.ok(diffHit.matches.some(m => m.path === 'searchable.txt'), 'diff mode hits worktree drift')
  const csHit = await gitSearch(repo, 'NEEDLE', null, null, 'content', true, false)
  assert.equal(csHit.ok, true)
  assert.ok(csHit.matches.some(m => m.path === 'searchable.txt'))
  const rxHit = await gitSearch(repo, 'ne+dle', null, null, 'diff', false, true)
  assert.ok(rxHit.matches.some(m => m.path === 'searchable.txt'), 'regex mode matches')
  const rxBad = await gitSearch(repo, '([', null, null, 'diff', false, true)
  assert.equal(rxBad.ok, true)
  assert.equal(rxBad.matches.length, 0, 'invalid regex counts as 0')
  // Overlong regex degrades to literal matching (host-stall guard), and the
  // whitespace flag threads through without breaking the call shape.
  const rxLong = await gitSearch(repo, 'needle' + 'x'.repeat(120), null, null, 'diff', false, true)
  assert.equal(rxLong.ok, true)
  const wsCall = await gitSearch(repo, 'needle', null, null, 'diff', false, false, true)
  assert.equal(wsCall.ok, true)
  assert.ok(wsCall.matches.some(m => m.path === 'searchable.txt'), 'ws flag keeps real matches')
  sh(repo, 'checkout', '--', 'searchable.txt')
}

// 13. file-op rename/delete (J9-1): fenced, target-exists guarded.
{
  writeFileSync(join(repo, 'op-a.txt'), 'op\n')
  sh(repo, 'add', '-A')
  sh(repo, 'commit', '-m', 'op file')
  const renamed = await gitFileOp(repo, 'op-a.txt', 'rename', 'op-b.txt', true)
  assert.equal(renamed.ok, true)
  assert.equal(existsSync(join(repo, 'op-b.txt')), true)
  const clash = await gitFileOp(repo, 'op-b.txt', 'rename', 'a.txt', true)
  assert.equal(clash.ok, false, 'rename onto an existing file refuses')
  const escape = await gitFileOp(repo, 'op-b.txt', 'rename', '../escape.txt', true).catch(e => ({ ok: false, error: String(e?.message ?? e) }))
  assert.equal(escape.ok, false, 'path escape refuses')
  const deleted = await gitFileOp(repo, 'op-b.txt', 'delete', undefined, true)
  assert.equal(deleted.ok, true)
  assert.equal(existsSync(join(repo, 'op-b.txt')), false)
}

// 14. branch lifecycle + remote tracking (J8-5): create/switch/rename/delete
//     plus switch -c --track from a file:// remote branch.
{
  const created = await gitBranchCreate(repo, 'j9-branch', undefined, true)
  assert.equal(created.ok, true)
  const switched = await gitBranchSwitch(repo, 'j9-branch', true)
  assert.equal(switched.ok, true)
  assert.match(sh(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim(), /^j9-branch$/)
  const renamedB = await gitBranchRename(repo, 'j9-branch', 'j9-renamed', true)
  assert.equal(renamedB.ok, true)
  assert.match(sh(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim(), /^j9-renamed$/)
  sh(repo, 'checkout', 'main')
  const dropped = await gitBranchDelete(repo, 'j9-renamed', false, true)
  assert.equal(dropped.ok, true)
  const badName = await gitBranchCreate(repo, '../escape', undefined, true)
  assert.equal(badName.ok, false, 'branch injection refuses')
  // remote tracking: publish main to the file:// origin, fetch a new remote
  // branch there, then track it locally.
  sh(repo, 'push', 'origin', 'main')
  sh(repo, 'checkout', '-b', 'upstream-feat')
  writeFileSync(join(repo, 'up.txt'), 'up\n')
  sh(repo, 'add', '-A')
  sh(repo, 'commit', '-m', 'upstream feat')
  sh(repo, 'push', '-u', 'origin', 'upstream-feat')
  sh(repo, 'checkout', 'main')
  sh(repo, 'branch', '-D', 'upstream-feat')
  const fetched = await gitFetch(repo, true)
  assert.equal(fetched.ok, true)
  const tracked = await gitBranchTrack(repo, 'origin/upstream-feat', undefined, true)
  assert.equal(tracked.ok, true)
  assert.match(sh(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim(), /^upstream-feat$/)
  assert.match(sh(repo, 'config', '--get', 'branch.upstream-feat.remote').trim(), /^origin$/)
  sh(repo, 'checkout', 'main')
  sh(repo, 'branch', '-D', 'upstream-feat')
}

// 15. tags (J8-1): create at HEAD/target, re-tag refuses, delete removes,
//     invalid names refuse before git runs.
{
  const tip = sh(repo, 'rev-parse', 'HEAD').trim()
  const made = await gitTagCreate(repo, 'j9-tag', undefined, true)
  assert.equal(made.ok, true)
  assert.equal(sh(repo, 'rev-list', '-n', '1', 'j9-tag').trim(), tip)
  const retag = await gitTagCreate(repo, 'j9-tag', undefined, true)
  assert.equal(retag.ok, false, 'existing tag refuses')
  const parentHash = sh(repo, 'rev-parse', 'HEAD~1').trim()
  const atTarget = await gitTagCreate(repo, 'j9-tag-2', parentHash, true)
  assert.equal(atTarget.ok, true)
  assert.equal(sh(repo, 'rev-list', '-n', '1', 'j9-tag-2').trim(), parentHash)
  const badTag = await gitTagCreate(repo, '../escape', undefined, true)
  assert.equal(badTag.ok, false, 'tag injection refuses')
  const unconfirmed = await gitTagDelete(repo, 'j9-tag', false)
  assert.equal(unconfirmed.ok, false)
  const droppedTag = await gitTagDelete(repo, 'j9-tag', true)
  assert.equal(droppedTag.ok, true)
  await gitTagDelete(repo, 'j9-tag-2', true)
  await gitTagDelete(repo, 'v-test-1', true)
  // tag push targets origin; in the fixture the push succeeds (file://).
  await gitTagCreate(repo, 'j9-push-tag', undefined, true)
  const pushed = await gitTagPush(repo, 'j9-push-tag', true)
  assert.equal(pushed.ok, true)
  await gitTagDelete(repo, 'j9-push-tag', true)
}

// 16. file-bytes: magic-sniffed preview bytes round-trip; unknown types
//     refuse honestly; escapes and missing files throw before git runs.
{
  const { writeFileSync: writeBin } = await import('node:fs')
  const pngHead = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D])
  writeBin(join(repo, 'dot.png'), pngHead)
  writeBin(join(repo, 'doc.txt'), 'plain text\n')
  writeBin(join(repo, 'pic.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>')
  const png = await gitFileBytes(repo, 'dot.png', undefined)
  assert.equal(png.ok, true)
  assert.equal(png.mime, 'image/png')
  assert.deepEqual(Buffer.from(png.base64, 'base64'), pngHead)
  assert.equal(png.truncated, false)
  const svg = await gitFileBytes(repo, 'pic.svg', undefined)
  assert.equal(svg.ok, true)
  assert.equal(svg.mime, 'image/svg+xml')
  const text = await gitFileBytes(repo, 'doc.txt', undefined)
  assert.equal(text.ok, false, 'unsniffable file refuses honestly')
  const missing = await gitFileBytes(repo, 'nope.png', undefined).catch(e => ({ ok: false, error: String(e?.message ?? e) }))
  assert.equal(missing.ok, false)
  const escape = await gitFileBytes(repo, '../escape.png', undefined).catch(e => ({ ok: false, error: String(e?.message ?? e) }))
  assert.equal(escape.ok, false, 'path escape refuses')
  // history bytes: committed png readable at its commit
  sh(repo, 'add', '-A')
  sh(repo, 'commit', '-m', 'preview fixtures')
  const tip = sh(repo, 'rev-parse', 'HEAD').trim()
  const atRef = await gitFileBytes(repo, 'dot.png', tip)
  assert.equal(atRef.ok, true)
  assert.equal(atRef.mime, 'image/png')
}

// 17. Fail-closed guards: invalid reset mode / conflict side / unknown app
//     refuse instead of defaulting to a destructive operation.
{
  const tip = sh(repo, 'rev-parse', 'HEAD').trim()
  const badMode = await gitReset(repo, tip, 'super', true)
  assert.equal(badMode.ok, false)
  const badSide = await gitConflictResolve(repo, 'a.txt', 'sideways', true)
  assert.equal(badSide.ok, false)
  const badFinish = await gitConflictFinish(repo, 'maybe', 'merge', true)
  assert.equal(badFinish.ok, false)
}
// 18. file-diff untracked flag is server-verified: a tracked modification
//     fetched with untracked=true must be a real diff, never an all-added
//     pseudo diff (no '/dev/null' baseline).
writeFileSync(join(repo, 'a.txt'), 'one\nverify\n')
{
  const diff = await gitFileDiff(repo, 'a.txt', true, false, undefined, 'all', null, null, false)
  assert.equal(diff.ok, true)
  assert.ok(!diff.diff.includes('/dev/null'), 'tracked file never gets a pseudo diff')
}
// 19. file-content with an unresolvable ref throws (no 'null:path' spec).
{
  let failed = false
  try {
    await gitFileContent(repo, 'a.txt', 'definitely-not-a-ref!!!')
  } catch { failed = true }
  assert.equal(failed, true)
}
// 20. GIT_DIR pollution must not hijack a real entry point (unit-tested
//     gitEnv above only proves the scrubber; this proves the call path).
process.env.GIT_DIR = 'Z:/definitely-not-a-repo/.git'
try {
  const polluted = await gitStatus(repo, null, null, false)
  assert.equal(polluted.ok, true)
} finally {
  delete process.env.GIT_DIR
}

// 21. Non-repository workspace degrades instead of refusing: status carries
//     cwdRoot, fs-list browses, file-content falls back, git-init unlocks.
//     (Outside ROOT: rev-parse walks up, so a dir under the project would
//     resolve to the project repo itself.)
{
  const { tmpdir } = await import('node:os')
  const plain = mkdtempSync(join(tmpdir(), 'dsh-git-review-plain-'))
  roots.push(plain)
  writeFileSync(join(plain, 'hello.txt'), 'hi\n')
  mkdirSync(join(plain, 'sub'))
  writeFileSync(join(plain, 'sub', 'b.txt'), 'b\n')
  const s = await gitStatus(plain, null, null, false)
  assert.equal(s.ok, false)
  assert.equal(s.isRepository, false)
  assert.ok(typeof s.cwdRoot === 'string')
  const listed = await gitFsList(plain, undefined)
  assert.equal(listed.ok, true)
  assert.ok(listed.entries.some(e => e.path === 'hello.txt' && e.kind === 'file'))
  assert.ok(listed.entries.some(e => e.path === 'sub' && e.kind === 'dir'))
  const content = await gitFileContent(plain, 'hello.txt', undefined)
  assert.equal(content.ok, true)
  assert.equal(content.content, 'hi\n')
  const refused = await gitInit(plain, false)
  assert.equal(refused.ok, false)
  const inited = await gitInit(plain, true)
  assert.equal(inited.ok, true)
  const after = await gitStatus(plain, null, null, false)
  assert.equal(after.ok, true)
}

// 22. Untracked probes count exactly past the 512 KiB prefix cap (bounded
//     streaming reads within the per-status budget).
{
  const big = fixture()
  const lines = 6000
  writeFileSync(join(big, 'big.txt'), ('x'.repeat(99) + '\n').repeat(lines))
  const st = await gitStatus(big, null, null, false)
  assert.equal(st.files.find(file => file.path === 'big.txt')?.added, lines)
}

// 23. Commit-files, list-files and open-with guards (no GUI ever spawns:
//     unknown apps, missing paths and directories fail before any spawn).
{
  const cov = fixture()
  writeFileSync(join(cov, 'a.txt'), 'one\n')
  sh(cov, 'add', '-A')
  sh(cov, 'commit', '-m', 'init')
  const sha = sh(cov, 'rev-parse', 'HEAD').trim()
  const cf = await gitCommitFiles(cov, sha)
  assert.equal(cf.ok, true)
  assert.ok(cf.files.length > 0)
  assert.ok(cf.files.some(file => file.path === 'a.txt'))
  const lf = await gitListFiles(cov)
  assert.equal(lf.ok, true)
  assert.ok(Array.isArray(lf.files))
  assert.ok(lf.files.includes('a.txt'))
  assert.equal(typeof lf.truncated, 'boolean')
  assert.equal((await gitOpenWith(cov, 'nope.txt', 'default', true)).ok, false)
  assert.equal((await gitOpenWith(cov, 'a.txt', 'evil-app', true)).ok, false)
  assert.equal((await gitOpenWith(cov, '.git', 'default', true)).ok, false)
  const apps = await gitOpenApps()
  assert.equal(apps.ok, true)
  assert.ok(apps.apps.length > 0)
  assert.ok(apps.apps.some(app => app.id === 'default' && app.available))
}

try {
  for (const root of roots) rmSync(root, { recursive: true, force: true })
  rmSync(ROOT, { recursive: true, force: true })
} catch {
  // Fixtures are disposable; a failed run keeps them for forensics (and
  // .gitignore keeps them out of the tree).
}
console.log('check-git: all assertions passed (' + roots.length + ' repos exercised)')
