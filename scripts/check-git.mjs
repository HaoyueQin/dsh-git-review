// J1 host-endpoint integration checks against REAL git repositories
// (tempdir fixtures, the dsh-git-status test pattern). Covers the new write
// surface — stage/unstage/discard, stash, amend, last-commit, fetch, the
// status ahead/behind counts — plus the GIT_DIR env sanitization. Requires
// Node >= 23.6 (native TS stripping) and git on PATH.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gitCherryPick, gitCommit, gitConflictFinish, gitConflictResolve, gitDiscard, gitEnv, gitFetch, gitLastCommit, gitMerge, gitPull, gitReset, gitRevert, gitStage, gitStash, gitStatus, gitUnstage } from '../src/index.ts'

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

for (const root of roots) rmSync(root, { recursive: true, force: true })
rmSync(ROOT, { recursive: true, force: true })
console.log('check-git: all assertions passed (' + roots.length + ' repos exercised)')
