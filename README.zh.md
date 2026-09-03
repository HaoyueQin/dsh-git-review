# dsh-git-review

DeepSeek Harness 的**只读「审查」标签页**——参照 Codex 桌面端审查页形态：在 harness 客户端内
以并列 tab 展示当前工作区相对 `HEAD` 的全部未提交变更（文件树 + 状态徽标 + 每文件双列 diff）。

- **Tab**：注册进公开插槽 `conversation.view`（`id: git-review`，order 20，排在「轨迹」右侧），
  中英文案，语义色自动适配深浅主题。
- **文件树**：目录聚合，`+ ± − R ?` 状态徽标，筛选框（筛选时降级为平铺列表），目录聚合计数。
- **Diff 面板**：双列并排（左右行号、缺侧斜纹占位、`\ No newline` 标记），hunk 间未修改上下文
  折叠条（点击以超大 `-U` 重取一次实现"展开全部"），2 万行渲染上限，二进制/截断/无文本变更提示。
- **Host 半**：进程内 cordis 插件，挂在插件自己的前缀路由上——
  `POST /dsh-git-review/api/status`、`POST /dsh-git-review/api/file-diff`、`GET .../ping`。
  所有 git 输出走 NUL/原样安全通道（`-z`、`core.quotepath=false`），只读（`--no-optional-locks`），
  路径一律围栏在会话工作区所属仓库内。diff 基线为 `HEAD`，未出生 HEAD（空仓库）用空树对象；
  未跟踪文件做行数统计（含二进制探测）并在面板中合成 `/dev/null` 伪 diff。

## 安装

```bash
pnpm install
pnpm build
pnpm pack
dsh plugin --profile web add ./dsh-git-review-<version>.tgz
dsh web
```

要求会话工作区是 git 仓库、host 侧 PATH 有 `git`；其余情况（非仓库、host 半缺失）tab 内给出
明确指引文案，绝不白屏报错。

## 自检

```bash
pnpm typecheck      # 严格类型检查
pnpm check:parse    # 解析器/文件树回归测试（需 Node >= 23.6 原生 TS 剥离）
pnpm build          # lib/index.js（node 半）+ lib/client.js（浏览器工厂包）
```

## 边界说明

- **为何不用 Remote API**：挂新客户端 namespace 需要 harness 构建期生成的编解码器与 api-remotes
  装配的显式选择，第三方插件走插件自挂路由（与 dsh-diff-stat 围栏文件 API 同一信任模型）。
- 仓库级而非子目录级：审查展示的是会话工作区所属仓库的整体状态（status/diff 天然是仓库级）。
- V2 设想（未实现）：diff 内容搜索、行内评论回写输入框、暂存/未暂存分列、语法高亮、
  agent 运行中的实时刷新。

MIT © HaoyueQin
