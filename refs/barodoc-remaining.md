# BaroModDoc 补漏摘录：剩余页面逐条要点 + 五张机读清单 + 与本插件实现对照

> **用途**：补齐 `refs/barodoc-reference.md` 遗漏或需要深挖的官方文档页面，重点产出**机读可用**的元素名 / 属性名 / 枚举取值全表。
> **来源站**：`https://regalis11.github.io/BaroModDoc/`
> **抓取方式**：本次会话用 `web_fetch` 逐页取，**本文件所有结论都来自本次实际抓到的页面**。
> **游戏版本**：1.13.4.0（本机 `F:\SteamLibrary\steamapps\common\Barotrauma`）。
>
> **本次抓到（HTTP 200，全部成功，共 27 页）**
> - 任务列出的 15 页：`/Intro/XML.html`、`/Intro/Publishing.html`、`/Misc/StatusEffect.html`、`/Misc/ScriptedEvents.html`、
>   `/Misc/StatTypes.html`、`/Misc/RelatedItem.html`、`/Misc/Attack.html`、`/Misc/Explosion.html`、`/Misc/Performance.html`、
>   `/ContentTypes/Character.html`、`/ContentTypes/Afflictions.html`、`/ContentTypes/Text.html`、`/ContentTypes/RandomEvents.html`、
>   `/ContentTypes/Other.html`、`/ContentTypes/Structure.html`
> - **新发现的页面（上一份参考完全没抓）**：`/EventActions/` 下的 12 页 —— `SpawnAction`、`TagAction`、`ConversationAction`、
>   `CheckConditionalAction`、`TriggerAction`、`WaitAction`、`FireAction`、`AfflictionAction`、`StatusEffectAction`、
>   `GiveExpAction`、`ClearTagAction`、`CheckItemAction`、`GoTo`、`MessageBoxAction`
> - 这 12 页是从 `/Misc/ScriptedEvents.html` 的「Event actions」链接清单里发现的：**每个 EventAction 都有独立页 + 完整属性表**。
>
> **404 / 取不到的（明确标注，不脑补）**
> - `https://regalis11.github.io/BaroModDoc/EventActions/Option.html` → **HTTP 404**（`Option` 是 `ConversationAction` 的子元素，
>   没有独立文档页；其属性只能从 `/Misc/ScriptedEvents.html`「Examples」的示例里读出：`text`、`endconversation`）。
> - 引擎源码（`github.com/Regalis11/...`）**本次未尝试抓取**：这些链接在 `/ContentTypes/*` 页里只是 "Relevant files" 参考链接，
>   与本次「文档正文」任务无关。
> - 本次**没有**重复抓 `/Misc/Conditional.html`、`/Intro/ContentPackages.html`、`/Intro/ContentTypes.html`、`/Intro/Overrides.html`、
>   `/ContentTypes/Item.html`、`/Misc/Troubleshooting.html`、`/Editors/SubmarineEditor.html`（上一份 `barodoc-reference.md` 已逐条摘录）。

---

# A. 逐页要点

## A.1 `/Intro/XML.html` —「XML」+「Barotrauma-specific notes」

**机制**：Barotrauma 内容全部用 XML 描述。元素 = 开闭标签；可有属性；可有子元素；无子元素时可 `/>` 自闭合；
可选编码声明 `<?xml version="1.0" encoding="utf-8"?>`；`<!-- -->` 注释被忽略。

**硬约束（原文，小节「Barotrauma-specific notes」）**：
| 约束 | 原文要点 |
|---|---|
| **只能有一个根元素** | "There may be only one root element (excluding the encoding declaration mentioned above). … the files shouldn't have multiple elements on the first level, but it's completely fine to have multiple elements on the lower levels in the hierarchy." |
| **同元素内属性必须唯一** | "All the attributes of an element must be unique." |
| **路径变量 `%ModDir%`** | "the game will interpret the string `%ModDir%` as the directory your mod is contained in. **This is required** to allow mods to be moved to different directories when they're installed through Steam Workshop, or downloaded through a server." |
| **跨 mod 路径变量 `%ModDir:[MOD NAME]%`** | "To reference files in other mods, you may use strings of the form `%ModDir:[MOD NAME]%`, where `[MOD NAME]` is replaced with the other mod." |

**本页明确没写的**：
- **没有**任何关于「属性名大小写是否敏感」的条款 → **属性大小写 = 文档未覆盖**。
- **没有**任何关于「数字/枚举怎么写」的条款（无 `0.5f` 后缀、无浮点/整数格式说明）→ **文档未覆盖**。
- **没有** CDATA 的说明（`<![CDATA[ ]]>` 本页未出现）→ **文档未覆盖**（本插件 `validate.ts:64` 主动剥离 CDATA 属于自选策略，无文档依据但也无冲突）。
- **没有** `Content/...`（原版资源引用）的说明 → **文档未覆盖**。

**常见坑**：多根元素、重复属性名是文档**明文禁止**的；写错不是"警告"而是加载失败。

---

## A.2 `/Intro/Publishing.html` —「Publishing to Steam Workshop」+「Local vs. Workshop mods」

- 通过游戏内 modding 菜单的 **「Publish」标签**发布；**发布不是开服的必须条件**（"this isn't required to host servers with mods, as players will be able to download any required mods directly from your server"）。
- 点 Publish 前要填：description、预览图（"select a preview image"）、tags、change note、"choose who gets to see it"（可见性）。
- 点 Publish 后：上传到 Workshop → 自动安装 → 必要时弹 Steam Subscriber Agreement。
- **Local vs. Workshop（重要）**：发布后「Installed Mods」里会有**两个版本**（LocalMods 本地版 + 工坊版）。
  官方解释：本地可以继续改，同时仍能用"上次发布到工坊的版本"开服；也防止游戏在你允许别人提交更新时**误覆盖你的本地改动**。
- **文档未覆盖**：预览图的**文件名规范**（如 `PreviewImage.png`）、filelist 里的 `steamworkshopid` / `installtime` / `expectedhash` / `hidden` 等字段，本页**一个都没提**。

---

## A.3 `/Misc/StatusEffect.html` —「StatusEffect」「ActionType」「TargetType」「Attributes」「Elements」

**机制**：三个术语必须分清 —— **执行者 entity**（定义 StatusEffect 的物品/角色）、**Type**（何时执行）、**target**（作用于谁）。
文档明说："status effects can modify any **property** of the target entity"。

**`type`（ActionType）全部取值 → 见 B.1**（27 个，原文逐条带"仅物品/仅角色/仅肢体/仅门"限制）。

**`target`（TargetType）全部取值 → 见 B.2**（12 个）。关键补充：
- `Parent`：物品语境 = 装着它的容器；肢体语境 = 它所属的角色。
- `Contained`：**执行者**（物品）容器里的物品。
- `NearbyCharacters` / `NearbyItems`：范围由 `Range` 决定。
- `Limb`：角色时用 **`targetLimbs`**（属性名，原文如此）指定是哪条肢体。
- `LinkedEntities`：**仅物品有效**。

**Attributes 全表（原文照抄，含默认值；这份表比上一份参考更完整）**：

| 属性 | 类型 | 默认值 | 说明（要点） |
|---|---|---|---|
| `OnlyInside` | bool | false | 只有执行者在 hull 内才执行 |
| `OnlyOutside` | bool | false | 只有执行者在 hull 外才执行 |
| `OnlyPlayerTriggered` | bool | – | 只有**玩家控制的角色**造成伤害时才执行；**仅角色 + 仅 `OnDamaged`** |
| `AllowWhenBroken` | bool | false | 物品已损坏（0 condition）时是否仍允许执行 |
| `Interval` | float | 0 | 执行间隔。**delay 与 interval 的区别**：delay 在 Apply 时立刻找目标/查条件、只是延后生效；interval 在 Apply 时**先判断间隔到没到，没到就什么都不做**。"Using this is preferred for performance reasons." |
| `Duration` | float | 0 | 持续多少秒。**若 Stackable=true 会同时跑多份**；"if the effect has a duration and executes every frame, you probably want to make it non-stackable" |
| `disableDeltaTime` | bool | false | true = 值按"每帧"而非"每秒"（用于一次性效果：开火/爆炸） |
| `setValue` | bool | false | true = 赋值（而不是加减） |
| `Stackable` | bool | true | **仅当有 duration 或 delay 时有效**；已在生效时能否再叠一份 |
| `ResetDurationWhenReapplied` | bool | true | **仅当非 stackable 且有 duration**；重附时是否重置时长 |
| `CheckConditionalAlways` | bool | false | **仅当有 duration/delay**；条件是在触发时只查一次，还是整个持续期都查/延迟到点时再查 |
| `TargetItemComponent` | string | Empty | 填目标某个 ItemComponent 名则只作用于该组件；**仅物品** |
| `TargetSlot` | int | -1 | 目标必须在的槽位索引；**仅目标为 Contained 物品时** |
| `Range` | float | 0 | 目标离执行者要多近；**仅 NearbyCharacters / NearbyItems 时有效** |
| `Offset` | Vector2 | Zero | 效果执行位置偏移（对粒子/爆炸/生成/声音有意义） |
| `RandomOffset` | float | 0 | 随机方向偏移量 |
| `SeverLimbs,severlimbsprobability` | float | 0 | 切断被本效果伤害的肢体的概率；**仅目标为角色或肢体时** |
| `EventTargetTag` | Identifier | Same as `triggeredEventTargetTag` | 触发脚本事件时，把本效果 target 以该 tag 加入事件目标 |
| `EventEntityTag` | Identifier | Same as `triggeredEventEntityTag` | 触发脚本事件时，把**执行者**以该 tag 加入事件目标 |
| `EventUserTag` | Identifier | Same as `triggeredEventUserTag` | 触发脚本事件时，把**使用者**（用物品的角色）以该 tag 加入事件目标 |
| `spawnItemRandomly` | bool | false | true = 从"本效果配置的多个生成物"里**随机挑一个**，而不是全生成 |
| `multiplyAfflictionsByMaxVitality` | bool | false | 造成的 affliction 强度是否与角色最大生命值成正比 |
| `UnlockRecipe` | Identifier | `""` | 给**整个船队**全局解锁一条制造配方 |
| `delay` | float | 0.0 | 延迟生效 |
| `tags` | string[] | – | 任意 tag（可多个），供 Conditionals 用 `HasStatusTag` 查"某个 StatusEffect 是否在跑" |
| `conditionalComparison` | `Comparison` | **`Or`** | **And / Or**。含义："Do all of the Conditionals defined in the effect be true for the effect to execute, or should the effect execute when any of them is true?" |
| `Any property of the target` | Any | – | "These are the meat of the StatusEffects." 任何目标实体的属性名都能写；默认**加/减**，`setValue` 才是赋值；**若目标没有该属性名，该属性什么也不做** |

> ⚠️ **`comparison` vs `conditionalComparison`（重要核实）**：
> - `/Misc/StatusEffect.html`「Attributes」里**只有 `conditionalComparison`**（类型 `Comparison`，默认 `Or`，取值 And/Or）。本页**没有**叫 `comparison` 的属性。
> - 本机内容里 `comparison="and|or"` 大量存在（上一份参考统计：原版 2611 处 / LocalMods 9182 处），但**文档未覆盖 `comparison`**。
> - 结论：**两个名字都要继续接受**；`conditionalComparison` 是文档正式名。

**Elements 全表（原文，共 19 项）**：

| 元素 | 类型 | 说明 |
|---|---|---|
| `explosion` | Explosion | 触发时产生爆炸 |
| `fire` | – | 起一把指定大小的火 |
| `removeitem` | – | 移除所有 target 物品 |
| `dropcontaineditems` | – | 把 target（物品或角色）各容器里的物品全部丢出 |
| `dropitem` | – | 让所有 target 物品从所在容器里掉出 |
| `removecharacter` | – | 移除 target 角色；若 target 是肢体，移除其所属角色 |
| `breaklimb` | – | 切断所有 target 肢体 |
| `hidelimb` | – | 隐藏所有 target 肢体 |
| `requireditem` | RelatedItem | 执行者必须持有/满足的物品条件 |
| `requireditems` | RelatedItem | **"Alias of 'requireditem'. Functionally identical."** |
| `requiredaffliction` | – | target 必须受到哪类 affliction 才应用本效果；**仅 type=OnDamaged 时有效** |
| `affliction` | – | 给 target 角色/肢体施加一条 affliction |
| `aitrigger` | – | 触发 AI 行为变化；**仅敌方怪物，人类角色不适用** |
| `triggeranimation` | – | 临时触发自定义动画 |
| `talenttrigger` | – | 供 `AbilityConditionStatusEffectIdentifier` 响应"某类状态效果触发" |
| `giveexperience` | – | 给 target 角色经验 |
| `giveskill` | GiveSkill | 给 target 角色技能点 |
| `conditional` | Conditional | 必须满足的条件 |
| （`SpawnItem` / `SpawnCharacter` / `GiveTalent` 等由 ItemSpawnInfo / CharacterSpawnInfo / GiveTalentInfo 定义，见下） | | |

**子结构属性（原文照抄，全是机读值）**：

- **`Fire`**：`size`（float，默认 `10.0f`，火初始宽度像素）。
- **`RequiredAffliction`**：`identifier, type`（Identifier[]，可写标识符**或类型**的列表）、`minstrength`（float，`0.0f`）。
- **`Affliction`**（作为 StatusEffect 子元素时）：`identifier`（Identifier）、`strength`（float，`0.0f`）、`probability`（float，`1.0f`，0=从不 / 0.5=50% / 1.0=总是）。
- **`TalentTrigger`**：`effectidentifier`（Identifier）。
- **`TriggerAnimation`**：`type`（**必填**，AnimationType ∈ `Walk` / `Run` / `SwimSlow` / `SwimFast` / `Crouch`）、`filename`（不含扩展名的动画文件名，必须在角色 `Animations` 文件夹里）、`path`（ContentPath，如 `%ModDir%/CustomRun.xml`，可任意目录也可在别的内容包）、`priority`（float，`0.0f`）、`expectedspecies`（Identifier，可多个；动画找不到会报错）。
- **`GiveExperience`**：`amount`（int）。
- **`ItemSpawnInfo`**：`SpawnIfInventoryFull=false`、`SpawnIfNotInInventory=false`、`SpawnIfCantBeContained=true`、`Impulse`、`Condition=1`（1=满）、`Rotation=0`、`MinCount`/`MaxCount`（默认同 fixedCount；写 `Count` 表示固定数量）、`Probability=1`、`Spread=0`、`AimSpread=0`、`Equip=false`、`SpawnPosition=SpawnPositionType.This`、`InheritEventTags=false`。
  - **`SpawnPositionType` 取值**：`This`、`ThisInventory`、`SameInventory`（仅 target 是物品时）、`ContainedInventory`、`Target`。
  - **`SpawnRotationType` 取值**：`None`、`This`、`Target`、`Limb`、`MainLimb`、`Collider`、`Random`。
- **`CharacterSpawnInfo`**：`SpeciesName=""`、`Count=1`、`TransferBuffs=false`、`TransferAfflictions=false`、`TransferInventory=false`、`TotalMaxCount=0`、`Stun=0`、`AfflictionOnSpawn=""`、`AfflictionStrength=1`、`TransferControl=false`、`RemovePreviousCharacter=false`、`Spread=0`、`Offset="0,0"`、`InheritEventTags=false`、`InheritTeam=false`。
- **`GiveSkill`**：`SkillIdentifier=""`、`Amount=0`、`TriggerTalents=true`、`UseDeltaTime=false`、`Proportional=false`、`AlwayShowNotification=false`（**原文就是这个拼写，少一个 s**）。
- **`AITrigger`**：`State=AIState.Idle`、`Duration=0`（0=永久，除非被别的 AITrigger 覆盖）、`Probability=1`、`MinDamage=0`（看**最近一次攻击**造成的伤害）、`AllowToOverride=true`、`AllowToBeOverridden=true`。
- **`AbilityStatusEffectIdentifier`**：`EffectIdentifier`。
- **`GiveTalentInfo`**：`TalentIdentifiers`（Identifier[]，`[]`）、`GiveRandom=false`。

**常见坑（原文 Examples 明说）**：
- 默认语义是"**每秒**变化量"；`disabledeltatime="true"` 改成"**每帧**"，**只该用在一次性效果上**（原文警告：给持续型效果加它会变成每帧掉 10 点）。
- 想"立刻掉固定值"用 `setvalue="true"`；想"每次开火掉固定值"用 `disabledeltatime="true"`。
- `Duration` + 每帧执行 + `Stackable=true` = 大量重叠实例（原文点名的问题）。

---

## A.4 `/Misc/ScriptedEvents.html` —「Examples」「Triggering events」「Event editor」「Event actions」

**机制**：脚本事件在**前哨站**或**任务中**触发；原版用于前哨站事件、叛徒事件、派系事件链、教程、越狱/点缀任务。
节点编辑器 = 控制台命令 **`eventeditor`**（「Event editor」小节里又写成 **`editevents`** —— **文档自身不一致**）；也可纯 XML 编辑。

**Tagging 是事件系统核心**（原文）：
- "The tags are **local to the event**; other events cannot refer to the trash can we tagged with 'potentialtrashcan' unless they tag it themselves."
- `TagAction` 可给**多个或单个**实体打 tag；`TriggerAction` 用来"缩小到具体某一个目标"并打新 tag（示例 `selectedtrashcan` / `triggerer_player`）；
  若后续还用 `player` / `potentialtrashcan`，对话会发给**所有**玩家、火会**每**个垃圾桶都起 —— 这是官方点名的坑。
- `ConversationAction` + `Option` 产生分支；`WaitAction` 等待；`GoTo` + `Label` 做循环（原文："we recommend using them sparingly"）。

**Event set（小节「Triggering events → Event sets」）**：
- 官方完整示例：
  ```xml
  <EventSet identifier="outpostevents.custom" leveltype="outpost" locationtype="research,military"
            minleveldifficulty="15" maxleveldifficulty="100" allowatstart="true" chooserandom="true" eventcount="2">
      <ScriptedEvent identifier="customevent1" commonness="100" />
      ...
  </EventSet>
  ```
- **可嵌套**（EventSet 里放 EventSet），示例里子集只写 `chooserandom="true"`。
- **`additive`（重要，官方强烈推荐）**：
  - "Making an event set additive is simply just a matter of setting the attribute `additive` to true."
  - "Overriding and modifying this whole vanilla event set … would be cumbersome … That's where **additive event sets** come in. Additive event sets simply **add more events on top of the existing events**, which is **often how mods should configure events**（除非你准备把原版事件全部 override）。"
  - 示例：`<EventSet identifier="outpostevents.custom" additive="true" leveltype="outpost" chooserandom="true" eventcount="1">`
  - **语义细节以 `/ContentTypes/RandomEvents.html` 为准**（见 A.13）：additive 集合被选中时，游戏**还会再选一个非 additive 集合** —— 即 additive 是"额外再抽一次"，不是"替换"。本页正文没写这句。
- 原版脚本事件配置在 `OutpostEvents.xml`，里面是一个多级大事件集。
- 其它触发途径：
  - **Status effects**：任何 status effect 都能触发事件（原文链到 status effect 文档）。
  - **Missions**：`<TriggerEvent state="0" delay="10" eventidentifier="somecustommissionevent" campaignonly="true"/>`（放在 mission config 里；`state="0"` 表示任务开始后 10 秒）。

**Event actions 全表（原文「Event actions」小节，共 61 个链接）→ 见 B.4**。
每个 action 都有独立页 `/EventActions/<Name>.html`，属性表见 **A.16**。

**常见坑**：`<ScriptedEvent>` 用 `identifier` + `commonness`；对话文本 `text="…"` 可以是裸文本，也可以是文本文件里的 tag（原文：`ConversationAction.Text` "Can be the text as-is, or a tag referring to a line in a text file"）。

---

## A.5 `/Misc/StatTypes.html` —「StatTypes」「AbilityFlags」

**机制**：StatTypes 改角色特性，**主要给天赋用**。多数是"百分比"：
"the value is 0 by default and **1 is added to the value** to get the final multiplier"，例：`0.2 → 1.2`（+20%），`-0.2 → 0.8`（−20%）。

**StatTypes 取值全表（83 项）→ 见 B.3**。
**AbilityFlags 取值全表（13 项）→ 见 B.3**。

**原文给出的按项语义要点（只列不容易猜的）**：
- `None`：**"Used to indicate an invalid stat type. Should not be used."**（AbilityFlags 的 `None` 同理："erroneous ability flag"）
- `*SkillOverride`（5 个）：把技能**提升到给定值**（仅当当前更低时）。
- `BuffDurationMultiplier` / `DebuffDurationMultiplier`：按 `isBuff` 区分，缩短 buff/debuff 的衰减时间。
- `MedicalItemEffectivenessMultiplier` / `MedicalItemApplyingMultiplier` / `BuffItemApplyingMultiplier` / `PoisonMultiplier`：只对带 `medical` tag 的物品 / `isBuff=true` 的 affliction / `type=poison` 的 affliction 生效。
- `MaxRepairConditionMultiplierMechanical|Electrical`：可以修到超过 100%（`0.1` → 110%）。
- `FlowResistance`：抵抗水流推力，**不能低于 0% 或高于 100%**。
- `GeneticMaterialTaintedProbabilityReductionOnCombine`：污染概率**不得低于 0%、高于 100%**。
- **必须配合 `CharacterAbilityGivePermanentStat` 指定 tag/job/天赋才生效的**：`IncreaseFabricationQuality`、`ReputationGainMultiplier`、`ReputationLossMultiplier`、`MaxAttachableCount`（"Does nothing if no tag is specified"）、`Apprenticeship`（需 job）、`LockedTalents`（需天赋 identifier）。
- `HideInSonar`（Character 页）与 `HideInThermalGoggles` 是角色根属性，不是 StatType。

---

## A.6 `/Misc/RelatedItem.html` —「RelatedItem」「Attributes」

**机制**：定义物品之间的"关系"——角色要拿什么才能互动、什么能放进容器、StatusEffect 的 target 身上得有什么物品才能触发。

**属性全表（原文）**：

| 属性 | 类型 | 默认值 | 生效范围（关键） |
|---|---|---|---|
| `ExcludeBroken` | bool | true | 排除已损坏（0 condition）物品 |
| `RequireEmpty` | bool | false | 只接受**空**容器 |
| `ExcludeFullCondition` | bool | false | 排除满状态（100%）物品 |
| `AllowVariants` | bool | true | 变体是否算有效 |
| `Rotation` | float | 0 | **仅 ItemContainer 的 Containable 定义**；覆盖该物品在容器里的朝向 |
| `SetActive` | bool | false | **仅 ItemContainer 的 Containable 定义**；强制某些物品在容器内保持 active（如挂在枪上的手电） |
| `Msg` | Identifier | `""` | **仅 ItemComponent 的 RequiredItems**；缺物品时弹的**本地化 tag** |
| `Optional` | bool | false | **仅 ItemComponent 的 RequiredItems**；可选（没有也能互动，有则改变互动结果，如撬棍撬门） |
| `IgnoreInEditor` | bool | false | **仅 ItemComponent 的 RequiredItems**；在潜艇编辑器里忽略该要求 |
| `MatchOnEmpty` | bool | false | 空容器也算合法（用于"有某物、或什么都没有"时触发） |
| `TargetSlot` | int | -1 | 目标为 Contained 物品时，必须在的槽位索引 |
| `Hide` | bool | false | **仅 ItemContainer 的 Containable 定义**；只在 `ItemContainer.hideItems` 为 false 时起作用，**不覆盖它** |
| `ItemPos` | `Vector2?` | Zero | **仅 ItemContainer 的 Containable 定义**；覆盖 ItemContainer 里的位置 |

**常见坑**：
- `requireditem` 与 `requireditems` **是同一个东西的别名**（出处 `/Misc/StatusEffect.html`「Elements」）。
- 本页**没有列 `type` 的取值**（例如 `type="Contained"`）→ **`type` 的枚举取值 = 文档未覆盖**（本机实例在用 `type="Contained"`；`/Misc/Performance.html`「Containables」示例同样用了 `<RequiredItem items="oxygenitetank" type="Contained" />`，但也没列取值表）。

---

## A.7 `/Misc/Attack.html` —「Attack」「Attributes」「Elements」

**机制**：Attack 造成伤害，定义在武器的 item component 或角色的 limb 定义里；limb attack 玩家也能用（操控怪物或有附肢，如 husk 尾刺）。

**Elements 全表（原文，只有 3 项）**：`particleemitter`、`sound`、`statuseffect`。
- `statuseffect` 原文附带一条**关键语义**："StatusEffect types of `OnUse` are executed **always**, `OnFailure` only when the attack **doesn't deal damage** and `OnSuccess` executes when **some damage is dealt**."
- **`<Affliction>` 不在本页 Elements 表里** → **文档未覆盖（很可能漏列）**；但本机真实 mod（`LocalMods/SmartPistol/SmartPistol.xml:43-47`）与本插件都在 `<Attack>` 下直接写 `<Affliction>`（见 C.4）。

**Attributes 全表（原文，按「名 = 默认值」）**：

`StructureSoundType="StructureBlunt"`、`Context=AttackContext.Any`、`TargetType=AttackTarget.Any`、`TargetLimbType=LimbType.None`（未定义或 None 时打最近的肢体）、
`HitDetectionType=HitDetection.Distance`（`Collision` 更准但只作用于与肢体接触的目标）、`AfterAttack=AIBehaviorAfterAttack.FallBack`、`AfterAttackDelay=0`、
`Reverse=false`、`SnapRopeOnNewAttack=true`、`Retreat=false`、`Range=0`、`DamageRange=0`、`MinRange=0`、`Duration=0.25`（命中判定时间窗；太小可能打不中）、
`CoolDown=5`、`SecondaryCoolDown=0`、`CoolDownRandomFactor=0`（0.1 → ±10%；范围 0~1）、`FullSpeedAfterAttack=false`、
`StructureDamage=0`、`EmitStructureDamageParticles=true`、`ItemDamage=0`、`Penetration=0`（忽略护甲减伤的比例）、`LevelWallDamage=0`、
`Ranged=false`、`AvoidFriendlyFire=false`（仅远程）、`RequiredAngle=20`（仅远程，AI 瞄准精度）、`RequiredAngleToShoot=0`（默认同 RequiredAngle）、
`AimRotationTorque=0`、`RotationLimbIndex=-1`、`SwayAmount=0`、`SwayFrequency=5`、`Stun=0`（**Legacy support. Use Afflictions.**）、
`OnlyHumans=false`、`ApplyForceOnLimbs=""`、`Force=0`、`RootForceWorldStart/Middle/End="0.0, 0.0"`、`RootTransitionEasing=Linear`、`Torque=0`、
`ApplyForcesOnlyOnce=false`、`TargetImpulse=0`、`TargetImpulseWorld="0.0, 0.0"`、`TargetForce=0`、`TargetForceWorld="0.0, 0.0"`、
`SubmarineImpactMultiplier=1`、`SeverLimbsProbability=0`、`Priority=0`、`Blink=false`。

---

## A.8 `/Misc/Explosion.html` —「Explosion」

**机制**：范围伤害攻击，可伤角色/物品/结构。**"This type also supports the attributes defined in: Attack"** → **A.7 那张表在 Explosion 上也全部适用**。

**属性全表（原文）**：
`force=0`、`sparks`、`shockwave`、`flames`、`underwaterBubble`、`smoke`、`playTinnitus`（以上默认值都是 **"Same as showEffects"**）、
`applyFireEffects`（**true 当 `showEffects=true` 且未显式把 `flames` 设为 false，否则 false**）、`ignoreFireEffectsForTags=[]`、`ignoreCover=false`、
`OnlyInside=false`、`OnlyOutside=false`、`flash`（Same as showEffects）、`flashDuration=0.05`、`flashColor=LightYellow`、
`EmpStrength=0`、`BallastFloraDamage=0`、`itemRepairStrength=0`、`decal=""`（**置空字符串即禁用 decal**）、`decalSize,decalsize=1`、
`cameraShake`（showEffects 时为范围的 10%，否则 0）、`cameraShakeRange`（showEffects 时为 attack range，否则 0）、
`screenColorRange`（showEffects 时为范围的 10%，否则 0）、`screenColor=Transparent`、`screenColorDuration=0.1`、
`flashRange=100`、`showEffects=true`。

**常见坑**：`showEffects` 是**总开关**（"Used to enable all particle effects without having to specify them one by one"）；
`applyFireEffects` 的默认值**依赖 `flames` 有没有被显式设 false**（有隐含耦合）。

---

## A.9 `/Misc/Performance.html` —「Performance」「ActionType」「Interval」「Containables」

原文要点（可直接变成校验建议）：

1. **ActionType**："The `Always` type is generally **the worst for performance**"；能用 `InWater` / `Contained` 之类就别用 `Always`。
2. **Interval**："By default, the interval is 0, meaning the effect **executes every frame**."；游戏固定 **60 次/秒**更新，
   "An effect that only runs once per second is generally **60 times more performant**"。
   官方等价写法示例：
   ```xml
   <!-- 慢 -->
   <StatusEffect type="OnContained" target="This" Condition="-0.1" />
   <!-- 快（同样效果） -->
   <StatusEffect type="OnContained" target="This" Condition="-0.1" interval="1" disabledeltatime="true" />
   ```
3. **Containables**：用"**每帧** `<StatusEffect>` + `<RequiredItem>` 检查容器里有没有某物"是**差**做法：
   ```xml
   <!-- 不推荐：一直要查容器里有没有氧石罐 -->
   <StatusEffect type="OnWearing" target="Contained,Character" SpeedMultiplier="1.5" setvalue="true">
     <RequiredItem items="oxygenitetank" type="Contained" />
   </StatusEffect>
   ```
   应改成写进 `ItemContainer` 的 `<Containable>`，用 `type="OnContaining"`：
   ```xml
   <ItemContainer capacity="1" maxstacksize="1" hideitems="true" containedstateindicatorstyle="tank">
     <Containable items="oxygenitetank">
       <StatusEffect type="OnContaining" target="Character" SpeedMultiplier="1.5" setvalue="true" />
     </Containable>
   </ItemContainer>
   ```
   原文："This only executes if there's an oxygenite tank inside the container, **otherwise it does nothing and causes no performance impact**."
4. 自定义天赋/affliction 里的 StatusEffect 也应尽量改成"每 x 秒执行一次"。

**附带取证（本插件 `validate.ts` 需注意）**：本页示例用了 `<StatusEffect type="OnContained" …><Remove /></StatusEffect>` —— 即 **`Remove` 是 StatusEffect 的子元素**；但 `/Misc/StatusEffect.html`「Elements」表**没有列 `remove`** → 文档两页自相矛盾（**`remove` 命令式元素 = StatusEffect 页未覆盖**）。

---

## A.10 `/ContentTypes/Character.html` —「Character」（★重点）

- **Required by core package: Yes**

### 根元素属性（原文「Root element attributes」全表）
| 属性 | 原文语义 |
|---|---|
| `SpeciesName` | "Used for referencing the character, like Item identifier." |
| `VariantOf` | 定义后继承另一个物种的子元素与属性；**同义词 `Inherit`**（见 Variants 小节） |
| `SpeciesTranslationOverride` | "References to another species. Used only if we want to **reuse the name defined for it in the Text files**." |
| `DisplayName` | "**Overrides** the name of the character, shown to the player. **Leave blank, if the name is defined in the Text files** (e.g. `<character.crawler>Crawler</character.crawler>`)!" |
| `Group` | 同 group 的不同物种**互相视为友方、不攻击** |
| `Humanoid` | true = 人形，动画约束与非人形不同 |
| `HasInfo` | true = 可以把 [jobs] 分配给该物种 |
| `SpecifierTags` | true 且 `HasInfo` 为 true 时，可给该物种角色挂 specifier tag |
| `CanInteract` | true = 能与物品交互 |
| `Husk` | true = AI 视其为 husk |
| `UseHuskAppendage` | true = 变 husk 时使用挂在 ragdoll 上的特殊 husk 附肢；附肢在"被 husk 化物种"的角色文件里定义（例：`<huskappendage affliction="huskinfection" path="Content/Characters/Humanhusk/Huskappendage.xml" />`） |
| `NeedsAir` | true = 需要氧气；**同时使它在潜艇外游泳时受高压伤害** |
| `NeedsWater` | true = 不在水里会慢慢窒息（像鱼） |
| `CanSpeak` | true = 能在聊天里发消息 |
| `ShowHealthBar` | true = 受伤时角色头顶显示血条。**默认 true** |
| `UseBossHealthBar` | true = 交战中在屏幕顶部显示其血量 |
| `Noise` | 移动时发出的声音量，影响被怪物发现的距离。**默认 100** |
| `Visibility` | 对怪物的可见度；实际发现距离还受体型与移速影响。**默认 100** |
| `BloodDecal` | 流血用的 decal identifier。**默认 `blood`** |
| `BleedParticleAir` | 干燥处流血用的 particle identifier。**默认 `blooddrop`** |
| `BleedParticleWater` | 水里流血用的 particle identifier。**默认 `waterblood`** |
| `BleedParticleMultiplier` | 流血粒子数量乘数 |
| `CanEat` | true = 能吃尸体；**仅对非人形有效** |
| `EatingSpeed` | 吃尸耗时乘数。**默认 10** |
| `UsePathFinding` | true = AI 用关卡 waypoint 寻路。**默认 true** |
| `PathFinderPriority` | 值越低，寻路调用频率越低（给不重要的生物调低以提升性能） |
| `HideInSonar` | true = 不出现在声呐上 |
| `HideInThermalGoggles` | true = 热成像看不到 |
| `SonarDisruption` | >0 时，在范围内对声呐制造干扰 |
| `DistantSonarRange` | "远距离"声呐光点出现的距离（部分深渊怪用） |
| `DisableDistance` | 距离潜艇与玩家超过该像素值就禁用；**该值的一半**用于触发"简化物理"（ragdoll 禁用、只更新主碰撞体） |
| `SoundInterval` | 播放该角色声音之间的等待时间 |
| `DrawLast` | true = 画在没开此项的角色之上；**当前对没有可形变贴图的角色无效** |
| `AITurretPriority` | bot 用潜艇武器优先打它的程度。**默认 `1`**；设 `0` = 完全不瞄它；距离会影响决策 |
| `AISlowTurretPriority` | 对被标为 `slowturret`（如轨道炮）的潜艇武器的优先度。**默认 `1`**；`AITurretPriority=0` 时不生效 |
| `DespawnContainer` | 角色消失时，其物品被放进哪个物品（identifier 或 tag） |

### 子元素（原文「Child elements」）
| 子元素 | 原文语义 |
|---|---|
| `ragdolls` & `animations` | 决定游戏去**哪些文件夹**找该角色的 ragdoll / animation 参数；由角色编辑器生成，"typically not necessary to edit them directly"；文件夹里可以有多个文件，但同一角色**同时只能有一个** animation 与 ragdoll 参数生效 |
| `damageemitter` / `bloodemitter` / `gibemitter` | 受伤 / 流血 / 被肢解时用的粒子。官方示例属性：`particle`、`drawontop`、`particleamount`、`velocitymin`、`velocitymax`、`anglemin`、`anglemax`、`scalemin`、`scalemax`、`emitinterval`、`particlespersecond`、`highqualitycollisiondetection`、`copyentityangle` |
| `health` | 定义最大生命、压碎深度、回血等；可玩角色还决定治疗 UI 外观。**ragdoll 里每条肢体定义的 `healthindex` 指向这里的 limb 定义**。官方示例属性：`vitality="80" doesbleed="True" crushdepth="-Infinity" usehealthwindow="False" bleedingreduction="0.2" burnreduction="0" constanthealthregeneration="0" healthregenerationwheneating="10"`；子元素 `<Limb name="Torso"><VitalityMultiplier type="damage,burn" multiplier="1.0" /></Limb>`（`name` 可缺省=无名肢体，示例里有 `<!--Tail-->`） |
| `Inventory` | 定义槽位数量与类型；**省略则该角色完全没有背包**。**既用于定义可玩角色背包，也用于定义生物 loot**。官方示例属性：`slots="Any, Any" accessiblewhenalive="False" commonness="1"`，子元素 `<Item identifier="crawlermask" />`；**用 `commonness` 做权重** |
| `ai` | 定义 AI 的目标与优先级。原文："There are **too many parameters to list here** … you can see them all in the character editor"；部分参数只在配合特定 `attackpattern` 时有效；`threshold` 之类是通用参数，含义随 targeting `state` 变化。官方示例属性：`combatstrength="100" sight="1" hearing="1.0" fleehealththreshold="10" aggressiveboarding="true" aggressiongreed="10" aggressionhurt="200" avoidgunfire="True"`；子元素**文档示例用 `<target tag=… state=… priority=… reactdistance=… ignoreifnotinsamesub=… attackdistance=… />`** |
| `StatusEffect` | 角色支持的 type 只有：`Always`、`OnSpawn`、`OnActive`、`OnEating`、`OnImpact`、`InWater`、`NotInWater`、`OnDamaged`、`OnSevered`、`OnFire`、`OnDeath`（**共 11 个**） |
| `sound` | 按角色状态播声音；有 specifier tag 时可限定只有带该 tag 的角色才播。示例属性：`File`、`State`、`Range`、`Volume`、`Tags` |
| `huskappendage` | 挂 husk 附肢；可标记只在有某 affliction 时激活。示例属性：`affliction`、`path`、`onlyfromafflictions="true"` |

### 仅在 `HasInfo=true` 且 `SpecifierTags=true` 时可用的子元素
`names`（"Defines a **file to load character names from**"）、`Vars`（定义 tag 所属类别，原版用来定义性别；示例 `<Var var="GENDER" tags="female,male" />`）、
`Heads`（可选头部，每个头必须有唯一 tag 组合；`sheetindex="x,y"` 用来在图集里偏移，**只需标记在想象网格里的位置，不必为每个变体写 sourcerect**）、
`MenuCategory`（`<MenuCategory var="GENDER" />`）、`Pronouns`（`<Pronouns var="GENDER" />`，当前只用于叛徒任务相关消息）、
`HeadAttachments`（发型/胡须/配件，同样用 `sheetindex` 偏移；示例含 `<Wearable type="Hair|Beard|FaceAttachment|Husk|Herpes" tags=… commonness=…>` 与 `<sprite name=… texture=… sheetindex="0,0" />`，Husk 那条还带 `hidewearablesoftype="Beard"`）。

### Variants（变体）
- 变体默认继承基种全部定义；在变体文件里重定义即可覆盖。
- 官方示例：`<Charactervariant inherit="Tigerthresher" speciesname="Tigerthresher_hatchling" speciestranslationoverride="Tigerthresher" texture="…" eatingspeed="10">`，
  内含 `<health vitality="75" poisonvulnerability="2"/>`、`<ragdoll scalemultiplier="0.5"/>`、`<attack damagemultiplier="0.5" rangemultiplier="0.5" impactmultiplier="0.5"/>`、
  `<animations folder="…" />`、`<ai combatstrength="120"/>`、`<inventory/>`。
- 原文："The example above uses `Inherit` attribute, but you can also use `VariantOf` as a synonym."
- **仅变体可用的子元素**：
  - `Ragdoll`：`ScaleMultiplier`、`ImpactTolerance`，**可用 `Folder` 或 `Path` 覆盖 ragdoll**
  - `Attack`：`DamageMultiplier`、`RangeMultiplier`、`ImpactMultiplier`

**常见坑**：`DisplayName` **留空**才走 Text 文件；`ragdolls` / `animations` 是**目录**语义。
**文档未覆盖**：`<targetpriority>` 这个元素名（文档示例只用 `<target>`；本机两种都有，见 C.4）。

---

## A.11 `/ContentTypes/Afflictions.html` —「AfflictionPrefab」（★重点）

- **Required by core package: Yes**
- **元素名决定类型**（原文示例）：
  ```xml
  <Afflictions>
    <Affliction identifier="mycoolaffliction1" />          <!-- 普通 -->
    <AfflictionPrefabHusk identifier="mycoolaffliction2" /> <!-- Husk 类 -->
    <AfflictionBleeding identifier="mycoolaffliction3" />   <!-- Bleeding 类 -->
  </Afflictions>
  ```
- 原文另提："There are multiple sub-types of afflictions such as AfflictionPrefabHusk, **AfflictionPsychosis** and AfflictionBleeding"（**Psychosis 被点名但没给示例**）。

### AfflictionPrefab 属性全表（原文）
| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Type` | Identifier | `""` | 任意字符串，标识 affliction 的"类型" |
| `TranslationOverride` | Identifier | **Same as Identifier** | "Can be set to the identifier of **another affliction** to make this affliction **reuse the same name and description**." |
| `ShowDescriptionInTooltip` | bool | true | 图标 tooltip 里是否带描述 |
| `IsBuff` | bool | false | true = 游戏认定为 buff（bot 不会治疗它；健康 UI 把受影响肢体画成绿色而非红色） |
| `AffectMachines` | bool | true | 能否影响被标为 machine 的角色（如 Fractal Guardian） |
| `ShowBarInHealthMenu` | bool | true | false = 健康 UI 不显示强度条 |
| `HealableInMedicalClinic` | bool | **buff 或 type 为 `geneticmaterialbuff`/`geneticmaterialdebuff` 时 false，否则 true** | 能否在医疗站治疗 |
| `HealCostMultiplier` | float | 1 | 每点强度给治疗费用加多少 |
| `BaseHealCost` | int | 0 | 治疗最低费用 |
| `Duration` | float | 0 | 持续秒数；**0 = 永不过期** |
| `LimbSpecific` | bool | false | true = 按肢体作用；否则作用整角色 |
| `HideIconAfterDelay` | bool | false | true = 图标 5 秒后从 HUD 隐藏 |
| `ActivationThreshold` | float | 0 | 强度达到多少才生效 |
| `ShowIconThreshold` | float | `max(ActivationThreshold, 0.05)` | 强度达到多少才在 UI 显示图标 |
| `ShowIconToOthersThreshold` | float | Same as ShowIconThreshold | 别人（健康扫描仪/健康界面）能看到图标的阈值 |
| `MaxStrength` | float | 100 | 最大强度 |
| `GrainBurst` | float | 0 | 强度上升时的辐照颗粒强度 |
| `ShowInHealthScannerThreshold` | float | – | 健康扫描仪显示图标的阈值 |
| `TreatmentThreshold` | float | `max(ActivationThreshold, 10)` | bot 开始治疗的强度；也影响"suitable treatments"列表显示 |
| `TreatmentSuggestionThreshold` | float | Same as TreatmentThreshold | 健康界面给治疗建议的阈值 |
| `DamageOverlayAlpha` | float | 0 | 受伤血污叠加不透明度（1=满） |
| `BurnOverlayAlpha` | float | 0 | 烧伤变暗叠加不透明度（1=满） |
| `KarmaChangeOnApplied` | float | 0 | 玩家施加该 affliction 时 karma 变化（按强度） |
| `IconColors` | Color[] | – | 按当前强度渲染图标颜色的**渐变** |
| `AfflictionOverlayAlphaIsLinear` | bool | false | true 且有 AfflictionOverlay 时，叠加层不透明度与强度严格成正比；否则由激活阈值与 effect 决定 |
| `AchievementOnReceived` | Identifier | `""` | （收到时给的 Steam 成就） |
| `AchievementOnRemoved` | Identifier | `""` | 从受控角色移除时给的 Steam 成就 |
| `Targets` | Identifier[] | `[]` | **允许受影响的物种列表** |
| `ResetBetweenRounds` | bool | false | true = 不跨回合保留 |
| `DamageParticles` | bool | true | 是否喷伤害粒子；**仅当 type 为 `bleeding` 或 `damage` 时相关** |
| `WeaponsSkillGain` | float | 0 | 施加时武器技能增幅（**目标为敌对时才算**） |
| `MedicalSkillGain` | float | 0 | 施加时医疗技能增幅（造成伤害或 `poison`/`paralysis` 类型时仅敌对算；`buff` 类型时仅友方算） |

### AfflictionPrefab Elements（原文）
`icon`(Sprite)、`afflictionoverlay`(Sprite)、`afflictionoverlayanimated`(SpriteSheet)、`description`(Description)、`effect`(Effect)、`periodiceffect`(PeriodicEffect)。

### AfflictionPrefabHusk 额外属性（原文）
`HuskedSpeciesName=""`、`TransferBuffs=true`、`SendMessages=true`、`CauseSpeechImpediment=true`、`NeedsAir=false`、`ControlHusk=false`、
`DormantThreshold`（默认 MaxStrength 的 50%；**必须 ≤ ActiveThreshold**）、`ActiveThreshold`（默认 75%；**必须 ≥ DormantThreshold 且 ≤ TransitionThreshold**）、
`TransitionThreshold`（默认 = MaxStrength；**必须 ≥ ActiveThreshold**）、`TransformThresholdOnDeath`（默认 = ActiveThreshold）。

### `description` 子元素属性
`TextIdentifier=""`（**"Text tag used to set the text from the localization files"**）、`MinStrength=0`、`MaxStrength=100`、
`Target=TargetType.Any`（**取值：`Any` / `Self` / `OtherCharacter`**）、`Text=""`（原始文本）。

### `effect` 子元素属性（原文全表）
`MinStrength=0`、`MaxStrength=0`、`MinVitalityDecrease=0`、`MaxVitalityDecrease=0`、**`StrengthChange=0`**（"How much the affliction's strength changes **every second** while this effect is active."）、
`MultiplyByMaxVitality=false`、`Min/MaxScreenBlur=0`、`Min/MaxScreenDistort=0`、`Min/MaxRadialDistort=0`、`Min/MaxChromaticAberration=0`、
`GrainColor=255,255,255,255`、`Min/MaxGrainStrength=0`、`ScreenEffectFluctuationFrequency=0`、
`Min/MaxAfflictionOverlayAlphaMultiplier=1`、`Min/MaxBuffMultiplier=1`（**仅 BuffDurationIncrease 类 affliction**）、
`Min/MaxSpeedMultiplier=1`、`Min/MaxSkillMultiplier=1`、`Min/MaxResistance=0`（配合 `ResistanceFor`）、
`DialogFlag=""`、`Tag=""`（敌对 AI 可借此锁定目标）、`Min/MaxFaceTint=0,0,0,0`、`Min/MaxBodyTint=0,0,0,0`、
`ThermalOverlayRange=0`、`ThermalOverlayColor=255,0,0,255`（仅当 ThermalOverlayRange>0）、`ConvulseAmount=0`。

- **`effect` 的子元素**：`statuseffect`(StatusEffect)、`abilityflag`(AppliedAbilityFlag)、`statvalue`(AppliedStatValue)。
  - （原文 Elements 表里**只列了 `statuseffect` 与 `abilityflag`**；`statvalue` 出现在页内 `AppliedStatValue` 小节的示例里 —— **以示例为准，`statvalue` 也确实存在**。）
- **`AppliedAbilityFlag`**：`FlagType`（AbilityFlags，默认 `None`）。示例 `<AbilityFlag flagtype="ImmuneToPressure" />`。
- **`AppliedStatValue`**：`Value=0`（若 MinValue/MaxValue 有设则被忽略）、`StatType`（StatTypes，默认 `None`）、`MinValue`（默认同 Value）、`MaxValue`（默认同 Value）。
  示例：`<StatValue stattype="WalkingSpeed" minvalue="0.1" maxvalue="0.3" />`、`<StatValue stattype="MaximumHealthMultiplier" value="0.2" />`。
- **`PeriodicEffect`**：`Interval=1.0`（设它会同时把 min/max interval 设为该值）、`MinInterval=1.0`、`MaxInterval=1.0`；子元素 `StatusEffect`。
- **原文关键约束**："Only one effect can be applied at any given moment, so their ranges should be defined with **no overlap**."

**常见坑（核实上一份参考的疑问）**：
- **本页确实没有写出 `afflictionname.<id>` / `afflictiondescription.<id>` 这两个前缀** → 前缀本身**文档未直接给**（只有 `description/TextIdentifier` 机制 + 本机 311 处实例）。
- **本页属性表里没有 `indicatorlimb`、也没有 `name` / `description` 这两个属性** → 本机真实样本（Neurotrauma）与本插件用的这几个写法 **文档未覆盖**。

---

## A.12 `/ContentTypes/Text.html` —「Text」

**本页内容极少，原文全部如下**：
- Relevant files：`TextFile.cs` / `TextPack.cs`（GitHub 链接）
- "_This page was generated automatically._"
- **Required by core package: No**

→ **语言文件的 XML 结构（`<infotexts>` 根、`language` / `nowhitespace` / `translatedname` 属性、`<key>文本</key>` 条目）
在 BaroModDoc 里没有专门文章 → 文档未覆盖**（本插件 `l10n.ts` 按 `<infotexts>` 内容识别，是文档未覆盖下的自选策略）。
→ 「键名规则」同样**未覆盖**：本页没写任何键前缀（`entityname.*` / `character.*` / `afflictionname.*` / `eventtext.*`）。
  唯一有文档明文的键前缀出现在别处：`entityname.[identifier]` / `entitydescription.[identifier]`（`/ContentTypes/Item.html` 的 `identifier` 条目）、
  `character.crawler`（`/ContentTypes/Character.html` 的 `DisplayName` 条目）、`TextIdentifier`（`/ContentTypes/Afflictions.html` 的 `Description` 小节）。
→ **「语言怎么选」也未覆盖**（本页一个字都没写）。

---

## A.13 `/ContentTypes/RandomEvents.html` —「EventSet」「EventPrefab」「MonsterEvent」

### EventSet 属性全表（自动生成表）→ **见 B.5**（28 个属性 + 2 个子元素）
**`Additive` 的语义（原文，最关键）**：
> "Additive sets are important to be aware of when creating custom event sets! **If an additive set gets chosen for a level, the game will also select a non-additive one.** This means you can for example configure an additive set that spawns custom monsters (and make it very common if you want the monsters to spawn frequently), which will spawn those custom monsters **in addition to** the vanilla monsters spawned by vanilla sets, without you having to add your custom monsters to every single vanilla set."

EventSet 子元素：`commonness`(float)、`eventset`(EventSet 自身，即可嵌套)。

### EventPrefab 属性
`Commonness=1`（**"Only valid if the event set is configured to choose a random event (as opposed to just executing all the events in the set)."**）、
`Probability,spawnprobability=1`、`TriggerEventCooldown`（默认 –）、`UnlockPathEvent=false`、
`UnlockPathTooltip="lockedpathtooltip"`（仅 UnlockPathEvent=true 时）、`UnlockPathReputation=0`（同上）。

### MonsterEvent 属性
`MinAmount`（默认同 defaultAmount；也可用 `Amount` 表示固定数量）、`MaxAmount=1`、`MaxAmountPerLevel=MaxValue`、`SpawnType=Level.PositionType.MainPath`、
`spawnPointTag=Empty`、`SpawnDistance=0`、`offset=0`、`scatter=500`、`delayBetweenSpawns=0.1`、`resetTime=0`。

**文档自身矛盾（必须记下）**：本页 EventSet 自动表**没有** `identifier`、`leveltype`、`locationtype`、`onceperoutpost` ——
但 `/Misc/ScriptedEvents.html` 的官方正文示例在用它自己的 `identifier` / `leveltype` / `locationtype`，
本机原版 `Content/Events/EventSets.xml` 同时在用 `identifier` / `locationtype` / `onceperoutpost`（见 C.4）。

---

## A.14 `/ContentTypes/Other.html` —「Other」

**本页内容极少，原文全部如下**：
- Relevant files：`OtherFile.cs`
- "_This page was generated automatically._"
- **Required by core package: No**
- **Alternate names: None**

→ `Other` 是官方承认的兜底内容类型，可挂任意文件；**文档没有说明"哪些文件该用 `Other` 登记"**（如 `.lua` / `.cs` / `.dll`）→ **文档未覆盖**。

---

## A.15 `/ContentTypes/Structure.html` —「Structure」

- **Required by core package: Yes**

### 子元素（原文全表，只有 3 个）
`sprite`、`backgroundsprite`、`decorativesprite`

### 属性全表（原文）
| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Body` | bool | false | 是否带物理体 |
| `BodyRotation` | float | 0 | 物理体旋转角度 |
| `BodyWidth` | float | 0 | 物理体宽（像素） |
| `BodyHeight` | float | 0 | 物理体高（像素） |
| `BodyOffset` | Vector2 | `"0.0,0.0"` | 物理体相对结构中心的偏移（像素） |
| `Platform` | bool | false | 是否是"平台"（玩家可穿过的地板）。**仅当有物理体时相关** |
| `AllowAttachItems` | bool | false | 能否在其上挂物品（如信号元件）。装饰性背景墙之类应打开 |
| `AllowRotatingInEditor` | bool | true | 能否在潜艇编辑器里旋转 |
| `MinHealth` | float | 0 | – |
| `Health` | float | 100 | – |
| `IndestructibleInOutposts` | bool | true | 在前哨站里是否不可摧毁 |
| `CastShadow` | bool | false | 开启 LOS 时是否投影并阻挡视线 |
| `StairDirection` | `Direction` | `None` | 使结构充当楼梯 |
| `StairAngle` | float | 45 | 楼梯角度。**仅当 StairDirection ≠ None** |
| `NoAITarget` | bool | false | 怪物不能把该结构设为目标 |
| `Size` | Vector2 | `"0,0"` | 结构尺寸（像素）。未设时依次按 `width`/`height`、再按 sprite 尺寸推导 |
| `DamageSound` | string | `""` | 墙体受损时播放的声音 tag |
| `DamageParticle` | string | `"shrapnel"` | 墙体受损时喷的粒子 identifier |
| `TextureScale` | Vector2 | `"1.0, 1.0"` | – |
| `ResizeHorizontal` | bool | false | – |
| `ResizeVertical` | bool | false | – |
| `Description` | LocalizedString | `""` | – |
| `AllowedUpgrades` | string | `""` | – |
| `HideInMenus` | bool | false | – |
| `HideInEditors` | bool | false | – |
| `Subcategory` | string | `""` | – |
| `Linkable` | bool | false | – |
| `SpriteColor` | Color | `"1.0,1.0,1.0,1.0"` | – |
| `Scale` | float | 1 | – |

---

## A.16 【新发现，上一份参考完全没抓】`/EventActions/*.html`

**来源**：`https://regalis11.github.io/BaroModDoc/Misc/ScriptedEvents.html`「Event actions」小节列出的 61 个链接，逐页可访问。
本节把**已抓的 14 页**逐条列出（其余 47 个 action 的同名页面结构相同，本次未逐页抓取 → 见每小节末尾的"未抓"说明）。

### A.16.1 `/EventActions/SpawnAction.html` —「SpawnAction」
"Spawns an entity (e.g. item, NPC, monster)."

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `SpeciesName` | Identifier | `""` | 要生成的**角色物种名** |
| `NPCSetIdentifier` | Identifier | `""` | 从哪个 NPC set 里选 |
| `NPCIdentifier` | Identifier | `""` | NPC 的 identifier |
| `LootingIsStealing` | bool | true | 拿该 NPC 的东西算不算偷 |
| `ItemIdentifier` | Identifier | `""` | 要生成的**物品** identifier |
| `ItemTag` | Identifier | `""` | 要生成的物品 tag |
| `TargetTag` | Identifier | `""` | 把生成出来的实体打上该 tag（供后续 action 引用） |
| `TargetInventory` | Identifier | `""` | 把物品生成到哪个"有 inventory 的实体"（填其 tag） |
| `SpawnLocation` | `SpawnLocationType` | **`Any`** | 生成在哪。**文档没有列出 SpawnLocationType 的取值** |
| `SpawnPointType` | `SpawnType` | `Human` | 用哪类 spawnpoint；**设了 `SpawnPointTag` 时被忽略** |
| `SpawnPointTag` | Identifier | `""` | 指定 spawnpoint 的 tag |
| `TeamID` | `CharacterTeamType` | `FriendlyNPC` | NPC 队伍；**仅生成角色时有效** |
| `RequireSpawnPointTag` | bool | false | **反义写法**：默认 false = 没找到匹配 tag 的 spawnpoint 时**照样生成** |
| `AllowDuplicates` | bool | true | false = 若已有同 identifier 的角色，就不再生成 |
| `Amount` | int | 1 | 生成数量 |
| `SpawnIfInventoryFull` | bool | true | 目标容器满时是否仍生成（直接生成在目标位置）。**仅生成到 inventory 时有效** |
| `Offset` | float | 100 | 生成位置随机偏移 |
| `TargetModuleTags` | string | `""` | 优先在前哨站里带这些 tag 的 module 生成 |
| `IgnoreByAI` | bool | false | AI 是否忽略该物品（防止前哨站 NPC 清理掉留给玩家的关键物品） |
| `AllowInPlayerView` | bool | true | 关掉后会尽量选玩家的视野之外生成 |
| `ContinueIfFailedToSpawn` | bool | false | 生成失败时事件是否继续 |

### A.16.2 `/EventActions/TagAction.html` —「TagAction」
"Tags a specific entity. … **The tags are event-specific**, i.e. you cannot use a tag that was added by another event to refer to an entity."

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Criteria` | string | `""` | 选择目标实体的**判定条件**。**取值全表（原文照抄）**：`players`、`player`、`traitor`、`nontraitor`、`nontraitorplayer`、`bot`、`crew`、`humanprefabidentifier:[id]`、`jobidentifier:[id]`、`structureidentifier:[id]`、`structurespecialtag:[tag]`、`itemidentifier:[id]`、`itemtag:[tag]`、`hull`、`hullname:[name]`、`submarine:[type]`、`eventtag:[tag]`、`speciesname:[id]` |
| `Tag` | Identifier | `""` | 要打的 tag |
| `SubmarineType` | `SubType` | `Any` | 目标必须在的潜艇类型 |
| `Team` | `CharacterTeam` | `Any` | 目标必须在的队伍 |
| `RequiredModuleTag` | Identifier | `""` | 目标必须处在带该 tag 的前哨站 module 里 |
| `IgnoreIncapacitatedCharacters` | bool | true | 是否忽略失能（死亡/瘫痪/昏迷）角色 |
| `AllowHiddenItems` | bool | false | 能否给"游戏内被设为隐藏"的物品打 tag |
| `ChooseRandom` | bool | false | true = 多个匹配目标里**随机挑一个**（而不是全打） |
| `ChooseRandomExcludingTag` | Identifier | `""` | 随机时排除带该 tag 的目标 |
| `ContinueIfNoTargetsFound` | bool | false | 找不到目标时事件是否继续 |
| `ChoosePercentage` | float | 0 | >0 时只给**指定百分比**的匹配目标打 tag（0–100） |

### A.16.3 `/EventActions/ConversationAction.html` —「ConversationAction」
"Triggers a 'conversation popup' with text and support for different branching options."

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Text` | string | `""` | 显示文本；**原样文本**或**指向文本文件某一行的 tag** |
| `SpeakerTag` | Identifier | `""` | 说话者的 tag。会让角色头顶出现气泡图标、对话触发时原地站定；说话者中途死亡/失能会**中断**对话 |
| `TargetTag` | Identifier | `""` | 对话展示给哪个玩家。**空 = 展示给所有人**；若定义了 SpeakerTag，则**永远只展示给与说话者互动的那名玩家** |
| `WaitForInteraction` | bool | **true** | 是否要有人与说话者互动才触发 |
| `InvokerTag` | Identifier | `""` | 给"调用对话的人"打的 tag |
| `FadeToBlack` | bool | false | 对话时是否淡入黑屏 |
| `EndEventIfInterrupted` | bool | true | 对话被打断（说话者死亡/昏迷）时是否结束事件 |
| `EventSprite` | string | `""` | 对话提示框角上显示的事件配图 identifier |
| `DialogType` | `DialogTypes` | `Regular` | 对话框类型（**枚举取值未列**） |
| `ContinueConversation` | bool | false | 本 ConversationAction 之后是否继续同一段对话（防止提示框关闭）。**嵌套的 ConversationAction 无需设此值**（永远视为同一段对话） |
| `ContinueAutomatically` | bool | false | 事件不等待对话被关闭就继续 |
| `IgnoreInterruptDistance` | bool | false | 定义了 SpeakerTag 时，说话者与目标离太远会中断；此项可关掉该行为 |

**子元素 `Option`**：**`/EventActions/Option.html` 返回 HTTP 404** —— 没有独立文档页。
属性只能从 `/Misc/ScriptedEvents.html`「Examples」读出：`text`（选项文本）、`endconversation`（`"true"` 时关闭对话）。
→ **`Option` 的完整属性表 = 文档未覆盖**（查过 `/EventActions/` 命名空间与 `ScriptedEvents` 页）。

### A.16.4 `/EventActions/CheckConditionalAction.html` —「CheckConditionalAction」
"Checks whether an arbitrary condition is met. **The conditionals work the same way as they do in StatusEffects.**"

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `TargetTag` | Identifier | `""` | 要检查的目标的 tag |
| `LogicalOperator` | `PropertyConditional.LogicalOperatorType` | `Or` | 多个 conditional 时是"全要满足"还是"满足一个即可" |
| `ApplyTagToLinkedHulls` | Identifier | `""` | 检查通过时，给目标所在 hull **及其所有链接 hull** 打 tag |
| `ApplyTagToHull` | Identifier | `""` | 检查通过时，给目标所在 hull 打 tag |
| `ApplyTagToTarget` | Identifier | `""` | 检查通过时，给目标（或多个目标）打 tag |

> 注意：这里用的是 **`LogicalOperator`**（不是 `conditionalComparison`），默认值同样标 `Or`。

### A.16.5 `/EventActions/TriggerAction.html` —「TriggerAction」
"Waits for a player to trigger the action before continuing. Triggering can mean entering a specific trigger area, or interacting with a specific entity."

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Target1Tag` | Identifier | `""` | 参与触发判定的第一个实体的 tag |
| `Target2Tag` | Identifier | `""` | 参与触发判定的第二个实体的 tag |
| `TargetModuleType` | Identifier | `""` | 第一个目标必须在的 outpost module 类型 |
| `ApplyToTarget1` | Identifier | `""` | 触发成功时给第一个实体打的 tag |
| `ApplyToTarget2` | Identifier | `""` | 触发成功时给第二个实体打的 tag |
| `Type` | `TriggerType` | `Inside` | 目标必须**在半径内**还是**在半径外** |
| `Radius` | float | 0 | 触发半径 |
| `DisableInCombat` | bool | true | true = 正被敌人锁定的角色无法触发 |
| `DisableIfTargetIncapacitated` | bool | true | true = 死亡/昏迷角色无法触发 |
| `WaitForInteraction` | bool | false | true = 必须一个目标与另一个**互动**才触发 |
| `AllowMultipleTargets` | bool | false | true = 与任意匹配目标互动都能触发（不只第一个） |
| `CheckAllTargets` | bool | false | true 且多目标时，所有目标都必须在半径内/外 |
| `SelectOnTrigger` | bool | false | true = 互动触发时让角色**选中**该目标 |

### A.16.6 `/EventActions/WaitAction.html` —「WaitAction」
| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Time` | float | 0 | 等待多少秒 |

### A.16.7 `/EventActions/FireAction.html` —「FireAction」
| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Size` | float | 10 | 火的宽度（像素） |
| `TargetTag` | Identifier | `""` | 在哪个目标的位置起火 |

### A.16.8 `/EventActions/AfflictionAction.html` —「AfflictionAction」
| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Affliction` | Identifier | `""` | affliction identifier |
| `Strength` | float | 0 | 强度 |
| `LimbType` | `LimbType` | `None` | 作用在哪些肢体；**仅当 affliction 是 limb-specific 时有效** |
| `TargetTag` | Identifier | `""` | 施加给哪个角色 |
| `MultiplyByMaxVitality` | bool | false | 强度是否乘以目标最大生命值 |

### A.16.9 `/EventActions/StatusEffectAction.html` —「StatusEffectAction」
"Executes all the StatusEffects defined as **child elements** of the action."
| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `TargetTag` | Identifier | `""` | 状态效果作用于哪个（些）实体 |

### A.16.10 `/EventActions/GiveExpAction.html` —「GiveExpAction」
| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Amount` | int | 0 | 给多少经验。**不能为负** |
| `TargetTag` | Identifier | `""` | 给谁 |

### A.16.11 `/EventActions/ClearTagAction.html` —「ClearTagAction」
"Clears the specific tag from the event (i.e. untagging all the entities that have been previously given the tag)."
| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Tag` | Identifier | `""` | 要清除的 tag |

### A.16.12 `/EventActions/CheckItemAction.html` —「CheckItemAction」
"Do various kinds of checks on items: whether a specific kind of item exists, if it's in a specific character's inventory or in a container, or whether some conditions are met on the item."

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `TargetTag` | Identifier | `""` | 要检查的物品的 tag，**或**装着这些物品的角色/容器 |
| `ItemIdentifiers` | string | `""` | 目标物品必须属于这些 identifier 之一 |
| `ItemTags` | string | `""` | 目标物品必须带其中至少一个 tag |
| `Amount` | int | 1 | 通过判定所需的最少匹配数量 |
| `HullTag` | Identifier | `""` | 目标必须在的 hull 的 tag（可选） |
| `ApplyTagToTarget` | Identifier | `""` | 通过时给第一个目标打 tag |
| `ApplyTagToItem` | Identifier | `""` | 通过时给找到的物品打 tag |
| `RequireEquipped` | bool | false | 是否必须**已装备** |
| `RequireWorn` | bool | false | 是否必须**已穿戴** |
| `Recursive` | bool | true | 是否允许**多层嵌套**（如角色背包→工具带→物品） |
| `ItemContainerIndex` | int | -1 | 要求物品在目标容器的**第几个 ItemContainer**（如制造机输入槽 = 第一个 ItemContainer，索引 0） |
| `RequiredConditionalMatchPercentage` | float | 100 | 需要百分之多少的目标满足 conditional |
| `CompareToInitialAmount` | bool | false | 与"回合开始时匹配数量"比较。**仅当设了 RequiredConditionalMatchPercentage 时有效** |

### A.16.13 `/EventActions/GoTo.html` —「GoTo」
"Makes the event jump to a Label … **Note that using GoTo resets the effects of other, currently active EventActions** (e.g. closing conversation prompts and stopping the objectives NPCs were forced to do)."

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Name` | string | `""` | 要跳到的 label 名 |
| `MaxTimes` | int | -1 | 最多跳几次；**≤0 = 无限制** |
| `EndConversation` | bool | true | 默认跳转会关闭当前对话提示框；设 false 可保持打开 |

### A.16.14 `/EventActions/MessageBoxAction.html` —「MessageBoxAction」
"Displays a message box, or modifies an existing one."

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Type` | `ActionType` | `Create` | **取值：`Create` / `ConnectObjective` / `Close` / `Clear`** |
| `Identifier` | Identifier | `""` | 可选：教程"segment" 的 identifier，供别的 action 引用 |
| `Tag` | string | `""` | 给消息框的任意 tag；**只有之后要用另一个 MessageBoxAction 关/清它时才需要** |
| `Header` | Identifier | `""` | 标题文本（原样或文本文件 tag） |
| `Text` | Identifier | `""` | 正文文本（原样或文本文件 tag） |
| `IconStyle` | string | `""` | 角落图标样式；**该样式必须在 UIStyle 文件里定义** |
| `HideCloseButton` | bool | false | 隐藏关闭按钮（隐藏后必须手动用另一个 MessageBoxAction 关） |
| `TargetTag` | Identifier | `""` | 展示给哪些角色 |
| `CloseOnInput` | string | `""` | 收到某输入时自动关闭（如 `Select`、`Use`、`CrewOrders`） |
| `CloseOnSelectTag` | Identifier | `""` | 选中带该 tag 的物品时关闭 |
| `CloseOnPickUpTag` | Identifier | `""` | 拾取带该 tag 的物品时关闭 |
| `CloseOnEquipTag` | Identifier | `""` | 装备带该 tag 的物品时关闭 |
| `CloseOnExitRoomName` | Identifier | `""` | 离开名为该值的房间时关闭 |
| `CloseOnInRoomName` | Identifier | `""` | 处于名为该值的房间时关闭 |
| `ObjectiveTag` | Identifier | `""` | 用于取屏上目标文本的 tag |
| `ObjectiveCanBeCompleted` | bool | true | – |
| `ParentObjectiveId` | Identifier | `""` | – |

### A.16.15 其余 47 个 EventAction 页
用同样的路径规则 `/EventActions/<Name>.html`（名字见 B.4）。**本次未逐页抓取** → 它们的属性表**本文件未覆盖**；
需要时按同一 URL 模板取。已抓的 14 页足以证明：**每个 action 都有"Attributes（属性 / 类型 / 默认值 / 说明）"表，且属性名就是 XML 属性名**。

---

# B. 五张机读清单

> 用法：直接复制代码块内容做数据文件（每行一个值，无注释）。来源 URL + 小节名标在每个块标题上。

## B.1 `<StatusEffect>` 的 `type` 全部取值（ActionType）

**来源**：`https://regalis11.github.io/BaroModDoc/Misc/StatusEffect.html`，小节「ActionType」。
**共 27 个**（原文逐条带"仅物品/仅角色/仅肢体/仅门/Growable/Abilities"限制）。

```
Always
OnPicked
OnUse
OnSecondaryUse
OnWearing
OnContaining
OnContained
OnNotContained
OnActive
OnFailure
OnBroken
OnFire
InWater
NotInWater
OnImpact
OnEating
OnDamaged
OnSevered
OnProduceSpawned
OnOpen
OnClose
OnSpawn
OnSuccess
OnAbility
OnInserted
OnRemoved
OnDeath
```

**附加限制表（同页 ActionType，机读用）**
```
Always             = 每帧执行，与实体状态无关
OnPicked           = 拾取时（仅物品）
OnUse              = 使用时（仅物品）
OnSecondaryUse     = 按住瞄准键时（仅物品）
OnWearing          = 穿戴中（仅可穿戴物）
OnContaining       = ItemContainer 里某个具体 Containable 在内时（仅 ItemContainer 的 Containable）
OnContained        = 被装在某 inventory 里时（仅物品）
OnNotContained     = 未被装在任何 inventory 里时（仅物品）
OnActive           = 物品 active 时（仅物品）
OnFailure          = 技能检定失败时（仅物品）
OnBroken           = 物品 condition 掉到 0 时（仅物品）
OnFire             = 处于火焰伤害范围时（物品与角色）
InWater            = 浸没时（物品与角色）
NotInWater         = 未浸没时（物品与角色）
OnImpact           = 撞击够硬时（物品看 ItemPrefab.ImpactTolerance / 角色看 Ragdoll.ImpactTolerance）
OnEating           = 角色吃另一角色时（仅角色）
OnDamaged          = 受外部来源伤害时（物品与角色；自身恶化/自损不算）
OnSevered          = 肢体被切断（仅肢体）
OnProduceSpawned   = Growable 产出物品时（仅 Growable）
OnOpen             = 门开（仅门）
OnClose            = 门关（仅门）
OnSpawn            = 生成时（物品与角色）
OnSuccess          = 技能检定成功时（仅物品）
OnAbility          = Ability（天赋效果）触发时（仅 Abilities；target 视 Ability 类型可为角色或物品）
OnInserted         = Containable 放入 ItemContainer 时执行一次（载入既有潜艇/角色时"本来就在里面"不触发）
OnRemoved          = Containable 从 ItemContainer 取出时执行一次
OnDeath            = 角色死亡（仅角色）
```
**角色（Character）可用的 type 子集（11 个）** —— 来源 `/ContentTypes/Character.html`「Child elements」：
```
Always
OnSpawn
OnActive
OnEating
OnImpact
InWater
NotInWater
OnDamaged
OnSevered
OnFire
OnDeath
```

## B.2 `<StatusEffect>` 的 `target` 全部取值（TargetType）

**来源**：`https://regalis11.github.io/BaroModDoc/Misc/StatusEffect.html`，小节「TargetType」。
**共 12 个**。

```
This
Parent
Character
Contained
NearbyCharacters
NearbyItems
UseTarget
Hull
Limb
AllLimbs
LastLimb
LinkedEntities
```
**配套机读说明**
```
This             = 定义该 StatusEffect 的实体本身（物品/角色/肢体）
Parent           = 物品语境：装着它的容器；肢体语境：它所属的角色
Character        = 定义处的角色；物品/攻击语境：正在使用该物品/攻击的角色
Contained        = 定义处实体（inventory）里装着的物品
NearbyCharacters = 定义处实体附近的角色；范围由 Range 决定
NearbyItems      = 定义处实体附近的物品；范围由 Range 决定
UseTarget        = 物品/攻击正在作用的对象
Hull             = 定义处实体所在的 hull
Limb             = 物品/攻击作用的对象；角色语境下用 targetLimbs 指定是哪条肢体
AllLimbs         = 被作用角色的所有肢体
LastLimb         = 被作用角色的最后一条肢体
LinkedEntities   = 该物品链接到的所有实体（物品/结构）。仅物品有效
```

## B.3 `StatTypes` 全部取值（含 `AbilityFlags`）

**来源**：`https://regalis11.github.io/BaroModDoc/Misc/StatTypes.html`，小节「StatTypes」与「AbilityFlags」。

**StatTypes：83 个**
```
None
ElectricalSkillBonus
HelmSkillBonus
MechanicalSkillBonus
MedicalSkillBonus
WeaponsSkillBonus
HelmSkillOverride
MedicalSkillOverride
WeaponsSkillOverride
ElectricalSkillOverride
MechanicalSkillOverride
MaximumHealthMultiplier
MovementSpeed
WalkingSpeed
SwimmingSpeed
PropulsionSpeed
BuffDurationMultiplier
DebuffDurationMultiplier
MedicalItemEffectivenessMultiplier
FlowResistance
AttackMultiplier
TeamAttackMultiplier
RangedAttackSpeed
RangedAttackMultiplier
TurretAttackSpeed
TurretPowerCostReduction
TurretChargeSpeed
MeleeAttackSpeed
MeleeAttackMultiplier
RangedSpreadReduction
RepairSpeed
MechanicalRepairSpeed
ElectricalRepairSpeed
DeconstructorSpeedMultiplier
RepairToolStructureRepairMultiplier
RepairToolStructureDamageMultiplier
RepairToolDeattachTimeMultiplier
MaxRepairConditionMultiplierMechanical
MaxRepairConditionMultiplierElectrical
IncreaseFabricationQuality
GeneticMaterialRefineBonus
GeneticMaterialTaintedProbabilityReductionOnCombine
SkillGainSpeed
ExtraLevelGain
HelmSkillGainSpeed
WeaponsSkillGainSpeed
MedicalSkillGainSpeed
ElectricalSkillGainSpeed
MechanicalSkillGainSpeed
MedicalItemApplyingMultiplier
BuffItemApplyingMultiplier
PoisonMultiplier
TinkeringDuration
TinkeringStrength
TinkeringDamage
ReputationGainMultiplier
ReputationLossMultiplier
MissionMoneyGainMultiplier
ExperienceGainMultiplier
MissionExperienceGainMultiplier
ExtraMissionCount
ExtraSpecialSalesCount
StoreSellMultiplier
StoreBuyMultiplierAffiliated
StoreBuyMultiplier
ShipyardBuyMultiplierAffiliated
ShipyardBuyMultiplier
MaxAttachableCount
ExplosionRadiusMultiplier
ExplosionDamageMultiplier
FabricationSpeed
BallastFloraDamageMultiplier
HoldBreathMultiplier
Apprenticeship
CPRBoost
LockedTalents
HireCostMultiplier
InventoryExtraStackSize
SoundRangeMultiplier
SightRangeMultiplier
DualWieldingPenaltyReduction
NaturalMeleeAttackMultiplier
NaturalRangedAttackMultiplier
```

**AbilityFlags：13 个**
```
None
MustWalk
ImmuneToPressure
IgnoredByEnemyAI
MoveNormallyWhileDragging
CanTinker
CanTinkerFabricatorsAndDeconstructors
TinkeringPowersDevices
GainSkillPastMaximum
RetainExperienceForNewCharacter
AllowSecondOrderedTarget
AlwaysStayConscious
CanNotDieToAfflictions
```

**原文对 `None` 的机读语义（两个表都要用）**：
```
StatTypes.None     = "Used to indicate an invalid stat type. Should not be used."
AbilityFlags.None  = "Used to indicate an erroneous ability flag. Should not be used."
```

## B.4 EventAction 元素名全部清单

**来源**：`https://regalis11.github.io/BaroModDoc/Misc/ScriptedEvents.html`，小节「Event actions」。
**共 61 个**（上一份 `barodoc-reference.md` 记为 60 —— 复查原文清单实为 61 行；差异来自 `GiveSkillExpAction` 等相邻条目的计数）。
每个名字对应 `/EventActions/<Name>.html`，该页给出该 action 的完整属性表。

```
AfflictionAction
CheckAfflictionAction
CheckConditionalAction
CheckConnectionAction
CheckDataAction
CheckReputationAction
CheckItemAction
CheckMissionAction
CheckMoneyAction
CheckObjectiveAction
CheckOrderAction
CheckPurchasedItemsAction
CheckSelectedAction
CheckTalentAction
CheckTraitorEventStateAction
CheckTraitorVoteAction
CheckVisibilityAction
CountTargetsAction
RNGAction
SkillCheckAction
ClearTagAction
CombatAction
ConversationAction
EventLogAction
EventObjectiveAction
FireAction
GiveExpAction
GiveSkillExpAction
GodModeAction
GoTo
HighlightAction
InventoryHighlightAction
Label
MessageBoxAction
MissionAction
MissionStateAction
ModifyLocationAction
MoneyAction
NPCChangeTeamAction
NPCFollowAction
NPCOperateItemAction
NPCWaitAction
OnRoundEndAction
RemoveItemAction
ReputationAction
SetDataAction
SetPriceMultiplierAction
SetTraitorEventStateAction
SpawnAction
StatusEffectAction
TagAction
TeleportAction
TriggerAction
TriggerEventAction
TutorialCompleteAction
TutorialIconAction
UIHighlightAction
UnlockPathAction
WaitAction
WaitForItemFabricatedAction
WaitForItemUsedAction
```
**已抓到属性表的 action（14 个，见 A.16）**：
```
SpawnAction
TagAction
ConversationAction
CheckConditionalAction
TriggerAction
WaitAction
FireAction
AfflictionAction
StatusEffectAction
GiveExpAction
ClearTagAction
CheckItemAction
GoTo
MessageBoxAction
```
**`Option`**：不是 EventAction（是 `ConversationAction` 的子元素），`/EventActions/Option.html` = **404**；已知属性只有 `text`、`endconversation`（来源「Examples」示例）。

## B.5 `<EventSet>` 完整属性名清单（标出默认值）

**来源**：`https://regalis11.github.io/BaroModDoc/ContentTypes/RandomEvents.html`，小节「EventSet」的自动生成属性表。
**该表共 28 个属性 + 2 个子元素**。`identifier` / `leveltype` / `locationtype` / `onceperoutpost` **不在这张表里**（来自同站正文示例与本机原版内容，见末尾）。

| 属性（原样大小写） | 类型 | 默认值 | 说明要点 |
|---|---|---|---|
| `Biome` | Identifier | `Empty` | 只能在指定生态群落被选中 |
| `MinLevelDifficulty` | float | `0` | 关卡难度须 ≥ 此值 |
| `MaxLevelDifficulty` | float | `100` | 关卡难度须 ≤ 此值 |
| **`Additive`** | bool | **`false`** | **additive 集合被选中时，游戏还会再选一个非 additive 集合** —— 即"额外再抽一次"，用来在不覆盖原版事件的前提下追加内容 |
| `Faction` | Identifier | `""` | 只能在属于该派系的地点被选中 |
| `MinIntensity` | float | `0` | 当前 EventManager intensity 不在此区间时事件被延迟 |
| `MaxIntensity` | float | `100` | 同上 |
| `ChooseRandom` | bool | `false` | 从本集合里**随机**选一个事件或子集合 |
| `eventCount` | int | `1` | **仅 ChooseRandom 启用时有效**：随机选几个 |
| `Exhaustible` | bool | `false` | 一个 world step（约 10 分钟）内不会在同一关卡再出现 |
| `MinDistanceTraveled` | float | `0` | 潜艇至少走了多远才激活；**0–1，0=关卡起点、1=终点** |
| `MinMissionTime` | float | `0` | 回合至少持续这么多秒才激活 |
| `AllowAtStart` | bool | `false` | false 时潜艇要离关卡起点 ≥50 米才激活。**仅在 LocationConnections（地点之间的关卡）有效** |
| `PerRuin` | bool | `false` | 每个 ruin 各应用一次 |
| `PerCave` | bool | `false` | 每个 cave 各应用一次 |
| `PerWreck` | bool | `false` | 每个 wreck 各应用一次 |
| `DisableInHuntingGrounds` | bool | `false` | 关卡含 hunting grounds 时不适用 |
| `IgnoreCoolDown` | bool | – （未标默认） | 忽略事件冷却 |
| `IgnoreIntensity` | bool | – | 忽略 intensity 限制 |
| `DelayWhenCrewAway` | bool | – | 半数船员离艇时是否延迟（上限见 EventManagerSettings.FreezeDurationWhenCrewAway） |
| `OncePerLevel` | bool | – | 本集合的事件每关卡只发生一次 |
| `TriggerEventCooldown` | bool | `true` | 激活时是否触发"事件冷却" |
| `Campaign` | bool | – | 仅战役模式可选中 |
| `ResetTime` | float | `0` | 距上次触发经过这么多秒后可再次触发 |
| `CampaignTutorialOnly` | bool | `false` | 仅在战役教程开启时出现 |
| `ForceAtDiscoveredNr` | int | `-1` | 按"已发现其他地点数"强制选该集合（教程用） |
| `ForceAtVisitedNr` | int | `-1` | 按"已访问前哨站数"强制选该集合（教程用） |
| `Commonness` | float | `1` | 该集合被选中的权重 |

**EventSet 子元素（同页）**：
```
commonness   (float)           = 同 Commonness，权重
eventset     (EventSet)        = 嵌套子集，即 EventSet 可自我嵌套
```

**不在这张自动表里、但被同站正文示例使用（文档自身不一致，机读时按"已文档化"处理）** ——
来源 `https://regalis11.github.io/BaroModDoc/Misc/ScriptedEvents.html`「Triggering events → Event sets」：
```
identifier        (string)     = 集合标识；官方示例 <EventSet identifier="outpostevents.custom" …>
leveltype         (string)     = 官方示例 leveltype="outpost"（自动表未列）
locationtype      (string)     = 官方示例 locationtype="research,military"（自动表未列，逗号分隔多值）
eventcount        (int)        = 官方示例 eventcount="2"（自动表列的是驼峰 eventCount）
additive          (bool)       = 官方示例 additive="true"（自动表列为 Additive，默认 false）
```

**`onceperoutpost`（文档未覆盖）**：`https://regalis11.github.io/BaroModDoc/ContentTypes/RandomEvents.html` 的 EventSet 表与本页正文示例
**都没有**这个属性；但本机原版 `Content/Events/EventSets.xml` 有 13 处实例（见 C.4）。

**`EventPrefab`（同页）机读默认值**：
```
Commonness              = 1      （仅当事件集配置为"随机选一个事件"时有效）
Probability,spawnprobability = 1
TriggerEventCooldown    = (未标)
UnlockPathEvent         = false
UnlockPathTooltip       = "lockedpathtooltip"   （仅 UnlockPathEvent=true）
UnlockPathReputation    = 0                     （仅 UnlockPathEvent=true）
```

---

# C. 与 `dsh-tool-barotrauma` 现有实现的差异

**对照文件**：`src/events.ts`、`src/characters.ts`、`src/items.ts`、`src/validate.ts`（另读了 `src/xml.ts` / `src/l10n.ts` 的引用点）。
**⚠️ 重要前提**：与上一份 `barodoc-reference.md` 的 C 节相比，**代码已经改过好几轮**，它列的 C.3「冲突」多条**已经修复**。
以下按**当前磁盘代码**逐条核对。

## C.1 ✅ 一致（文档支持现有做法）

| # | 代码位置 | 文档支持 |
|---|---|---|
| 1 | `validate.ts:189-219` 检查「同元素内属性名重复」+「只能有一个根元素」 | `/Intro/XML.html`「Barotrauma-specific notes」两条硬约束原文 ✔（且大小写不同的同名额外单独判为 major，属合理加严） |
| 2 | `validate.ts:588-592` 找不到游戏目录时只 warning、不报错 | `/Intro/XML.html` 没有 `Content/...` 引用规范 → 无法硬校验，warning 处理正确 ✔ |
| 3 | `validate.ts:622-631` filelist 子元素名走 `CONTENT_TYPES_LOWER` 白名单，非法记 blocker | `/Intro/ContentPackages.html`「File list」"must be one of the content types" ✔ |
| 4 | `validate.ts:782-792` identifier 撞车文案 = "整个 mod 被游戏禁用"、severity=blocker | `/Misc/Troubleshooting.html` 第 4 条原文 ✔（**上一份参考指出的旧文案已改好**） |
| 5 | `validate.ts:758-765` `<RequiredItems?` 单复数都认 | `/Misc/StatusEffect.html`「Elements」"requireditems: Alias of 'requireditem'" ✔（**已修好**） |
| 6 | `validate.ts:388-397` 运算符表与 Conditional 页一致，`ge` 单独注释为"文档漏列、原版在用" | `/Misc/Conditional.html`（本次未重抓，沿用上一份参考）✔；**已删掉 `l`/`le`/`g`** |
| 7 | `events.ts:156` 生成 `additive="true"` | `/Misc/ScriptedEvents.html`「Event sets」"often how mods should configure events" ✔（**已加上**） |
| 8 | `events.ts:127` `<TagAction criteria="player" tag="player" />` | `/EventActions/TagAction.html`「Attributes」`Criteria` 取值表里第一个就是 `player` ✔ |
| 9 | `events.ts:131-132` `<SpawnAction speciesname=… spawnlocation=… targettag=… amount=… />` | `/EventActions/SpawnAction.html`「Attributes」四个属性名全部命中 ✔（属性名大小写不敏感） |
| 10 | `events.ts:141` `<ConversationAction targettag=… text=… eventsprite=…>` + `Option text/endconversation` | `/EventActions/ConversationAction.html`「Attributes」的 `TargetTag`/`Text`/`EventSprite` ✔；`Option` 属性来自 `/Misc/ScriptedEvents.html`「Examples」✔ |
| 11 | `items.ts:799` `<Effect minstrength= maxstrength= strengthchange= />` | `/ContentTypes/Afflictions.html`「Effect」三个属性名与语义完全一致 ✔ |
| 12 | `items.ts:810-820` 的 `maxstrength` / `targets` / `isbuff` / `showiconthreshold` / `showinhealthscannerthreshold` / `limbspecific` / `iconcolors` / `type` / `healableinmedicalclinic` | `/ContentTypes/Afflictions.html`「Attributes」表**逐项命中**（含 `Type`、`Targets`、`IsBuff`、`LimbSpecific`、`ShowIconThreshold`、`ShowInHealthScannerThreshold`、`IconColors`、`HealableInMedicalClinic`）✔ |
| 13 | `items.ts:283-291` 用 `type="OnSuccess"` / `OnFailure` / `OnBroken` / `OnUse` | `/Misc/StatusEffect.html`「ActionType」全部存在 ✔ |
| 14 | `items.ts:89-91` `<Attack …><Affliction identifier= strength= /></Attack>` | `/Misc/Attack.html`「Elements」**未列 affliction**，但本机真实 mod 同样写法（C.4 #3）→ 依赖实例，非文档支持；**不算错** |
| 15 | `characters.ts:88-104` 子元素 `ragdolls`/`animations`/`health`/`bloodemitter`/`damageemitter`/`gibemitter`/`sound`/`Inventory`/`ai` | `/ContentTypes/Character.html`「Child elements」表**全部列出** ✔（必需子元素无遗漏） |
| 16 | `characters.ts:79` `<Inventory slots="Any, Any" accessiblewhenalive="false" commonness="1">` + `<Item identifier=… />` | `/ContentTypes/Character.html` 的 Inventory 官方示例完全同构（含 `commonness` 权重语义）✔ |
| 17 | `characters.ts:207` 显示名写 `character.<SpeciesName>` 而**不**写 `DisplayName` 属性 | `/ContentTypes/Character.html` 的 `DisplayName` 明文："**Leave blank, if the name is defined in the Text files**" ✔ |
| 18 | `characters.ts:92` `<health vitality= doesbleed= crushdepth= />` | 同页 health 官方示例属性名一致 ✔ |
| 19 | `validate.ts:61-65` 剥离注释与 CDATA | `/Intro/XML.html` 明说注释被忽略 ✔；CDATA 文档未覆盖但剥离是安全策略 |
| 20 | `validate.ts:91-95` 不再整片豁免 `config/`、`assets/`，改为"存在 ModConfig.xml 才豁免" | `/Intro/ContentPackages.html` 要求登记每个内容 XML；"某目录整片免登记"文档里不存在 ✔（**已收窄**） |

## C.2 ⚠️ 文档有补充 / 建议补的（按价值排序）

| # | 现状（文件:行） | 文档补充（URL + 小节） | 建议 |
|---|---|---|---|
| **1** | `events.ts:154-161`：`chooserandom="false"`，同时在 `:160` 写 `<ScriptedEvent identifier=… commonness="100" />` | `/ContentTypes/RandomEvents.html`「EventPrefab」：`Commonness` **"Only valid if the event set is configured to choose a random event"**；`eventCount` 也**仅 ChooseRandom 时有效**（同页「EventSet」） | **`commonness` 在 `chooserandom="false"` 下是死属性。** 要么把 `chooserandom` 暴露成参数（默认 true，并按 B.5 支持 `eventcount`），要么在 `chooserandom="false"` 时**不要写 commonness**，避免误导作者 |
| **2** | `events.ts:152-153` 注释：「不加 additive 会**替换**掉原版的同名 EventSet，而不是追加事件」 | `/ContentTypes/RandomEvents.html`「EventSet」的 `Additive` 原文：additive 集合被选中时游戏**还会再选一个非 additive 集合**；`/Misc/ScriptedEvents.html`「Event sets」说的是"add more events on top" | **注释的因果写错了**（additive 的机制是"额外再抽一次"，不是"不加就替换"）。建议按原文改写注释，并把 `additive` 做成参数（默认 true） |
| **3** | `events.ts:154-159` 只用了 10 个 EventSet 属性 | B.5 的自动表有 **28 个**属性 | 至少补：`eventcount`（配 chooserandom）、`biome`、`faction`、`percave`/`perwreck`/`perruin`、`exhaustible`、`mindistancetraveled`、`minmissiontime`、`campaign`、`resettime`、`triggercooldown` —— 这些都是**怪物生成类 mod 的常用开关** |
| **4** | `events.ts:158` 硬编码 `ignorecooldown="true"` | `/ContentTypes/RandomEvents.html`「EventSet」：`IgnoreCoolDown` 默认值**未标**，语义 = "忽略事件冷却（冷却期内不再生成新事件）" | 硬编码 true 会让该事件**无视冷却反复触发**，建议改成参数（默认 false，与文档"未标默认"的保守取向一致）并在注释里引用原文 |
| **5** | `events.ts:159` `onceperoutpost="…"` | **BaroModDoc 全站未覆盖 `onceperoutpost`**（查过 `/ContentTypes/RandomEvents.html`「EventSet」表与 `/Misc/ScriptedEvents.html`「Event sets」正文示例，都没有） | 保留（本机原版 `Content/Events/EventSets.xml` 13 处实例，见 C.4 #2），但**必须在注释里标明"文档未覆盖，取自本机原版内容"** |
| **6** | `events.ts:131` `spawnlocation` 默认 `"Outpost"` | `/EventActions/SpawnAction.html`「Attributes」：`SpawnLocation` 类型是 `SpawnLocationType`，**默认 `Any`**，并且**文档没有列出该枚举的取值** | 保留 `Outpost`（本机原版最常见写法），但注释里注明"枚举取值文档未列，取自本机 `Content/Events/*.xml`（见 C.4 #3）"；同时可考虑支持 `Any` |
| **7** | `events.ts:141` ConversationAction 只写了 text/targettag/eventsprite | `/EventActions/ConversationAction.html`「Attributes」还有 `SpeakerTag`/`DialogType`/`WaitForInteraction`(默认 **true**)/`FadeToBlack`/`ContinueConversation`/`ContinueAutomatically`/`IgnoreInterruptDistance` | 至少补 **`speakertag`**（官方 `/Misc/ScriptedEvents.html`「Examples」自己就用 `speakertag="outpostmanager" dialogtype="Small"`）；补 `dialogtype` 能让提示框样式可控 |
| **8** | `characters.ts:89` 只生成 `SpeciesName` / `humanoid` / `group` 三个根属性 | `/ContentTypes/Character.html`「Root element attributes」有 **30+ 个**（`NeedsAir`、`NeedsWater`、`CanSpeak`、`CanEat`、`EatingSpeed`、`UsePathFinding`、`AITurretPriority`、`DespawnContainer`…） | 根据新生成怪物的用途补最常用的几个（`needsair` 对鱼形怪、`caneat`、`canspeak`、`aiturretpriority`） |
| **9** | `characters.ts:98-103` 的 `<ai>` 只生成 6 个属性 + `<targetpriority>` | 同页 `ai` 小节说"too many parameters to list"；官方示例的 `<target …>` 带 `reactdistance` / `attackdistance` / `ignoreifnotinsamesub` 等 | 可补 `reactdistance` / `attackdistance`（否则 AI 反应距离只能用默认） |
| **10** | `characters.ts:92` health 只有 3 个属性、无 `<Limb>` 子元素 | 同页 health 官方示例含 `usehealthwindow` / `bleedingreduction` / `burnreduction` / `constanthealthregeneration` / `healthregenerationwheneating`，以及 `<Limb><VitalityMultiplier type= multiplier= /></Limb>` | 文档明说"ragdoll 里每条肢体的 `healthindex` 指向这里的 limb 定义" → 需要按肢体调伤害的怪物应支持 limb 块（当前不支持 = 功能缺失，不产生错误） |
| **11** | `items.ts:819` 硬编码 `healableinmedicalclinic="false"`, `items.ts:810` 写 `name=""` `description=""` | `/ContentTypes/Afflictions.html`「Attributes」：`HealableInMedicalClinic` 默认 **"buff 或 type 为 geneticmaterialbuff/geneticmaterialdebuff 时 false，否则 true"**；本页属性表**没有** `name` / `description` / `indicatorlimb` | `healableinmedicalclinic="false"` 对所有 affliction 一律写死会**关掉医疗站治疗**（除非有意）→ 建议改成参数或按文档默认省略；`name`/`description`/`indicatorlimb` 属"文档未覆盖但本机样本在用"，注释里标一下 |
| **12** | `items.ts:734-735` 工具描述承诺"可选 `<icon>`、`<Effect>` 与**内嵌 `<StatusEffect>`**" | `/ContentTypes/Afflictions.html`「Effect → Elements」确认 `statuseffect` 是 Effect 的合法子元素 | **实现与自己的描述不符**：代码只生成 `<Effect … />` 自闭合 + `<icon>`，**没有**生成内嵌 `<StatusEffect>`（`items.ts:795-821`）→ 要么补参数，要么改描述 |
| **13** | `items.ts:805` `<icon … sheetindex="0,0" sheetelementsize="128,128" origin="0,0" />` | `/ContentTypes/Afflictions.html`「Elements」只说 `icon` 是 `Sprite`；`/ContentTypes/Item.html` 的 sprite 说明用 `sourcerect` | `sheetelementsize` **文档未覆盖**（本机 Neurotrauma 样本在用）→ 注释里标注来源；`items.ts:808` 的注释已经把两种写法都写出来了，做得好 |
| **14** | `items.ts:801` 默认生成 `<Effect minstrength="0" maxstrength="100" …/>`；`items.ts:752` 的 `effects` 参数格式 `"0-5:10"` / `"5-200:0"` | `/ContentTypes/Afflictions.html`「effect」原文："Only one effect can be applied at any given moment, so their ranges should be defined with **no overlap**." | 示例 `["0-5:10","5-200:0"]` 在 **5** 处边界重叠 → 按文档应避免；建议生成/校验时检查区间重叠并 warning |
| **15** | `validate.ts:97-98` `CONTENT_TYPE_INDEX` 只用于"写错时提建议" | B.4 / `/Intro/ContentTypes.html` 的 45 个内容类型是权威清单 | 已经够用；若要更严，可把 `CONTENT_TYPE_INDEX` 换成精确白名单（现状已是精确白名单在 622 行） |
| **16** | `validate.ts:5-13` 模块头注释列的检查项 | `/Misc/Performance.html` 的三条硬建议（`Always` 最差 / 默认 `interval=0` 每帧 / `OnContaining` 优于每帧 `RequiredItem`）；`/Misc/Troubleshooting.html` 第 1 条"改 filelist 后必须重启游戏" | 可在 `warnings` 里加：(a) 改了 filelist 必须重启游戏；(b) 扫 `<StatusEffect type="Always">` 与缺 `interval` 的持续型效果给 minor 性能提示（Performance 页原文可直接引用） |

## C.3 ❌ 冲突（文档原文 vs 代码位置）

| # | 代码位置 | 文档原文 | 判定 |
|---|---|---|---|
| **1** | `validate.ts:7`（模块头注释）：「物品 `identifier` 重复（**同 mod 内重复会让后一个覆盖前一个**）」 | `/Misc/Troubleshooting.html` 第 4 条：报错是 `Failed to add the prefab X from MyMod: a prefab with the same identifier from OtherMod already exists; try overriding`，且 **"the game now disables mods with such errors"** | **仍是错的**：运行时文案（`validate.ts:784-792`）已经改对成"整个 mod 被禁用 + blocker"，但**第 7 行的模块头注释没跟着改** → 改这一行注释即可（低风险、明确冲突） |
| **2** | `characters.ts:75` 生成 `<targetpriority tag= state= priority= />` | `/ContentTypes/Character.html`「Child elements」的 `ai` 官方示例用的是 **`<target tag=… state=… priority=… reactdistance=… />`**；同页 Elements 表根本没列 `target`/`targetpriority`（"too many parameters to list"） | **不算硬冲突，但字段名与文档示例不一致**。本机两种都有（`<target>` 是主流，`<targetpriority>` 见 C.4 #1）→ 建议：生成器接受两种写法（或改用文档示例的 `<target>`），并在注释里注明 |
| **3** | `validate.ts:407` 注释与 `:433` 的正则把 `comparison` 与 `conditionalcomparison` 当同一东西校验 | `/Misc/StatusEffect.html`「Attributes」里**只有 `conditionalComparison`**；`/Misc/Conditional.html` 整页**没有** `comparison` | **代码是对的**（本机 2611+9182 处 `comparison` 实例），但**文档只认 `conditionalComparison`** → 保留代码、注释里明确"文档正式名是 `conditionalComparison`，`comparison` 无文档支持但有大量实例" |
| **4** | `events.ts:152-153` 注释断言"不加 `additive` 会替换原版 EventSet" | `/ContentTypes/RandomEvents.html`「EventSet」`Additive` 原文说明 additive 是"额外再选一个非 additive 集合"，`/Misc/ScriptedEvents.html` 说是"add more events on top"，**两处都没有"不加就替换"的说法** | **注释与文档语义冲突**（见 C.2 #2）→ 改注释 |
| **5** | `items.ts:91` / `items.ts:200` 在 `<Attack>` 下写 `<Affliction>` | `/Misc/Attack.html`「Elements」表**只有** `particleemitter` / `sound` / `statuseffect`，**没有 `affliction`** | **文档很可能漏列**：本机 `LocalMods/SmartPistol/SmartPistol.xml:43-47` 同样写法（C.4 #3）→ 保留代码，注释里注明"文档未列，依赖真实文件"（`items.ts` 目前没有这条注释） |
| **6** | `items.ts:289-291` 写 `<StatusEffect type="OnBroken" target="This"><Remove /></StatusEffect>` | `/Misc/StatusEffect.html`「Elements」表（19 项）**没有 `remove`**；但 `/Misc/Performance.html`「Interval」官方示例用的正是 `<Remove />` | **文档两页自相矛盾**：`Remove` 的写法由 Performance 页官方示例支持 → 代码保留，`reference.md` 里标注"StatusEffect 页 Elements 表未列" |
| **7** | `validate.ts:92` 的 `NO_REGISTRATION_NEEDED` 含 `modconfig.xml` / `runconfig.xml`；`:95` 的 `MODCONFIG_DECLARED` 在存在 ModConfig.xml 时整片豁免 `config/`、`assets/` | `/Intro/ContentPackages.html`「File list」要求"每个要加载的内容 XML"都登记；**BaroModDoc 全站没有 ModConfig.xml 的页面** | **文档未覆盖**（ModConfig 属 LuaCsForBarotrauma 体系）：豁免逻辑没有文档依据，但也没有文档反对 → 建议在注释里注明"依据 LuaCs 的 ModConfig 机制，BaroModDoc 未覆盖"（当前注释已提到 `ModConfig.xml` 声明式加载，来源可补一句） |

## C.4 本机证据（支撑"文档未覆盖但实现有依据"）

| # | 结论 | 本机证据（来源：本次 grep 本机磁盘，**非文档**） |
|---|---|---|
| 1 | `<ai>` 里 **`<targetpriority>` 与 `<target>` 都真实存在**，`<target>` 是主流 | `<targetpriority>`：`Content/Characters/Carrier/Carrier.xml:29-33`、`Legacymoloch/Legacymoloch.xml:21-26`、`Legacymantis/Legacymantis.xml:35-43`；`<target>`：`Bonethresher.xml:6-23`、`Hammerhead.xml:34-50`、`Crawlerhusk.xml:63-76`、`Fractalguardian.xml:65-74` 等**大量**文件（本次 grep 命中 250/595） |
| 2 | **`onceperoutpost` 在原版内容里真实使用**（文档全站未覆盖） | `Content/Events/EventSets.xml:303,327,364,365,375,382,398,405,434,440,445,451` 共 **13 处**，例：`<EventSet identifier="outpostevents.easy.generic.randomevents" minleveldifficulty="0" maxleveldifficulty="30" allowatstart="true" chooserandom="true" onceperoutpost="true">` |
| 3 | **`spawnlocation` 的取值**（文档只给类型名、未列枚举）至少包含 `Outpost` / `outpost` / `beaconstation` / `MainSub`；本机**大小写混用** | `Content/Events/OutpostEvents.xml:103`（`Outpost`）、`:354`（`MainSub`）；`TraitorEvents.xml:206`（`beaconstation`）、`ChainingEvents.xml:108`（`outpost` 小写） |
| 4 | 原版 EventSet 用 `identifier` / `locationtype` / `minleveldifficulty` / `maxleveldifficulty` / `allowatstart` / `chooserandom` / `onceperoutpost` | `Content/Events/EventSets.xml:375` `<EventSet identifier="outpostevent.military.randomevents" minleveldifficulty="0" maxleveldifficulty="80" locationtype="military" allowatstart="true" chooserandom="true" onceperoutpost="true">` |
| 5 | `<Attack>` 下直接写 `<Affliction>` 是真实写法（`/Misc/Attack.html` Elements 表未列） | `LocalMods/SmartPistol/SmartPistol.xml:43-47` `<Attack structuredamage="10" …><Affliction identifier="gunshotwound" strength="24" /></Attack>`（上一份参考已取证，本次沿用） |
| 6 | `comparison="and|or"` 大量真实存在（文档只列 `conditionalComparison`） | 上一份参考的 grep：原版 2611 处 / LocalMods 9182 处（本次未重复统计） |
| 7 | `afflictionname.*` / `afflictiondescription.*` / `eventtext.*` 前缀无文档明文但在官方文件里存在 | 上一份参考：`Content/Texts/English/EnglishVanilla.xml` 311 处 `afflictionname.*`；`Content/Events/**` 1957 处 `eventtext.*` 引用 |

---

# D. 本文件明确标注「文档未覆盖」的清单（附"查了哪几页"）

| 主题 | 查过的页 | 结论 |
|---|---|---|
| 属性名**大小写是否敏感** | `/Intro/XML.html` 全页 | **文档未覆盖** |
| 数字/枚举的**书写格式**（`0.5f` 后缀等） | `/Intro/XML.html` 全页 | **文档未覆盖** |
| **CDATA** 支持 | `/Intro/XML.html` 全页 | **文档未覆盖** |
| `Content/...` 原版资源引用语法 | `/Intro/XML.html`（只讲 `%ModDir%` 与 `%ModDir:[NAME]%`） | **文档未覆盖** |
| 语言文件结构（`<infotexts>` 根、`language`/`nowhitespace`/`translatedname`、语言怎么选） | `/ContentTypes/Text.html`（全页只有 "Required by core package: No" + 源码链接） | **文档未覆盖** |
| 本地化**键名规则/前缀**（`afflictionname.*`、`eventtext.*`） | `/ContentTypes/Text.html`、`/ContentTypes/Afflictions.html`、`/Misc/ScriptedEvents.html` | **文档未覆盖**（有官方文件实例：311 / 1957 处） |
| `Text` 之外还需要登记哪些语言相关文件 | `/ContentTypes/Text.html`、`/ContentTypes/Other.html` | **文档未覆盖** |
| `Other` 内容类型的**用途清单**（哪些文件该用它登记） | `/ContentTypes/Other.html`（只有 "Alternate names: None"） | **文档未覆盖** |
| EventSet 的 `identifier` / `leveltype` / `locationtype` | `/ContentTypes/RandomEvents.html`「EventSet」自动表**未列**；`/Misc/ScriptedEvents.html`「Event sets」正文示例在用 | **文档自相矛盾**（正文有、自动表无） |
| EventSet 的 `onceperoutpost` | 同上两页都没有 | **文档未覆盖**（本机原版 13 处实例） |
| `spawnlocation`（SpawnLocationType）的**取值枚举** | `/EventActions/SpawnAction.html`「Attributes」（只给类型名） | **文档未覆盖**（本机见 Outpost/outpost/beaconstation/MainSub） |
| `SpawnPointType`（SpawnType）的取值枚举 | 同上 | **文档未覆盖** |
| `DialogType`（DialogTypes）的取值枚举 | `/EventActions/ConversationAction.html`（只给类型名） | **文档未覆盖** |
| `LimbType` 取值 | `/EventActions/AfflictionAction.html`、`/Misc/Attack.html`（都只说"见 Barotrauma.LimbType"） | **文档未覆盖** |
| `Option` 元素的完整属性表 | `/EventActions/Option.html`（**404**）、`/Misc/ScriptedEvents.html`「Examples」 | **文档未覆盖**（只有 `text` / `endconversation` 能见到） |
| `<Attack>` 子元素 `affliction` | `/Misc/Attack.html`「Elements」 | **文档很可能漏列**（本机实例支持） |
| `<StatusEffect>` 子元素 `remove` | `/Misc/StatusEffect.html`「Elements」**未列**，`/Misc/Performance.html`「Interval」官方示例在用 | **文档两页自相矛盾** |
| `RequiredItems` 的 `type` 取值（如 `Contained`） | `/Misc/RelatedItem.html`（无取值表）、`/Misc/Performance.html`（示例在用） | **文档未覆盖** |
| `<Affliction>` 的 `indicatorlimb` / `name` / `description` 属性 | `/ContentTypes/Afflictions.html`「Attributes」 | **文档未覆盖**（本机 Neurotrauma 样本在用） |
| `<icon>` 的 `sheetelementsize` 属性 | `/ContentTypes/Afflictions.html`「Elements」（只说 icon 是 Sprite） | **文档未覆盖**（本机样本在用） |
| `EventActions` 其余 47 个 action 的属性表 | `/Misc/ScriptedEvents.html`「Event actions」只给链接 | **本次未逐页抓**（页面存在，URL 模板 `/EventActions/<Name>.html`） |
| 工坊预览图文件名 / filelist 的 `steamworkshopid` 等 | `/Intro/Publishing.html` 全页 | **文档未覆盖** |

---

**本文件未修改任何被读取的文件；仅新建 `refs/barodoc-remaining.md` 这一份产物。**
