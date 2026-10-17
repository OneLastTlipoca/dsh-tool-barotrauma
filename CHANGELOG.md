# 更新日志

版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)，格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

---

## [0.4.0] — 2026-10-17

首个公开发布。**17 个工具**覆盖潜渊症 mod 的完整制作流程，零外部服务依赖。

### 新增

**探测与规划（3）**
- `barotrauma_detect_env` — 探测游戏目录、版本、Steam 库分布、LuaCsForBarotrauma 是否安装、LocalMods 已装 mod 清单
- `barotrauma_plan` — 生成制作方案（标识符前缀、要生成的文件、里程碑、风险清单）
- `barotrauma_create_mod` — 创建内容包骨架（filelist、物品/事件 XML、本地化、Lua/C# 入口、RunConfig）

**内容 XML（4）**
- `barotrauma_gen_item` — 物品生成，6 种：远程武器（自动配套弹药与弹丸）、近战武器、弹药、消耗品、穿戴装备、材料
- `barotrauma_gen_affliction` — 状态效果定义
- `barotrauma_gen_character` — 角色/怪物定义
- `barotrauma_gen_event` — 随机事件三件套（EventSprites / ScriptedEvent / EventSet）

**脚本（2）**
- `barotrauma_gen_lua` — LuaCsForBarotrauma 的 `Hook.Add` 钩子骨架
- `barotrauma_gen_csharp` — `ACsMod` 内存脚本骨架（含 CSharp/RunConfig.xml）

**本地化（2）**
- `barotrauma_scan_l10n` — 声明式识别需要本地化的条目并报告缺哪些语言
- `barotrauma_translate` — 只写**调用方提供的译文**；绝不自动编造；已有键不覆盖

**校验与发布（6）**
- `barotrauma_validate` — 内容包校验（详见下节）
- `barotrauma_convert_names` — 元素名/属性名/枚举值的中英互转（格式保真）
- `barotrauma_describe_component` — 查询 85 个物品组件的官方属性表（609 条）
- `barotrauma_gen_icon` — 生成物品图标 / 事件插图
- `barotrauma_pack` — 打包成可分发 zip（自带 store 模式写入器，不依赖外部压缩工具）
- `barotrauma_publish` — 生成创意工坊发布文案与检查清单（上传统计须在游戏内完成）

### 校验器覆盖

| 检查族 | 代码 | 级别 | 依据 |
|---|---|---|---|
| filelist 与实际文件一致性 | `XML_NOT_REGISTERED` | major | 实测 |
| filelist 子元素名是否为官方内容类型 | `FILELIST_UNKNOWN_TYPE` | **blocker** | 官方 ContentPackages·File list |
| identifier 重复 | `DUPLICATE_IDENTIFIER` | **blocker** | 官方 Troubleshooting：会**禁用整个 mod** |
| 属性重复 / 多根元素 / 引号不成对 / 标签不配对 | `XML_DUPLICATE_ATTRIBUTE` 等 | blocker~major | 官方 XML 页硬约束 |
| 贴图音效引用缺失（含 `Content/` 原版） | `ASSET_MISSING` / `VANILLA_ASSET_MISSING` / `ASSET_CROSS_MOD` | major | 实测 |
| 本地化缺口 | `L10N_MISSING` / `L10N_EMPTY` / `L10N_DUPLICATE_KEY` | major~minor | 官方 Item / Character / Afflictions / Text 页 |
| `<conditional>` 运算符 | `CONDITIONAL_UNKNOWN_OPERATOR` | major | 官方 Conditional 页全表 |
| StatusEffect 的 type / target | `STATUSEFFECT_BAD_TYPE` / `STATUSEEFFECT_BAD_TARGET` | major | 官方闭集（游戏实测 ∪ 文档） |
| Item 的 category | `ITEM_BAD_CATEGORY` | minor | 同上 |
| 弹药与容器配套 | `AMMO_CONTAINER_MISSING` | major | 实测 |
| 组件名拼写 | `ITEM_COMPONENT_TYPO` | major | 官方 85 个组件名 |
| 属性名 / 枚举值拼写（可选） | `SUSPECT_TYPO_ATTRIBUTE` / `SUSPECT_TYPO_VALUE` | major~minor | 原版名称全集（`checkTypos=true` 时启用） |

### 数据文件

`src/` 下 4 个**生成文件**（已入库，保证 clone 后可直接编译）：

| 文件 | 规模 | 来源 |
|---|---|---|
| `vocabulary.ts` | 元素名 112 / 属性名 517 / 枚举值 352 | 合作者「渊深 XML 翻译工具」的内置词表 |
| `known-names.ts` | 元素名 11,635 / 属性名 3,327 / 枚举值 1,600 | 本机安装的游戏 `Content` 目录 617 个 XML 抽取 |
| `schemas.ts` | StatusEffect type 29 / target 12、Item category 17、StatTypes 82、AbilityFlags 13、EventAction 61 | 游戏实测 ∪ 官方 BaroModDoc |
| `components.ts` | 85 个物品组件 / 609 条属性 | 官方 BaroModDoc 的 `ItemComponents/*` 85 页 |

### 验证情况

- `tsc` 编译零错误；端到端 10 步流程全通（建包 → 物品 → 状态 → 角色 → 事件 → Lua → C# → 本地化 → 校验 → 打包 → 发布）
- 本机 34 个目录 / 32 个真实内容包全量回归：**blocker 级误报 0**
- 校验器误报率校准过程（真实 mod 语料）：

  | 检查 | 校准前 | 校准后 |
  |---|---|---|
  | `ASSET_MISSING` | 185 | 16 |
  | `DUPLICATE_IDENTIFIER` | 152 | 0 |
  | `XML_NOT_REGISTERED` | 80 | 12 |
  | `CONDITIONAL_UNKNOWN_OPERATOR` | 66 | 0 |
  | `VANILLA_ASSET_MISSING` | 44 | 5（21 条改判为 `ASSET_CROSS_MOD`） |

- 名称互转往返对称：58 标签 / 190 属性 / 27 枚举值，**行数 72→72→72 不变**，回译后忽略大小写等于原文
- 在真实 mod 中核实的问题：`XML_DUPLICATE_ATTRIBUTE` 17 条（抽源文件确认）、`AMMO_CONTAINER_MISSING` 1 条

### 已知边界

- **C# modern 写法（`IAssemblyPlugin`）未实测**；`legacy`（`ACsMod`）已在 LuaCsForBarotrauma 1.0.109 上验证可加载
- 物品组件的属性表**尚未接进生成器**（数据已就位）
- 拼写检测默认关闭：基准虽为原版全集，但大量 mod 自有属性与某个原版名只差 1–2 字符，噪声偏大
- 官方组件属性表**不完整**（原版 XML 有用到而表里没列的字段），因此 `describe_component` 只作查询参考，不作"未收录即非法"的判据
- 官方文档标注 v0.17.12.0，比当前游戏版本旧；相关枚举一律取「游戏实测 ∪ 文档」并集
- 官方引擎仓库（`github.com/FakeFishGames/Barotrauma`）未能直接取用，凡只有源码能定性的结论均标注为推断

### 备注

- 项目目录由 `_barotrauma_tool` 更名为 `dsh-tool-barotrauma`
- 公开仓库不收录 `refs/`（第三方派生资料：合作者工具分析、官方文档整段摘录），该目录仅随分发包提供
- `lib/` 不入库，克隆后需 `pnpm install && pnpm build`

---

## [0.3.0] — 2026-10-17

- 新增 `barotrauma_convert_names`（16 个工具）：元素名/属性名/枚举值中英互转，格式保真、值映射受白名单约束、绝不覆盖原文件
- 校验器新增官方封闭枚举检查（`STATUSEFFECT_BAD_TYPE` / `STATUSEEFFECT_BAD_TARGET` / `ITEM_BAD_CATEGORY`）
- 校验器新增 `FILELIST_UNKNOWN_TYPE`（官方 45 种内容类型）、`XML_DUPLICATE_ATTRIBUTE`、`XML_MULTIPLE_ROOTS`
- `DUPLICATE_IDENTIFIER` 由 major 升为 **blocker**，并修正说明（撞 identifier 会禁用整个 mod）
- `<Conditional>` 运算符按官方表修正（移除文档没有、本机也无实例的 `l`/`le`/`g`；保留原版在用的 `ge`）
- 弹药检查同时认单数 `<RequiredItem>`
- 本地化识别补 `descriptionidentifier`、`TranslationOverride`、`Affliction*` 变体
- `Config/`、`Assets/` 改为**仅在存在 `ModConfig.xml` 时**豁免 filelist 登记
- 识别跨 mod 路径 `%ModDir:[MOD NAME]%`
- 事件 `EventSet` 默认 `additive="true"`；新增 `chooseRandom` / `ignoreCooldown` 参数

## [0.2.0] — 2026-10-17

- 修复三类误报：文件名含空格被截断、`folder=`/`path=` 按目录加载的 XML 被判漏登记、`<override>` 与语言键被当成内容条目
- 校验器只在**实际加载**的文件上检查
- 新增 `barotrauma_convert_names` 的数据基础（中英词表）

## [0.1.1] — 2026-10-10

- 首个可用版本：15 个工具，Lua/C# 脚手架、本地化、校验、打包发布
