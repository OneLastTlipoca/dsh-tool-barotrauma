# dsh-tool-barotrauma

DeepSeek Harness 插件：**潜渊症（Barotrauma）mod 制作工具集**。

装进 DSH profile 后，模型直接获得一组 `barotrauma_*` 工具，覆盖从「探测游戏环境」到「打包上传创意工坊」的完整 mod 制作链路。零外部 MCP 服务依赖，零第三方 npm 运行时依赖。

---

## 一、工具清单（17 个，全部已实现）

### 阶段一 · 探测与规划

| 工具 | 作用 |
|---|---|
| `barotrauma_detect_env` | 探测游戏目录、版本号、Steam 库、LocalMods、LuaCs、已装 mod 清单 |
| `barotrauma_plan` | 生成 mod 制作方案：内容清单、要生成的文件、filelist 记录、风险 |
| `barotrauma_create_mod` | 建内容包骨架：目录树 + `filelist.xml` + 空内容文件 + Lua/C# 入口 |

### 阶段二 · 内容 XML

| 工具 | 作用 |
|---|---|
| `barotrauma_gen_item` | 远程武器（**自动配套弹药与弹丸**）、近战武器、弹药、消耗品、穿戴装备、材料 |
| `barotrauma_gen_affliction` | 状态效果（affliction）：maxstrength / targets / Effect 区间 / 图标 |
| `barotrauma_gen_character` | 怪物 / NPC：health、emitter、`<Inventory>` 掉落、`<ai>` 与目标优先级 |
| `barotrauma_gen_event` | 随机事件三件套：`<EventSprites>` + `<EventPrefabs>` + `<EventSet>` |

### 阶段三 · 脚本逻辑

| 工具 | 作用 |
|---|---|
| `barotrauma_gen_lua` | Lua 骨架：大写 `Hook.Add(事件名, 唯一钩子名, 回调)`，带 CLIENT/SERVER 分支 |
| `barotrauma_gen_csharp` | C# 内存脚本骨架 + `RunConfig.xml`；`legacy`(ACsMod) / `modern`(IAssemblyPlugin) |

### 阶段四 · 本地化

| 工具 | 作用 |
|---|---|
| `barotrauma_scan_l10n` | 扫描需要本地化的键，报告每种语言缺哪些（**不产出译文**） |
| `barotrauma_translate` | 把**调用方提供的译文**写进语言文件；已有键不覆盖 |
| `barotrauma_convert_names` | 英文名 XML ⇄ 中文名 XML 互转（元素名/属性名/枚举值），只换名字、格式原样保留 |

### 阶段五 · 校验与发布

| 工具 | 作用 |
|---|---|
| `barotrauma_validate` | filelist 一致性、XML 结构、identifier 重复、贴图缺失（含**原版 `Content/` 引用**）、本地化缺口、弹药配套 |
| `barotrauma_describe_component` | 按组件名或关键词查物品组件的官方属性表（85 个组件 / 609 条属性） |
| `barotrauma_gen_icon` | AI 生图（Pollinations 免 Key）出物品图标 / 事件插图，直接请求目标尺寸 |
| `barotrauma_pack` | 打包成可分发 zip（**自带最小 ZIP 写入器**，不依赖 7z/PowerShell） |
| `barotrauma_publish` | 创意工坊发布文案 + 操作清单 + 发布前检查（**上传必须在游戏里做**） |

---

## 二、典型用法

```
1. barotrauma_detect_env                                        # 确认版本与路径
2. barotrauma_create_mod   name="等离子武器扩展" identifierPrefix="Plasma"
                           features=["items","localization"]
3. barotrauma_gen_item     modDir=<上一步的 modDir> identifier="PlasmaRifle"
                           kind="weapon_ranged" displayName="等离子步枪"
                           texture="%ModDir%/Items/PlasmaRifle.png"
                              → 一并生成 PlasmaRifleMagazine + PlasmaRifleRound
4. barotrauma_scan_l10n    modDir=…                              # 看缺哪些键
5. barotrauma_translate    modDir=… translations={…}             # 传入译文
6. barotrauma_validate     modDir=…                              # 结构性检查
7. barotrauma_pack         modDir=…                              # 出可分发 zip
```

## 三、设计原则

1. **模板必须取证**：所有 XML 字段名、目录约定、脚本入口写法都来自本机真实 mod 或官方文档，
   找不到实证的一律标注「未实测」，不编造字段名。取证过程与结论见 `refs/reference.md`。
2. **不产出译文**：`barotrauma_translate` 只接受调用方给的译文。机器直译的游戏文本质量很差，
   宁可先出清单。
3. **不代传工坊**：创意工坊上传必须在游戏里操作，插件只产出文案与检查清单。
4. **失败就抛**：工具 `execute` 只返回一个 canonical 值；任何磁盘/网络/解析失败直接 throw。
5. **入参必须收窄**：所有参数在工具边界显式收窄后才允许拼进 XML 或路径。
6. **路径不可逃逸**：用模型给的 slug 建目录/写文件时一律 `resolveInside`，挡住 `..`。
7. **只插入不重写**：`filelist.xml` 与内容 XML 走文本级插入，保留未知属性、不制造无意义 diff。
8. **只读优先**：探测类工具绝不修改游戏目录任何文件。

## 四、本机环境事实（2026 实测）

| 项 | 值 |
|---|---|
| 游戏版本 | **1.13.4.0**（Summer Update 2026 Hotfix 1） |
| 游戏目录 | `F:\SteamLibrary\steamapps\common\Barotrauma` |
| buildid | `23799131` |
| LuaCs | `Data\Mods\LuaCsForBarotrauma`（1.0.109），`0Harmony.dll` 在 |
| LocalMods | `<gameDir>\LocalMods`（**在游戏目录内**，不是 AppData 旧位置） |
| 预览图真名 | `PreviewImage.png`（不是 `preview.png`） |

取证素材（真实 mod）：`ACAWeaponsExpand`、`SmartPistol`、`monster_energy_gun`、`MolochMilk`、
`Neurotrauma`(Lua)、`BetterHealthUI (Updated)`(C#)、`WarhammerCreature`(角色)。

## 五、构建与测试

```powershell
$node="C:\Users\OtobeSpica\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
pnpm install
& $node ".\node_modules\typescript\bin\tsc" -p tsconfig.json
& $node tools\test-e2e.mjs
```

> `tsconfig.json` 的 `paths` 把 `@deepseek-ai/cordis` 与 `@deepseek-ai/dsh-tools` 指向 DSH profile 的
> `node_modules`，保证**编译期类型与运行期实际加载的版本一致**。这两个包是 DSH 私有 rc 包，
> 不要写进 `dependencies`。

## 六、插件配置

| 字段 | 说明 |
|---|---|
| `gameDir` | 潜渊症安装目录；不填则自动探测 Steam 库 |
| `localModsDir` | LocalMods 目录；不填则用 `<gameDir>/LocalMods` |
| `outputRoot` | 生成 mod 的默认输出根目录；不填则用 LocalMods 目录 |
| `imageModel` | 生图模型（Pollinations，免 Key），默认 `flux` |

## 七、已知边界（未实测项）

- C# `modern`（`IAssemblyPlugin`）写法在 LuaCs 1.0.109 下的兼容性**未实测**；`legacy`(ACsMod) 已在本机真实 mod 上验证过。
- Harmony 补丁写法未取证（本机真实 mod 里 `Harmony` 命中 0 处），因此 `gen_csharp` 不输出 Harmony 补丁。
- `filelist.xml` 的 `hidden` / `submarines` 属性在本机 49 个 filelist 里 0 次出现，未验证。
- 贴图路径的**跨平台大小写敏感性**未验证（Windows NTFS 本身不区分大小写，无法在本机做实验）。
- 潜艇（`.sub`）编辑未纳入工具范围。

## License

MIT

---

## 从源码仓库安装 / 发布流程

`.gitignore` 忽略了 `lib/`（构建产物不入库，这是源码仓库的标准做法），
而 `package.json` 的 `main` 指向 `lib/index.js` —— **所以从 clone 到能用必须经过一次构建**。

```bash
pnpm install
pnpm build          # tsc 编译 src/ → lib/
```

然后按需要选择：

**A. 本地装进 DSH profile（开发时用）**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\update-installed.ps1
```
这个脚本会 `pnpm pack` 出 tgz → 放进 `<profile>\vendor\` → `pnpm add file:vendor/<name>-<ver>.tgz`，
最终在 `node_modules` 里落成**真实目录**（不是软链）。
⚠️ 必须是真实目录：Node 解析 `link:` 软链时会用 realpath，导致插件目录里找不到 `@deepseek-ai/*` 依赖而加载失败。

**B. 分发给别人**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1 -Target ProfilePath
```

**C. 从 npm 安装（普通用户推荐）**

```sh
dsh plugin --profile <profile> add dsh-tool-barotrauma
```

**装完要重启 DSH（或重载 profile）**：模块在 Host 进程里是缓存住的，换版本不重启不生效；重载后工具清单里出现 `barotrauma_*` 即可用。

### 构建产物清单（不入库，但分发时不缺）

| 路径 | 说明 |
|---|---|
| `lib/` | `pnpm build` 产物 |
| `src/vocabulary.ts` | **生成文件**（合作者的中英词典） |
| `src/known-names.ts` | **生成文件**（原版名称全集，426 KB） |
| `src/schemas.ts` | **生成文件**（官方封闭枚举） |
| `src/components.ts` | **生成文件**（85 个物品组件属性表，124 KB） |

上面 4 个生成文件**已经入库**（否则 clone 后编译不出来）。它们的生成脚本在开发时用过，
没有一起入库 —— 需要重新生成时找开发者要。

### 开发期自检脚本（都在 `tools/`）

| 脚本 | 作用 |
|---|---|
| `test-e2e.mjs` | 全流程端到端：建包→物品→状态→角色→事件→Lua→C#→本地化→校验→打包→发布 |
| `audit-templates.mjs` | 把 `gen_item` 产物里的组件属性对照官方组件属性表 |
---

## 数据来源与许可

本项目的源码（`src/*.ts`、`tools/*`）为 MIT。但 `src/` 里有 **4 个生成的数据文件**，来源需要单独说明：

| 文件 | 内容 | 来源 |
|---|---|---|
| `src/vocabulary.ts` | 元素名 112 / 属性名 517 / 枚举值 352 条的中英对照 | 合作者「渊深 XML 翻译工具」的内置词表 |
| `src/known-names.ts` | 元素名 11,635 / 属性名 3,327 / 枚举值 1,600 条 | 从**本机安装的游戏** `Content` 目录的 617 个 XML 抽取 |
| `src/schemas.ts` | StatusEffect type/target、Item category、StatTypes、AbilityFlags、EventAction | 游戏自身数据 ∪ 官方 [BaroModDoc](https://regalis11.github.io/BaroModDoc/) |
| `src/components.ts` | 85 个物品组件 / 609 条属性 | 官方 BaroModDoc 的 `ItemComponents/*` 页面 |

说明：

- `known-names.ts` / `components.ts` / `schemas.ts` 收录的是**名称、字段名、枚举取值**这类事实性标识符，用于校验与补全，不包含游戏的文本、贴图、音频等资产。
- `vocabulary.ts` 的词表来自合作者，**公开再分发前请先取得其同意**（如不希望随仓库分发，可将此文件移出跟踪，改为安装后自行生成）。
- 官方文档页面本身不随本仓库分发；本文档只说明规则依据。仓库阅读者如需原文请访问 BaroModDoc。
- 这些文件都是**生成文件**，不要手工编辑。
---

## 版本历史

各版本的变更见 [CHANGELOG.md](CHANGELOG.md)。

## 参与开发

环境要求、构建与自检流程、改校验规则的约定见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 查组件属性

不确定某个物品该用哪个组件、或某个组件有哪些字段时：

```text
barotrauma_describe_component {}                         # 列出全部 85 个组件名
barotrauma_describe_component { name: "RepairTool" }     # 查它自己的 22 条属性
barotrauma_describe_component { search: "penetration" }  # 反向查：哪些组件有这个字段
```