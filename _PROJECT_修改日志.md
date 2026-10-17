# dsh-tool-barotrauma 改动日志

> 创建日期：2026-10-10。每次改动后在本文件末尾追加新章节。
> 本文件给**用户本人**读（章节式、含决策理由）；机器快照见同目录 `_PROJECT_工作档.md`。

## 一、项目关键路径

| 用途 | 绝对路径 |
|---|---|
| 工程根 | `E:\Desktop\001\dsh-tool-barotrauma` |
| 源码根 | `E:\Desktop\001\dsh-tool-barotrauma\src` |
| 编译输出 | `E:\Desktop\001\dsh-tool-barotrauma\lib` |
| 元数据 | `E:\Desktop\001\dsh-tool-barotrauma\package.json` |
| 构建配置 | `E:\Desktop\001\dsh-tool-barotrauma\tsconfig.json` |
| Cordis 补丁层 | `E:\Desktop\001\dsh-tool-barotrauma\cordis.patch.yml` |
| 测试脚本 | `E:\Desktop\001\dsh-tool-barotrauma\tools\*.mjs` |
| 事实参考（施工依据） | `E:\Desktop\001\dsh-tool-barotrauma\refs\reference.md` |
| 安装位置 | `C:\Users\OtobeSpica\.dsh\profiles\desktop`（`link:` 依赖 + bundles 条目） |

游戏侧（本机实测事实）：

| 项 | 值 |
|---|---|
| 游戏目录 | `F:\SteamLibrary\steamapps\common\Barotrauma` |
| 版本 | `1.13.4.0`（Summer Update 2026 Hotfix 1） |
| buildid | `23799131` |
| LuaCs | `F:\SteamLibrary\steamapps\common\Barotrauma\Data\Mods\LuaCsForBarotrauma`（版本 1.0.109） |
| LocalMods | `F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods`（**在游戏目录内**，不是 AppData） |

## 二、编译 / 打包工作流

```powershell
$proj="E:\Desktop\001\dsh-tool-barotrauma"
$node="C:\Users\OtobeSpica\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
Set-Location $proj

# 依赖（只用到 typescript；@deepseek-ai/* 走 tsconfig paths 指向 DSH profile）
& $node "C:\Users\OtobeSpica\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\pnpm\bin\pnpm.mjs" install

# 编译
& $node ".\node_modules\typescript\bin\tsc" -p tsconfig.json

# 测试
& $node tools\test-planning.mjs     # 阶段一
& $node tools\test-items.mjs        # 阶段二
& $node tools\test-e2e.mjs          # 全链路（15 个工具）
```

**易错点**

1. `tsconfig.json` 的 `paths` 把 `@deepseek-ai/cordis` / `@deepseek-ai/dsh-tools` 指向
   `C:\Users\OtobeSpica\.dsh\profiles\node_modules\@deepseek-ai\*`，**故意不用 pnpm 装的版本**：
   profile 里实际加载的是 cordis 4.0.1 / dsh-tools 0.1.0-rc.5，npm 上最新是 4.0.4 / 0.1.0-rc.8，
   编译期类型必须跟运行期一致。
2. 这两个包**不能**写进 `dependencies`（它们是 DSH 私有 rc 包，运行时由 profile 提供）。
3. 测试脚本里的假 ctx **必须立即调用 effect 工厂函数**，否则注册不会发生、表现为"工具未注册"：
   ```js
   effect: (factory) => { const d = factory(); return () => d?.() }   // ✅
   effect: (factory) => () => factory()                              // ❌ 永远不注册
   ```
4. 二进制（zip/png）必须走 `writeFile(path, Uint8Array)`，**不能**经过 `writeFileEnsured`（utf8 文本写入会损坏字节）。
5. 本机 pwsh 控制台显示中文可能乱码，但字节正确 —— 判断结果看 `exit code`，别信显示。

## 三、配置默认值与关键常量

插件配置（`BarotraumaPluginConfig`，全部可选）：

| 字段 | 默认行为 |
|---|---|
| `gameDir` | 不填 → 自动探测（注册表 SteamPath → libraryfolders.vdf → 兜底候选） |
| `localModsDir` | 不填 → `<gameDir>/LocalMods` |
| `outputRoot` | 不填 → `localModsDir` |
| `imageModel` | 不填 → `flux` |

代码里的关键默认值：

| 常量 | 值 | 依据 |
|---|---|---|
| `DEFAULT_FEATURES` | `['items','localization']` | 最常用的最小组合 |
| 武器贴图 TODO | `Content/Items/Weapons/weapons_new.png`、`sourcerect=0,0,64,64` | SmartPistol 真实值附近 |
| 弹匣贴图 | `sourcerect=146,157,21,44`、`depth=0.54` | vanilla smgmagazine |
| 每弹匣发数 | 20 | 参数默认 |
| `condition` 递减 | `-(100/每弹匣发数)`，3 位小数 | vanilla smgmagazine 的 `-4.8` 同构 |
| 消耗品医疗技能 | `medical` / level 40、`duration=20.0` | vanilla bandage |
| 护甲 `armorsector` | `0.0,360.0` | vanilla bodyarmor |
| filelist 记录标签 | `Item` / `Character` / `RandomEvents` / `Text` / `Afflictions` / `Other` | 真实 mod 统计 |
| 预览图文件名 | `PreviewImage.png` | **不是** `preview.png`（本机 LocalMods 里 `preview.png` 为 0 个） |

## 四、源码改动清单（本次全部为新增）

| 文件 | 内容 |
|---|---|
| `src/index.ts` | Cordis 入口：`name` / `inject=['tools']` / `apply`，注册 15 个工具，导出 `TOOL_NAMES` |
| `src/config.ts` | 插件配置类型与收窄 |
| `src/util.ts` | 入参收窄、路径安全（`resolveInside`）、XML 转义、`collectAssetReferences`、`registerTool` |
| `src/paths.ts` | 路径上下文解析（工具入参 > 插件配置 > 自动探测） |
| `src/env.ts` | `barotrauma_detect_env`：Steam 库、游戏版本、LocalMods、LuaCs、已装 mod 扫描 |
| `src/mod.ts` | `barotrauma_plan` / `barotrauma_create_mod` |
| `src/xml.ts` | filelist / 语言文件构造、内容类型标签、本地化键命名 |
| `src/pack-io.ts` | 内容包文本级读写：登记 filelist、追加 XML 块、插入容器、追加语言条目 |
| `src/items.ts` | `barotrauma_gen_item` / `barotrauma_gen_affliction` |
| `src/characters.ts` | `barotrauma_gen_character` |
| `src/events.ts` | `barotrauma_gen_event` |
| `src/scripts.ts` | `barotrauma_gen_lua` / `barotrauma_gen_csharp` |
| `src/l10n.ts` | `barotrauma_scan_l10n` / `barotrauma_translate` |
| `src/validate.ts` | `barotrauma_validate`（含自带轻量 XML 结构检查器） |
| `src/pack.ts` | `barotrauma_pack`（自带最小 ZIP 写入器）/ `barotrauma_publish` |
| `src/icon.ts` | `barotrauma_gen_icon`（Pollinations 免 Key 生图） |

## 五、调研阶段的关键发现（来自 `refs/reference.md`，已抽样复核）

1. **不存在 `<Magazine>` 元素。** 1.13.4.0 原版 `Content` 与 `ACAWeaponsExpand` 里 `<Magazine` 命中均为 0。
   弹药 = `<ItemContainer>` + `<StatusEffect type="OnUse">` 里的 `<SpawnItem spawnposition="ThisInventory">`；
   武器侧 = `<RequiredItems items="tag" type="Contained">` + `<StatusEffect type="Contained"><Use />`。
   → 这直接决定了 `gen_item` 的武器/弹药模板结构。
2. **Lua 钩子是大写 `Hook.Add`**（不是 `hook.add`）。在 `Neurotrauma` 里实测 32 处命中。
   mod 根路径 = `table.pack(...)[1]`；`CLIENT` / `SERVER` / `Game.IsMultiplayer` 是全局。
3. **目录名 `Items/` / `Characters/` 等只是社区习惯**，引擎只认 `filelist.xml` 的 `file=`。
   真正硬编码的只有 `Lua/Autorun/`、`CSharp/{Shared,Client,Server}/`、`bin/<Client|Server>/<平台>/`。
4. **XML 元素/属性名大小写不敏感**（`<Randomevents>` 与 `<RandomEvents>`、`tags` 与 `Tags` 在真实 mod 里并存）。
   → 校验器一律大小写不敏感比较；但生成器统一输出一种写法，避免无意义 diff。
5. **2026 春季重构在新 API 上本机无样本**：LocalMods 里 `ModConfig.xml` 0 个、`ModUtils.*` 0 处、
   `IAssemblyPlugin` 0 处。唯一 C# 样本用旧 `ACsMod` 写法。
   → `gen_csharp` 默认 `style="legacy"`（本机可加载），`modern` 输出时明确标注**未实测**。
6. **`%ModDir%` = mod 根**，不是 XML 所在目录。
7. 预览图真名是 `PreviewImage.png`（3 个 mod 有），`preview.png` 是 0 个。

## 六、验证记录（本次会话）

| 验证项 | 方法 | 结果 |
|---|---|---|
| 编译 | `tsc -p tsconfig.json` | exit 0 |
| 工具齐全 | `TOOL_NAMES` 与实注册比对 | 15/15 一致 |
| 生成的 XML 良构 | Python `lxml.etree.parse` 逐文件解析 | 阶段二 4 个 + 端到端 7 个文件全部 OK |
| zip 完整性 | PowerShell `ZipFile::OpenRead` + `Expand-Archive` 实解压 | 10 个文件读出、CRC 校验通过 |
| 插件真实加载 | DSH 现场注入 `barotrauma_*` 工具 schema（工具列表出现 15 个新工具） | ✅ 已加载 |
| 真实工具跑真实数据 | `detect_env` / `validate` / `scan_l10n` 作用在真实 LocalMods 上 | 正常 |
| 端到端 | `.scratch/e2e` 走完 create→item→affliction→character→event→lua→csharp→scan→translate→validate→pack→publish | 全通 |

**校验器抓到的真实问题（对用户有直接价值）**

- `SmartPistol`（你已装的真实 mod）：2 个实体用 `name=""` 走本地化，但 `filelist.xml` 里**没有登记任何语言文件**
  → 游戏里这两个物品会直接显示原始键名。**这是该 mod 的真实缺陷。**
- 我自己写的验证 mod 里引用了 `Content/Items/Materials/SteelBar.png` —— **该文件在原版里不存在**，
  游戏里会没有贴图。这条错误最初被校验器漏掉了（`Content/` 引用未被收集），修好后成功抓出。

## 七、踩坑记录

1. **`plugin_manager install_bundle` 装本地路径包会超时**：pnpm 侧 775ms 就装完了（link 建立），
   但插件管理器随后「等 pnpm 输出」等了 600s 被终止，报 `application: failed` 并**回滚 package.json**，
   而 `node_modules` 里的软链**没回滚**。→ 改为手动安装（备份 + 改 package.json + pnpm install），成功。
2. **那次超时顺带让 pnpm 清理了 27 个"多余包"**（`Packages: -27`）。已确认 profile 未被破坏：
   `package.json` / `pnpm-lock.yaml` 未变、重新 `pnpm install --frozen-lockfile` 通过、
   9 个 bundle 的入口 import 全部解析正常（`minecraft-dev` 无根 export 属预期）。
   手动清掉了残留的 `node_modules/dsh-tool-barotrauma` 软链（用 `cmd /c rmdir`，只删链接不跟进目标）。
3. **删除目录软链**：`Remove-Item` 在非交互模式会因确认提示失败；`cmd /c rmdir <link>` 才是只删链接的安全做法，
   但执行前必须 `Get-Item` 核对 `LinkType` 与 `Target`。
4. **校验器的两个自误报**（已修）：
   - `CSharp/RunConfig.xml` 是硬编码文件名，不该要求登记进 filelist；
   - 输出到 XML 里的**注释**（如 affliction 图标占位说明）不能被当成真实资源引用。
5. **`collectAssetReferences` 最初只匹配 `%ModDir%/`**，导致新增的 `Content/` 原版资源检查是死代码
   —— 「写了检查」和「检查真的会跑」是两件事，必须用能触发失败的数据验证。

## 八、导出安装包（2026-10-10 追加）

需求：把插件导出成可分发 / 可重装的安装包，放到桌面。

**产物**

| 路径 | 说明 |
|---|---|
| `E:\Desktop\dsh-tool-barotrauma-0.1.0\` | 解压即用的完整目录（92 个文件，约 0.76 MB） |
| `E:\Desktop\dsh-tool-barotrauma-0.1.0.zip` | 同内容 zip（251.1 KB），用于归档与分发 |

**包结构**

```
dsh-tool-barotrauma-0.1.0/
├── install.ps1        一键安装/卸载脚本（-Profile / -Uninstall / -DryRun）
├── INSTALL.md         安装、卸载、手动安装、排障
├── 功能说明.md          15 个工具的完整功能文档
├── README.md          工程说明、构建、设计原则、已知边界
├── LICENSE            MIT（含原版资源版权说明）
├── package.json       包元数据；dsh.bundle.patch → cordis.patch.yml
├── cordis.patch.yml   把插件挂进 profile loader 根列表的补丁层
├── lib/               编译产物（DSH 实际加载的就是这里）
├── src/               TypeScript 源码（便于二次修改）
├── tools/             4 个测试脚本（smoke / planning / items / e2e）
└── docs/reference.md  施工参考：基于本机真实 mod 的字段级取证（1085 行）
```

**安装包验证（对成品包本身，不只是源码目录）**

| 验证项 | 结果 |
|---|---|
| 解压 | 92 个文件全部就位（逐项核对关键文件） |
| 包内 `install.ps1` 语法 | Windows PowerShell 5.1 解析通过 |
| 包内 `install.ps1 -DryRun` | exit 0，正确识别 profile / node / pnpm，输出待写入 JSON |
| `-Profile <不存在>` | exit 1，并列出可用 profile |
| `-Uninstall -DryRun` | 正确移除依赖与 bundles 条目 |
| 包内 `lib/` 载入 | 15/15 工具注册成功，声明与实注册完全一致 |
| 包内 `lib/` 实跑工具 | `barotrauma_detect_env` 返回 1.13.4.0 + 正确游戏目录 |

**新发现的坑（重要，已修）**

**Windows PowerShell 5.1 + UTF-8 无 BOM 的 `.ps1` 会语法错误。**
本机 DSH 的 `pwsh` 工具跑的实际是 **Windows PowerShell 5.1**（`$PSVersionTable.PSVersion = 5.1.19041.6456`，不是 PS7）。
PS 5.1 对无 BOM 的 `.ps1` 按系统 ANSI 代码页（这里是 GBK）解码，脚本里某个中文字符的 UTF-8 字节序列
恰好"吃掉"紧随其后的引号 → `The string is missing the terminator: '`，整个脚本无法执行。

修法：`install.ps1` 写成 **UTF-8 with BOM**（前 3 字节 `239,187,191`）。
- `write` 工具写的是无 BOM UTF-8，因此额外用
  `[System.IO.File]::WriteAllText($p, $text, (New-Object System.Text.UTF8Encoding $true))` 补 BOM。
- 验证方式：`[System.Management.Automation.Language.Parser]::ParseFile(...)` 检查语法错误集合。
- 教训：**凡是要被 PowerShell 执行的脚本，只要含非 ASCII 字符，就必须带 BOM**；
  文档类 `.md` 不执行，无 BOM 无影响。

**附带发现**

- 本机 `pwsh` 不在 PATH 上（`& pwsh` 报 CommandNotFound），"用 pwsh 跑一下"这个验证思路在本机行不通，
  要用 `powershell -File` 或直接在当前会话里调用。
- 当前会话执行策略会拦截直接 `& script.ps1`（`UnauthorizedAccess`），
  必须 `powershell -ExecutionPolicy Bypass -File ...`。这条已写进 INSTALL.md 排障节。

## 九、校验收到的误报反馈与修复（2026-10-10 追加）

试用者拿 `validate` 跑一个真实 mod，报「0 blocker / 2 major / 8 minor」，逐条核对后**两条 major 都是误报**。
反馈的三条我用**自建 fixture** 全部复现了（原 mod 不在本机），修完再用全量 LocalMods 做回归。

### 复现与修复对照

| 试用者的报告 | 根因 | 修法 |
|---|---|---|
| `ASSET_MISSING: Sounds/雪叶子` （文件其实存在） | 资源路径用 `[^"'\s]+` 正则抓，**遇到文件名里的空格就截断**（`雪叶子 - 天街桜.ogg` → `雪叶子`） | 改为解析**属性值**、按「下一个 `%ModDir%/` 或 `Content/` 起点」划界，不再依赖空白 |
| `XML_NOT_REGISTERED: names.xml / Ragdolls/未央.xml / 5 个 Animations/*.xml` | 这些是 `<names path=…>`、`<ragdolls folder=…>`、`<animations folder=…>` **按路径/目录加载**的，本就不进 filelist；另有 `<ragdolls />`（**无 folder 属性**，引擎读 XML 旁边的同名目录）这种隐式约定 | 新增约定路径识别：`folder=` / `path=` 属性解析 + `Ragdolls`/`Animations`/`Names` 固定目录名 |
| `L10N_MISSING: 缺 89 键`（多数其实存在） | 语言文件**只按 filelist 的 `<Text>` 识别**，而真实 mod 也用 `<Other>` 注册语言文件（Neurotrauma 的德语就是）→ 整个文件被漏读，它的键全被算成缺失。另外键名比较区分大小写 | 改为**按内容识别**（根元素 `<infotexts>` 即为语言文件）+ 键名统一小写比较 |
| `WY_YE` / `WY_ys` 是真缺口 | 实体**压根没有 `name` 属性**，游戏退回显示 identifier | 新增 `L10N_NAME_IMPLICIT`（minor）；且只在语言文件里**也没有该键**时才报 |
| `Config.xml` 不进 filelist 是正常的 | 硬编码文件名 | `NO_REGISTRATION_NEEDED` 覆盖 `RunConfig.xml` / `ModConfig.xml` / `Config/` |

### 试用者表格里「缺失的能力」也补上了

- **`<Conditional>` 语义**（照引擎实测写法）：关系运算符词表来自本机真实教程文档，
  并按真实 mod 补上 `ge`/`le`/`g`/`l` 缩写；`comparison` / `conditionalcomparison` 只认 `and`/`or`
  （大小写不敏感，250 处实测全是这两个值）。运算符拼错是**静默失效**类错误，按 major 报。
- **文本结构**：语言文件的重复键与空文本检查，**聚合成一条**而不是逐条刷屏。

### 全量回归（34 个目录 / 32 个内容包）

| 检查项 | 修复前 | 修复后 | 说明 |
|---|---|---|---|
| `ASSET_MISSING` | 185 | **16** | 其余转为 `ASSET_CROSS_MOD`（21）或消失 |
| `DUPLICATE_IDENTIFIER` | 152 | **11** | 新增「物品装配实例（`ID=`/`rect=`）不算重复定义」 |
| `XML_NOT_REGISTERED` | 80 | **12** | 改为聚合；限定只对会被加载的文件做下游检查 |
| `CONDITIONAL_UNKNOWN_OPERATOR` | 66 | **0** | 补 `ge`/`le` + 排除 `tag: value` 形式 |
| `VANILLA_ASSET_MISSING` | 44 | **5** | 排除带 `[GENDER]` 之类占位符的路径 |

### 又挖出来的两个真实语义

1. **只检查会被加载的文件。** 没登记进 filelist 的 XML 引擎根本不读，对它的贴图/identifier/条件做检查全是噪音
   （`ACAWeaponsExpand` 的 `Afflictions/Raptor*.xml` 既没登记又引用了不存在的贴图 → 原来刷出几十条下游问题）。
2. **跨 mod 资源引用是合法的。** `ACA_NonHumanRaces_Extend` 的
   `<huskappendage path="%ModDir%/Afflictions/Raptor*.xml">` 指向的是**隔壁 ACAWeaponsExpand** 的文件。
   现在会去兄弟 mod 目录找一遍，找到就报 `ASSET_CROSS_MOD`（minor，附上那个 mod 的名字），找不到才报 major。

### 核实过、确认是**真问题**的（不是误报）

- `XCOM2Armor`：磁盘上只有**蓝色**贴图，XML 却引用了**绿色/白色**版本 → 那两套配色真的没有贴图（8 条 major）。
- `SmartPistol`：2 个物品 `name=""` 却没有任何语言文件 → 游戏里显示原始键名。

### 教训

「写了检查」和「检查真的会跑」是两件事：`Content/` 资源检查一度是死代码（收集函数只匹配 `%ModDir%/`），
「空格截断」也是先复现才定位到。**每一条修正都用能触发失败的数据验证过**，不靠读代码推断。

## 十、卸载旧版 / 安装新版时挖出的部署级坑（2026-10-10 追加）

需求：把已装的（link 到源码目录的）旧版卸掉，改装桌面上修正后的 0.1.1。

### 卸载

改用桌面 0.1.1 包里的 `install.ps1 -Uninstall`：正确移除了 `package.json` 的依赖与 `bundles` 条目，
并备份了 `package.json` / `pnpm-lock.yaml`。

**但暴露出 install.ps1 的一处缺陷**：卸载后 `node_modules\dsh-tool-barotrauma` 软链**残留**，
而脚本最后还打印"软链已建立"（那段确认逻辑只考虑了安装方向）。
- 根因：**pnpm 不会清理不是它自己建立的链接**（与之前 `plugin_manager` 超时后残留软链是同一现象）。
- 修法：卸载分支里主动 `cmd /c rmdir` 清掉链接（只删链接不跟进目标），并把确认文案按安装/卸载分开。

### 安装到桌面包目录 → 加载失败

装完 `link:E:/Desktop/dsh-tool-barotrauma-0.1.1` 后，从 profile 目录按包名 `import` 直接报：

```
ERR_MODULE_NOT_FOUND: Cannot find package '@deepseek-ai/dsh-tools'
  imported from E:\Desktop\dsh-tool-barotrauma-0.1.1\lib\env.js
```

**根因（重要）**：**Node 解析软链用的是真实路径**（`preserveSymlinks=false`）。
装成 `link:` 之后，模块解析从**插件目录的真实路径**向上逐层找 `node_modules`，
根本不会经过 profile 的 `node_modules`。

之前一直"能用"是**巧合**：link 指向的源码目录 `E:\Desktop\001\dsh-tool-barotrauma`
里恰好有 `node_modules\@deepseek-ai`（我 `pnpm install` typescript 时 pnpm 顺带自动装了 peers）。
换成干净的发布包目录后，这个巧合就消失了。

**修法**：让 install.ps1 保证插件目录能解析 `@deepseek-ai` ——
发现 `$PluginDir\node_modules\@deepseek-ai` 不存在时，把它 junction 到
`$ProfilePath\node_modules\@deepseek-ai` 或 `$ProfilePath\..\node_modules\@deepseek-ai`
（本机实际在后者的位置：`profiles\node_modules\@deepseek-ai`）。
测试方式：**故意删掉 junction 模拟全新解压的包**，再跑脚本，确认它自己重建成功。

这条已写进 `INSTALL.md`，并附了手动安装时的补救命令。

### 最终验证（对**已安装的那一份**，不是源码目录）

| 验证项 | 结果 |
|---|---|
| 依赖 | `dsh-tool-barotrauma = link:E:/Desktop/dsh-tool-barotrauma-0.1.1` |
| 软链 | `SymbolicLink → E:\Desktop\dsh-tool-barotrauma-0.1.1` |
| 从 profile 目录按包名 import | 成功；`req.resolve` 指向 `...\dsh-tool-barotrauma-0.1.1\lib\index.js` |
| 版本 | 0.1.1 |
| 工具注册 | 15/15 |
| `validate` 跑 fixture | blocker 0 / major 2 / minor 1（只剩故意埋的真问题） |
| `detect_env` 实跑 | 游戏 1.13.4.0 @ 正确路径 |

### 教训

打包/部署类工作里，「本地开发目录能跑」和「发布后的产物能跑」是两件事 ——
前者的成功可能来自开发目录里偶然存在的文件。**必须对"解压出来的干净副本"做验证**，
而我这次是先对干净副本验证过 lib 载入（用 junction 临时补依赖）却漏了 `link:` 的真实路径语义。

## 最后：日志双版本规范（固定附录）

1. 一个事实只写一处：本文件写"过程与原因"；`_PROJECT_工作档.md` 只写"终态事实"。
2. 收尾顺序：先追加本文件章节，再刷新工作档终态小节。

## 十一、0.2.0：依据官方文档与合作者工具完善（2026-10-10 追加）

用户给了三份材料：合作者的「渊深 XML 翻译工具」（zip）、官方仓库 URL、官方 modding 文档站。

### 调研（两个 subagent 并行）

- 合作者工具分析 → `refs/translator-tool-analysis.md`
- 官方文档逐条摘录 + 与插件实现的差异清单 → `refs/barodoc-reference.md`

关键结论：
1. 合作者工具**不是机器翻译**，是纯离线词典替换（元素名 112 / 属性名 517 / 枚举值 352），**从不读取元素文本**，所以它不产生玩家可见本地化；与插件"绝不编造译文"的原则不冲突，其价值是**中英名称对照**。
2. 它有三个实测缺陷：`VAL_ATTRS` 白名单定义了却没用（污染自由文本：`identifier="Right"`→`right`、`name="… Right Hand"`→`"… 右 手"`）、`pretty_print=True` 重排整份文件、带 BOM 输入崩溃。
3. 官方文档补上了我一直靠反推的规则：**45 个内容类型全表**、Conditional 运算符全表、filelist 属性、Override 语义、撞 identifier 会**禁用整个 mod**。

### 实现

- 新增 `src/vocabulary.ts`（112KB，词典，生成文件）+ `src/known-names.ts`（408KB，原版名称全集，生成文件）
- 新增 `src/names.ts`：**按长度分桶**的名称索引 + 有界编辑距离（不分桶会被上万个名称拖死）
- 新增 `src/convert.ts`：`barotrauma_convert_names`（格式保真的名称互转）
- `src/validate.ts`：新增 4 项检查 + 6 处规则修正（见 `功能说明.md` 第 7 节）
- `src/events.ts`：`EventSet` 默认 `additive="true"`
- `src/l10n.ts`：补 `descriptionidentifier` / `TranslationOverride` / `Affliction*` 变体

### 踩坑（本轮全是"自己写的检查有 bug"）

1. **`*/` 出现在块注释里**：生成 `known-names.ts` 时文档注释写了 `Content/**/*.xml`，`*/` 提前闭合注释 → 整个文件语法错误。改为不写该串。
2. **拼写检测基准选错**：先用 517 条社区词表当基准 → 全量刷出 **1655 条**属性误报（原版实际有 2918 个属性名）。改用原版全集后降到 238 条，仍偏噪 → 最终**默认关闭**，改为 `checkTypos` 可选。
3. **`convert.ts` 的扫描器假设 ASCII**：`zh-to-en` 方向源文件名是汉字，`[A-Za-z_][\w.:-]*` 一个都匹配不到 → 零替换。改成"排除分隔符"的字符集。实测双向对称（58 标签/190 属性/27 枚举值），行数 72→72→72 不变，回译忽略大小写后与原文一致。
4. **`DUPLICATE_IDENTIFIER` 连续三次误报**：
   - 第一次 11 条：`<override>` 造成的合法覆盖被当成撞车 → 按"非 override 定义"统计
   - 第二次仍剩 `idcard`×11（同一文件）：是 NPC 库存引用，只因为带了 `tags=` 被我的"定义判定"误认 → 收紧为只认 `name`/`category`/`maxstacksize`
   - 第三次剩余 2 条：文件根是 `<Items>`、里面**内嵌** `<Override>` 区块（override 有两种写法），我只检查了根元素 → 改为按字符位置判定覆盖区间
   - 最终全量 32 个内容包 `DUPLICATE_IDENTIFIER` = **0**
5. **`XML_DUPLICATE_ATTRIBUTE` 措辞要分情况**：`Texture` 与 `texture` 严格 XML 允许（大小写敏感），但游戏侧名称不敏感≈重复 → 仅大小写不同时降为 major 并改措辞。

### 验证

| 项 | 结果 |
|---|---|
| `tsc` | exit 0 |
| 全量 LocalMods（32 个内容包） | 26.5 秒跑完，**blocker 误报 0** |
| 官方 45 内容类型校验 | 对 49 个真实 filelist 零误报（说明类型表正确） |
| `XML_DUPLICATE_ATTRIBUTE` 17 条 | 抽查源文件确认真实（`<sprite>` 里 `Texture` 两次、`<Character>` 里 `Speciestranslationoverride` 两次） |
| `convert_names` 往返 | 双向对称；格式未重排；回译忽略大小写等于原文 |
| `reload`/安装 | 通过 `tools/update-installed.ps1` 重装进 profile |
## 十二、0.3.0：把官方子页全面落实（2026-10-10 追加）

用户确认后，继续读官方文档的其余子页，并据此完善插件。

### 抓取（4 个 subagent 并行）

| 批次 | 内容 | 结果 |
|---|---|---|
| 1 / 2 / 3 | `ItemComponents/*` 共 **85 页** | 全 200，0 失败；共约 609 条属性；产出 `refs/itemcomponents-part{1,2,3}.json` + `.md` |
| 4 | 剩余 Misc/Intro 页 | 27 页全 200；**新发现 14 个 `/EventActions/*.html`**；产出 `refs/barodoc-remaining.md`（含 5 张机读清单） |

我自己另外亲自抓了 6 页做交叉验证（上一轮只依赖 subagent 摘录，用户问起后才补）：ContentTypes / Conditional / ContentPackages / Troubleshooting / Overrides / Item —— 逐条与实现对上。

### 关键新发现

1. **官方文档比游戏旧**：文档标注 v0.17.12.0，本机游戏 1.13.4.0。先后加过新值 ——
   `StatusEffect type` 有 `OnDeconstructed`/`OnDeconstructing`/`OnInserted`/`OnRemoved`，
   `Item category` 有 `Hidden`/`Thalamus`/`Projectile`/`Legacy`，**文档名单全都没有**。
   → 枚举校验必须用「**游戏自身数据 ∪ 文档**」的并集。
2. **ItemComponents 的属性表不可当校验基准**：文档表用 PascalCase 而 XML 实例用小写；
   表本身不完整（示例里用了表里没有的属性，如 RangedWeapon 的 `combatPriority`/`drawhudwhenequipped`）。
   → 它的价值在**模板校核**，不在校验。
3. 官方给了一批**封闭枚举**：StatusEffect type/target、StatTypes 82、AbilityFlags 13、EventAction 61、Item category。

### 实现

- 新增 `src/schemas.ts`（生成文件，9.5 KB）：枚举并集 + lower 集合 + 85 个组件元素名
- `src/validate.ts` 新增 `checkClosedEnums`（**始终开启**）：
  `STATUSEFFECT_BAD_TYPE` / `STATUSEFFECT_BAD_TARGET`（major）、`ITEM_BAD_CATEGORY`（minor）
- `src/validate.ts` 的 `checkXmlNames` 大幅收窄（见下）
- `src/events.ts`：`additive` 注释修正（文档语义是"额外再抽一次"，不是替换）、
  新增 `chooseRandom`（chooserandom=false 时不再写 commonness）与 `ignoreCooldown`（默认 false）参数

### 踩坑（本轮 4 个，全是"我的检查又误报"）

1. **语言文件被当成内容 XML 检查**：`<afflictionname.rinternaldamage>文本</afflictionname.rinternaldamage>`
   在语言文件里是**本地化键**，我的元素名检查把它当元素 → 大量误报。修：语言文件跳过拼写检查。
2. **`<conditional>` 的属性名是自由命名**：`oxygenlow="gt 15"` 被判成 `OxygenFlow` 的拼错。
   官方 Conditional 页明文：那里的属性名是「目标对象属性 / affliction 标识符」。修：跳过。
3. **`tags` 的值是自由标签**（官方 Item 页原文），不该按枚举核对。修：跳过。
4. **属性名基准用了 ≥2 次阈值**，导致 `skincolors` 这类稀有但真实的属性被判"未知"。修：放宽到 ≥1。
   —— 拼写检测误报因此从 **949 降到 149**（32 个 mod），且仍抓到真拼错（`ddescription`、`preasure`）。
5. **封闭枚举用了过时的文档名单**：并集前 `STATUSEFFECT_BAD_TYPE` 30 条 + `ITEM_BAD_CATEGORY` 20 条误报；
   并集后降到 **0 + 2**（那 2 条是 minor 的 mod 自造分类）。

### 验证

| 项 | 结果 |
|---|---|
| `tsc` | exit 0 |
| 端到端（建包→物品→角色→事件→Lua→C#→本地化→校验→打包→发布） | 全通 |
| 全量 LocalMods 回归（32 个内容包） | blocker 0 误报；`STATUSEFFECT_BAD_TYPE` 0；`ITEM_BAD_CATEGORY` 2（minor） |
| 拼写检测（opt-in） | 149 条，含 2 条已核实的真拼错 |
| 安装 | 0.3.0 已装进 desktop profile（真实目录形态），16 个工具 |
## 十三、0.4.0：物品组件库落地（2026-10-10 追加）

### 数据

`refs/itemcomponents-part{1,2,3}.json`（subagent 抓的 85 页 / 609 条属性）→ 生成 `src/components.ts`（124 KB）。

### 实现

- 新工具 `barotrauma_describe_component`（第 17 个）：按组件名或关键词查属性表
- 新脚本 `tools/audit-templates.mjs`：把 `gen_item` 产物里的组件属性对照官方表
- `validate.ts` 新检查 `ITEM_COMPONENT_TYPO`（opt-in，随 `checkTypos`）
- `characters.ts`：`<targetpriority>` → `<target>`；补 6 个根属性
- `items.ts`：`gen_affliction` 的 `healableInMedicalClinic` 参数化、effects 示例去重叠、描述去过度承诺

### 校核发现（重要）

模板校核脚本跑出来的结论，与 subagent 的警告一致：**官方组件属性表不完整**。

| 生成器在用的属性 | 文档表里有吗 | 原版 XML 里有吗 |
|---|---|---|
| `Holdable.slots` / `msg` / `handle1` | ❌ 无 | ✅ 有 |
| `RangedWeapon.combatPriority` / `drawhudwhenequipped` | ❌ 无 | ✅ 有 |
| `ItemContainer.canBeSelected` | ❌ 无 | ✅ 有 |
| `MeleeWeapon.canBeCombined` / `slots` / `aimpos` 等 | ❌ 无 | ✅ 有（原版绷带就这么写） |

→ 所以组件表只做**查询/扩模板参考**，不做"未收录即错误"的校验。
这也是我坚持"校核脚本 + 人工判断"而不是直接拿文档当真理的原因。

### 精度设计：组件名检查怎么做到零误报

朴素做法（85 个组件名做近似匹配）会误伤 `<Sprite>`、`<Body>`、`<Price>` 这类正常元素。
解法是把**原版全部真实元素名**（`known-names.ts`，11635 个）先排除：
只有"**既不是已知元素名、又离官方组件名只差 1 个字符**"才报。
实测 32 个真实 mod 零误报，造 `<Holable>` 能精确报成 `<Holdable>`。

### 验证

| 项 | 结果 |
|---|---|
| `tsc` | exit 0 |
| 工具数 | 17，`TOOL_NAMES` 与实注册一致 |
| `describe_component` | `<Wearable>` 查到 1 条属性；`search:"penetration"` 命中 RangedWeapon |
| 端到端 | 全通（blocker 0 / major 4 / minor 0） |
| 全量 32 个 mod | `ITEM_COMPONENT_TYPO` 零误报 |
| 造假拼错探针 | `<Holable>` ✅ 命中；`spraed` ✅ 命中 |
| 安装 | 0.4.0 装进 desktop profile |