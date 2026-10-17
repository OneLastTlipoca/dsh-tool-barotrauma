# BaroModDoc 官方文档权威参考 + 与 `dsh-tool-barotrauma` 实现逐条对照

> **用途**：把潜渊症官方 modding 文档站（BaroModDoc，`https://regalis11.github.io/BaroModDoc/`）的关键内容摘成权威参考，并逐条对比
> `_barotrauma_tool` 插件的现有规则（`src/validate.ts`、`src/l10n.ts`、`src/xml.ts`，必要时含 `src/util.ts` / `src/events.ts` / `src/items.ts` / `src/characters.ts`）。
>
> **游戏版本**：1.13.4.0（Summer Update 2026 Hotfix 1）。**本机 LocalMods**：49 个真实 mod。
> **抓取方式**：`web_fetch` 逐页取，全部 HTTP 200。
> **抓取到的页（15/15，无 404）**：
> `/Intro/XML.html`、`/Intro/ContentPackages.html`、`/Intro/ContentTypes.html`、`/Intro/Overrides.html`、
> `/Misc/StatusEffect.html`、`/Misc/Conditional.html`、`/Misc/ScriptedEvents.html`、`/Misc/StatTypes.html`、
> `/Misc/RelatedItem.html`、`/Misc/Attack.html`、`/Misc/Explosion.html`、`/Misc/Troubleshooting.html`、
> `/Misc/Performance.html`、`/Intro/Publishing.html`、`/Editors/SubmarineEditor.html`。
> **额外抓取（任务未列但直接支撑第 B 节）**：`/ContentTypes/Item.html`、`/ContentTypes/Character.html`、
> `/ContentTypes/Afflictions.html`、`/ContentTypes/Text.html`、`/ContentTypes/Other.html`、`/ContentTypes/RandomEvents.html`。
>
> **取不到的来源（明确标注）**：引擎源码（`raw.githubusercontent.com`、`github.com`、`cdn.jsdelivr.net`）被本会话的抓取策略拒绝
> （报错 `resolves to a non-public IP address`）。因此凡「文档没写、只有引擎源码能定性」的问题，本文只用 **文档 + 本机磁盘证据** 作答，并明确标注「引擎源码未核对」。
>
> **纪律**：每条都标来源 URL + 小节名。文档没写的写「**文档未覆盖**」，不脑补。凡用本机文件补证的，单独标「本机证据」，与文档结论分开。

---

## A. 逐页要点

### A.1 `/Intro/XML.html` —「XML」（+「Barotrauma-specific notes」）

**机制**：Barotrauma 的内容基本都用 XML 描述。元素 = 开闭标签；元素可有属性；元素可有子元素；
无子元素时可用 `/>` 自闭合；可用 `<?xml version="1.0" encoding="utf-8"?>` 声明编码；`<!-- -->` 注释被忽略。

**硬约束（原文 "Barotrauma-specific notes"，原文照抄要点）**：
- **只能有一个根元素**（不含编码声明）："There may be only one root element… All subsequent elements must be children of this element… the files shouldn't have multiple elements on the first level"。
- **同一元素内所有属性必须唯一**："All the attributes of an element must be unique."
- 路径变量 `%ModDir%`：**"the game will interpret the string `%ModDir%` as the directory your mod is contained in"**，用于让 mod 能被移到任意目录（创意工坊/服务器下载）。
- **引用了第二个路径变量**：`%ModDir:[MOD NAME]%` —— "To reference files in other mods, you may use strings of the form `%ModDir:[MOD NAME]%`, where `[MOD NAME]` is replaced with the other mod."

**常见坑**：多根元素、重复属性名是**文档明令禁止**的写法；`Content/...`（原版引用）在本页**没写**（本页只讲 `%ModDir%` 与 `%ModDir:[NAME]%`）。

---

### A.2 `/Intro/ContentPackages.html` —「Content packages」「File list」「Core packages」

**机制**：内容包（content package）是一堆 XML + 贴图/音效。游戏默认只有一个内容包 "Vanilla"，其它都算 mod。
mod 必须放在 `LocalMods` 目录下的文件夹里。

**filelist（"File list" 小节）**：
- "For any given mod, its filename will always be `filelist.xml`."
- 根元素的属性**全表**（原文逐条）：
  | 属性 | 原文含义 |
  |---|---|
  | `name` | "The name for this content package that is seen by players in-game." |
  | `modversion` | "The version number of the mod… Currently, this is simply a hint for modders…" |
  | `gameversion` | "The version number that this mod was last updated for. This may be used by the game to detect mods that need to be modified for backwards compatibility." |
  | `corepackage` | "Whether or not the content package is a 'core' package" |
- **子元素规则（关键）**："This root element then has a child element for each **content XML file** that needs to be loaded. The name of each of these child elements **must be one of the content types** listed in the Content Types page."
- 官方示例：
  ```xml
  <contentpackage name="Alien Wrench" modversion="1.0.0" gameversion="0.17.8.0" corepackage="false">
      <Item file="%ModDir%/alienwrench.xml" />
  </contentpackage>
  ```

**Core packages 小节**：core 包必须自带全部运行所需文件（不是"叠在别的包上"），**同时只能启用一个 core 包**。
"Typically this is not what you want to use, as overrides are usually sufficient and core mods are likely to break as we make updates".
→ 文档**未**提 `steamworkshopid` / `installtime` / `expectedhash` / `hidden` / `submarines`（这些属性文档未覆盖）。

---

### A.3 `/Intro/ContentTypes.html` —「Content types」

**机制**：这是 filelist 子元素名（= 内容类型）的**权威清单**。原文注明 "As of v0.17.12.0, the game supports the following content types"。
分组也来自原文：

- **用编辑器创建/编辑的**：`Submarine`、`BeaconStation`、`EnemySubmarine`、`Outpost`、`OutpostModule`、`Wreck`（原文链到 Submarine editor）
- **半自动生成文档的**：`Item`、`Character`、`Afflictions`
- **全自动生成文档的**（本节清单即权威元素名）：`BackgroundCreaturePrefabs`、`BallastFlora`、`CaveGenerationParameters`、`Corpses`、`Decals`、
  `EventManagerSettings`、`Factions`、`ItemAssembly`、`Jobs`、`LevelGenerationParameters`、`LevelObjectPrefabs`、`LocationTypes`、
  `MapGenerationParameters`、`Missions`、`NPCConversations`、`NPCPersonalityTraits`、`NPCSets`、`Orders`、`OutpostConfig`、`Particles`、
  `RandomEvents`、`RuinConfig`、`ServerExecutable`、`SkillSettings`、`Sounds`、`StartItems`、`Structure`、`Talents`、`TalentTrees`、
  `Text`、`TraitorMissions`、`Tutorials`、`UIStyle`、`UpgradeModules`、`WreckAIConfig`、`Other`

→ 合计 **45** 个（6 + 3 + 36）。**注意**：**文档未覆盖** `Ragdolls` / `Animations` / `Names` / `Lua` / `CSharp` 这类"目录约定"内容类型 —— 它们不在这个清单里。

**常见坑**：清单里**没有** `LevelObjectPrefab` 之类的单数写法；**没有** `ModConfig`；`Other` 是官方兜底类型（见 A.16）。

---

### A.4 `/Intro/Overrides.html` —「Overrides」

**机制**：用 `override` 元素替换原版（或别的 mod）的部分内容。
- **按 identifier 匹配**（原文）："For items, overriding is based on identifiers, meaning that the identifier of the new item must match the identifier of the old item. **This is also true of most other content types.**"
- 官方示例用大写 `<Override>` 包裹若干 `<Item identifier="harpoongun" …>`。
- **覆盖时必须重写全部子元素/tags**（原文）："In order to get the new item to function like the vanilla counterpart, **make sure to include all the tags and child elements of the original item.**"
- **可以覆盖另一个 mod 的物品**（原文 + 示例 `alienwrench`）。

**关于本地化**：**本页对"覆盖原版内容后是否要重新提供本地化键"完全没写 → 文档未覆盖**。
（唯一相关的间接线索在 `/ContentTypes/Item.html` 的 `identifier` 条目，见 A.13 与 B.4。）

**常见坑**：不加 `<override>` 而同 identifier 重定义 → 见 A.12 Troubleshooting 的报错原文（模组会被禁用）。

---

### A.5 `/Misc/StatusEffect.html` —「StatusEffect」

**机制**：StatusEffect 在特定时机执行效果（改实体属性、生成物件、播声音、喷粒子、点火、爆炸、加技能……）。
两个术语：**执行者 entity**、**Type（何时执行）**、**target（作用于谁）**。

**ActionType 全表（原文照抄）**：
| 值 | 含义（原文摘要） |
|---|---|
| `Always` | Executes every frame regardless of the state of the entity. |
| `OnPicked` | 拾取时（仅物品） |
| `OnUse` | 使用时（仅物品） |
| `OnSecondaryUse` | 按住瞄准键时（仅物品） |
| `OnWearing` | 穿戴中（仅可穿戴物） |
| `OnContaining` | 某个 Containable 在 ItemContainer 内时持续（仅 ItemContainer 里定义的 Containable） |
| `OnContained` | 被装在容器里时持续（仅物品） |
| `OnNotContained` | 未被装在任何容器里时持续（仅物品） |
| `OnActive` | 物品处于 active 时持续（仅物品） |
| `OnFailure` | 技能检定失败时（仅物品） |
| `OnBroken` | 物品 condition 掉到 0 时（仅物品） |
| `OnFire` | 处于火焰伤害范围时（物品与角色） |
| `InWater` | 浸没时（物品与角色） |
| `NotInWater` | 未浸没时（物品与角色） |
| `OnImpact` | 撞击够硬时（物品按 `ItemPrefab.ImpactTolerance`，角色按 `Ragdoll.ImpactTolerance`） |
| `OnEating` | 角色吃尸体中（仅角色） |
| `OnDamaged` | 受到**外部来源**伤害时（自身恶化/自损不算）（物品与角色） |
| `OnSevered` | 肢体被切断（仅肢体） |
| `OnProduceSpawned` | Growable 产出物品（如结果实）（仅 Growable） |
| `OnOpen` / `OnClose` | 门开/关（仅门） |
| `OnSpawn` | 生成时（物品与角色） |
| `OnSuccess` | 技能检定成功时（仅物品） |
| `OnAbility` | Ability（天赋效果）触发时（仅 Abilities） |
| `OnInserted` / `OnRemoved` | Containable 放入/取出 ItemContainer 时各执行一次（仅 ItemContainer 的 Containable；载入既有潜艇/角色时"本来就在里面"不触发） |
| `OnDeath` | 角色死亡（仅角色） |

**TargetType 全表（原文）**：`This`、`Parent`、`Character`、`Contained`、`NearbyCharacters`（范围用 `Range`）、`NearbyItems`（`Range`）、
`UseTarget`、`Hull`、`Limb`（角色时用 `targetLimbs` 指定）、`AllLimbs`、`LastLimb`、`LinkedEntities`（仅物品）。

**Attributes 表（原文全表，按「属性 = 默认值」压缩列出）**：
`OnlyInside=false`、`OnlyOutside=false`、`OnlyPlayerTriggered`、`AllowWhenBroken=false`、`Interval=0`、`Duration=0`、
`disableDeltaTime=false`、`setValue=false`、`Stackable=true`、`ResetDurationWhenReapplied=true`、`CheckConditionalAlways=false`、
`TargetItemComponent=Empty`、`TargetSlot=-1`、`Range=0`、`Offset=Zero`、`RandomOffset=0`、`SeverLimbs,severlimbsprobability=0`、
`EventTargetTag`、`EventEntityTag`、`EventUserTag`、`spawnItemRandomly=false`、`multiplyAfflictionsByMaxVitality=false`、
`UnlockRecipe=""`、`delay=0.0`、`tags`（任意 tag，供 Conditionals 查"某 StatusEffect 是否在跑"）、
**`conditionalComparison`（类型 `Comparison`，文档标的默认值是 `Or`，说明："And/Or. Do all of the Conditionals defined in the effect be true for the effect to execute, or should the effect execute when any of them is true?"）**、
以及 "**Any property of the target**：These are the meat of the StatusEffects… 默认是"加/减"，要用 `setValue` 才是赋值。若 target 没有该属性名，该属性什么也不做。"

> ⚠️ 文档这一行给 `conditionalComparison` 标的 **Type = `Comparison`、Default = `Or`**。但**本机真实内容几乎总显式写**（见 C 节），且本机未找到能对照的源码，**默认值到底是不是 Or 请以实测为准**。

**Elements 全表（原文）**：`explosion`、`fire`、`removeitem`、`dropcontaineditems`、`dropitem`、`removecharacter`、`breaklimb`、
`hidelimb`、`requireditem`、**`requireditems`（"Alias of 'requireditem'. Functionally identical."）**、`requiredaffliction`、`affliction`、
`aitrigger`、`triggeranimation`、`talenttrigger`、`giveexperience`、`giveskill`、`conditional`。

**子结构（原文给出的属性）**：
- `Fire`：`size=10.0f`
- `RequiredAffliction`：`identifier,type`、`minstrength=0.0f`
- `Affliction`：`identifier`、`strength=0.0f`、`probability=1.0f`
- `TalentTrigger`：`effectidentifier`
- `TriggerAnimation`：`type`（**必填**，取值 `Walk`/`Run`/`SwimSlow`/`SwimFast`/`Crouch`）、`filename`、`path`、`priority=0.0f`、`expectedspecies`
- `GiveExperience`：`amount`
- `GiveSkill`：`SkillIdentifier`、`Amount`、`TriggerTalents=true`、`UseDeltaTime`、`Proportional`、`AlwayShowNotification`
- `ItemSpawnInfo`（SpawnItem）：`SpawnIfInventoryFull`、`SpawnIfNotInInventory`、`SpawnIfCantBeContained=true`、`Impulse`、`Condition=1`、`Rotation`、
  `MinCount`/`MaxCount`（或 `Count`）、`Probability=1`、`Spread`、`AimSpread`、`Equip`、`SpawnPosition=This`、`InheritEventTags`
- `SpawnPositionType`：`This`、`ThisInventory`、`SameInventory`、`ContainedInventory`、`Target`
- `SpawnRotationType`：`None`、`This`、`Target`、`Limb`、`MainLimb`、`Collider`、`Random`
- `CharacterSpawnInfo`：`SpeciesName`、`Count=1`、`Transfer{Buffs,Afflictions,Inventory}`、`TotalMaxCount=0`、`Stun=0`、
  `AfflictionOnSpawn`、`AfflictionStrength=1`、`TransferControl`、`RemovePreviousCharacter`、`Spread`、`Offset`、`InheritEventTags`、`InheritTeam`
- `AITrigger`：`State=Idle`、`Duration=0`、`Probability=1`、`MinDamage=0`、`AllowToOverride=true`、`AllowToBeOverridden=true`
- `GiveTalentInfo`：`TalentIdentifiers`、`GiveRandom`

**常见坑（原文 Examples 里明说）**：默认值是"**每秒**变化量"，`disabledeltatime="true"` 改成"每帧"（用于一次性效果，如开火/爆炸）；配 `interval` 才省性能。

---

### A.6 `/Misc/Conditional.html` —「Conditionals」（**最权威之一**）

**机制**：Conditionals 被若干机制用来"必须满足一个或多个条件才生效"，例如某些 StatusEffect 只在角色活着时触发。
**使用 Conditional 的类（原文列的链接标题）**：Attack、ConditionalSprite、StatusEffect、CheckConditionalAction、CheckItemAction、
ItemComponent、AbilityConditionCharacter、DecorativeSprite(Client)、LightSource(Client)。
→ 即：`<conditional>` 元素**不只在 StatusEffect 里**出现。

**Attributes 全表（原文照抄；第一列是属性名）**：
| 属性名 | 原文含义 |
|---|---|
| Property or affliction identifier | 视情况拿目标的某个属性 or 某个 affliction 的强度来比。目标可用属性取决于该对象在源码里怎么定义。**当元素带 `SkillRequirement="true"` 时本项不适用。** |
| Skill identifier | 拿目标角色同名技能来比。**仅当元素带 `SkillRequirement="true"` 时适用。** |
| `Name` | 拿目标的名字比 |
| `SpeciesName` | 拿目标的物种 ID 比，仅对角色有效 |
| `SpeciesGroup` | 拿目标的物种组比，仅对角色有效 |
| `HasTag` | 拿目标的 tag 比，**仅物品有效**；可用**逗号分隔**多个 tag |
| `HasStatusTag` | 拿目标**激活中 StatusEffect 的 tag** 比；逗号分隔多个 |
| `HasSpecifierTag` | 拿目标的 specifier tag 比（原版里就是 head index 与性别，见 human.xml）；逗号分隔多个 |
| `EntityType` | 拿目标实体类型比，**当前支持取值：`character`、`limb`、`item`、`structure`、`null`** |
| `LimbType` | 拿目标肢体类型比（见 `Barotrauma.LimbType`） |
| `TargetItemComponent` | 设成目标某个 ItemComponent 的名字，则本元素里的 conditionals 改为对该组件的属性做判断。**仅物品有效。** |
| `TargetContainer` | 设为 true，则改为判断"装着目标的那个实体" |
| `TargetSelf` | 设为 true，则改为判断**攻击者**而不是被攻击者 |
| `TargetGrandParent` | 与 `TargetContainer` 同时为 true 时，判断"装着目标容器的那个实体" |
| `TargetContainedItem` | 设为 true，则改为判断"目标所装着的物品"。**仅物品有效。** |

**Comparison operators 全表（原文照抄，含说明）**：
> 原文："The comparison operator to use can be specified by placing one of the following **before** the value to compare against."

| 运算符 | 原文说明 |
|---|---|
| `"e"`, `"eq"`, `"equals"` | 要求相等。**这是不写运算符时的默认值**（"This is the default operator used if none is specified."） |
| `"ne"`, `"neq"`, `"notequals"`, `"!"`, `"!e"`, `"!eq"`, `"!equals"` | 要求不相等 |
| `"lt"`, `"lessthan"` | 小于。**只能用于数值属性、affliction 强度、技能等级** |
| `"lte"`, `"lteq"`, `"lessthanequals"` | 小于等于。同上限制 |
| `"gt"`, `"greaterthan"` | 大于。同上限制 |
| `"gte"`, `"gteq"`, `"greaterthanequals"` | 大于等于。同上限制 |

**本页没有列出的**：`l` / `le` / `g` / `ge`（**文档未覆盖**）；**也没有任何叫 `comparison` 的属性**（本页 Attributes 表里没有；`conditionalComparison` 出现在 StatusEffect 页，见 A.5）。

---

### A.7 `/Misc/ScriptedEvents.html` —「Examples」「Triggering events」「Event editor」「Event actions」

**机制**：脚本事件在**前哨站**或**任务中**触发各种事情；原版用它做前哨站事件、叛徒事件、派系事件链、教程、任务点缀。
有节点编辑器（控制台命令 "eventeditor"；下文又写 "editevents"）也可纯 XML 编辑。
**Tagging 是事件系统的核心**：`TagAction` 给实体打 tag，tag **只在本次事件内有效**，别的没自己打 tag 的事件看不到。
`TriggerAction` 用来"缩小到具体某一个目标"并给它打新 tag（如 `selectedtrashcan`）；`ConversationAction` + `Option` 产生分支；
`WaitAction`、`FireAction`、`AfflictionAction`、`MissionAction`、`Label` + `GoTo`（官方建议少用 GoTo）。

**Event set（"Triggering events → Event sets"）**：
- 官方示例：`<EventSet identifier="outpostevents.custom" leveltype="outpost" locationtype="research,military" minleveldifficulty="15" maxleveldifficulty="100" allowatstart="true" chooserandom="true" eventcount="2">` 内放若干 `<ScriptedEvent identifier="…" commonness="…" />`。
- **可嵌套**（EventSet 里放 EventSet）。
- **additive（重要，官方强烈推荐）**：原文 "Making an event set additive is simply just a matter of setting the attribute `additive` to true."；
  "Overriding and modifying this whole vanilla event set… would be cumbersome… That's where **additive event sets** come in. Additive event sets simply add more events on top of the existing events, **which is often how mods should configure events**（除非你准备把原版事件全部override）。"
  示例：`<EventSet identifier="outpostevents.custom" additive="true" leveltype="outpost" chooserandom="true" eventcount="1">`
- 其它触发途径：**Status effects**（任何 status effect 都能触发事件）、**Missions**（`<TriggerEvent state="0" delay="10" eventidentifier="…" campaignonly="true"/>`）。

**Event actions 全表（原文列出的链接名，共 60 个）**：
`AfflictionAction`、`CheckAfflictionAction`、`CheckConditionalAction`、`CheckConnectionAction`、`CheckDataAction`、`CheckReputationAction`、
`CheckItemAction`、`CheckMissionAction`、`CheckMoneyAction`、`CheckObjectiveAction`、`CheckOrderAction`、`CheckPurchasedItemsAction`、
`CheckSelectedAction`、`CheckTalentAction`、`CheckTraitorEventStateAction`、`CheckTraitorVoteAction`、`CheckVisibilityAction`、`CountTargetsAction`、
`RNGAction`、`SkillCheckAction`、`ClearTagAction`、`CombatAction`、`ConversationAction`、`EventLogAction`、`EventObjectiveAction`、`FireAction`、
`GiveExpAction`、`GiveSkillExpAction`、`GodModeAction`、`GoTo`、`HighlightAction`、`InventoryHighlightAction`、`Label`、`MessageBoxAction`、
`MissionAction`、`MissionStateAction`、`ModifyLocationAction`、`MoneyAction`、`NPCChangeTeamAction`、`NPCFollowAction`、`NPCOperateItemAction`、
`NPCWaitAction`、`OnRoundEndAction`、`RemoveItemAction`、`ReputationAction`、`SetDataAction`、`SetPriceMultiplierAction`、
`SetTraitorEventStateAction`、`SpawnAction`、`StatusEffectAction`、`TagAction`、`TeleportAction`、`TriggerAction`、`TriggerEventAction`、
`TutorialCompleteAction`、`TutorialIconAction`、`UIHighlightAction`、`UnlockPathAction`、`WaitAction`、`WaitForItemFabricatedAction`、`WaitForItemUsedAction`。

**常见坑**：`<ScriptedEvent>` 的 `identifier` 与 `commonness`；对话文本直接写在 `text="…"`（官方示例里就是裸英文），也可以是本地化键（见 B.4 本机证据）。

---

### A.8 `/Misc/StatTypes.html` —「StatTypes」「AbilityFlags」

**机制**：StatTypes 用于改角色特性，**主要给天赋用**。多数是"百分比"：值 0 默认，最终乘数 = 1 + 值（0.2 → 1.2 即 +20%，-0.2 → 0.8 即 −20%）。

**StatTypes 取值全表（原文 63 项，照抄名字）**：
`None`、`ElectricalSkillBonus`、`HelmSkillBonus`、`MechanicalSkillBonus`、`MedicalSkillBonus`、`WeaponsSkillBonus`、
`HelmSkillOverride`、`MedicalSkillOverride`、`WeaponsSkillOverride`、`ElectricalSkillOverride`、`MechanicalSkillOverride`、
`MaximumHealthMultiplier`、`MovementSpeed`、`WalkingSpeed`、`SwimmingSpeed`、`PropulsionSpeed`、`BuffDurationMultiplier`、
`DebuffDurationMultiplier`、`MedicalItemEffectivenessMultiplier`、`FlowResistance`、`AttackMultiplier`、`TeamAttackMultiplier`、
`RangedAttackSpeed`、`RangedAttackMultiplier`、`TurretAttackSpeed`、`TurretPowerCostReduction`、`TurretChargeSpeed`、
`MeleeAttackSpeed`、`MeleeAttackMultiplier`、`RangedSpreadReduction`、`RepairSpeed`、`MechanicalRepairSpeed`、`ElectricalRepairSpeed`、
`DeconstructorSpeedMultiplier`、`RepairToolStructureRepairMultiplier`、`RepairToolStructureDamageMultiplier`、`RepairToolDeattachTimeMultiplier`、
`MaxRepairConditionMultiplierMechanical`、`MaxRepairConditionMultiplierElectrical`、`IncreaseFabricationQuality`、
`GeneticMaterialRefineBonus`、`GeneticMaterialTaintedProbabilityReductionOnCombine`、`SkillGainSpeed`、`ExtraLevelGain`、
`HelmSkillGainSpeed`、`WeaponsSkillGainSpeed`、`MedicalSkillGainSpeed`、`ElectricalSkillGainSpeed`、`MechanicalSkillGainSpeed`、
`MedicalItemApplyingMultiplier`、`BuffItemApplyingMultiplier`、`PoisonMultiplier`、`TinkeringDuration`、`TinkeringStrength`、
`TinkeringDamage`、`ReputationGainMultiplier`、`ReputationLossMultiplier`、`MissionMoneyGainMultiplier`、`ExperienceGainMultiplier`、
`MissionExperienceGainMultiplier`、`ExtraMissionCount`、`ExtraSpecialSalesCount`、`StoreSellMultiplier`、`StoreBuyMultiplierAffiliated`、
`StoreBuyMultiplier`、`ShipyardBuyMultiplierAffiliated`、`ShipyardBuyMultiplier`、`MaxAttachableCount`、`ExplosionRadiusMultiplier`、
`ExplosionDamageMultiplier`、`FabricationSpeed`、`BallastFloraDamageMultiplier`、`HoldBreathMultiplier`、`Apprenticeship`、`CPRBoost`、
`LockedTalents`、`HireCostMultiplier`、`InventoryExtraStackSize`、`SoundRangeMultiplier`、`SightRangeMultiplier`、
`DualWieldingPenaltyReduction`、`NaturalMeleeAttackMultiplier`、`NaturalRangedAttackMultiplier`。

**AbilityFlags 全表（原文）**：`None`、`MustWalk`、`ImmuneToPressure`、`IgnoredByEnemyAI`、`MoveNormallyWhileDragging`、`CanTinker`、
`CanTinkerFabricatorsAndDeconstructors`、`TinkeringPowersDevices`、`GainSkillPastMaximum`、`RetainExperienceForNewCharacter`、
`AllowSecondOrderedTarget`、`AlwaysStayConscious`、`CanNotDieToAfflictions`。

**常见坑**：`None` 是"非法值，不该用"；部分 StatType（`IncreaseFabricationQuality`、`ReputationGainMultiplier`、`MaxAttachableCount`、`Apprenticeship`、`LockedTalents`、`HireCostMultiplier`）**必须**配合 `CharacterAbilityGivePermanentStat` 指定 tag/job/天赋，否则不生效或无效。

---

### A.9 `/Misc/RelatedItem.html` —「RelatedItem」「Attributes」

**机制**：定义"物品之间的关系"——角色要装备什么才能互动、什么能放进容器、StatusEffect 要求目标身上有什么物品才能触发。

**属性全表（原文）**：`ExcludeBroken=true`、`RequireEmpty=false`、`ExcludeFullCondition=false`、`AllowVariants=true`、
`Rotation=0`（仅 ItemContainer 的 Containable 定义里有效）、`SetActive=false`（同上）、`Msg=""`（仅 ItemComponent 的 RequiredItems；缺物品时弹的本地化 tag）、
`Optional=false`（仅 ItemComponent 的 RequiredItems）、`IgnoreInEditor=false`（同上）、`MatchOnEmpty=false`、`TargetSlot=-1`、
`Hide=false`（仅 Containable 定义，且 ItemContainer.hideItems 为 false 时才起作用，不覆盖它）、`ItemPos=Zero`（仅 Containable 定义）。

**常见坑**：`requireditem` 与 `requireditems` **是同一个东西的别名**（见 A.5 Elements 表原文）；本页没说 `type` 属性的取值（**文档未覆盖** `type="Contained"` 这类）。

---

### A.10 `/Misc/Attack.html` —「Attack」「Attributes」「Elements」

**机制**：Attack 给角色/结构/物品造成伤害，定义在武器的 item component 或角色的 limb 定义里；limb attack 玩家也能用（操控怪物/有附肢时）。

**Elements 全表（原文）**：`particleemitter`、`sound`、`statuseffect`（**注意**：原文这条说 "StatusEffect types of 'OnUse' are executed always, 'OnFailure' only when the attack doesn't deal damage and 'OnSuccess' executes when some damage is dealt."）。
→ **文档 Elements 表里没有 `affliction`**（但本机真实内容与插件都直接在 `<Attack>` 下写 `<Affliction>`，见 C 节与 A.13）。

**Attributes 全表（按「名 = 默认值」压缩列出，全部来自原文）**：
`StructureSoundType="StructureBlunt"`、`Context=Any`、`TargetType=Any`、`TargetLimbType=None`、`HitDetectionType=Distance`、
`AfterAttack=FallBack`、`AfterAttackDelay=0`、`Reverse=false`、`SnapRopeOnNewAttack=true`、`Retreat=false`、`Range=0`、`DamageRange=0`、
`MinRange=0`、`Duration=0.25`、`CoolDown=5`、`SecondaryCoolDown=0`、`CoolDownRandomFactor=0`、`FullSpeedAfterAttack=false`、
`StructureDamage=0`、`EmitStructureDamageParticles=true`、`ItemDamage=0`、`Penetration=0`、`LevelWallDamage=0`、`Ranged=false`、
`AvoidFriendlyFire=false`、`RequiredAngle=20`、`RequiredAngleToShoot=0`、`AimRotationTorque=0`、`RotationLimbIndex=-1`、
`SwayAmount=0`、`SwayFrequency=5`、`Stun=0`（Legacy support，改用 Afflictions）、`OnlyHumans=false`、`ApplyForceOnLimbs=""`、
`Force=0`、`RootForceWorldStart/Middle/End="0.0,0.0"`、`RootTransitionEasing=Linear`、`Torque=0`、`ApplyForcesOnlyOnce=false`、
`TargetImpulse=0`、`TargetImpulseWorld="0.0,0.0"`、`TargetForce=0`、`TargetForceWorld="0.0,0.0"`、`SubmarineImpactMultiplier=1`、
`SeverLimbsProbability=0`、`Priority=0`、`Blink=false`。

---

### A.11 `/Misc/Explosion.html` —「Explosion」

**机制**：范围伤害攻击，可伤角色/物品/结构。**"This type also supports the attributes defined in: Attack"**（即上面 A.10 那张表也适用）。

**属性全表（原文）**：`force=0`、`sparks`、`shockwave`、`flames`、`underwaterBubble`、`smoke`、`playTinnitus`（以上默认 "Same as showEffects"）、
`applyFireEffects`（`showEffects=true` 且未显式把 `flames` 设 false 时为 true，否则 false）、`ignoreFireEffectsForTags=[]`、`ignoreCover=false`、
`OnlyInside=false`、`OnlyOutside=false`、`flash`（Same as showEffects）、`flashDuration=0.05`、`flashColor=LightYellow`、`EmpStrength=0`、
`BallastFloraDamage=0`、`itemRepairStrength=0`、`decal=""`（置空字符串即禁用）、`decalSize,decalsize=1`、`cameraShake`、
`cameraShakeRange`、`screenColorRange`、`screenColor=Transparent`、`screenColorDuration=0.1`、`flashRange=100`、`showEffects=true`。

**常见坑**：`showEffects` 是总开关（"Used to enable all particle effects without having to specify them one by one"）。

---

### A.12 `/Misc/Troubleshooting.html` —「Troubleshooting」

原文四个 FAQ，都是**游戏行为**，对校验器非常有价值：
1. **改了 filelist 里的文件名/新增文件后没生效** → "**You must restart the game to pick up new or renamed files in the LocalMods directory.**"
2. **v0.17 前的老 mod/潜艇不见了** → 游戏不会删你的文件；需在 Steam Workshop 界面把 `Disabled regular packages` 里的拖到 `Enabled regular packages`；若没出现，删 `Mods/LOCALMODS_README.txt` 后重启触发再迁移一次。
3. **v0.17 前发布过的 mod 怎么改** → 在 Publish 标签建本地副本 → 用 Installed Mods 列表里的铅笔图标定位 LocalMods 副本 → 改 → 回 Publish 提交。
4. **老 mod 现在拒绝启用** → "**It's likely that this mod has some sort of error in its XML**… the game now **disables mods with such errors**"。
   并给出一句**关键报错原文**：**"Failed to add the prefab X from MyMod: a prefab with the same identifier from OtherMod already exists; try overriding"** — 即**同 identifier 被定义两次且都没标 override 时，模组会被禁用**；解决办法："either change the identifier of the mentioned prefab in your mod, or **wrap it in `<override>...</override>` tags**"。

**常见坑**：identifier 撞车不是"后者覆盖前者"，是**整个 mod 被禁用**（这一点与插件现有提示相反，见 C 节）。

---

### A.13 `/ContentTypes/Item.html` —「Item」（**本地化键的权威出处**）

**机制**：Item 定义可交互物（机械 + 可拾取物）。**Required by core package: Yes**。

- `identifier`（原文）："This is used to be able to make references to the item, as well as determine what to remove when overriding. **If `nameidentifier` and `name` are not defined, it is also used to fetch the name and description of the item from a Text content file using the tags `entityname.[identifier]` and `entitydescription.[identifier]`.**"
- `nameidentifier`：指定取名字用的 tag；`fallbacknameidentifier`：`nameidentifier` 在当前语言里没定义时的回退 tag；
  `descriptionidentifier`：指定取描述用的 tag。
- **`name`（关键优先级，原文）**："If defined, **and the previous optional identifiers are not defined, and the identifier is not found in a Text file**, this string is used directly as the name to display in the player's inventory."
- `aliases`：逗号分隔的额外 identifier 列表（用于旧物品被替换后的向后兼容）。
- `category` 取值全表（原文）：`Decorative`、`Machine`、`Medical`、`Weapon`、`Diving`、`Equipment`、`Fuel`、`Electrical`、`Material`、`Alien`、`Wrecked`、`Misc`（可为多值）。
- 其它属性（原文列名，按类型）：`tags`、`allowasextracargo`、`InteractDistance`、`InteractPriority`、`InteractThroughWalls`、`HideConditionBar`、
  `HideConditionInTooltip`、`RequireBodyInsideTrigger`、`RequireCursorInsideTrigger`、`RequireCampaignInteract`、`FocusOnSelected`、
  `OffsetOnSelected`、`Health`、`AllowSellingWhenBroken`、`Indestructible`、`DamagedByExplosions`、`ExplosionDamageMultiplier`、
  `DamagedByProjectiles`、`DamagedByMeleeWeapons`、`DamagedByRepairTools`、`DamagedByMonsters`、`FireProof`、`WaterProof`、`ImpactTolerance`、
  `OnDamagedThreshold`、`SonarSize`、`UseInHealthInterface`、`DisableItemUsageWhenSelected`、`CargoContainerIdentifier`、
  `UseContainedSpriteColor`、`UseContainedInventoryIconColor`、`AddedRepairSpeedMultiplier`、`AddedPickingSpeedMultiplier`、`CannotRepairFail`、
  `EquipConfirmationText`、`AllowRotatingInEditor`、`ShowContentsInTooltip`、`CanFlipX`、`CanFlipY`、`IsDangerous`、`MaxStackSize`、
  `AllowDroppingOnSwap`、`ResizeHorizontal`、`ResizeVertical`、`Description`(LocalizedString)、`AllowedUpgrades`、`HideInMenus`、`Subcategory`、
  `Linkable`、`SpriteColor`、`Scale`。
- **子元素（原文）**：`sprite`、`price`、`preferredcontainer`、`fabricate`、`deconstruct`、`swappableitem`、`trigger`、`suitabletreatment`，
  以及一大堆 **item component** 类型（`Holdable`、`ItemContainer`、`RangedWeapon`、`MeleeWeapon`、`Wearable`、`Quality`…）。
- `sprite` 原文说明：`texture` 路径、`sourcerect` = `(x, y, width, height)` 像素、`depth` 0~1（0 在前 1 在后）、`origin` 相对物品位置的中心点。
- `preferredcontainer` 原文：**"each `preferredcontainer` element will be processed individually for spawning items: they are additive"**；同一元素内多个 tag/identifier 是"或"。

**常见坑**：`name` 的优先级是 **nameidentifier > fallbacknameidentifier > （identifier 在 Text 文件里的 `entityname.*`）> name**。
→ 只要**任何** Text 文件里存在 `entityname.<identifier>`，你写的硬编码 `name` 就**不会**生效。

---

### A.14 `/ContentTypes/Character.html` —「Character」（**`character.` 键的权威出处**）

- **`SpeciesName`**（原文）："Used for referencing the character, like Item identifier."
- **`DisplayName`（原文）**："Overrides the name of the character, shown to the player. **Leave blank, if the name is defined in the Text files (e.g. `<character.crawler>Crawler</character.crawler>`)**!"
- **`SpeciesTranslationOverride`（原文）**："References to another species. Used only if we want to reuse the name defined for it in the Text files."
- `VariantOf`：继承另一个物种的子元素与属性；**同义词 `Inherit`**（"you can also use `VariantOf` as a synonym"）；根元素可用 `<Charactervariant inherit="…" speciesname="…">`。
- 其它根属性（原文列名）：`Group`、`Humanoid`、`HasInfo`、`SpecifierTags`、`CanInteract`、`Husk`、`UseHuskAppendage`、`NeedsAir`、
  `NeedsWater`、`CanSpeak`、`ShowHealthBar`、`UseBossHealthBar`、`Noise`、`Visibility`、`BloodDecal`、`BleedParticleAir`、`BleedParticleWater`、
  `BleedParticleMultiplier`、`CanEat`、`EatingSpeed`、`UsePathFinding`、`PathFinderPriority`、`HideInSonar`、`HideInThermalGoggles`、
  `SonarDisruption`、`DistantSonarRange`、`DisableDistance`、`SoundInterval`、`DrawLast`、`AITurretPriority`、`AISlowTurretPriority`、`DespawnContainer`。
- **子元素（原文）**：`ragdolls` & `animations`（"used to determine **the folders** the game should look to find the ragdoll and animation parameters"）、
  `damageemitter`/`bloodemitter`/`gibemitter`、`health`、`Inventory`、`ai`、`StatusEffect`、`sound`、`huskappendage`。
- `Inventory` 原文：定义槽位；**同时用于定义玩家的背包和怪物的 loot**，用 `commonness` 做权重。
- 角色可用的 StatusEffect type（原文列的字符专用子集）：`Always`、`OnSpawn`、`OnActive`、`OnEating`、`OnImpact`、`InWater`、`NotInWater`、`OnDamaged`、`OnSevered`、`OnFire`、`OnDeath`。
- **仅当 `HasInfo` 与 `SpecifierTags` 都为 true 时可用的子元素**：`names`（"Defines a file to load character names from"）、`Vars`、
  `Heads`、`MenuCategory`、`Pronouns`、`HeadAttachments`。
- **variant 专属子元素**：`Ragdoll`（`ScaleMultiplier`/`ImpactTolerance`，**可用 `Folder` 或 `Path` 覆盖 ragdoll**）、`Attack`（`DamageMultiplier`/`RangeMultiplier`/`ImpactMultiplier`）。

**常见坑**：`DisplayName` 留空才走 Text 文件；`ragsolls`/`animations` 是"**目录**"语义（默认读 XML 旁边的 `Ragdolls/`、`Animations/`，或用 `folder=`）。
**文档没有说这些目录要不要写进 filelist** → 该具体问题**文档未覆盖**（但可从句法推断，见 C 节）。

---

### A.15 `/ContentTypes/Afflictions.html` —「AfflictionPrefab」

- **元素名决定类型**（原文）：`<Afflictions>` 根里，`<Affliction>` = 普通；`<AfflictionPrefabHusk>` =  Husk 类；`<AfflictionBleeding>` = Bleeding 类。
- **属性全表（按「名 = 默认值」压缩，全部原文）**：`Type=""`、`TranslationOverride`（默认同 Identifier，"Can be set to the identifier of another affliction to make this affliction **reuse the same name and description**"）、
  `ShowDescriptionInTooltip=true`、`IsBuff=false`、`AffectMachines=true`、`ShowBarInHealthMenu=true`、`HealableInMedicalClinic`、
  `HealCostMultiplier=1`、`BaseHealCost=0`、`Duration=0`、`LimbSpecific=false`、`HideIconAfterDelay=false`、`ActivationThreshold=0`、
  `ShowIconThreshold`、`ShowIconToOthersThreshold`、`MaxStrength=100`、`GrainBurst=0`、`ShowInHealthScannerThreshold`、`TreatmentThreshold`、
  `TreatmentSuggestionThreshold`、`DamageOverlayAlpha=0`、`BurnOverlayAlpha=0`、`KarmaChangeOnApplied=0`、`IconColors`、
  `AfflictionOverlayAlphaIsLinear=false`、`AchievementOnReceived`、`AchievementOnRemoved`、`Targets=[]`、`ResetBetweenRounds=false`、
  `DamageParticles=true`、`WeaponsSkillGain=0`、`MedicalSkillGain=0`。
- **Elements**：`icon`(Sprite)、`afflictionoverlay`(Sprite)、`afflictionoverlayanimated`(SpriteSheet)、`description`、`effect`、`periodiceffect`。
- `Description` 子元素属性：`TextIdentifier`（"**Text tag used to set the text from the localization files**"）、`MinStrength=0`、`MaxStrength=100`、`Target=Any`、`Text`。
- `TargetType`（description 用）：`Any`、`Self`、`OtherCharacter`。
- **`Effect` 属性**：`MinStrength=0`、`MaxStrength=0`、`MinVitalityDecrease=0`、`MaxVitalityDecrease=0`、**`StrengthChange=0`**（"How much the affliction's strength changes every second while this effect is active."）、
  `MultiplyByMaxVitality=false`、屏幕类 `Min/MaxScreenBlur`、`Min/MaxScreenDistort`、`Min/MaxRadialDistort`、`Min/MaxChromaticAberration`、
  `GrainColor`、`Min/MaxGrainStrength`、`ScreenEffectFluctuationFrequency`、`Min/MaxAfflictionOverlayAlphaMultiplier`、`Min/MaxBuffMultiplier`、
  `Min/MaxSpeedMultiplier`、`Min/MaxSkillMultiplier`、`Min/MaxResistance`、`DialogFlag`、`Tag`、`Min/MaxFaceTint`、`Min/MaxBodyTint`、
  `ThermalOverlayRange`、`ThermalOverlayColor`、`ConvulseAmount`。
- `Effect` 的 Elements：`statuseffect`、`abilityflag`（`AbilityFlag flagtype="…"`）、`statvalue`（`StatType`/`Value`/`MinValue`/`MaxValue`）。
- `PeriodicEffect`：`Interval=1.0`、`MinInterval=1.0`、`MaxInterval=1.0`，子元素 `StatusEffect`。
- **原文关键约束**："Only one effect can be applied at any given moment, so their ranges should be defined with **no overlap**."
- `AfflictionPrefabHusk` 额外属性：`HuskedSpeciesName`、`TransferBuffs=true`、`SendMessages=true`、`CauseSpeechImpediment=true`、`NeedsAir=false`、`ControlHusk=false`、`DormantThreshold`、`ActiveThreshold`、`TransitionThreshold`、`TransformThresholdOnDeath`。

**常见坑**：**本页没有写出 `afflictionname.<id>` / `afflictiondescription.<id>` 这两个前缀** → 前缀本身**文档未直接给**（但有 `TextIdentifier` 机制 + 本机 311 处实例，见 B.4）。

---

### A.16 `/ContentTypes/Text.html` 与 `/ContentTypes/Other.html`

- **Text**（`/ContentTypes/Text.html`）：内容极少，只写 "Required by core package: No" + 源码链接（`TextFile.cs`/`TextPack.cs`）。
  → **语言文件的 XML 结构（`<infotexts>` 根、`language`/`nowhitespace`/`translatedname` 属性、`<key>文本</key>` 条目）在 BaroModDoc 里没有专门文章 → 文档未覆盖**。
- **Other**（`/ContentTypes/Other.html`）：只写 "Required by core package: No" + "**Alternate names: None**" + 源码链接（`OtherFile.cs`）。
  → 即 `Other` 是官方承认的兜底内容类型，可挂任意文件。

---

### A.17 `/ContentTypes/RandomEvents.html` —「EventSet」「EventPrefab」「MonsterEvent」

这是 **EventSet 属性的自动生成表**（比 A.7 的手写正文更全，但**缺 leveltype/locationtype/onceperoutpost**）：
- `EventSet`：`Biome=Empty`、`MinLevelDifficulty=0`、`MaxLevelDifficulty=100`、**`Additive=false`**（原文解释了 additive 的意义）、`Faction=""`、
  `MinIntensity=0`、`MaxIntensity=100`、`ChooseRandom=false`、`eventCount=1`（仅 ChooseRandom 时有效）、`Exhaustible=false`、
  `MinDistanceTraveled=0`、`MinMissionTime=0`、`AllowAtStart=false`、`PerRuin=false`、`PerCave=false`、`PerWreck=false`、
  `DisableInHuntingGrounds=false`、`IgnoreCoolDown`、`IgnoreIntensity`、`DelayWhenCrewAway`、`OncePerLevel`、`TriggerEventCooldown=true`、
  `Campaign`、`ResetTime=0`、`CampaignTutorialOnly=false`、`ForceAtDiscoveredNr=-1`、`ForceAtVisitedNr=-1`、`Commonness=1`。
  子元素：`commonness`、`eventset`。
- `EventPrefab`：`Commonness=1`、`Probability,spawnprobability=1`、`TriggerEventCooldown`、`UnlockPathEvent=false`、
  `UnlockPathTooltip="lockedpathtooltip"`、`UnlockPathReputation=0`。
- `MonsterEvent`：`MinAmount`/`MaxAmount=1`（或 `Amount`）、`MaxAmountPerLevel`、`SpawnType=MainPath`、`spawnPointTag`、
  `SpawnDistance=0`、`offset=0`、`scatter=500`、`delayBetweenSpawns=0.1`、`resetTime=0`。

**常见坑**：本表**没有** `leveltype`、`locationtype`、`onceperoutpost`、`minleveldifficulty` 的大小写变体说明 —— 但 A.7 的官方正文示例与真实 mod 都在用它们（见 C 节）。

---

### A.18 `/Intro/Publishing.html` —「Publishing to Steam Workshop」「Local vs. Workshop mods」

- 通过游戏内 **Publish 标签**发布；发布**不是**开服必须的（玩家能从服务器直接下载所需 mod）。
- 发布时要写：description、预览图、tags、change note、可见性。点 Publish 后会上传、安装，必要时弹 Steam 订阅协议。
- 发布后 Installed Mods 里会看到**两个版本**（本地 LocalMods 一份 + 已发布工坊一份）——所以本地改动不会覆盖已发布版本。
- **文档未覆盖**：工坊的文件命名（如预览图叫什么文件名）、`steamworkshopid` 之类的 filelist 字段。

---

### A.19 `/Editors/SubmarineEditor.html` —「Submarine editor」（要点摘要）

作者 TorpedoMike / Chad Husk / Hexcode Guy。要点：
- **结构**：外墙默认比内墙结实，穿梭机墙居中；每块墙可单独改 max health，作为基础血量被"船体升级"乘算。
- **hull 与 gap**：hull 定义房间（没有 hull 就等于没有隔水）；hull 决定体积与质量；多 hull 可**链接**（选中一个，按住空格点另一个）让 AI 视为一间房；hull 可命名（AI 靠 hull 名导航，例如 `airlock`）；gap 连接 hull 让水与氧气流动（门/舱口自动生成 gap，无墙相邻 hull 需手放；红=关，蓝=开）。
- **接线**：接线模式下在设备间拉线；颜色只是外观（传统红=电、蓝=信号）；CTRL+click 线体加点。
- **核反应堆与电网**：反应堆是主电源，每个反应堆建议指定一名工程师；所有设备必须经**接线盒（junction box）**取电（不能直接接反应堆）；同一电网负载不均会导致低负载那侧过载损坏设备；**超电容（supercapacitor）**给炮塔用。
- **引擎/压载/导航**：引擎后半必须浸水否则损坏；压载舱 = 空房间 + 水泵；**综合中性压载水平目标 0.5**；导航终端把方向转为信号（`velocity_x_out`→`set_force`，`velocity_y_out`→`set_targetlevel`）。
- **武器系统**：炮塔 = 炮 + 装填器 + 潜望镜；装填器需与炮**链接**；潜望镜输出 `position_out`/`trigger_out` 接到炮的 `position_in`/`trigger_in`；深水炸弹需要投放器+发射管；放电线圈接电网 + 激活信号。
- **氧气**：氧气发生器 + 氧气口（需链接，选中发生器后按住空格点氧气口）；耗氧取决于 hull 体积与人数；氧气经 gap 流动。
- **气闸/对接口/货物**：对接口独立于舱门，放了接口也要放舱口（推荐把接口与舱口链接）。
- **容器（Container）**：`ItemContainer` 组件开 **Auto Fill** + 给容器打 tag 才能自动装填；**手动需要加的 tag 全表**：`engcab`、`reactorcab`、`divingcab`、`supplycab`、`armcab`、`secarmcab`、`medcab`、`medfabcab`、`toxcab`、`storagecab`、`mineralcab`（各自用途见原页）。
- **安保**：在门的 `picked required` 字段加 tag，并在 spawn point 加同名 `ID Card` tag，即可限定只有从该点出生的人能开门。
- **防水**：水泵为主；用 duct block 把水导到指定舱底；房间越大水蔓延越远；原版潜艇多用自动关门。
- **Waypoint**：AI 必须有路点；推荐用 `Generate waypoints` 按钮一键生成（在物品与结构都摆好之后），改动门/楼梯/梯子后要补路点。
- **多选改属性**：可批量改；**限制**：只有属于**同一个 item component** 的属性才能一起改（例：OxygenGenerator 与 Engine 的 Power Consumption 分属不同组件，不能同改）。
- **自动保存**：每 5 分钟或游戏暂停时存到 `Submarines/.AutoSave/AutoSave.sub`（**所有潜艇共用一个自动存档**）。
- **快捷键**：WASD 滚屏 / Shift+WASD 快滚 / Ctrl+1、Ctrl+2 切编辑与接线 / Q 开关实体目录 / F 居中到选中 / E 打开物品界面 / Ctrl+A 全选 / Ctrl+S 保存菜单 / Ctrl+Shift+S 快速保存 / Ctrl+M、Ctrl+N 水平/垂直翻转 / **空格+左键 链接** / 拖拽时按住 Shift 关网格吸附。

---

### A.20 `/Misc/Performance.html` —「Performance」

原文要点（都是可直接变成校验建议的硬建议）：
- **ActionType**："The `Always` type is generally the worst for performance"；能用 `InWater`/`Contained` 就别用 `Always`。
- **Interval**："By default, the interval is 0, meaning the effect executes every frame."；游戏固定 60 次/秒更新，"An effect that only runs once per second is generally **60 times more performant**"。
  官方示例：`<StatusEffect type="OnContained" target="This" Condition="-0.1" interval="1" disabledeltatime="true" />` 与不写 interval 的版本效果相同但快得多。
- **Containables**：用 `<StatusEffect>` + `<RequiredItem>` 去"每帧检查容器里有没有某物"是**差**做法；
  应改为把 StatusEffect 写进 `ItemContainer` 的 `<Containable>` 里用 `type="OnContaining"`（"otherwise it does nothing and causes no performance impact"）。
- 官方提醒：自定义天赋/affliction 带 StatusEffect 时也应尽量改成每 x 秒执行一次。

---

## B. 四张「权威清单」

### B.1 内容类型（filelist 子元素名）— 权威全表

**来源**：`https://regalis11.github.io/BaroModDoc/Intro/ContentTypes.html`，小节「Content types」（原文注明 "As of v0.17.12.0"）；
**子元素约束**来自 `https://regalis11.github.io/BaroModDoc/Intro/ContentPackages.html`，小节「File list」（"The name of each of these child elements must be one of the content types"）。

| 分组（原文分组） | 内容类型（原样照抄元素名） |
|---|---|
| 编辑器创建/编辑 | `Submarine`、`BeaconStation`、`EnemySubmarine`、`Outpost`、`OutpostModule`、`Wreck` |
| 半自动生成文档 | `Item`、`Character`、`Afflictions` |
| 全自动生成文档 | `BackgroundCreaturePrefabs`、`BallastFlora`、`CaveGenerationParameters`、`Corpses`、`Decals`、`EventManagerSettings`、`Factions`、`ItemAssembly`、`Jobs`、`LevelGenerationParameters`、`LevelObjectPrefabs`、`LocationTypes`、`MapGenerationParameters`、`Missions`、`NPCConversations`、`NPCPersonalityTraits`、`NPCSets`、`Orders`、`OutpostConfig`、`Particles`、`RandomEvents`、`RuinConfig`、`ServerExecutable`、`SkillSettings`、`Sounds`、`StartItems`、`Structure`、`Talents`、`TalentTrees`、`Text`、`TraitorMissions`、`Tutorials`、`UIStyle`、`UpgradeModules`、`WreckAIConfig`、`Other` |

补充证据（`/ContentTypes/*.html` 各页的 "Required by core package" 字段）：
- **`Item` = Yes**（`/ContentTypes/Item.html`）、**`Character` = Yes**（`/ContentTypes/Character.html`）、**`Afflictions` = Yes**（`/ContentTypes/Afflictions.html`）
- **`Text` = No**（`/ContentTypes/Text.html`）、**`Other` = No**（`/ContentTypes/Other.html`）；`Other` 另注 "**Alternate names: None**"。
- **文档未覆盖**：`Ragdolls` / `Animations` / `Names` / `Lua` / `CSharp` / `Config` 这些既不是内容类型也不是 filelist 子元素。

---

### B.2 Conditional — 运算符 / 语法 / 可用属性（权威）

**来源**：`https://regalis11.github.io/BaroModDoc/Misc/Conditional.html`，小节「Comparison operators」与「Attributes」。

**（1）关系运算符全表（原文照抄）**：

| 运算符（原文） | 含义（原文） |
|---|---|
| `"e"`, `"eq"`, `"equals"` | 相等；**不写运算符时的默认值** |
| `"ne"`, `"neq"`, `"notequals"`, `"!"`, `"!e"`, `"!eq"`, `"!equals"` | 不相等 |
| `"lt"`, `"lessthan"` | 小于（只能比数值属性 / affliction 强度 / 技能等级） |
| `"lte"`, `"lteq"`, `"lessthanequals"` | 小于等于（同上限制） |
| `"gt"`, `"greaterthan"` | 大于（同上限制） |
| `"gte"`, `"gteq"`, `"greaterthanequals"` | 大于等于（同上限制） |

**（2）语法形式**：运算符**写在值前面**，用空格分隔：`<conditional 属性名="运算符 值" />`（原文："by placing one of the following before the value to compare against"）。
不写运算符 = 等于。

**（3）可用在哪些元素**：原文列的类 = `Attack`、`ConditionalSprite`、`StatusEffect`、`CheckConditionalAction`、`CheckItemAction`、
`ItemComponent`、`AbilityConditionCharacter`、`DecorativeSprite`、`LightSource`。
→ 即 `<conditional>` 出现在这些元素的定义里（StatusEffect 页 Elements 表也确认 `conditional` 是 StatusEffect 的子元素）。

**（4）属性名全表 + 取值约束**（原文 "Attributes"）：见 A.6 的完整表。关键约束：
- `EntityType` 的**允许取值**：`character`、`limb`、`item`、`structure`、`null`（原文）。
- `SkillRequirement="true"` 时，属性名变成"技能 identifier"，此时**不能**再用 Property/affliction identifier（原文双向限制）。
- `HasTag`/`HasStatusTag`/`HasSpecifierTag` 支持**逗号分隔**多值。
- `LimbType` 取值"见 `Barotrauma.LimbType`"（**文档未列出具体取值**）。

**（5）`comparison` / `conditionalComparison`**：
- **`Conditional.html` 整页没有名为 `comparison` 或 `conditionalComparison` 的属性**。
- `https://regalis11.github.io/BaroModDoc/Misc/StatusEffect.html`，小节「Attributes」里有 **`conditionalComparison`**，类型 `Comparison`，文档标默认值 `Or`，取值 **And/Or**。
- 原文那句的解释照抄："And/Or. Do all of the Conditionals defined in the effect be true for the effect to execute, or should the effect execute when any of them is true?"

---

### B.3 Content package / filelist（权威）

**来源**：`https://regalis11.github.io/BaroModDoc/Intro/ContentPackages.html`（小节「Content packages」「File list」「Core packages」）+ `https://regalis11.github.io/BaroModDoc/Intro/XML.html`（小节「Barotrauma-specific notes」）。

**根元素**：`<contentpackage>`，文件名固定 `filelist.xml`（原文 "its filename will always be `filelist.xml`"）。

**根元素属性（文档全表，就这 4 个）**：
| 属性 | 文档含义 | 必填？ |
|---|---|---|
| `name` | 游戏内显示给玩家的包名 | 文档未标"必填"，但这是玩家看到的唯一名称 |
| `modversion` | mod 版本号（目前只是给 modder 看的提示） | 文档未标必填 |
| `gameversion` | 本 mod 最后适配的游戏版本（游戏可能用它做向后兼容检测） | 文档未标必填 |
| `corepackage` | 是否为 "core" 包 | 文档未标必填 |

**子元素写法（原文）**："a child element for **each content XML file** that needs to be loaded"，元素名**必须是 B.1 里的内容类型之一**。
官方示例：`<Item file="%ModDir%/alienwrench.xml" />` → **子元素用 `file` 属性，值为 `%ModDir%/…`**。

**corepackage 语义**：core 包必须包含游戏运行所需的**全部**文件；**同一时刻只能启用一个 core 包**；官方建议普通 mod **不要**用（"overrides are usually sufficient"，且 core mod "are likely to break as we make updates"）。

**路径变量（`/Intro/XML.html`「Barotrauma-specific notes」）**：
- `%ModDir%` = **你 mod 所在的目录**（"the directory your mod is contained in"）。
- `%ModDir:[MOD NAME]%` = **另一个 mod** 的目录（"[MOD NAME] is replaced with the other mod"）。
- **文档未覆盖**：`Content/...`（原版资源引用）、`steamworkshopid` / `installtime` / `expectedhash` / `hidden` / `submarines` 等属性（本机 49 个 filelist 里 `steamworkshopid` 3 例、`installtime`/`expectedhash` 各 1 例，但文档不提）。

**文档未覆盖**：`filelist.xml` 里能否把 `.lua` / `.cs` / `.dll` 登记成 `<Other>`（ContentTypes 里 `Other` 是合法内容类型、且 "Alternate names: None"，但没有任何一页说这些文件需要/不需要登记）。

---

### B.4 Override（权威） + 「覆盖原版是否要重供本地化键」的核实

**来源**：`https://regalis11.github.io/BaroModDoc/Intro/Overrides.html`（小节「Overrides」）；辅助来源 `/ContentTypes/Item.html`（小节「Attributes」的 `identifier` 条目）、`/Misc/Troubleshooting.html`（第 4 个 FAQ）。

| 问题 | 文档结论 | 原文/出处 |
|---|---|---|
| 用什么语法 | `<Override> … </Override>` 包裹要覆盖的元素 | Overrides「Overrides」示例 |
| 匹配依据 | **identifier 相同**；"This is also true of **most other content types**" | Overrides「Overrides」 |
| 能覆盖什么 | 原版内容；**也能覆盖另一个 mod 的内容** | Overrides「Overrides」第二例 |
| 覆盖时要注意 | "**make sure to include all the tags and child elements of the original item**"（否则新物品不会像原版那样工作） | Overrides「Overrides」 |
| 不写 override 会怎样 | **整个 mod 会被游戏禁用**，报错原文 "Failed to add the prefab X from MyMod: a prefab with the same identifier from OtherMod already exists; try overriding"；解法是改 identifier 或包 `<override>` | Troubleshooting 第 4 条 |
| **覆盖原版内容是否需要重新提供本地化键？** | **文档未直接说明 → 「文档未覆盖」** | Overrides 全页无本地化内容 |

**能由文档机制推出的结论（不是原文，标明为推断）**：
`/ContentTypes/Item.html`「Attributes」原文说：名字/描述是**按 identifier 去 Text 文件里查 `entityname.[identifier]` / `entitydescription.[identifier]`**。
→ 因为 override **不改变 identifier**，而原版 Text 文件里本来就有 `entityname.<原 identifier>`，所以**"覆盖原版且继续用原版显示名"时，mod 确实不需要再提供该键**。
→ **但反过来不成立**：如果覆盖后想**改名**（或想改描述），就必须**自己提供** `entityname.<identifier>`（或 `descriptionidentifier` 指向的键），
否则玩家看到的仍是原版文本。文档没有一句话保证"override 就自动继承 mod 自己的本地化"，这是**机制推断，不是文档明文**。

**本机证据（补强，非文档）**：
- `afflictionname.` / `afflictiondescription.` 前缀在**原版语言文件里真实存在**：`F:\SteamLibrary\steamapps\common\Barotrauma\Content\Texts\English\EnglishVanilla.xml`（如 L5540 `<afflictionname.bleeding>Bleeding</afflictionname.bleeding>`），共 311 处（含 `.low`/`.high`/`.self` 变体）。
  来源：对 `Content/Texts/English` 的 grep。
- `eventtext.` 前缀在**原版事件文件里真实被引用**：如 `Content/Events/MissionEvents.xml:7` `text="EventText.missionevent_killmonster.c1"`（键名大小写混用：`EventText.` / `eventtext.`），共 1957 处命中。
  来源：对 `Content/Events` 的 grep。
- `character.` 前缀有**文档明文**（Character 页 `DisplayName` 条目里的 `<character.crawler>Crawler</character.crawler>`）。
- `entityname.` / `entitydescription.` 前缀有**文档明文**（Item 页 `identifier` 条目）。
- **`afflictionname.` / `afflictiondescription.` / `eventtext.` 这三个前缀文档未直接写出** → 属于「文档未覆盖，但有官方文件实例」。

---

## C. 与现有插件的差异清单

对照文件：`E:\Desktop\001\_barotrauma_tool\src\validate.ts`、`src\l10n.ts`、`src\xml.ts`（另涉 `src\util.ts`、`src\events.ts`、`src\items.ts`、`src\characters.ts`）。

### C.1 ✅ 一致（文档支持插件的做法）

| # | 插件做法（位置） | 文档支持 |
|---|---|---|
| 1 | `xml.ts:24-34` 的 `CONTENT_TAGS` 用 `Item`/`Character`/`RandomEvents`/`Text`/`Afflictions`/`Sounds`/`Particles`/`Submarine`/`Other` | 9 个全部出现在 ContentTypes「Content types」清单里 ✔ |
| 2 | `xml.ts:39-56` `buildFilelist` 只写 `name`/`modversion`/`corepackage`/`gameversion` 四个属性 | 与 ContentPackages「File list」列的 4 个属性**完全一致** ✔ |
| 3 | 子元素写成 `<Tag file="%ModDir%/…" />` | 与 ContentPackages「File list」官方示例写法一致 ✔ |
| 4 | `xml.ts:113-119` `entityname.<id>` / `entitydescription.<id>` | Item 页「Attributes」`identifier` 条目**明文给了这两个 tag** ✔ |
| 5 | `xml.ts:133-135` `character.<SpeciesName>`；`l10n.ts:172-182` 有 `DisplayName`/`SpeciesTranslationOverride` 就跳过 | Character 页「Root element attributes」明文：DisplayName 留空时用 Text 文件（例 `<character.crawler>`）；SpeciesTranslationOverride 是复用别的物种的 Text ✅ |
| 6 | `l10n.ts:89-95,134` `<override>` 根文件不产生本地化需求 | **文档未覆盖**；但由 Item 页"identifier → `entityname.[identifier]`"机制可推出成立（前提：想要原版名）。见 C.2 #8 的限定条件 |
| 7 | `l10n.ts:142-152` `name=""` → 需要 `entityname.<id>`；`name` 非空 → 跳过 | Item 页「Attributes」`name` 条目：硬编码 name 只在"identifier 没在 Text 文件里找到"时才用 → 插件方向正确 ✔（但优先级有细节，见 C.2 #9） |
| 8 | `validate.ts:563-570` `<RequiredItems type="Contained">` 必须配 `<ItemContainer>` | StatusEffect 页「Elements」：`requireditems` = `requireditem` 的别名；RelatedItem 页说明它用于"容器里得有什么"→ 方向正确 ✔（但正则漏了单数，见 C.3 #1） |
| 9 | `validate.ts:82-83,93` 认为 `Lua/`、`CSharp/`、`bin/`、`Ragdolls|Animations|Names` 不需要 filelist 登记 | **BaroModDoc 完全没有这些页** → 文档未覆盖；但文档侧**不矛盾**：ContentTypes 清单里没有这些类型（所以它们不可能作为 filelist 子元素被登记），Character 页说明 `ragdolls`/`animations`/`names` 是**由角色 XML 引用目录/文件**的方式加载 ✔（间接） |
| 10 | `validate.ts:584-593` 报 identifier 重复 | Troubleshooting 第 4 条**确实**把 identifier 撞车列为导致 mod 被禁用的原因 → 这个检查点方向正确 ✔（但严重度与文案要改，见 C.3 #2） |
| 11 | `l10n.ts:202-226` 语言文件**按内容**（`<infotexts>` 根）识别，而不是只认 filelist 的 `<Text>` | ContentTypes「Text」页信息极少，说明 Text 内容类型本身没有强结构约束；按 `<infotexts>` 识别比按 filelist 标签更稳 ✔（文档未否定） |
| 12 | `validate.ts:82-83` 把 `modconfig.xml`/`runconfig.xml` 排除 | ContentTypes「Content types」清单里没有这两个名字 ✔（不属于内容包体系） |

### C.2 ⚠️ 文档有补充（插件规则不完整，该补什么）

| # | 插件现状（位置） | 文档补充 | 建议补什么 |
|---|---|---|---|
| 1 | `validate.ts` 校验 filelist 时**只**检查 `name`/`gameversion`/文件是否存在（`424-431`），**从不校验子元素名是否合法** | ContentPackages「File list」：子元素名"**must be one of the content types**" | 用 B.1 的 45 项白名单校验每个 filelist 记录的 tag，非法即报 major（这是**整包加载失败**级错误） |
| 2 | `xml.ts:24-34` 只覆盖 9 种内容类型 | B.1 共 45 种 | 至少补：`Structure`、`Jobs`、`Talents`、`TalentTrees`、`Missions`、`ItemAssembly`、`NPCSets`、`OutcastConfig`…（生成器要能出这些类型时） |
| 3 | `validate.ts:250-283` `checkConditionals` **只查运算符值与 comparison 值**，不查属性名 | Conditional 页「Attributes」给了完整属性名表 + `EntityType` 的 5 个允许值 + `SkillRequirement` 的互斥规则 | 增加：属性名白名单（Property/affliction id 之外）、`EntityType` 取值校验、`SkillRequirement` 时属性名应为技能 id |
| 4 | `validate.ts:271-281` 只把 `comparison`/`conditionalcomparison` 当作同一个东西校验 | StatusEffect 页「Attributes」的正式名是 **`conditionalComparison`**（`Comparison`，And/Or，文档标默认 `Or`）；而 `comparison` 在 Conditional 页**根本没出现** | 保留接受 `comparison`（本机证据，见 C.4 #1），但注释里明确"文档正式名是 conditionalComparison"；可考虑当两者都**没写**时给一条提示（文档声称默认 Or） |
| 5 | `validate.ts:228-235` 运算符表**收录了 `l`/`le`/`g`/`ge`** | Conditional 页运算符表**没有**这 4 个 | `ge` 有原版实例（C.4 #2）→ 保留但标注"文档未列"；`l`/`le`/`g` 文档与原版内容**都没出现** → 建议删除或降级为 minor |
| 6 | `validate.ts:146-204` `checkXmlStructure` 不检查"同元素内属性名唯一"与"只能有一个根元素" | XML 页「Barotrauma-specific notes」把这两条列为硬约束 | `<A/><B/>` 这种双根目前**查不出来**（两个自闭合都不会进栈）；重复属性名也不查 → 两条都该加（都是 blocker 级） |
| 7 | `util.ts:242-260` `pathsInAttributeValue` **只认 `%ModDir%/`**；`validate.ts:532` 也只剥 `%ModDir%/` | XML 页「Barotrauma-specific notes」明确有 `%ModDir:[MOD NAME]%` 语法 | 支持 `%ModDir:[NAME]%`：要么解析出"另一个 mod"并做跨 mod 检查，要么显式跳过并给提示（目前是**静默忽略**，既不报错也不检查） |
| 8 | `l10n.ts:89-95` 用"根元素是 `<override>`"整文件免除本地化需求 | Overrides 页**没有**任何本地化条款（文档未覆盖）；Item 页机制上只能保证"**沿用原版 identifier 的键**" | 免除逻辑要**加前提**：只有当覆盖后的显示名仍指向原 identifier 的键时才免除。若 `<override>` 里的实体写了 `name="非空"` 或 `nameidentifier=`，应照常提示/记录；并在注释里写清"这是机制推断，非文档明文" |
| 9 | `l10n.ts:143-152` 的判定是"有 `name=""` 就要键，`name` 非空就跳过" | Item 页「Attributes」给了**完整优先级**：`nameidentifier` > `fallbacknameidentifier` > Text 文件里的 `entityname.<id>` > `name` | 补：识别 `descriptionidentifier`（当前只在 `145` 行认了 nameidentifier / fallbacknameidentifier）；对 `name` 非空的实体，若**任意**语言文件里已存在 `entityname.<id>`，应提示"硬编码 name 会被 Text 文件覆盖" |
| 10 | `l10n.ts:157-170` 只认 `<Affliction>` 且要求有 `maxstrength` 才算定义 | Afflictions 页：**元素名决定类型**（`<Affliction>` / `<AfflictionPrefabHusk>` / `<AfflictionBleeding>`）；且有 `TranslationOverride`（复用别的 affliction 的名字与描述） | 补 `<AfflictionPrefabHusk>` / `<AfflictionBleeding>`；补 `TranslationOverride` 时**跳过**本地化需求（与角色的 SpeciesTranslationOverride 对称） |
| 11 | `items.ts:89-101,199-238` 写 `<Attack …><Affliction …/></Attack>` | Attack 页「Elements」表**只列** `particleemitter`/`sound`/`statuseffect`，**没列 `affliction`** | 文档很可能漏列（真实 mod `SmartPistol` 与插件都这么写，见 C.4 #3）→ 插件**不必改**，但应在 `reference.md`/注释里注明"文档未列，依赖真实文件" |
| 12 | `items.ts:752,799-801` 写 `<Effect minstrength= maxstrength= strengthchange= />` | Afflictions 页「Effect」：`MinStrength=0`、`MaxStrength=0`、`StrengthChange=0`；且原文要求**各 Effect 区间不得重叠**（"their ranges should be defined with no overlap"） | 属性名与文档一致 ✔；**建议补**：生成/校验时检查区间重叠（当前 `["0-5:10","5-200:0"]` 写法在 5 处是**边界重叠**，按文档严格说应避免） |
| 13 | `events.ts:151-158` 的 `EventSet` **没有 `additive`** | ScriptedEvents 页「Triggering events → Event sets」：additive 示例 + "**which is often how mods should configure events**"；`/ContentTypes/RandomEvents.html`「EventSet」把 `Additive` 默认值记为 `false` | 事件生成器**默认应输出 `additive="true"`**（否则会和原版事件集互斥/冲突，这正是文档点名要避免的） |
| 14 | `events.ts:151-156` 用的 `leveltype` / `locationtype` / `onceperoutpost` | **`/ContentTypes/RandomEvents.html` 的 EventSet 自动表里没有这三个属性**；但 ScriptedEvents 页官方示例在用 `leveltype`/`locationtype`，真实 mod 用 `onceperoutpost` | 文档自身不一致 → 保留现状（有官方正文示例 + 本机实例支持），但在注释里注明"自动生成表未列" |
| 15 | `characters.ts` 只生成单一物种文件（无变体支持） | Character 页「Variants」：`VariantOf`/`Inherit`、`<Charactervariant inherit=…>`、variant 专属 `<Ragdoll Folder|Path>` 与 `<Attack DamageMultiplier/RangeMultiplier/ImpactMultiplier>` | 需要变体时可补参数（当前不支持 = 不完整，但不产生错误） |
| 16 | `items.ts` 的 `category` 值是自由字符串 | Item 页给了 `category` 的 **12 个允许取值** | 校验/提示 category 取值（拼错 category 会导致商店/编辑器分类不对） |
| 17 | `validate.ts` 无任何"编辑器/性能"类提示 | Troubleshooting 第 1 条：**改了 filelist 后必须重启游戏**；Performance 页：`Always` 最差、默认 `interval=0` 每帧执行、`OnContaining` 优于 `RequiredItem` 每帧检查 | 在 validate 输出的 `warnings` 里加"改了 filelist 后必须重启游戏"；可选加扫 `<StatusEffect type="Always">` 与缺 `interval` 的高频效果，给 minor 性能提示 |

### C.3 ❌ 冲突 / 插件可能错（文档与插件矛盾）

| # | 插件代码 | 文档原文 | 判定与理由 |
|---|---|---|---|
| 1 | `validate.ts:563` 正则 `<RequiredItems\b[^>]*\btype\s*=\s*"Contained"` —— **只认复数 `<RequiredItems>`** | StatusEffect 页「Elements」：**"requireditems: Alias of 'requireditem'. Functionally identical."** | **插件漏检**：真实 mod 用单数 `<RequiredItem identifier="coilgunammo" type="Contained" />`（已在 `reference.md` B.4 记录）→ 单数写法**永远不会**触发 `AMMO_CONTAINER_MISSING`。**应改成 `<RequiredItems?\b`** |
| 2 | `validate.ts:589` 文案：identifier 重复"**后一个会覆盖前一个**" | Troubleshooting 第 4 条：报错是 "Failed to add the prefab X … try overriding"，且**"the game now disables mods with such errors"** | **文案与严重度都错**：不是"覆盖"，是**整个 mod 被禁用**；`severity: 'major'` 应改为 `'blocker'`（因为后果是 mod 根本启用不了），并提示解法（改 identifier 或包 `<override>`） |
| 3 | `validate.ts:82-83` 的 `NO_REGISTRATION_NEEDED` 里 `assets/(content|config)/` **把这两个目录下的一切**都当成"不需要登记" | ContentPackages「File list」：**每个要加载的内容 XML 都必须登记**，子元素名必须是内容类型 | **过度豁免**：只要有人在 `Assets/Content/` 下放一个真的内容 XML，插件会**静默放过**（连"漏登记"都不报）。建议收窄成精确匹配 `modconfig.xml` / `runconfig.xml`，别按目录整片豁免 |
| 4 | `validate.ts:82-83` 同样整片豁免 `config/` | 同上 | 同类问题：`Config/` 目录下的 XML 会被无条件放过 |
| 5 | `validate.ts:228-235` 收录 `l` / `le` / `g` | Conditional 页运算符表**没有**这三个 | 文档不支持；本机原版 Content 与 LocalMods 也都**没查到**用它们（只查到 `ge`）→ 插件把**拼错的运算符当成合法**，会让真错静默通过。**应删掉或降级** |
| 6 | `l10n.ts:89-95` + `l10n.ts:133-134`：**任何** `<override>` 文件都**完全不产生**本地化需求 | Overrides 页无本地化条款；Item 页只说名字是按 `identifier` 去 Text 文件查 | **可能漏报**：覆盖原版后**想改名**的作者如果不自己提供 `entityname.<id>`，插件不会提醒（游戏里显示的还是原版名）。文档没有"override 免本地化"的说法 → 这条"不需要"的结论**没有文档支撑**，只是机制推断，应在代码注释与文档里如实标注 |
| 7 | `l10n.ts:104-108` 把 `<override>` 里嵌套的 `<Item>` 也算"待翻译定义" | 同上 | 与 #6 同一根因（先 `continue` 掉了整文件）。若按 #6 修正，这里也要一起改 |

### C.4 本机证据（支撑"文档未提及但插件做法有实例"）

| # | 结论 | 本机证据（来源：grep 本机磁盘，**非文档**） |
|---|---|---|
| 1 | `comparison="and|or"` 在引擎里**确实**是常用属性，且**只见到 and/or**（含大小写 `And`/`AND`/`or`/`OR`），可用在 `StatusEffect`、`conditionalsprite`、`TriggerComponent`、`DecorativeSprite` 上 | `Content/**` 下该正则命中 **2611** 处（例：`Content/Afflictions.xml:614` `comparison="and"`、`Content/input.xml:2627` `IsActiveConditionalComparison="Or"`、`Content/alienitems.xml:737` `<DecorativeSprite … comparison="and">`）；`LocalMods/**` 命中 **9182** 处（例：`ACAProjectEndfield/Characters/Humanhusk/Ragdolls/HumanHuskDefaultRagdoll.xml:9` `<conditionalsprite comparison="and" exclusive="true">`）。→ 插件同时接受 `comparison` 与 `conditionalcomparison` 是**对的**，但文档只正式列了 `conditionalComparison` |
| 2 | `ge` 运算符**原版内容自己在用** | `Content/Talents/Security/TalentsSecurity.xml:221` `<Conditional maxhealth="ge 1000"/>`、`:232` `maxhealth="ge 5000"`；`LocalMods/ACAWeaponsExpand/…/TalentsSecurity.xml:222,233` 同（另有 `LocalMods/TalentTreesReBuild/…`）。→ 文档运算符表**漏了 `ge`**；`l`/`le`/`g` 则查无实例 |
| 3 | `<Attack>` 下直接写 `<Affliction>` 是真实写法 | `LocalMods/SmartPistol/SmartPistol.xml:43-47` `<Attack structuredamage="10" …><Affliction identifier="gunshotwound" strength="24" /></Attack>`；插件 `items.ts:199-201` 同。→ Attack 页 Elements 表未列 `affliction` 应视为**文档遗漏** |
| 4 | `afflictionname.`/`afflictiondescription.`/`eventtext.` 前缀真实存在 | `Content/Texts/English/EnglishVanilla.xml`（`afflictionname.*` 共 311 处命中）；`Content/Events/**` 引用 `EventText.*`/`eventtext.*` 共 1957 处命中。→ 三个前缀**文档未直接写出**，但插件用的前缀有官方文件实例 |
| 5 | `Ragdolls`/`Animations`/`Names` 都不用登记 filelist | Character 页说明这三个元素指向**目录/文件**；ContentTypes 清单里没有对应内容类型 → 它们确实不走 filelist。插件 `validate.ts:93` 的豁免有依据 |
| 6 | `Lua/Autorun`、`CSharp/{Shared,Client,Server}`、`bin/<Client|Server>` 不必登记 filelist | **BaroModDoc 完全没有这些页**（15 页 Topics 导航里没有 Lua/C# 条目）→ 文档未覆盖。插件之所以成立，靠的是 **LuaCsForBarotrauma 官方文档**（`reference.md` A.1/A.4 已引），不是 BaroModDoc |

---

## D. 给插件的具体改进建议（按优先级）

1. **`src/validate.ts:563` 支持 `RequiredItems` 的别名 `RequiredItem`**
   - 改动：`/<RequiredItems?\b[^>]*\btype\s*=\s*"Contained"/i`
   - 依据：StatusEffect 页「Elements」"requireditems: Alias of 'requireditem'. Functionally identical."；本机 `ACAWeaponsExpand/Items/Heavy_Weapons.xml:47` 用单数。
   - 影响：目前单数写法**完全不会被检查**（漏报）。

2. **`src/validate.ts:584-593` 改 identifier 撞车的严重度与文案**
   - 改动：`severity: 'major'` → `'blocker'`；文案改为"**同 identifier 被定义两次且都没标 `<override>`，游戏会直接禁用这个 mod**（不是后者覆盖前者）"，并给出解法。
   - 依据：Troubleshooting 第 4 条（含官方报错原文）。

3. **`src/validate.ts` 增加 filelist 子元素名白名单校验**
   - 改动：在 `424-431` 附近新增：把 B.1 的 45 个内容类型建成 `Set`，对 `doc.entries` 里每个 `tag` 做校验，非法 → `blocker`，文案引 ContentPackages「File list」原句。
   - 依据：ContentPackages「File list」"The name of each of these child elements **must be one of the content types**"。
   - 影响：拼错的标签目前**静默通过**，而后果是整包加载失败。

4. **`src/validate.ts:228-235` 清理运算符表**
   - 改动：保留 `ge` 但加注释「文档未列，原版 `Content/Talents/Security/TalentsSecurity.xml:221` 有实例」；**删除** `l`/`le`/`g`（文档无、本机无实例），或把它们降级为独立 `minor` 提示「这是非文档写法，建议改用 lt/gte」。
   - 依据：Conditional 页「Comparison operators」全表。

5. **`src/util.ts:242-260` + `src/validate.ts:532` 支持 `%ModDir:[MOD NAME]%`**
   - 改动：路径解析加入 `%ModDir:NAME%` 形态；能定位到同 LocalMods 下的兄弟 mod 就走 `ASSET_CROSS_MOD` 逻辑，定位不到就报 `minor`「引用了另一个 mod 的资源，无法静态校验」。
   - 依据：XML 页「Barotrauma-specific notes」原文给了这个语法；当前实现会**静默忽略**这种路径。

6. **`src/validate.ts:146-204` 补 XML 硬约束**
   - 改动：新增 (a) 同一元素内属性名重复 → blocker；(b) 顶层出现第二个根元素（如 `<A/><B/>`）→ blocker。当前 `stack` 检查**都抓不到**。
   - 依据：XML 页「Barotrauma-specific notes」两条硬约束。

7. **`src/events.ts:151-158` 的 `EventSet` 默认加 `additive="true"`**
   - 改动：加一个 `additive` 参数（默认 true），拼进 `<EventSet …>`。
   - 依据：ScriptedEvents 页「Triggering events → Event sets」"Making an event set additive is simply just a matter of setting the attribute `additive` to true" + "which is often how mods should configure events"。

8. **`src/l10n.ts` 的 override 豁免加限定**
   - 改动：`89-95`/`133-134` 保留"整文件默认免除"，但 (a) 注释里写明"**这是机制推断**（Item 页：名字按 identifier 查 `entityname.[identifier]`），**文档未直接覆盖**"；(b) 若 `<override>` 里的实体显式写了 `name="非空"` 或 `nameidentifier=`，仍然记录/提示。
   - 依据：Overrides 页全文无本地化条款；Item 页「Attributes」`identifier` 条目。

9. **`src/l10n.ts:145` 补 `descriptionidentifier`，`:157-170` 补 Husk/Bleeding 与 `TranslationOverride`**
   - 依据：Item 页「Attributes」（`descriptionidentifier`）；Afflictions 页「AfflictionPrefab」（元素名决定类型、`TranslationOverride` 复用名字与描述）。

10. **`src/validate.ts:82-83` 收窄目录级豁免**
    - 改动：去掉 `assets/(content|config)/` 与 `config/` 的整片豁免，改为精确文件名（`modconfig.xml`、`runconfig.xml`）。
    - 依据：ContentPackages「File list」要求登记每个要加载的内容 XML；文档里**不存在**"某目录整片免登记"的说法。

11. **`src/validate.ts` 输出层加两条「非问题但必须知道」的 warning**
    - (a) 「改了 filelist.xml（新增/改文件名）后**必须重启游戏**才会生效」——依据 Troubleshooting 第 1 条。
    - (b) 性能提示：`<StatusEffect type="Always">` 或缺 `interval` 的持续型效果是每帧执行，能用 `OnContaining` + `<Containable>` 就别用每帧 `<RequiredItem>` ——依据 Performance 页「ActionType」「Interval」「Containables」。

12. **`src/xml.ts:24-34` 的 `CONTENT_TAGS` 扩容**
    - 改动：按 B.1 补 `Structure`、`Particles` 之外的常用项（`Jobs`、`Talents`、`TalentTrees`、`Missions`、`ItemAssembly`、`NPCSets`、`OutpostConfig` 等），供后续生成器复用。
    - 依据：ContentTypes「Content types」45 项清单。

13. **`src/items.ts` 的 `category` 加白名单提示**
    - 依据：Item 页「Attributes」`category` 的 12 个取值。

---

## 附录：文档明确「未覆盖」的清单（本参考里出现过的）

| 主题 | 查过的页 | 结论 |
|---|---|---|
| `Lua/Autorun`、`CSharp/{Shared,Client,Server}`、`bin/<Client\|Server>` 的加载约定 | BaroModDoc 全站 Topics 导航（15 页） | **文档未覆盖**（须看 LuaCsForBarotrauma 官方文档） |
| `ModConfig.xml` | 同上 | **文档未覆盖** |
| `Ragdolls`/`Animations`/`Names` 要不要登记 filelist | ContentTypes、Character、ContentPackages、XML | **文档未覆盖**（只能从句法推断"它们是角色 XML 引用的目录/文件"） |
| 语言文件结构（`<infotexts>`、`language`、`nowhitespace`、`translatedname`） | `/ContentTypes/Text.html`（内容极少）、全站无本地化专文 | **文档未覆盖** |
| `afflictionname.` / `afflictiondescription.` / `eventtext.` 三个键前缀 | Conditional/StatusEffect/Afflictions/ScriptedEvents/Text 均未写出 | **文档未覆盖前缀**（有官方文件实例：311 / 1957 处） |
| 覆盖原版后是否需要重供本地化键 | Overrides 页全文 | **文档未覆盖**（只有 Item 页的 identifier→entityname 机制可推断） |
| `Content/...` 原版资源引用语法 | `/Intro/XML.html`（只讲 `%ModDir%` 与 `%ModDir:[NAME]%`） | **文档未覆盖** |
| filelist 的 `steamworkshopid` / `installtime` / `expectedhash` | ContentPackages | **文档未覆盖**（本机真实存在） |
| `compare` 之外的 `comparison` 属性 | Conditional 页无；仅 StatusEffect 页有 `conditionalComparison`；`comparison` 只在本机内容里大量出现 | **`comparison` 文档未覆盖**（本机 2611 + 9182 处实例） |
| `leveltype` / `locationtype` / `onceperoutpost` | `/ContentTypes/RandomEvents.html` 的 EventSet 表未列；ScriptedEvents 页正文示例在用 | **文档自相矛盾**（正文有、自动表无） |
| `Attack` 下的 `Affliction` 子元素 | Attack 页 Elements 表未列 | **文档很可能漏列**（本机 `SmartPistol` 实例） |
| `type="Contained"` 这类 RequiredItems 的 `type` 取值 | RelatedItem 页未列取值 | **文档未覆盖** |
| `Quality` 的 `stattype`（如 `FirepowerMultiplier`） | `/Misc/StatTypes.html` 是角色 StatTypes，无该值 | **文档未覆盖** |
| 引擎源码级确认（运算符别名的实现） | `raw.githubusercontent.com` / `github.com` / `cdn.jsdelivr.net` 均被拒绝（非公开 IP） | **取不到**（已在开头标注） |
