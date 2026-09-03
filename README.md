# dsh-git-review

A **read-only Review tab** for [DeepSeek Harness](https://github.com/deepseek-ai) — a Codex-style
"Review" page inside the harness client: every uncommitted workspace change vs `HEAD`, as a
filterable file tree with status badges plus per-file side-by-side diffs.

- **Tab**: registers into the public `conversation.view` slot (`id: git-review`, order 20, next to
  Trajectory), zh/en labels, theme-safe semantic colors.
- **File tree**: directory aggregation, `+ ± − R ?` status badges, filter box (flat list while
  filtering), per-directory change counts.
- **Diff pane**: side-by-side rows (old/new gutters, hatched missing side, `\ No newline` marks),
  collapsible inter-hunk context ("N unmodified lines" → expand-all via one re-fetch with a huge
  `-U`), 20k-row render cap, binary/truncated/no-text-change notices.
- **Host half**: an in-process cordis plugin serving a fenced prefix route —
  `POST /dsh-git-review/api/status`, `POST /dsh-git-review/api/file-diff`, `GET .../ping`. All git
  output is NUL/verbatim safe (`-z`, `core.quotepath=false`), read-only
  (`--no-optional-locks`), fenced to the session workspace's repository. Diff base is `HEAD`, or
  the empty-tree id on an unborn HEAD. Untracked files get line-counted (binary-probed) for the
  tree and a synthesized `/dev/null` pseudo diff for the pane.

## Install

```bash
pnpm install
pnpm build
pnpm pack
dsh plugin --profile web add ./dsh-git-review-<version>.tgz
dsh web
```

Requires the harness workspace to be a git repository; anything else degrades to explicit guidance
copy in the tab (never a blank screen). Requires `git` on the host PATH.

## Checks

```bash
pnpm typecheck      # strict, noEmit
pnpm check:parse    # parser/tree regression (Node >= 23.6 native TS stripping)
pnpm build          # lib/index.js (node) + lib/client.js (browser factory bundle)
```

## Scope notes

- **Why not the Remote API**: mounting a new client namespace requires the harness build's
  generated codecs plus an explicit `api-remotes` composition choice, so a third-party plugin uses
  the plugin-served route instead (same trust model as dsh-diff-stat's fenced file API).
- Repo-wide, not worktree-subdirectory-scoped: the review shows the repository that contains the
  session workspace (status/diff are inherently repo-level).
- V2 ideas (not implemented): diff content search, inline comments back into the composer, staged/
  unstaged split, syntax highlighting, live re-render on agent activity.

MIT © HaoyueQin
