# 参与开发

这是一个 DeepSeek Harness（DSH）插件，为《潜渊症 / Barotrauma》mod 制作提供工具链。
代码是 TypeScript，没有运行时依赖（`dependencies` 为空），只 peer 依赖 DSH 的 Cordis 契约。

---

## 环境要求

| 项 | 要求 | 说明 |
|---|---|---|
| Node.js | **≥ 20.18.1** | 见 `package.json` 的 `engines` |
| pnpm | 任意较新版本 | 仓库用 `pnpm-lock.yaml` |
| DSH | 已安装并至少运行过一次 | `@deepseek-ai/cordis` / `@deepseek-ai/dsh-tools` 是 peer 依赖，由 DSH 提供 |
| 潜渊症 | 可选，1.13.4.0 为实测基线 | `barotrauma_validate` 需要它才能校验 `Content/` 原版贴图引用 |

---

## 第一次上手

```powershell
git clone https://github.com/OneLastTlipoca/dsh-tool-barotrauma.git
cd dsh-tool-barotrauma
pnpm install
pnpm build                                              # src/ → lib/（lib/ 不入库）
powershell -File tools\update-installed.ps1             # 装进当前 DSH profile
```

**装完要重启 DSH**（或重载 profile）：模块在 Host 进程里是缓存住的，不重启不生效。

装完后在 DSH 里跑一句 `barotrauma_detect_env` 验证是否加载成功。

---

## 目录

| 路径 | 内容 |
|---|---|
| `src/index.ts` | 插件入口：导出 `name` / `inject` / `apply`，注册全部工具，`TOOL_NAMES` 是权威工具清单 |
| `src/<模块>.ts` | 工具实现，按阶段分文件（`env` / `mod` / `items` / `characters` / `events` / `scripts` / `l10n` / `validate` / `convert` / `reference` / `pack` / `icon`） |
| `src/pack-io.ts` | filelist 与语言文件的读写（所有生成器共用） |
| `src/util.ts` | 输入强制转换、路径安全（`resolveInside`）、资源引用收集 |
| `lib/` | 构建产物，**不入库** |
| `tools/` | 开发期自检脚本（见下） |
| `CHANGELOG.md` | 版本历史，**每次改动都要记** |

不在仓库里的两处（需要时另行索取）：`refs/`（官方文档摘录、真实 mod 取证）、`.scratch/`（测试夹具）。
分发包的 `docs/` 里带了一份 `refs/` 的副本。

---

## 常用命令

```powershell
pnpm build          # 编译
pnpm typecheck      # 只做类型检查
pnpm verify         # typecheck + build

node tools\test-e2e.mjs        # 全流程端到端：建包→物品→状态→角色→事件→Lua→C#→本地化→校验→打包→发布
node tools\test-items.mjs      # 物品生成器
node tools\test-planning.mjs   # 探测与规划
node tools\smoke.mjs           # 快速冒烟
node tools\audit-templates.mjs # 把生成器用到的组件属性对照官方组件属性表
```

`test-e2e.mjs` 是提交前必须过的：它会把完整流程跑一遍，任何生成器改坏了都会在这里暴露。

---

## 改校验规则时的要求

这个项目的历史基本就是一部**误报校准史** —— 校验器最大的风险不是漏报，而是**乱报**。
所以改 `src/validate.ts` 请按这个顺序：

1. **先复现**：在 `.scratch/` 下造一个能触发该问题的最小 mod，确认检查真的会响。
   （"零触发"和"检查根本没跑"看起来一模一样，必须用能失败的样本验证。）
2. **再改规则**。
3. **做全量回归**：在本机 `LocalMods` 里的全部真实 mod 上跑一遍，
   确认没有新增 blocker 级误报。历史上的坑包括：
   - 文件名含空格被截断 → 假报贴图缺失
   - `folder=` / `path=` 按目录加载的 XML → 假报漏登记
   - `<override>` 造成的"重复 identifier" → 其实是合法覆盖（而且有两种写法）
   - NPC 库存里的 `<Item identifier="…">` → 带 `tags=` 但不是定义
   - 语言文件里的 `<afflictionname.x>` → 是本地化键，不是元素名
   - 官方文档比游戏旧 → 枚举必须取「游戏实测 ∪ 文档」并集
4. **把结论写进 `CHANGELOG.md`**，包括"校准前/后"的数字。没有数字的结论不算结论。

---

## 生成文件不要手改

`src/` 下有 4 个**生成文件**，它们是把游戏与官方文档的规则固化下来的数据：

| 文件 | 规模 | 来源 |
|---|---|---|
| `vocabulary.ts` | 元素名 112 / 属性名 517 / 枚举值 352 | 合作者的「渊深 XML 翻译工具」内置词表 |
| `known-names.ts` | 元素名 11,635 / 属性名 3,327 / 枚举值 1,600 | 本机游戏 `Content` 目录 617 个 XML 抽取 |
| `schemas.ts` | StatusEffect type 29 / target 12、Item category 17、StatTypes 82、AbilityFlags 13、EventAction 61 | 游戏实测 ∪ 官方 BaroModDoc |
| `components.ts` | 85 个物品组件 / 609 条属性 | 官方 BaroModDoc 的 `ItemComponents/*` 85 页 |

它们**必须入库**（否则 clone 后编译不出来），但**不要手工编辑**——需要更新时重新生成并说明来源。

---

## 不要提交

`.gitignore` 已覆盖：`node_modules/`、`lib/`、`dist/`、`.scratch/`、`refs/`、`vendor/`、`*.tgz`、`.env`。
其中 `.scratch/` 里有十几 MB 的测试夹具和第三方工具解包副本，`refs/` 里是第三方派生资料 —— 两者都刻意不进公开仓库。

---

## 推送约定

- **不要对 `main` 做 `rebase` / `amend` 之后强推**。历史上已经发生过一次：`git rebase --root --exec ...` 卡在中途，
  工作区的被跟踪文件全部消失、`git ls-files` 归零，靠 `git rebase --abort` 才救回来。
  要改历史就开分支，改完确认 `git status` 干净、`git log` 正常再考虑。
- 日常改动建议走分支 + PR：`git switch -c fix/xxx` → 提交 → 推送 → 开 PR。两人项目也可以直接推 `main`，但别强推。
- 提交信息用中文，写清**为什么**改（"修了什么误报、依据是什么"），而不只是"修了个 bug"。

---

## 一条硬原则

`barotrauma_translate` **只写调用方提供的译文，绝不自动编造**，已存在的键永不覆盖。
改本地化相关代码前请先理解这一点 —— 缺什么由 `barotrauma_scan_l10n` 报告，译不译由人决定。
