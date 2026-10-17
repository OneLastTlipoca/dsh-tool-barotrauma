# 潜渊症 (Barotrauma) v1.13.4.0 Mod 施工参考（实测版）

> 目的：为 DSH 插件生成潜渊症内容包提供**基于本机真实文件**的字段与结构事实。
> 游戏目录：`F:\SteamLibrary\steamapps\common\Barotrauma`
> 版本：**1.13.4.0**（Summer Update 2026 Hotfix 1），来源：`F:\SteamLibrary\steamapps\common\Barotrauma\changelog.txt` 第 1–2 行
> LuaCsForBarotrauma：`1.0.109`，来源：`F:\SteamLibrary\steamapps\common\Barotrauma\luacsversion.txt`
> 本地 mod 根目录：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods`
>
> **阅读约定**
> - 每条结论后跟 `来源：<绝对路径>`，必要时带行号。
> - 标 **未验证/需实测** 的条目表示本机静态文件无法证实，禁止当成事实使用。
> - 标注 `[MD]` 的来源指 `潜渊症xml样本..md`，该文件是第三方（冷鸢）AI 提炼文档，**自述"可能有部分是错误的/过时的"**（来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\潜渊症xml样本..md` 第 10 行），凡 `[MD]` 单独支撑而未在真实 XML 中出现的字段，一律视为弱证据。

---

## A. 内容包目录结构

### A.1 最小可加载 mod 目录树

下面这棵树是**从真实样本反推的实际最小值**，不是猜测模板：

```
LocalMods/MyMod/                      <- 目录名 = 显示名（可含空格/中文），见 A.4
├── filelist.xml                      <- 【必需】内容包清单，注册每个要被加载的 XML
├── MyItems.xml                       <- 物品定义（位置任意，只要 filelist 指到）
├── SimplifiedChinese.xml             <- 本地化
├── Items/aaa.png                     <- 贴图（可选，也可放任意子目录）
├── Lua/
│   └── Autorun/
│       └── script.lua                <- 【约定目录】自动执行；无需写进 filelist
└── CSharp/
    ├── RunConfig.xml                 <- 【约定文件】声明 Server/Client 编译目标
    ├── Shared/MyMod.cs               <- 【约定目录】两端都编译
    ├── Client/MyMod.cs               <- 【约定目录】仅客户端
    └── Server/MyMod.cs               <- 【约定目录】仅服务端
```

**逐项作用与证据**

| 路径 | 作用 | 是否必需 | 来源 |
|---|---|---|---|
| `filelist.xml` | 内容包清单；`<contentpackage>` 根，逐条注册 XML 文件 | **必需** | 49 个 `LocalMods/*/filelist.xml` 全部存在，见 A.2 |
| 任意位置的 `.xml` | 物品/角色/事件/本地化等实际内容 | 必需（否则空 mod） | 例：`LocalMods\SmartPistol\SmartPistol.xml` |
| `Lua/Autorun/*.lua` | LuaCs 自动执行脚本（**目录名硬编码**） | 可选 | 官方文档：`https://luatrauma.github.io/Luatrauma.Docs/lua/getting-started/`；实例：`LocalMods\ACA_NonHumanRaces_Extend\Lua\Autorun\script.lua` |
| `CSharp/RunConfig.xml` | 声明 `<Server>`/`<Client>` 编译目标 | 用 C# 时必需 | `LocalMods\BetterHealthUI (Updated)\CSharp\RunConfig.xml` |
| `CSharp/Shared|Client|Server/` | 按目标分别编译（**目录名硬编码**） | 用 C# 时必需 | 官方文档 `https://luatrauma.github.io/Luatrauma.Docs/cs/setup-in-memory-csharp/`；实例同上 |
| `bin/<Client|Server>/<平台>/*.dll` | 预编译程序集 | 可选 | 官方迁移指南 `https://luatrauma.github.io/Luatrauma.Docs/common/migration-guide/` |
| `ModConfig.xml`（mod 根） | 2026 春季重构新增的**声明式加载清单**，替代上述约定目录 | 可选 | 官方文档 `https://luatrauma.github.io/Luatrauma.Docs/common/development/modconfig/`（**本机 LocalMods 内 0 个样本存在此文件**，见 E.2） |

### A.2 `filelist.xml` 的确切格式

**根元素：`<contentpackage>`**，实测属性（对全部 49 个 `filelist.xml` 做属性统计）：

| 属性 | 出现次数 | 值示例 | 必需? |
|---|---|---|---|
| `name` | 49/49 | `"ACAWeaponsExpand"` | **实测 100% 出现** |
| `gameversion` | 49/49 | `"1.13.4.0"`、`"1.7.7.0"` | **实测 100% 出现**（游戏自动写入/更新） |
| `corepackage` | 49/49 | 全部为 `"False"`（大小写混合写法 `"False"`/`"false"` 都存在） | 实测 100% 出现 |
| `modversion` | 48/49 | `"1.0.234"` | 几乎总是出现 |
| `steamworkshopid` | 3/49 | `"3231293294"` | 可选，创意工坊 mod 才有 |
| `installtime` | 1/49 | `"1714337353"` | 可选 |
| `expectedhash` | 1/49 | `"773A33B913735006B0B451698924A1DC"` | 可选 |

> **注意**：任务描述里提到的 `hidden`、`submarines` 属性，在 LocalMods 的 49 个 `filelist.xml` 中**一次都没出现**。→ **未验证/需实测**（可能存在于工坊包或旧版本）。
> 来源：`LocalMods\BetterHealthUI (Updated)\filelist.xml`（同时含 `steamworkshopid`/`installtime`/`expectedhash`）；属性统计见下两段真实片段。

**真实片段 1（最小）**— `来源：F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\SmartPistol\filelist.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<contentpackage name="SmartPistol" modversion="1.0.160" corepackage="False" gameversion="1.11.5.0">
  <Item file="%ModDir%/SmartPistol.xml" />
</contentpackage>
```

**真实片段 2（多类型 + 工坊字段）**— `来源：F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\BetterHealthUI (Updated)\filelist.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<contentpackage name="BetterHealthUI (Updated)" steamworkshopid="3231293294" corepackage="false" modversion="1.0.1" gameversion="1.4.5.0" installtime="1714337353" expectedhash="773A33B913735006B0B451698924A1DC">
  <Other file="%ModDir%/CSharp/Client/BetterHealthUIMod.cs" />
  <Other file="%ModDir%/CSharp/Shared/BetterHealthUIMod.cs" />
</contentpackage>
```

**子元素唯一的实测字段就是 `file`**（值必须以 `%ModDir%/` 开头），没有观测到其它属性（如 `path=`、`hidden=`、`submarines=`）。→ **未验证/需实测**

**子元素名 = 内容类型**，实测出现过的全部 28 种（括号内为 49 个 filelist 中的出现次数）：

```
Character(536)  Item(379)  Other(373)  Submarine(119)  Text(105)
Afflictions(76)  Talents(18)  EnemySubmarine(17)  Wreck(15)  Particles(14)
RandomEvents(13)  ItemAssembly(9)  NPCSets(9)  Jobs(7)  TalentTrees(6)
UIStyle(5)  OutpostModule(5)  Structure(4)  Sounds(4)  Orders(3)
Missions(3)  BackgroundCreaturePrefabs(2)  Outpost(2)  NPCConversations(2)
NPCPersonalityTraits(2)  Factions(2)  Decals(1)  BeaconStation(1)
```

`[MD]` 还提到 `MapGenerationParameters`、`LocationTypes`、`OutpostConfig`、`MapGenerationParameters` —— **在 LocalMods 的 49 个 filelist 中出现次数均为 0**，→ **未验证/需实测**。
来源（[MD] 第 26–71 行）：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\潜渊症xml样本..md`

**`<Outpost>` 的真实语义**— 用于声明**前哨站模块用的 .sub**，不是潜艇：
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\磁轨炮 测试\filelist.xml`
```xml
<Outpost file="%ModDir%/Periscope navigation circuits.sub" />
```

**真实 `Text` 用法（多语言）**— `来源：F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\filelist.xml`
```xml
<Text file="%ModDir%/Localization/English/English.xml" />
<Text file="%ModDir%/Localization/Russian/Russian.xml" />
...
<Text file="%ModDir%/NACAtext/ACA-Neurotraumachinese.xml" />
<Other file="%ModDir%/Localization/German/German.xml" />   <!-- 德语用的是 Other，见 H -->
```

**真实 `Sounds` / `Afflictions` 用法**— 同上文件：
```xml
<Sounds file="%ModDir%/Xml/sounds.xml" />
<Afflictions file="%ModDir%/Xml/Afflictions.xml" />
<Item file="%ModDir%/Xml/items.xml" />
```

### A.3 路径变量

- `%ModDir%` = 该 mod 的根目录（真实 filelist 中 100% 使用）。来源：全部 49 个 `filelist.xml`
- `Content/...`（不带 `%ModDir%`）= 引用**原版游戏**内容，用于复用官方贴图/音效。真实例：
  `LocalMods\SmartPistol\SmartPistol.xml:5` → `texture="Content/Items/InventoryIconAtlas.png"`

### A.4 目录名是"约定"还是"硬编码"？——重要更正

**任务描述里列出的 `Items / Characters / Events / Afflictions / Particles / Sounds / Submarines` 等目录名，全部只是社区习惯，不是硬编码。** 证据：

- `ACAWeaponsExpand` 把上千个物品 XML 直接放在 mod 根目录（`filelist.xml` 里全是 `%ModDir%/xxx.xml`），来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\ACAWeaponsExpand\filelist.xml`
- `MolochMilk` 把物品放根目录、角色放 `Characters/Moloch/`，来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\MolochMilk\filelist.xml`
- `Neurotrauma` 把物品/状态效果/音效全放 `Xml/`，来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\filelist.xml`
- 引擎只认 `filelist.xml` 里声明的 `file=`，路径随便写。

**真正硬编码的只有这些：**

| 硬编码路径 | 作用 | 来源 |
|---|---|---|
| `Lua/Autorun/` | 自动执行 Lua | 官方文档 `lua/getting-started/` |
| `CSharp/Shared|Client|Server/` | 按目标编译 .cs | 官方文档 `cs/setup-in-memory-csharp/` |
| `bin/<Client|Server>/<Platform>/` | 预编译 DLL | 官方迁移指南 |
| `<mod>/Assets/Content/ModConfig.xml` | 新模板中 ModConfig 的位置（官方说"应放在 ContentPackage 顶层目录"，模板里在 `Assets/Content/`） | 官方文档 `modconfig/` |

### A.5 大小写敏感性

**XML 元素名与属性名，实测是大小写不敏感的**（同一批已装 mod 里两种写法并存）：

| 小写 | 大写 | 来源 |
|---|---|---|
| `<Randomevents>` | `<RandomEvents>` | 小写：`LocalMods\NonHumanRaces_Robotrauma_Patch\NPC\KATEEspawn.xml:2`；大写：`LocalMods\Scartarus\Code\event.xml:3` |
| `<sound ...>` | `<Sound ...>` | 小写：`LocalMods\ACAWeaponsExpand\Items\Heavy_Weapons.xml:32`；大写语义等价：`LocalMods\SmartPistol\SmartPistol.xml:12` |
| `<Item Identifier="x">` | `<Item identifier="x">` | 小写：`LocalMods\SmartPistol\SmartPistol.xml:4`；大写：`LocalMods\MolochMilk\Characters\Moloch\Moloch.xml:35` |
| `tags=` / `Tags=` | — | `LocalMods\SmartPistol\SmartPistol.xml:4`（`tags`） vs `LocalMods\ACAWeaponsExpand\Items\Heavy_Weapons.xml:3`（`tags`）；`LocalMods\MolochMilk\Characters\Moloch\Moloch.xml:18`（`Tags=""`） |
| `Scale=` / `scale=` | — | 同上两组文件 |

**贴图/资源文件路径的大小写敏感性** → **未验证/需实测**。Windows NTFS 本身不区分大小写，所以在本机无法用实验区分；跨平台（Linux 服务端）时才可能暴露。**生成器建议：贴图路径一律按磁盘实际大小写输出。**

---

## B. 物品 XML 字段实测清单

### B.1 文件根元素

两种根，都在真实 mod 中出现：

```xml
<?xml version="1.0" encoding="utf-8"?>
<Items>
  <Item ... />
</Items>
```
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\SmartPistol\SmartPistol.xml:2`

```xml
<?xml version="1.0" encoding="utf-8"?>
<override>
  <Items>
    <Item identifier="现有的物品" ... />
  </Items>
</override>
```
来源（同类用法，物品）：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\ACAWeaponsExpand\Items\override_idcard.xml`

`<override>` 语义 = 打补丁/覆盖原版同 `identifier` 物品。统计证据：`ACAWeaponsExpand` 中 `<Override>` 出现 54 次。`[MD]` 第 93–102 行同结论。

### B.2 `<Item>` 元素上的属性

**必需属性（实测，缺一加载器无法注册该物品）：**

| 属性 | 说明 | 证据 |
|---|---|---|
| `identifier` | 唯一标识符；本地化键、`RequiredItem` 引用都靠它 | 全部真实 `<Item>` 都有，例 `SmartPistol.xml:4`、`Heavy_Weapons.xml:3`、`MolochMilkItems.xml` |

**`name` 属性有两种真实用法（易踩坑）：**
- `name=""`（空字符串）= 显示名走本地化 `entityname.<identifier>`。真实例：`LocalMods\SmartPistol\SmartPistol.xml:4` → `<Item name="" identifier="SmartPistol" ...>`
- `name="mobilecoilgun"`（非空）= 直接当显示名用。真实例：`LocalMods\ACAWeaponsExpand\Items\Heavy_Weapons.xml:3`

**常用可选属性（全部有真实文件出处）：**

| 属性 | 值示例 | 出处 |
|---|---|---|
| `category` | `"Weapon"` | `SmartPistol.xml:4` |
| `tags` | `"smallitem,weapon,gun,pistolitem,provocativetohumanai,gunsmith,mountableweapon"` | `SmartPistol.xml:4` |
| `Scale` / `scale` | `"0.5"` | `SmartPistol.xml:4`（大写 S）/ `Heavy_Weapons.xml:3` |
| `cargocontaineridentifier` | `"metalcrate"` | `SmartPistol.xml:4` |
| `impactsoundtag` | `"impact_metal_light"` | `SmartPistol.xml:4` |
| `maxstacksize` | `"8"` | `Content\input.xml:7532` |
| `maxstacksizecharacterinventory` | `"2"` | `Content\input.xml:7532` |
| `allowasextracargo` | `"true"` | `Content\input.xml:2915` |
| `linkable` | `"true"` | `Content\input.xml:7532` |
| `sonarsize` | `"2"` | `SmartPistol.xml:38` |
| `damagedbyexplosions` | `"true"` | `SmartPistol.xml:38` |
| `explosiondamagemultiplier` | `"0.5"` | `SmartPistol.xml:38` |
| `damagedbyprojectiles` | `"true"` | `SmartPistol.xml:38` |
| `variantof` | `"smgmagazine"`（声明是某物品的变体） | `Content\input.xml:2229` |
| `spritecolor` / `inventoryiconcolor` | `"110,120,110"` / `"110,120,110,255"` | `Content\input.xml:2229` |
| `damagedbyprojectiles` `damagedbymeleeweapons` `damagedbyexplosions` `damagedbyrepairtools` `RequireAimToUse` `hideconditionbar` `hideconditionintooltip` `hidehealthbar` | — | `[MD]` 第 13–22 行 + `潜渊症xml样本..md` 第 121–128 行（**这些在真实文件里我没逐个验证，标弱证据**） |

> `health` / `fireproof` / `hideinmenus` / `interactthroughwalls` / `allowasextracargo` 等：`[MD]` 第 106–129 行列出，**未在本机真实文件中逐个确认 → 未验证/需实测**。

### B.3 典型子元素（字段名原样，均为真实文件）

**`<Sprite>` / `<InventoryIcon>` / `<BrokenSprite>` / `<ContainedSprite>`**
```xml
<InventoryIcon texture="Content/Items/InventoryIconAtlas.png" sourcerect="128,64,64,64" origin="0.5,0.5" />
<Sprite texture="Content/Items/Weapons/weapons_new.png" sourcerect="0,418,76,41" depth="0.55" origin="0.5,0.5" />
```
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\SmartPistol\SmartPistol.xml:5-6`

带自定义贴图的写法（相对 mod）：
```xml
<Sprite texture="%ModDir%/Items/Exoweapons.png" sourcerect="0,0,446,162" depth="0.55" origin="0.5,0.5" />
```
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\ACAWeaponsExpand\Items\Heavy_Weapons.xml:18`

`<BrokenSprite ... maxcondition="99.9" />` 真实例（原版）：`Content\input.xml:7666`
`<Body width= height= density= />`：`SmartPistol.xml:7`；圆形 `<Body radius="30" density="25" />`：`[MD]` 第 218 行

**`<Price>` / `<PreferredContainer>` / `<Fabricate>` / `<Deconstruct>`**
```xml
<PreferredContainer primary="secarmcab" secondary="armcab,weaponholder" />
<Fabricate suitablefabricators="fabricator" requiredtime="75" requiresrecipe="false">
  <RequiredSkill identifier="weapons" level="80" />
  <RequiredItem identifier="physicorium" amount="3" />
</Fabricate>
<Deconstruct time="35">
  <Item identifier="physicorium" amount="2" />
</Deconstruct>
```
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\ACAWeaponsExpand\Items\Heavy_Weapons.xml:4-17`

```xml
<Price baseprice="100" displaynonempty="true" minleveldifficulty="15">
  <Price storeidentifier="merchantoutpost" sold="false" multiplier="1.5" />
  <Price storeidentifier="merchantmilitary" multiplier="0.9" minavailable="4" />
</Price>
```
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\Content\input.xml:7539-7546`

**`<RangedWeapon>`**（真实，含 4 个易错子元素）
```xml
<RangedWeapon reload="0.19" weapondamagemodifier="1.3" penetration="0.15" holdtrigger="true"
              barrelpos="64,9" spread="10" unskilledspread="16" combatPriority="80"
              drawhudwhenequipped="true" crosshairscale="0.2">
  <Crosshair texture="Content/Items/Weapons/Crosshairs.png" sourcerect="0,256,256,256" />
  <CrosshairPointer texture="Content/Items/Weapons/Crosshairs.png" sourcerect="256,256,256,256" />
  <ParticleEmitter particle="muzzleflash" particleamount="1" velocitymin="0" velocitymax="0" />
  <Sound file="Content/Items/Weapons/SMGsingleShot1.ogg" type="OnUse" range="3000" selectionmode="Random" />
  <StatusEffect type="OnUse" target="This">
    <ParticleEmitter particle="casingfirearm" particleamount="1" anglemin="90" anglemax="150" velocitymin="50" velocitymax="250" CopyEntityAngle="true" />
    <Explosion range="150.0" force="1.5" shockwave="false" smoke="false" flames="false" sparks="false" underwaterbubble="false" camerashake="12.0" />
  </StatusEffect>
  <StatusEffect type="OnUse" target="Contained">
    <Use />
  </StatusEffect>
  <RequiredItems items="smgammo" type="Contained" msg="ItemMsgAmmoRequired" />
  <RequiredSkill identifier="weapons" level="50" />
</RangedWeapon>
```
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\Content\input.xml:7604-7624`

**`<MeleeWeapon>` + `<Attack>` + `<Affliction>`**
```xml
<Attack targetimpulse="15" severlimbsprobability="1" itemdamage="6" structuredamage="1"
        structuresoundtype="StructureSlash">
  <Affliction identifier="lacerations" strength="10" />
  <Affliction identifier="bleeding" strength="29" />
  <Affliction identifier="stun" strength="5" />
</Attack>
```
来源（`[MD]` 第 318–328 行）；同结构在真实弹药里：`LocalMods\SmartPistol\SmartPistol.xml:43-47`
```xml
<Attack structuredamage="10" targetforce="10" itemdamage="10" severlimbsprobability="0.2" penetration="0.1">
  <Affliction identifier="gunshotwound" strength="24" />
  <Affliction identifier="bleeding" strength="16" />
  <Affliction identifier="stun" strength="0.3" />
</Attack>
```
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\SmartPistol\SmartPistol.xml:43-47`

**`<ItemContainer>` / `<Containable>`**
```xml
<ItemContainer capacity="1" maxstacksize="1" hideitems="false" containedstateindicatorslot="0"
               containedstateindicatorstyle="bullet" containedspritedepth="0.56">
  <Containable items="smgammo" hide="false" itempos="4,-10" rotation="-30" />
  <SlotIcon slotindex="0" texture="Content/UI/StatusMonitorUI.png" sourcerect="256,448,64,64" origin="0.5,0.5" />
  <SubContainer capacity="1" maxstacksize="1">
    <Containable items="flashlight" hide="false" itempos="22,-1" setactive="true" />
  </SubContainer>
</ItemContainer>
```
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\Content\input.xml:7625-7632`
另一个真实例（`autofill` / `itempos` 在容器上、`ContainedStateIndicator` 子元素）：
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\ACAWeaponsExpand\Items\Heavy_Weapons.xml:49-53`
```xml
<ItemContainer autofill="false" capacity="1" maxstacksize="1" canbeselected="false" hideitems="false" itempos="-151,-22">
  <Containable identifier="coilgunammo" />
  <SlotIcon slotindex="1" texture="Content/UI/CampaignUIAtlas2.png" sourcerect="896,536,128,64" origin="0.45,0.5" />
  <ContainedStateIndicator texture="Content/UI/ContainerIndicators.png" sourcerect="16,64,120,24" />
</ItemContainer>
```
> **关键**：`<Containable>` **两种属性写法都真实存在** —— `items="tag"`（按标签，`input.xml:7626`）和 `identifier="id"`（按 ID，`Heavy_Weapons.xml:50`）。只认 `items` 会漏掉一半写法。

**`<StatusEffect>`**
```xml
<StatusEffect type="OnUse" target="This" disabledeltatime="true">
  <SpawnItem identifiers="SmartPistolRound" spawnposition="ThisInventory" />
</StatusEffect>
```
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\SmartPistol\SmartPistol.xml:20-22`

**`<Afflictions>`（在物品内）**：见 B.2/`MolochMilkAfflictions.xml` 独立文件形式（用 `<Afflictions>` 根，见第 D.3 节）。

**`<Wearable>` / `<Holdable>` / `<Quality>` / `<aitarget>` / `<PropelledProjectile>` / `<LineDrawer>` / `<Throwable>`**
- `<Holdable slots="Any,RightHand,LeftHand" controlpose="true" aimpos="70,5" handle1="-25,-7" msg="ItemMsgPickUpSelect" />` — 来源：`LocalMods\SmartPistol\SmartPistol.xml:8`
- `<Holdable canBeCombined="true" slots="Any,RightHand,LeftHand" handle1="0,0" msg="ItemMsgPickUpSelect" />`（**注意 `canBeCombined` 大小写混排**）— 来源：`Content\input.xml:7575`
- `<Wearable slots="Bag" msg="ItemMsgEquipSelect" canbeselected="false" canbepicked="true" pickkey="Select">` + 子 `<sprite name="Exosuit" texture="..." limb="Torso" .../>` — 来源：`LocalMods\ACAWeaponsExpand\Items\Heavy_Weapons.xml:23-24`
- `<Quality><QualityStat stattype="FirepowerMultiplier" value="0.1" /></Quality>` — 来源：`LocalMods\SmartPistol` 附近/`Content\input.xml:7634-7636`
- `<aitarget sightrange="2000" soundrange="4000" fadeouttime="5" />` — 来源：`Content\input.xml:7633`
- `<PropelledProjectile characterusable="false" damagedoors="true" spread="20" oscillationfrequency="1.0" maxspeed="5" IgnoreProjectilesOfSameTypeWhileActive="true">` — 来源：`LocalMods\SmartPistol\SmartPistol.xml:41`
- `<LineDrawer blockedbycharacters="true" range="2500" width="1" color="0,0,1,0.5">` + `<LineSprite>/<HitSprite>/<NotTargetedSound>/<TargetedSound>` — 来源：`LocalMods\SmartPistol\SmartPistol.xml:23-28`
- `<Throwable characterusable="false" slots="Any,RightHand,LeftHand" throwforce="3.5" aimpos="35,-10" msg="ItemMsgPickUpSelect">` — 来源：`Content\input.xml:7668`
- `<Upgrade gameversion="0.10.0.0" scale="0.5" />` — 来源：`Content\input.xml:7530`
- `<RequiredSkill identifier="weapons" level="50" />` — 来源：`Content\input.xml:7623`
- `<SkillRequirementHint identifier="weapons" level="50" />` — 来源：`Content\input.xml:7638`

### B.4 武器 + 弹药：**不存在 `<Magazine>` 元素**（重要更正）

**实测：整份 1.13.4.0 原版 `Content` 目录里 `<Magazine` 出现次数 = 0**；`ACAWeaponsExpand` 里 `<Magazine` 也是 0。
来源：对 `F:\SteamLibrary\steamapps\common\Barotrauma\Content\**\*.xml` 与 `LocalMods\ACAWeaponsExpand\**\*.xml` 的全文检索。

弹药在 v1.13.x 是**用 `<ItemContainer>` + `<SpawnItem>` + condition 模拟的**。真实原版 SMG 弹匣（这就是权威写法）：

**弹药物品（=弹匣）** — 来源：`F:\SteamLibrary\steamapps\common\Barotrauma\Content\input.xml:7532-7577`
```xml
<Item name="" identifier="smgmagazine" maxstacksize="8" maxstacksizecharacterinventory="2" scale="0.5"
      category="Weapon" cargocontaineridentifier="metalcrate" linkable="true"
      tags="smallitem,smgammo,handheldammo" impactsoundtag="impact_metal_light">
  <Sprite texture="Content/Items/Weapons/weapons_new.png" depth="0.54" sourcerect="146,157,21,44" origin="0.5,0.5" />
  <Body width="14" height="40" density="25" />
  <ItemContainer hideitems="true" capacity="1" drawinventory="false" canbeselected="false"
                 ShowConditionInContainedStateIndicator="true" SpawnWithId="smground"
                 removecontaineditemsondeconstruct="true" containedstateindicatorstyle="bullet">
    <Containable items="smground" />
    <!--Spawn an SMG round on use. Condition -4.8 -> 21 shots per magazine.-->
    <StatusEffect type="OnUse" target="This" condition="-4.8" disabledeltatime="true">
      <SpawnItem identifiers="smground" spawnposition="ThisInventory" />
    </StatusEffect>
  </ItemContainer>
  <!--Magazines can be combined to raise condition.-->
  <Holdable canBeCombined="true" slots="Any,RightHand,LeftHand" handle1="0,0" msg="ItemMsgPickUpSelect" />
</Item>
```

**武器侧必须配的 3 处** — 来源：`Content\input.xml:7604` / `7619-7626`
```xml
<!-- 1) 容器里装得下这种弹药（按 tag） -->
<ItemContainer capacity="1" maxstacksize="1" ...>
  <Containable items="smgammo" hide="false" itempos="4,-10" rotation="-30" />
</ItemContainer>
<!-- 2) 开火时"使用"容器里的弹药 -->
<StatusEffect type="OnUse" target="Contained">
  <Use />
</StatusEffect>
<!-- 3) 强制需要弹药，否则不能开火 -->
<RequiredItems items="smgammo" type="Contained" msg="ItemMsgAmmoRequired" />
```

**真实 mod 版最小配套（更简洁，可直接复制）** — 来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\SmartPistol\SmartPistol.xml`（全文 72 行）
```xml
<Item name="" identifier="SmartPistol" category="Weapon" cargocontaineridentifier="metalcrate"
      tags="smallitem,weapon,gun,pistolitem,provocativetohumanai,gunsmith,mountableweapon"
      Scale="0.5" impactsoundtag="impact_metal_light">
  <Sprite texture="Content/Items/Weapons/weapons_new.png" sourcerect="0,418,76,41" depth="0.55" origin="0.5,0.5" />
  <Body width="72" height="40" density="25" />
  <Holdable slots="Any,RightHand,LeftHand" controlpose="true" aimpos="70,5" handle1="-25,-7" msg="ItemMsgPickUpSelect" />
  <RangedWeapon barrelpos="29,11" spread="0.1" unskilledspread="6" combatPriority="70"
                drawhudwhenequipped="true" crosshairscale="0.2" reload="0.5">
    <StatusEffect type="OnUse" target="This" disabledeltatime="true">
      <SpawnItem identifiers="SmartPistolRound" spawnposition="ThisInventory" />
    </StatusEffect>
    <RequiredItems items="smartrevolverammo" type="Contained" msg="ItemMsgAmmoRequired" />
    <RequiredSkill identifier="weapons" level="40" />
  </RangedWeapon>
  <ItemContainer capacity="1" maxstacksize="1" drawinventory="false" hideitems="true"
                 containedstateindicatorstyle="bullet" spawnwithid="SmartPistolRound">
    <SlotIcon slotindex="0" texture="Content/UI/StatusMonitorUI.png" sourcerect="256,448,64,64" origin="0.5,0.5" />
    <Containable items="smartrevolverammo" />
  </ItemContainer>
</Item>

<Item identifier="SmartPistolRound" category="Weapon" scale="0.5" sonarsize="2"
      tags="smallitem,smartrevolverammo,handheldammo,smartpistolammoitem"
      damagedbyexplosions="true" explosiondamagemultiplier="0.5" damagedbyprojectiles="true">
  <Sprite texture="Content/Items/Diving/Scooter.png" depth="0.55" sourcerect="0,0,140,102" />
  <Body width="140" height="100" density="20"/>
  <PropelledProjectile characterusable="false" damagedoors="true" spread="20" oscillationfrequency="1.0" maxspeed="5">
    <Attack structuredamage="10" targetforce="10" itemdamage="10" severlimbsprobability="0.2" penetration="0.1">
      <Affliction identifier="gunshotwound" strength="24" />
    </Attack>
  </PropelledProjectile>
</Item>
```

> **注意 `RequiredItems` vs `RequiredItem`**：原版 SMG 用复数 `<RequiredItems items="..." type="Contained">`（`input.xml:7622`），ACA 用单数 `<RequiredItem identifier="coilgunammo" type="Contained" />`（`Heavy_Weapons.xml:47`）。**两种都真实存在且都能加载**。

### B.5 贴图/图标路径怎么写

三种真实写法：
1. **`%ModDir%/` 绝对锚定到 mod 根**（最常用，推荐）：
   `texture="%ModDir%/Items/Exoweapons.png"` — 来源：`LocalMods\ACAWeaponsExpand\Items\Heavy_Weapons.xml:18`
   注意：XML 文件在 `Items/` 子目录里，而路径写的是 `%ModDir%/Items/Exoweapons.png`，说明 **`%ModDir%` 是 mod 根，不是 XML 所在目录**。
2. **`Content/...`** 引用原版资源：`texture="Content/Items/InventoryIconAtlas.png"` — 来源：`LocalMods\SmartPistol\SmartPistol.xml:5`
3. **相对 XML 文件所在目录的裸文件名**（mod 根有 XML 时等价于相对 mod 根）：
   `texture="%ModDir%/BackgroundCreatures/ACA_Fish_1.png"` 也是 `%ModDir%` 系；而 `SmartPistol` 的 ogg 用 `%ModDir%/WEAPONS_swarmLaserNotTargetedLoop.ogg`（文件与 XML 同在 mod 根）— 来源：`LocalMods\SmartPistol\SmartPistol.xml:26`
   > 裸相对路径（不带 `%ModDir%`、不带 `Content/`）在 LocalMods 样本中**未观测到** → **未验证/需实测**。

`sourcerect` 格式 = `x,y,width,height`（来源：`[MD]` 第 1591 行 + 全部真实 Sprite 用法）。
`spritecolor` 格式 = RGBA `"255,255,255,255"`（来源：`[MD]` 第 21 行）。

---

## C. 角色 / 怪物 XML 字段

### C.1 文件与根

- 根元素 `<Character>`，一个文件一个物种。
- **必需属性：`SpeciesName`**（= 物种 ID，事件里 `SpawnAction speciesname="..."` 引用的就是它）。
- 真实例（最简怪物，40 行全文）：`来源：F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\WarhammerCreature\Characters\MudraptorLegacy\MudraptorLegacy.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<Character SpeciesName="MudraptorLegacy" humanoid="false" group="Mudraptor">
  <ragdolls />
  <animations />
  <health vitality="120" doesbleed="true" crushdepth="Infinity" />
  <bloodemitter particle="blood" particleamount="1" />
  <bloodemitter particle="waterblood" particleamount="1" />
  <damageemitter particle="brownchunks" particleamount="10" velocitymin="50" velocitymax="300" anglemin="0" anglemax="360" scalemin="0.1" scalemax="0.3" />
  <gibemitter particle="gib" particleamount="20" velocitymin="200" velocitymax="700" anglemin="0" anglemax="360" />
  <sound file="Content/Characters/Mudraptor/MUDRAPTOR_attack1.ogg" state="Attack" range="1000" />
  <Inventory slots="Any, Any" accessiblewhenalive="false">
    <Item identifier="hydroxyapatite" />
  </Inventory>
  <ai combatstrength="250" sight="0.5" hearing="1.0" aggressiveboarding="true" fleehealththreshold="20" aggressiongreed="30" aggressionhurt="100">
    <latchonto attachtowalls="true" attachtosub="false" />
    <targetpriority tag="decoy" state="Attack" priority="600" />
    <targetpriority tag="human" state="Attack" priority="200" />
    <targetpriority tag="dead" state="Eat" priority="140" />
    <targetpriority tag="wall" state="Attack" priority="40" />
  </ai>
</Character>
```

### C.2 `<Character>` 属性实测清单（来自一个超大真实怪物定义）

来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\MolochMilk\Characters\Moloch\Moloch.xml:2`

```
SpeciesName="Moloch"  SpeciesTranslationOverride=""  DisplayName=""  Group="moloch"
Humanoid="False"  HasInfo="False"  CanInteract="False"  Husk="False"  UseHuskAppendage="False"
NeedsAir="False"  NeedsWater="False"  UseHumanAI="False"  IsMachine="False"  CanSpeak="False"
ShowHealthBar="True"  UseBossHealthBar="False"  Noise="100"  Visibility="100"
BloodDecal="blackblood"  BleedParticleAir="blooddrop"  BleedParticleWater="blackwaterblood"
BleedParticleMultiplier="1"  CanEat="False"  EatingSpeed="10"  UsePathFinding="True"
PathFinderPriority="1"  HideInSonar="False"  HideInThermalGoggles="False"  SonarDisruption="0"
DistantSonarRange="0"  DisableDistance="30000"  SoundInterval="10"  DrawLast="False"
AITurretPriority="1"  AISlowTurretPriority="1"  DespawnContainer=""
```
> 该文件**以 `<override>` 包裹**（第 1 行 `<override>`），说明这是覆盖原版 Moloch。

### C.3 常见子元素（全部真实）

| 元素 | 真实字段 | 出处 |
|---|---|---|
| `<ragdolls folder="%ModDir%/Characters/Moloch/Ragdolls/" />` | `folder` | `Moloch.xml:3` |
| `<animations folder="%ModDir%/Characters/Moloch/Animations/" />` | `folder` | `Moloch.xml:4` |
| `<health Vitality= DoesBleed= CrushDepth= UseHealthWindow= BleedingReduction= BurnReduction= ConstantHealthRegeneration= HealthRegenerationWhenEating= StunImmunity= PoisonImmunity= PoisonVulnerability= EmpVulnerability= ApplyAfflictionColors= Immunities=` | 见左 | `Moloch.xml:10` |
| `<health>` 子 `<Limb name="Head" />` … | `name` | `Moloch.xml:11-16` |
| `<damageemitter Particle= AngleMin= AngleMax= ScaleMin= ScaleMax= VelocityMin= VelocityMax= EmitInterval= ParticlesPerSecond= ParticleAmount= HighQualityCollisionDetection= CopyEntityAngle= drawontop=` | 见左 | `Moloch.xml:5` |
| `<bloodemitter .../>` | 同上 | `Moloch.xml:6` |
| `<gibemitter .../>` | 同上 | `Moloch.xml:7-9` |
| `<sound File= State= Range= Volume= Tags= dontmuffle= />`（**State 取值：Attack/Damage/Idle/Die**） | 见左 | `Moloch.xml:18-33` |
| `<Inventory Slots= AccessibleWhenAlive= Commonness=>` 子 `<Item Identifier="molochbone" />` | 见左 | `Moloch.xml:34-38` |
| `<ai CombatStrength= Sight= Hearing= AggressionHurt= AggressionGreed= FleeHealthThreshold= AttackWhenProvoked= AvoidGunfire= DamageThreshold= AvoidTime= MinFleeTime= AggressiveBoarding= TargetOuterWalls= RandomAttack= CanOpenDoors= UsePathFindingToGetInside= KeepDoorsClosed= AvoidAbyss= StayInAbyss= PatrolFlooded= PatrolDry= StartAggression= MaxAggression= AggressionCumulation= WallTargetingMethod=` | 见左 | `Servoskull.xml:6` / `Moloch.xml` |
| `<ai>` 子 `<target Tag= State= Priority= ReactDistance= IgnoreContained= IgnoreInside= .../>` | 见左 | `Servoskull.xml:7` |
| `<ai>` 子 `<latchonto attachtowalls= attachtosub= />` | 见左 | `MudraptorLegacy.xml:26` |
| `<ai>` 子 `<targetpriority tag= state= priority= />`（**state 取值：Attack/Escape/Eat/Follow**） | 见左 | `MudraptorLegacy.xml:27-38` |
| `<ai>` 子 `<petbehavior maxhappiness= happinessdecreaserate= hungerincreaserate= playforce= />` | 见左 | `Servoskull.xml:8` |
| `<StatusEffect type="OnDeath" target="This" targetlimb="Torso">` + `<ParticleEmitter/>`/`<Explosion/>`/`<sound/>`/`<RemoveCharacter />` | 见左 | `Servoskull.xml:11-23` |
| `<Inventory Slots="Any,Card" AccessibleWhenAlive="True" Commonness="1"></Inventory>` | 见左 | `Servoskull.xml:10` |

### C.4 NPC / 敌人生成、AI、掉落

**掉落（loot）= `<Inventory>` + 多个 `<Item>`，用 `Commonness` 做权重。** 真实例：
```xml
<Inventory Slots="Any, Any, Any, Any, Any, Any" AccessibleWhenAlive="False" Commonness="2">
  <Item Identifier="molochbone" />
  <Item Identifier="hydroxyapatite" />
  <Item Identifier="brockite" />
</Inventory>
```
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\MolochMilk\Characters\Moloch\Moloch.xml:34-38`

**敌人生成（事件系统驱动）**：`<SpawnAction speciesname="<SpeciesName>" .../>`
真实例：
```xml
<SpawnAction speciesname="orangeboy" spawnpointtag="saferoom" targettag="maurice" spawnlocation="beaconstation" requirespawnpointtag="true"/>
<SpawnAction speciesname="crawler" spawnlocation="Outpost" targetmoduletags="researchmodule" SpawnPointTag="testsubject" spawnpointtype="enemy" RequireSpawnPointTag="true" />
```
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\Content\Events\*.xml`（`SpawnAction` 全文检索命中）

**NPC 集合（前哨站/任务 NPC）** 用 `<npcsets>` 根 + `<npcset>` + `<npc>`：
```xml
<npcsets>
  <npcset identifier="outpostnpcs1">
    <npc identifier="captain" job="captain" commonness="1" spawnpointtags="admin" behavior="Passive"
         preferredoutpostmoduletypes="admin,adminmodule">
      <ItemSet commonness="1">
        <Item identifier="idcard" equip="true" tags="id_outpostsecurity"/>
        <Item identifier="revolver" equip="false">
          <Item identifier="revolverround" amount="3"/>   <!-- 嵌套=放进容器 -->
        </Item>
      </ItemSet>
    </npc>
  </npcset>
</npcsets>
```
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\Content\NPCPrefabs\OutpostNpcs.xml:2-24`
`<npc>` 其它真实属性：`tags`、`faction`、`healthmultiplier`、`healthmultiplierinmultiplayer`、`aimspeed`、`aimaccuracy`、`reportrange`、`skillmultiplier`、`moduleflags`（`[MD]` 第 2137–2153 行）
`behavior` 取值：`Patrol` / `Passive` / `Active` / `StayInHull`（`[MD]` 第 2174–2180 行）

**背景生物（不参与战斗的装饰鱼群）**：根 `<backgroundcreatures>`，条目名 = 自定义物种名：
```xml
<backgroundcreatures>
  <ACA_Fish_1 speed="75" wanderamount="0.1" wanderzamount="0.1" swarmmax="5" swarmradius="300" scale="0.5" commonness="25">
    <Sprite texture="%ModDir%/BackgroundCreatures/ACA_Fish_1.png" sourcerect="0,0,124,46" />
  </ACA_Fish_1>
</backgroundcreatures>
```
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\ACAWeaponsExpand\BackgroundCreatures\BackgroundCreaturePrefabs.xml:2-5`
变体（含 `<DeformableSprite>` + `<overridecommonness leveltype= commonness= />`）：
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\ACAWeaponsExpand\BackgroundCreatures\BlahajBackgroundCreaturePrefabs.xml`

---

## D. 事件 XML 字段

### D.1 放在哪

- **原版**：`F:\SteamLibrary\steamapps\common\Barotrauma\Content\Events\*.xml`（9 个文件，来源：该目录列表）
- **mod**：任意位置，filelist 里用 `<RandomEvents file="%ModDir%/xxx.xml" />` 注册。
  真实例：`LocalMods\ACAWeaponsExpand\filelist.xml` → `<RandomEvents file="%ModDir%/reinforce_event.xml" />`（共 7 条）
- LocalMods 中真实存在事件文件的 mod：`ACAWeaponsExpand`(7)、`Horny Europa REDO Beta 1`(2)、`NonHumanRaces_Robotrauma_Patch`(1)、`Scartarus`(1)、`异种生存MOD(普通版)`(2)

### D.2 根元素与最小随机事件结构

**根元素两种真实写法（大小写不同、语义相同）**：

实际使用（非 override，直接新增）— 来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\NonHumanRaces_Robotrauma_Patch\NPC\KATEEspawn.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<Randomevents>
  <EventSprites>
    <Sprite identifier="katee_neutral" texture="%ModDir%/UI/katee_portrait.png" sourcerect="0,0,256,256" origin="0.5,0.5" />
  </EventSprites>
  <EventPrefabs>
    <ScriptedEvent identifier="kateespawn" commonness="100">
      ...
    </ScriptedEvent>
  </EventPrefabs>
  <EventSet identifier="outpostevents.robot" allowatstart="true" minleveldifficulty="5"
            maxleveldifficulty="80" ignorecooldown="true" chooserandom="true" onceperoutpost="true">
    <ScriptedEvent identifier="kateespawn" commonness="120" />
  </EventSet>
</Randomevents>
```

override 形式 — 来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Scartarus\Code\event.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<Override>
  <RandomEvents>
    <EventPrefabs>
      <ScriptedEvent identifier="holoassistant">
        <TagAction criteria="player" tag="player" />
        ...
      </ScriptedEvent>
    </EventPrefabs>
  </RandomEvents>
</Override>
```

原版 `<Randomevents>` 根（无 override）— 来源：`F:\SteamLibrary\steamapps\common\Barotrauma\Content\Events\ChainingEvents.xml:2`

**最小可用随机事件（三件套：EventPrefabs 定义 + EventSet 挂载）**
```xml
<Randomevents>
  <EventSprites>
    <Sprite identifier="myeventpic" texture="%ModDir%/event.png" sourcerect="0,0,256,256" origin="0.5,0.5" />
  </EventSprites>
  <EventPrefabs>
    <ScriptedEvent identifier="myevent" commonness="25">
      <TagAction criteria="player" tag="player" />
      <SpawnAction speciesname="crawler" spawnlocation="Outpost" targettag="mycrawler" />
      <ConversationAction targettag="player" text="eventtext.myevent.intro" eventsprite="myeventpic">
        <Option text="eventtext.myevent.opt1" endconversation="true" />
      </ConversationAction>
    </ScriptedEvent>
  </EventPrefabs>
  <EventSet identifier="myeventset" leveltype="outpost"
            locationtype="outpost,city,research,military,mine"
            allowatstart="true" minleveldifficulty="0" maxleveldifficulty="80"
            chooserandom="false" ignorecooldown="true">
    <ScriptedEvent identifier="myevent" commonness="100" />
  </EventSet>
</Randomevents>
```
`EventSet` 属性来自真实原版：`eventcount` / `setcount` / `exhaustible` / `onceperoutpost` / `locationtype` / `leveltype` 均实测存在。
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\Content\Events\EventSets.xml`（全文检索 `<EventSet` 命中，含 `missionevents.coldcaverns.basic` 等）

### D.3 实测事件动作元素（不分大小写）

| 动作元素 | 真实属性 | 出处 |
|---|---|---|
| `TagAction` | `criteria` `tag` `submarine` `continueifnotargetsfound` | `Scartarus\Code\event.xml` |
| `TriggerAction` | `target1tag` `target2tag` `applytotarget1` `applytotarget2` `radius` `waitforinteraction` | `KATEEspawn.xml` |
| `ConversationAction` | `targettag` `text` `eventsprite` `endconversation` | `KATEEspawn.xml` |
| `SpawnAction` | `speciesname` / `npcsetidentifier`+`npcidentifier` / `itemidentifier`；`spawnlocation` `spawnpointtag` `spawnpointtype` `targettag` `targetinventory` `targetmoduletags` `targetmoduleTags` `requirespawnpointtag` `RequireSpawnPointTag` `ignorebyai` | `Content\Events\*.xml` |
| `CheckMoneyAction` | `Amount` → 子 `<Success>/<Failure>` | `KATEEspawn.xml` |
| `MoneyAction` | `amount` `TargetTag` | `KATEEspawn.xml` / `[MD]` 第 1007 行 |
| `CheckItemAction` | `targettag` `itemidentifiers` → `<Success>/<Failure>` | `KATEEspawn.xml` |
| `RemoveItemAction` | `targettag` `itemidentifiers` `Amount` | `[MD]` 第 1047 行 |
| `AfflictionAction` | `targettag` `affliction` `strength` | `KATEEspawn.xml` |
| `ClearTagAction` | `tag` | `KATEEspawn.xml` |
| `StatusEffectAction` | `targettag` → 子 `<StatusEffect>` | `Scartarus\Code\event.xml` |
| `CheckDataAction` | `identifier` `condition` → `<Success>/<Failure>` | `Scartarus\Code\event.xml` |
| `SetDataAction` | `identifier` `value` | `Content\Events\ChainingEvents.xml` |
| `Label` / `GoTo` | `name` | 两者均实测 |
| `Option` | `text` `endconversation` | `KATEEspawn.xml` |
| `NPCOperateItemAction` | `npctag` `targettag` `Operate` | `ChainingEvents.xml` |
| `NPCChangeTeamAction` | `npctag` `teamid` `addtocrew` | `[MD]` 第 992 行 |
| `TeleportAction` | `Position` `TargetTag` | `[MD]` 第 997 行 |
| `GodModeAction` | `targettag` `enabled` | `[MD]` 第 1002 行 |
| `HighlightAction` | `TargetTag` `State` | `[MD]` 第 1063 行 |
| `WaitAction` | `Time` | `[MD]` 第 1069 行 |
| `RNGAction` | `Chance` | `[MD]` 第 1023 行 |

> `[MD]` 标注的条目仅来自第三方文档，**未在本机事件文件里逐一确认 → 弱证据**。

---

## E. Lua 脚本写法（真实样本）

### E.1 文件放哪

- `<mod>/Lua/Autorun/*.lua` — **自动执行**（硬编码约定）。来源：官方 `https://luatrauma.github.io/Luatrauma.Docs/lua/getting-started/`
- `<mod>/Lua/Scripts/**/*.lua`、`<mod>/Lua/<任意子目录>/` — **不自动执行**，需在 Autorun 里 `dofile` / `require`。
  真实例：`LocalMods\Neurotrauma\Lua\Autorun\init.lua` 里 `dofile(NT.Path.."/Lua/Scripts/helperfunctions.lua")`

### E.2 `ModConfig.xml` —— **本机 0 个样本，只有官方文档**

- 实测：对整个游戏目录（含 `LocalMods`、`Data`）递归搜索 `ModConfig.xml`，**命中 0 个文件**。
- 因此**本机没有任何真实 ModConfig.xml 可参照**，以下是官方文档原文格式（`https://luatrauma.github.io/Luatrauma.Docs/common/development/modconfig/`，页面标注 `Last Updated: 2026-04-13`）：
```xml
<?xml version="1.0" encoding="utf-8" ?>
<ModConfig>
    <Assembly Folder="%ModDir%/CSharp/Client" Target="Client" IsScript="true" UseInternalAccessName="true" />
    <Assembly File="%ModDir%/bin/Server/Windows/MyMod.dll" Target="Server" Platform="Windows" />
    <Config File="%ModDir%/Config/SettingsShared.xml" />
    <Config File="%ModDir%/Config/SettingsClient.xml" Target="Client"/>
    <Lua Folder="%ModDir%/Lua/Server" Target="Server" IsAutorun="true" />
</ModConfig>
```
- 四种资源类型 `Assembly` / `Config` / `Lua` / `Style`，属性集（官方文档）：`Name` `File` `Folder` `LoadPriority` `Optional` `Platform` `Target` `IsFileRequired`；Assembly 额外 `FriendlyName` `IsScript` `UseInternalAccessName` `IsReferenceModeOnly`；Lua 额外 `IsAutorun` `RunUnrestricted`。
- `Platform` 取值：`Linux`,`OSX`,`Windows`,`Any`；`Target` 取值：`Client`,`Server`,`Any`；`LoadPriority` 数字越小越先加载（官方文档）。

### E.3 没有 ModConfig 时的传统约定（**这才是本机 30 个 mod 的实际做法**）

`source：官方迁移指南 https://luatrauma.github.io/Luatrauma.Docs/common/migration-guide/`
> "There is a legacy loading system built-in if your project follows the old structure (Lua files are in `Lua/...`, Csharp files are in `CSharp/...`, binary assemblies are in `bin/<(Client|Server)>/...`, etc.)."

即：**Lua 放 `Lua/Autorun/` 就自动跑，C# 放 `CSharp/{Shared,Client,Server}/` 就自动编译，完全不需要 ModConfig.xml。**

**Lua / C# 文件要不要写进 filelist.xml？** 两种都真实存在：
- **不写**（`ACA_NonHumanRaces_Extend`）：`filelist.xml` 里只有 Character/Item/Text，但 `Lua/Autorun/script.lua` 正常工作。
  来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\ACA_NonHumanRaces_Extend\filelist.xml`
- **写成 `<Other>`**（`Neurotrauma`、`BetterHealthUI`）：
  来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\filelist.xml`
```xml
<Other file="%ModDir%/Lua/Autorun/init.lua" />
<Other file="%ModDir%/Lua/Scripts/Client/configgui.lua" />
```
`[MD]` 第 1590 行的建议：**"lua、cs 文件都可以不写，如果要写，就写 other，宁可不写不要乱写"**。

### E.4 原文片段 1 —— Autorun 入口 / mod 路径 / dofile 分发

**完整原文**（`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\Lua\Autorun\init.lua`，节选 1–56 行）
```lua
--if Game.IsMultiplayer and CLIENT then return end

NT = {} -- Neurotrauma
NT.Name="Neurotrauma"
NT.Version = "A1.10.1h2"
NT.VersionNum = 01100102
NT.Path = table.pack(...)[1]          -- <== LuaCs 会把 mod 根路径作为 ... 传入

dofile(NT.Path.."/Lua/Scripts/helperfunctions.lua")
dofile(NT.Path.."/Lua/Scripts/configdata.lua")

-- server-side code (also run in singleplayer)
if (Game.IsMultiplayer and SERVER) or not Game.IsMultiplayer then
    Timer.Wait(function() Timer.Wait(function()
        ...
    end,1) end,1)
    dofile(NT.Path.."/Lua/Scripts/Server/ntcompat.lua")
    dofile(NT.Path.."/Lua/Scripts/Server/blood.lua")
    dofile(NT.Path.."/Lua/Scripts/Server/humanupdate.lua")
    ...
end

-- server-side code only
if SERVER then
    Networking.Receive("NT.ConfigUpdate", function(msg, sender)
        if not sender.HasPermission(ClientPermissions.ManageSettings) then return end
        NTConfig.ReceiveConfig(msg)
        NTConfig.SaveConfig()
    end)
    Networking.Receive("NT.ConfigRequest", function(msg, sender)
        if not sender then return end
        NTConfig.SendConfig(sender)
    end)
end

-- client-side code
if CLIENT then
    dofile(NT.Path.."/Lua/Scripts/Client/configgui.lua")
end
```
**要点**：
- mod 根路径 = `table.pack(...)[1]`（LuaCs 传给 Autorun chunk 的第 1 个 vararg）
- `CLIENT` / `SERVER` / `Game.IsMultiplayer` 是**全局**，直接判断
- `Timer.Wait(fn, ms)` 做延时
- `Networking.Receive(channelName, fn)` 做网络
- `dofile(path)` / `require("模块.路径")` 加载子脚本

### E.5 原文片段 2 —— `Hook.Add` 注册写法（注意是**大写 `Hook.Add`**，不是 `hook.add`）

**原文**（`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\Lua\Scripts\Server\blood.lua:36-49`）
```lua
Hook.Add("characterCreated", "NT.BloodAndImmunity", function(createdCharacter)
    Timer.Wait(function()
        if (createdCharacter.IsHuman and not createdCharacter.IsDead) then
            NT.TryRandomizeBlood(createdCharacter)
            -- add immunity
            local conditional2 = createdCharacter.CharacterHealth.GetAffliction("immunity")
            if (conditional2 == nil) then
                HF.SetAffliction(createdCharacter,"immunity",100)
            end
        end
    end, 1000)
end)
```
**签名 = `Hook.Add(事件名, 唯一 hook 名, 回调)`**。其它真实事件名（全部来自 Neurotrauma 的 `Hook.Add` 检索）：
`"loaded"`、`"think"`、`"roundStart"`、`"chatMessage"`、`"characterCreated"`、`"character.applyDamage"`、`"character.giveJobItems"`、`"item.applyTreatment"`、`"changeFallDamage"`、`"human.CPRSuccess"`、`"human.CPRFailed"`、`"item.ApplyTreatment"`、以及自定义事件名（如 `"NT.multiscalpel.incision"`、`"NT.RotOrgan"`、`"bodybag.dragfast"`）
来源：对 `LocalMods\Neurotrauma\Lua\**\*.lua` 的 `Hook.Add` 全文检索

**另一种原文（用常量拼事件名）**（`LocalMods\Neurotrauma\Lua\ConsentRequiredExtended\Main.lua:26-31`）
```lua
Hook.Add(LUA_EVENT_ITEM_APPLYTREATMENT, HOOK_NAME_ITEM_APPLYTREATMENT, OnItemApplied)
Hook.Add(LUA_EVENT_MELEEWEAPON_HANDLEIMPACT, HOOK_NAME_MELEEWEAPON_HANDLEIMPACT, onMeleeWeaponHandleImpact)
Hook.Add(LUA_EVENT_ROUNDSTART, HOOK_NAME_UPDATE_RESCUETARGETS, Api.UpdateRescueTargets)
```

### E.6 原文片段 3 —— `require` 模块化 + `loaded` 钩子

**原文**（`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\Lua\ConsentRequiredExtended\init.lua` 全文）
```lua
local SRC_NAMESPACE       = "ConsentRequiredExtended."
local MAIN                = "Main"
local LUA_EVENT_LOADED    = "loaded"
local HOOK_NAME_ON_LOADED = "ConsentRequiredExtended.onLoaded"

local function onLoaded()
  -- Only run client side if not multiplayer
  ---@diagnostic disable-next-line: undefined-global
  -- if Game.IsMultiplayer and CLIENT then return end

  local requireStr = SRC_NAMESPACE .. MAIN

  require(requireStr)
end

Hook.Add(
  LUA_EVENT_LOADED,
  HOOK_NAME_ON_LOADED,
  onLoaded
)
```
**`require("包.子.模块")`** 用点号路径（对应磁盘 `Lua/ConsentRequiredExtended/Main.lua`）。
来源：`LocalMods\Neurotrauma\Lua\ConsentRequiredExtended\Config.lua:2` → `require 'ConsentRequiredExtended.Util.Environment'`

**极简 autorun（另一条真实路线 —— 只做一行转发）**
`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\ACA_NonHumanRaces_Extend\Lua\Autorun\script.lua` 全文：
```lua
local NHR = require("tonty.NonHumanRaces")

NHR.RegisterSpecies("Mechabunny")
NHR.RegisterSpecies("Aca_mudraptor")
```
> 注意：它 `require` 的是**别的 mod**（`tonty.NonHumanRaces`）提供的模块 —— 说明 LuaCs 的 `require` 命名空间是**跨 mod 共享**的。来源：同文件。

### E.7 配置（`ConfigService`）

- **本机样本里没有任何 `ConfigService` 调用**。→ `ConfigService` 是 2026 重构后新增的 API，**本机无法验证用法 → 未验证/需实测**。
- 本机的实际做法是**自己写 JSON**：
  来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\Lua\Scripts\configdata.lua`
```lua
NTConfig = {Entries={},Expansions={}}
local configFilePath = configDirectoryPath.."/Neurotrauma.json"
function NTConfig.SaveConfig()
    ...
    File.Write(configFilePath, json.serialize(tableToSave))
end
function NTConfig.LoadConfig()
    if not File.Exists(configFilePath) then return end
    local readConfig = json.parse(File.Read(configFilePath))
    ...
end
```
  落盘结果真实存在于 `F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\config.json`（单行 JSON）。
  取配置项：`NTConfig.Get("NTCRE_ConsentRequired", true)` — 来源：`LocalMods\Neurotrauma\Lua\ConsentRequiredExtended\OnItemApplied.lua:11`
- 官方文档指出 `ConfigService` 需要传内容包参数，用 `trygetpackage("your package name")` 获取 —— 来源：`https://luatrauma.github.io/Luatrauma.Docs/common/migration-guide/`
- 传统 `ConsentRequiredExtended\Config.lua` 用 `local _ENV = Environment.PrepareEnvironment(_ENV)` 允许用户直接编辑 Lua 配置 — 来源：`LocalMods\Neurotrauma\Lua\ConsentRequiredExtended\Config.lua:1-6`

### E.8 Lua 常用全局 API（实测出现）

`Game.IsMultiplayer`、`SERVER`、`CLIENT`、`Timer.Wait`、`Networking.Receive`、`Hook.Add`、`File.Read`/`File.Write`/`File.Exists`、`json.parse`/`json.serialize`、`dofile`、`require`、`ClientPermissions.ManageSettings`、`print`
来源：`LocalMods\Neurotrauma\Lua\Autorun\init.lua`、`...\configdata.lua`、`...\blood.lua`、`...\ConsentRequiredExtended\*.lua`

---

## F. C# 内存脚本写法（真实样本）

### F.1 CSharp 目录结构（全 LocalMods 只有 1 个 C# mod）

```
LocalMods\BetterHealthUI (Updated)\
├── filelist.xml                                    (401 B)
└── CSharp\
    ├── RunConfig.xml                               (124 B)
    ├── Client\BetterHealthUIMod.cs                 (95,735 B)
    └── Shared\BetterHealthUIMod.cs                 (610 B)
```
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\BetterHealthUI (Updated)\` 递归列表
**全 LocalMods 只有这 2 个 `.cs` 文件、只有这 1 个 `RunConfig.xml`、只有这 1 个 `CSharp/` 目录。**

### F.2 `.cs` 如何被加载

- `CSharp/Shared/` 两端都编译，`CSharp/Client/` 仅客户端，`CSharp/Server/` 仅服务端 —— 来源：官方 `https://luatrauma.github.io/Luatrauma.Docs/cs/setup-in-memory-csharp/`
- `CSharp/RunConfig.xml` 声明目标 —— 真实原文：
  来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\BetterHealthUI (Updated)\CSharp\RunConfig.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<RunConfig>
  <Server>Standard</Server>
  <Client>Forced</Client>
</RunConfig>
```
  > `Standard` / `Forced` 的完整取值域 → **未验证/需实测**（本机只有这一种组合）。
- 也可以在 `filelist.xml` 里显式声明成 `<Other>`（本 mod 就声明了）：
  `LocalMods\BetterHealthUI (Updated)\filelist.xml` → `<Other file="%ModDir%/CSharp/Client/BetterHealthUIMod.cs" />`

### F.3 需要哪些 using / 基类 / 特性（真实原文）

**`CSharp/Shared/BetterHealthUIMod.cs` 全文**（610 B）
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\BetterHealthUI (Updated)\CSharp\Shared\BetterHealthUIMod.cs`
```csharp
using System;
using Barotrauma;
using Barotrauma.Networking;

namespace BetterHealthUI {
    partial class BetterHealthUIMod : ACsMod {
        public static bool IsCampaign => GameMain.GameSession?.GameMode is MultiPlayerCampaign;
        public static bool IsRunning => GameMain.GameSession?.IsRunning ?? false;

        public BetterHealthUIMod() {
            LuaCsSetup.PrintCsMessage("BetterHealthUIMod..ctor");
            #if CLIENT
                InitClient();
            #endif
        }

        //public override void Start() { }
        public override void Stop() { }
    }
}
```
**关键事实**：
- 基类 `ACsMod`（LuaCs 提供），命名空间自定
- **用 `#if CLIENT` 条件编译**区分端
- 构造函数里做初始化；覆写 `Start()` / `Stop()`
- 日志用 `LuaCsSetup.PrintCsMessage(...)`
- 用 `partial class` 拆到 `Shared/` + `Client/` 两个文件（同一命名空间同一类）

**`CSharp/Client/BetterHealthUIMod.cs` 头部 using（1–14 行）**
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\BetterHealthUI (Updated)\CSharp\Client\BetterHealthUIMod.cs`
```csharp
using System.Reflection;
using System.Collections.Generic;
using System;
using Barotrauma;
using Barotrauma.Sounds;
using Barotrauma.Extensions;
using Barotrauma.Items.Components;
using Barotrauma.Networking;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using System.Linq;

namespace BetterHealthUI {
    partial class BetterHealthUIMod {
```

### F.4 注册方式（该样本的实际做法：**没有 Harmony**）

- **全 LocalMods 的 `.cs` 文件里 `Harmony` 出现 0 次。**
- 它用的是 **LuaCs 的 `HookMethod` 反射钩子**，真实原文：
  来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\BetterHealthUI (Updated)\CSharp\Client\BetterHealthUIMod.cs:75-80`
```csharp
GameMain.LuaCs.Hook.HookMethod("BetterHealthUIMod_InitProjSpecific",
    typeof(CharacterHealth).GetMethod("InitProjSpecific", BindingFlags.Instance | BindingFlags.NonPublic),
    (object self, Dictionary<string, object> args) => {
        InitProjSpecific(self, args);
        return null;
    }, LuaCsHook.HookMethodType.After, this);
```
**签名 = `GameMain.LuaCs.Hook.HookMethod(唯一名, MethodInfo, 回调(self, args)->object, HookMethodType.{Before|After}, 宿主对象)`**
该文件共 11 处 `HookMethod`：`InitProjSpecific`(After)、`UpdateOxygenProjSpecific`(Before)、`CreateRecommendedTreatments`(Before)、`CreateAfflictionInfoElements`(Before)、`DrawHealthWindow`(Before)、`CreateAfflictionInfos`(Before)、`UpdateAfflictionContainer`(Before)、`UpdateAfflictionInfos`(Before)、`UpdateLimbIndicators`(Before)、`SortAfflictionsBySeverity`(Before) 等。
来源：对该 `.cs` 的 `HookMethod` 全文检索
- 也大量使用**纯反射**读私有字段（该 mod 依赖 `InternalAccess`）：
```csharp
GUIListBox afflictionIconContainer = (GUIListBox)((typeof(CharacterHealth).GetField("afflictionIconList",
    BindingFlags.NonPublic | BindingFlags.Instance)).GetValue(selfHealth));
GUIComponent parent = (GUIComponent)(args["parent"]);
Affliction affliction = (Affliction)(args["affliction"]);
```
来源：同文件 58、411、412 行
- 判断别的 mod 是否启用：`ContentPackageManager.EnabledPackages.All` + `package.NameMatches("Neurotrauma")` — 来源：同文件 24–26 行

### F.5 Harmony 的真实写法（**本机无样本，仅官方文档**）

→ **未验证/需实测**。官方有专门页面 `https://luatrauma.github.io/Luatrauma.Docs/cs/development/harmony/`，我未取该页内容。生成器若要输出 Harmony 补丁，需先取该文档或另找带 Harmony 的工坊 mod。

### F.6 2026 春季重构后的写法在本机样本里**是否已体现**？—— **完全没有**

明确结论：
- 本机**唯一**的 C# 样本 `BetterHealthUI (Updated)` 用的是**旧 API**：
  - `GameMain.LuaCs.Hook.HookMethod(...)` ← 重构后应改为 `LuaCsSetup.Instance.Hook.HookMethod(...)`
  - 基类 `ACsMod` + 构造函数初始化 ← 重构后推荐 `IAssemblyPlugin` + `Initialize()` / `OnLoadCompleted()` / `Dispose()`
  - 该 mod 的 `filelist.xml` 自报 `gameversion="1.4.5.0"`、`installtime="1714337353"`（≈2024-04），**明显早于 2026 重构**
  - 来源：`LocalMods\BetterHealthUI (Updated)\filelist.xml`、`...\CSharp\Client\BetterHealthUIMod.cs:75`
- 本机**没有任何** `ModUtils.*`、`LuaCsSetup.Instance`、`IAssemblyPlugin`、`ModConfig.xml` 的出现。
- 重构后的正确写法（**官方文档，非本机实证**）：
  来源：`https://luatrauma.github.io/Luatrauma.Docs/cs/setup-in-memory-csharp/`
```csharp
using System;
using Barotrauma;

// This is required so that the .NET runtime doesn't complain about you trying to access internal Types and Members
[assembly: IgnoreAccessChecksTo("Barotrauma")]
[assembly: IgnoreAccessChecksTo("BarotraumaCore")]
[assembly: IgnoreAccessChecksTo("DedicatedServer")]

namespace ExampleNamespace {
    partial class ExampleMod : IAssemblyPlugin {
        public void Initialize()   { LuaCsLogger.Log("ExampleMod loaded!"); }
        public void OnLoadCompleted() { }
        public void PreInitPatching() { }   // Not yet supported
        public void Dispose()      { LuaCsLogger.Log("ExampleMod disposed!"); }
    }
}
```
- 函数名替换表（官方迁移指南，`https://luatrauma.github.io/Luatrauma.Docs/common/migration-guide/`）：

| 旧 | 新 |
|---|---|
| `GameMain.LuaCs` | `LuaCsSetup.Instance` |
| `Client.ClientList` | `ModUtils.Client.ClientList` |
| `Barotrauma.Networking.Client.ClientList` | `ModUtils.Client.ClientList` |
| `ItemPrefab.GetItemPrefab` | `ModUtils.ItemPrefab.GetItemPrefab` |

> **给生成器的建议**：既然目标版本是 1.13.4.0 + LuaCs 1.0.109，**新 API 与 `ACsMod` 旧 API 的兼容性必须进游戏实测**（见"待实测清单"第 7 条）。本地样本只能证明"旧写法曾经能跑"。

---

## G. 本地化

### G.1 放哪

- 惯例 `<mod>/Localization/<Language>/<Language>.xml`（`Neurotrauma` 的 9 语言都这样放）
  来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\Localization\` 目录树
- 也完全可以放 mod 根（`MolochMilk\SimplifiedChinese.xml`、`WarhammerCreature\SimplifiedChinese.xml`、`monster_energy_gun\SimplifiedChinese.xml`、`ACA_NonHumanRaces_Extend\SimplifiedChinese.xml`）—— **大多数小 mod 都放根**。
- 文件名任意，靠 filelist 的 `<Text file=...>` 注册。
- 该语言**不一定是 mod 作者的语言**：`Neurotrauma` 把中文放 `NACAtext\ACA-Neurotraumachinese.xml`。

### G.2 根元素与条目格式

根 = **`<infotexts>`**，三个实测属性：

| 属性 | 值示例 | 说明 |
|---|---|---|
| `language` | `"English"` / `"Korean"` / `"Simplified Chinese"` | 目标语言 |
| `nowhitespace` | `"false"`（英/韩） / `"true"`（简中） | 是否不保留空白 |
| `translatedname` | `"English"` / `"Korean"` / `"中文(简体)"` | 语言自称 |

来源：
- `F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\Localization\English\English.xml:2` → `<infotexts language="English" nowhitespace="false" translatedname="English">`
- `F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\Localization\Korean\Korean.xml:2` → `<infotexts language="Korean" nowhitespace="false" translatedname="Korean">`
- `F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\NACAtext\ACA-Neurotraumachinese.xml:2` → `<infotexts language="Simplified Chinese" nowhitespace="true" translatedname="中文(简体)">`
- `F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\WarhammerCreature\SimplifiedChinese.xml:2` → 同上

**条目格式 = `<键.标识符>文本</键.标识符>`**，键名决定用途：

| 键前缀 | 对应内容 | 真实出处 |
|---|---|---|
| `entityname.<itemIdentifier>` | 物品名 | `Neurotrauma\...\English.xml:4` → `<entityname.defibrillator>Manual defibrillator</entityname.defibrillator>` |
| `entitydescription.<itemIdentifier>` | 物品描述 | 同上第 5 行 |
| `afflictionname.<afflictionId>` | 状态效果名 | `MolochMilk\SimplifiedChinese.xml` → `<afflictionname.molochvenom>…` |
| `afflictiondescription.<afflictionId>` | 状态效果描述 | 同文件 |
| `afflictioncauseofdeath.<id>` | 死因文本 | `Neurotrauma\NACAtext\ACA-Neurotraumachinese.xml` → `<afflictioncauseofdeath.cerebralhypoxia>脑死亡</...>` |
| `afflictioncauseofdeathself.<id>` | 自身死因文本 | 同上 → `<...cerebralhypoxia>你死了</...>` |
| `character.<SpeciesName>` | 角色/物种名 | `WarhammerCreature\SimplifiedChinese.xml:3` → `<character.cryptothrall>墓穴构造体</character.cryptothrall>` |
| `eventtext.<eventKey>` | 事件文本 | `KATEEspawn.xml` → `eventtext.shop.katee.interact`；`ChainingEvents.xml` → `EventText.miketheidiot1.c1` |
| `<任意键>`（无点号） | UI 消息等 | `monster_energy_gun\SimplifiedChinese.xml` → `<ItemMsgMonsterEnergyDrinkRequired>…` |
| `jobname.<id>` / `jobdescription.<id>` | 职业 | `[MD]` 第 1141–1142 行（弱证据） |
| `talentname.<id>` / `talentdescription.<id>` | 天赋 | 真实统计：`ACAWeaponsExpand` 中 `<talentname>` 112 次、`<talentdescription>` 175 次（**注意根可能不是 infotexts，见 G.4**） |
| `missionname.<id>` / `missiondescription.<id>` | 任务 | `[MD]` 第 1162–1163 行（弱证据） |
| `locationtype.<id>` | 地点类型名 | `[MD]` 第 2642 行（弱证据） |
| `factionname.<id>` / `factiondescription.<id>` | 派系 | `[MD]` 第 2099–2100 行（弱证据） |

**可选：用 `<override>` 包裹条目**（用于覆盖原版文本）。`[MD]` 第 1088 行给出该形式；真实文件里出现过**被注释掉的** `<Override>` 包裹：
来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\NACAtext\ACA-Neurotraumachinese.xml:3-6`
```xml
  <!-- <Override>
    <entityname.healthscanner>手持扫描仪</entityname.healthscanner>
  </Override> -->
```

### G.3 真实语言文件片段（中英对照）

**英文** — 来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\Localization\English\English.xml:1-9`
```xml
<?xml version="1.0" encoding="utf-8"?>
<infotexts language="English" nowhitespace="false" translatedname="English">
  <!-- ITEMS -->
  <!-- /// Gear /// -->
  <entityname.defibrillator>Manual defibrillator</entityname.defibrillator>
  <entitydescription.defibrillator>A medical device delivering an electric shock to the heart to stabilize cardiac arythmias. Requires extensive medical training. Use on a patient with cardiac arrest.</entitydescription.defibrillator>
  <entityname.aed>Automated external defibrillator</entityname.aed>
  <entitydescription.aed>A medical device delivering an electric shock to the heart to stabilize cardiac arythmias. Requires little to no medical training. Use on a patient with cardiac arrest.</entitydescription.aed>
```

**韩文（非 ASCII 语言样本）** — 来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\Localization\Korean\Korean.xml:1-6`
```xml
<?xml version="1.0" encoding="utf-8"?>
<infotexts language="Korean" nowhitespace="false" translatedname="Korean">
  <entityname.defibrillator>수동 제세동기</entityname.defibrillator>
  <entitydescription.defibrillator>심장에 전기충격을 가하여 부정맥을 안정화시키는 의료기기. 광범위한 의료 훈련이 필요합니다. 심정지 환자에게 사용하십시오.</entitydescription.defibrillator>
```

**中文（怪物名）** — 来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\WarhammerCreature\SimplifiedChinese.xml:1-7`
```xml
<?xml version="1.0" encoding="utf-8"?>
<infotexts language="Simplified Chinese" nowhitespace="true" translatedname="中文(简体)">
  <character.cryptothrall>墓穴构造体</character.cryptothrall>
  <character.HuskMarine>画皮星际战士</character.HuskMarine>
  <character.Bioship>生化船</character.Bioship>
```

**中文（物品 + 状态效果）** — 来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\MolochMilk\SimplifiedChinese.xml`（逐字以 read 工具读取，非转码推断）
```xml
<?xml version="1.0" encoding="utf-8"?>
<infotexts language="Simplified Chinese" nowhitespace="true" translatedname="中文(简体)">
  <entityname.milktank>储奶罐</entityname.milktank>
  <entitydescription.milktank>用来装奶。里面的奶过一段时间就会变质。</entitydescription.milktank>
  <entityname.freshmilk>鲜奶</entityname.freshmilk>
  <entityname.spoiltmilk>变质奶</entityname.spoiltmilk>
  <afflictionname.molochvenom>摩螺克毒素中毒</afflictionname.molochvenom>
  <afflictiondescription.molochvenom>皮肤麻木并伴有刺痛感，行动开始变得笨拙。</afflictiondescription.molochvenom>
```

### G.4 额外的标识符↔文本对应事实

- **`identifier` 与本地化键必须严格一致**（含大小写）。证据：`WarhammerCreature\SimplifiedChinese.xml` 里出现 `<character.Crawlerhyb>`、`<character.Mudraptortyr>` 等，与 `WarhammerCreature\Characters\*\*.xml` 的 `SpeciesName` 一一对应。
- `ACAWeaponsExpand` 中 `<talentname>`/`<talentdescription>` 出现 112/175 次，但**不是** `<infotexts>` 根 —— 我会给出该文件的根元素统计：`<Aca>` 634 次、`<Ragdoll>` 217、`<Character>` 212、`<talentdescription>` 175、`<talentname>` 112、`<Items>` 103、`<Override>` 54。
  来源：对 `F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\ACAWeaponsExpand\**\*.xml` 根元素统计
  → 说明**天赋名/描述的 `<talentname.x>` 条目也被放在普通 XML 里**，不必非在 infotexts 文件。**其确切规则未验证/需实测**。
- 物品 ID 中文对照表（`identifier` + 中文名两列，制表符对齐）真实存在于：
  `F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\附赠-潜渊症物品id表.md`（366 行），格式：
  ```
  piratehelmet                    分裂派头盔
  piratebodyarmor                 分裂派防弹衣
  ```
  来源：该文件第 1–8 行（用 read 工具读，编码正确）

### G.5 `preview.png` / 创意工坊预览图 —— 更正任务背景里的一条假设

- 任务背景称"LocalMods 下没有任何 mod 带 preview.png"。**更精确的实测结论**：
  - **小写 `preview.png` 在 LocalMods 中确实 0 个**
  - **但 `PreviewImage.png` 有 3 个**（mod 根目录）：
    - `F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Horny Europa REDO Beta 1\PreviewImage.png`
    - `F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\异种生存MOD(普通版)\PreviewImage.png`
    - `F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\!!!_暂时不用\[R18+]奇怪❤木卫二\PreviewImage.png`
  - 另有 `F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\ACAWeaponsExpand\Minecraft\Preview.png`（在子目录，非 mod 根）
- **这些 `PreviewImage.png` 没有被任何 `filelist.xml` / `ModConfig.xml` / `metadata.xml` / `RunConfig.xml` 引用**（对全部此类文件做 `preview` 全文检索，命中 0）。→ 名字只是**社区喂给发布工具的约定**。
- 游戏自带默认预览图：`F:\SteamLibrary\steamapps\common\Barotrauma\Content\DefaultWorkshopPreviewImage.png`（存在性已验证）
- 官方内容包清单 `F:\SteamLibrary\steamapps\common\Barotrauma\Content\ContentPackages\Vanilla.xml` 中**检索 `preview` 命中 0**
- → **`preview.png` 作为加载时字段 = 未验证/需实测**；结论仍是"工坊预览图由发布环节处理，不属于 mod 加载必需文件"。

---

## H. 常见坑与版本差异

### H.1 会导致加载失败或报错的坑（均有真实证据）

1. **`<Magazine>` 元素不存在**（1.13.4.0 实测 0 次命中）。照抄网上旧文档写 `<Magazine>` 必然无效。弹药要用 `<ItemContainer>` + `<SpawnItem>` + `<Holdable canBeCombined>`；武器要用 `<RequiredItems type="Contained">` + `<StatusEffect type="OnUse" target="Contained"><Use/></StatusEffect>`。
   来源：`F:\SteamLibrary\steamapps\common\Barotrauma\Content\input.xml:7532-7626`、`LocalMods\SmartPistol\SmartPistol.xml`
2. **`<Containable>` 的 `items=` 是标签、`identifier=` 是 ID**，两者语义不同且都真实存在；写错则容器装不进东西。
   来源：`Content\input.xml:7626`（`items="smgammo"`） vs `LocalMods\ACAWeaponsExpand\Items\Heavy_Weapons.xml:50`（`identifier="coilgunammo"`）
3. **`RequiredItem` / `RequiredItems` 两种拼写都在用**，生成器必须两种都接受/知道等价。
   来源：`Content\input.xml:7622`（复数） vs `LocalMods\ACAWeaponsExpand\Items\Heavy_Weapons.xml:47`（单数）
4. **事件根元素大小写两种都真实存在**：`<Randomevents>` 与 `<RandomEvents>`。生成器若做 XML 校验，不能只认一种。
   来源：`LocalMods\NonHumanRaces_Robotrauma_Patch\NPC\KATEEspawn.xml:2` vs `LocalMods\Scartarus\Code\event.xml:3`
5. **`filelist.xml` 的 `file=` 必须带 `%ModDir%/` 前缀**（实测 100% 如此）。写成裸相对路径**未验证**。
6. **`name=""`（空）≠ `name="xxx"`**：空字符串走本地化 `entityname.<identifier>`，非空则直接当显示名。混用会导致游戏里显示原始 ID 或本地化失效。
   来源：`LocalMods\SmartPistol\SmartPistol.xml:4`（空） vs `LocalMods\ACAWeaponsExpand\Items\Heavy_Weapons.xml:3`（非空）
7. **Lua 的钩子是 `Hook.Add`（大写 H、大写 A），不是 `hook.add`**。写小写会静默不注册。
   来源：`LocalMods\Neurotrauma\Lua\Scripts\Server\blood.lua:36` 等 30+ 处
8. **`Lua/Autorun` 目录名大小写**：官方文档写 `Lua/Autorun`（`A` 大写、`u` 小写）。本机真实目录名就是 `Autorun`。
   来源：`LocalMods\Neurotrauma\Lua\Autorun\`、`LocalMods\ACA_NonHumanRaces_Extend\Lua\Autorun\`
9. **`<ModConfig.xml>` 若声明了不存在的文件会导致整个内容包不加载**（官方原文：*"missing files in `ModConfig.xml` will cause the ContentPackage to not be loaded"*），除非加 `IsFileRequired="false"`。
   来源：`https://luatrauma.github.io/Luatrauma.Docs/common/development/modconfig/`
10. **XML 编码**：所有真实样本都是 UTF-8（`<?xml version="1.0" encoding="utf-8"?>`），中文语言文件必须在 `<infotexts>` 上同时给 `language="Simplified Chinese"` 和 `nowhitespace="true"`。缺 `nowhitespace="true"` 时中文里的换行/缩进可能被当成内容。
    来源：全部真实 `SimplifiedChinese.xml` 文件第 1–2 行
11. **`<Text>` 元素与语言强绑定**：`Neurotrauma` 把德语文件用 `<Other>` 而非 `<Text>` 注册（`filelist.xml`），暗示 `<Text>` 只接受游戏认识的语言名。→ **确切规则未验证/需实测**。
    来源：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\Neurotrauma\filelist.xml`
12. **UTF-8 BOM 可有可无**（实测两种都在真实 mod 里工作）：带 BOM 的首 4 字节 `EF BB BF 3C`，不带的 `3C 3F 78 6D`。
    带 BOM：`LocalMods\WarhammerCreature\SimplifiedChinese.xml`、`LocalMods\Neurotrauma\NACAtext\ACA-Neurotraumachinese.xml`、`LocalMods\SmartPistol\SmartPistol.xml`
    不带 BOM：`LocalMods\MolochMilk\SimplifiedChinese.xml`、`LocalMods\monster_energy_gun\SimplifiedChinese.xml`
    → 生成器**统一输出 UTF-8 + BOM 即可**（这两条都是本机实测首字节）。
13. **同一个 mod 内 `identifier` 必须全局唯一**（跨所有 XML 文件）；重名会覆盖。
    `[MD]` 第 1586 行 + `Content\input.xml` 的 `<override>` 机制。

### H.2 v1.13.x 相对旧版的变化（有证据的）

| 变化 | 证据 |
|---|---|
| 当前版本 = `1.13.4.0 (Summer Update 2026 Hotfix 1)` | `F:\SteamLibrary\steamapps\common\Barotrauma\changelog.txt` 第 1–2 行 |
| 该版本有实装内容改动（Typhon 重制相关） | `changelog.txt` 第 4 行：`- Fixed a missing gap in the reworked Typhon + other minor fixes.` |
| `filelist.xml` 的 `gameversion` 会被游戏更新为当前版本（新旧 mod 里并存 `1.4.5.0` / `1.7.7.0` / `1.9.8.0` / `1.11.5.0` / `1.13.4.0`） | 各 `filelist.xml` 的 `gameversion` 属性 |
| `<Upgrade gameversion="0.10.0.0" scale="0.5" />` —— 游戏支持在物品里按版本做数值缩放，说明版本迁移是官方机制 | `Content\input.xml:7530`；`[MD]` 第 663–664 行 |
| LuaCs 2026 春季重构：`GameMain.LuaCs` → `LuaCsSetup.Instance`；`ItemPrefab.GetItemPrefab` → `ModUtils.ItemPrefab.GetItemPrefab`；`Client.ClientList` → `ModUtils.Client.ClientList`；新增 `ModConfig.xml` 声明式加载 | `https://luatrauma.github.io/Luatrauma.Docs/common/migration-guide/`、`.../common/development/modconfig/` |
| **本机所有样本都早于该重构**，未体现新 API | `LocalMods\BetterHealthUI (Updated)\filelist.xml` 的 `gameversion="1.4.5.0"`/`installtime`；其 `.cs` 用 `GameMain.LuaCs` |

### H.3 版本差异：**未验证**的部分

- v1.13.x 相对 1.12/1.11 具体删改了哪些 XML 字段 → **未验证/需实测**（本机没有旧版本 `Content` 目录可 diff，只有编译后的 `Barotrauma.dll`）。
- 若需要权威字段表，可考虑对 `F:\SteamLibrary\steamapps\common\Barotrauma\Barotrauma.dll` / `BarotraumaCore.dll` 做反编译或 IL 反射，枚举 `Barotrauma.Items.Components.*` 与 `Barotrauma.*Prefab` 的属性名 —— 这是比静态 XML 更可靠的手段，本次未做。

---

## 待实测清单（必须进游戏验证，静态文件无法确认）

| # | 事项 | 为什么无法静态确认 | 建议验证方法 |
|---|---|---|---|
| 1 | `filelist.xml` 是否支持 `hidden` / `submarines` / `path` 等属性 | 49 个样本中出现 0 次 | 写一个带该属性的 mod，看是否报 unknown attribute |
| 2 | `MapGenerationParameters` / `LocationTypes` / `OutpostConfig` 作为 filelist 子元素是否有效 | 49 个样本中出现 0 次，仅 `[MD]`（第三方文档）声称存在 | 逐个写进 filelist，看内容包是否加载、日志是否报错 |
| 3 | 贴图/资源路径的大小写敏感性 | Windows NTFS 不区分大小写，本机无法区分 | 在 Linux 服务端或改扩展名大小写后测试 |
| 4 | 裸相对路径（不加 `%ModDir%`、不加 `Content/`）在 texture/file 上是否被接受 | LocalMods 样本中未观测到该写法 | 写一个用裸相对路径的 mod 试加载 |
| 5 | `<Text>` 元素能否注册任意语言名（如 German） | 只有 Neurotrauma 一例把 German 写成 `<Other>`，样本量 1 | 用 `<Text file=".../German.xml">` 注册，看是否被识别为德语 |
| 6 | `RunConfig.xml` 的 `<Server>`/`<Client>` 全部合法取值 | 本机只有 `Standard`/`Forced` 这一组 | 逐个试 `Force`/`None`/`Optional` 等，或查 LuaCs 源码 |
| 7 | **`ACsMod` + `GameMain.LuaCs` 旧 API 在 LuaCs 1.0.109 下是否仍可用**；`IAssemblyPlugin` + `LuaCsSetup.Instance` 新 API 是否必须 | 本机唯一 C# 样本早于 2026 重构，无新旧对照 | 各写一个最小 mod，进游戏看 Console 是否报 `GameMain.LuaCs` 不存在 |
| 8 | Harmony 在 LuaCs 下注册补丁的确切写法 | 本机 `.cs` 中 `Harmony` 出现 0 次 | 取官方 `cs/development/harmony/` 文档，或找带 Harmony 的工坊 mod 实测 |
| 9 | `ConfigService` / `trygetpackage` 的确切调用签名 | 本机 0 个样本使用 | 取官方 `common/development/config-service/`、`config-specifications/` 文档 + 实测 |
| 10 | `<talentname.x>` / `<talentdescription.x>` 是否必须在 `<infotexts>` 内（ACAWeaponsExpand 把它们放在别处） | 根元素统计显示它们不在 infotexts 里，但无加载日志佐证 | 分别测试两种放法 |
| 11 | `preview.png` / `PreviewImage.png` 是否被游戏读取（而非仅发布工具） | 无任何 XML 引用它们 | 放置文件后看是否影响 mod 列表中显示的缩略图 |
| 12 | 事件 `<EventSet>` 的 `leveltype` / `locationtype` 合法取值全集 | 只观测到若干实例 | 从 `Content\Events\EventSets.xml` 全量提取，或进游戏看报错 |
| 13 | `[MD]` 中所有未在真实文件里验证过的 `<Item>` 属性（`health` `fireproof` `hideinmenus` `interactthroughwalls` `hideconditionbar` `RequireAimToUse` `damagedbyrepairtools` `hidehealthbar` 等） | 只在第三方文档出现 | 反编译 `BarotraumaCore.dll` 枚举 `ItemPrefab` / `Item` 属性，或逐个试写 |
| 14 | 完整内容组件清单（`Holdable` `Rope` `GrappleRope` `LightComponent` `Controller` `Turret` `MotionSensor` `CustomInterface` `WifiComponent` `AITarget` `Throwable` `PropelledProjectile` `LineDrawer` `Growable` `Door` `Pump` `Reactor` …）及各自字段 | `[MD]` 列了一批，但真实文件里我只逐一确认了其中一部分 | 反编译 `Barotrauma.Items.Components` 命名空间，自动生成权威字段表 |
| 15 | 多语言文件是否必须与 `<infotexts language>` 里的字符串完全一致（如 `"Simplified Chinese"` vs `"Chinese"`） | 样本里两种都用（`Simplified Chinese`），无对照 | 用错误语言名注册，看是否被忽略 |
| 16 | `<override>` 与不加 `<override>` 在"同名 identifier 新增 vs 覆盖"上的确切行为 | 只从 `[MD]` 得到说法 | 做一个故意重名的 mod，进游戏观察是覆盖还是报错 |

---

## 附：本次研究的证据索引（供后续复用）

| 素材 | 绝对路径 | 用途 |
|---|---|---|
| 主 XML 参考（第三方） | `F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\潜渊症xml样本..md`（2771 行） | 字段索引；**弱证据，需交叉验证** |
| 物品 ID 中英表 | `...\LocalMods\附赠-潜渊症物品id表.md`（366 行） | `identifier` ↔ 中文名 |
| 入门教程（第三方） | `...\LocalMods\附赠-Mod初学者教程.md`（136 行） | `[MD]` 同源的 StatusEffect/ActionType 列表 |
| 完整物品样本（原版） | `F:\SteamLibrary\steamapps\common\Barotrauma\Content\input.xml`（189,246 行） | **最权威的物品/弹药/武器字段来源** |
| 原版武器 | `...\Content\Items\Weapons\weapons.xml`(146 KB)、`coilgun.xml`、`chaingun.xml`、`railgun.xml`、`depthcharge.xml`、`flakcannon.xml` | 各种武器组件字段 |
| 原版角色 | `...\Content\Characters\` | 怪物字段 |
| 原版事件 | `...\Content\Events\*.xml`（9 个，最大 184 KB） | 事件动作字段 |
| 原版 NPC 集合 | `...\Content\NPCPrefabs\OutpostNpcs.xml`(70 KB)、`SpecialNpcs.xml`、`CombatMissionNpcs.xml`、`EscortMissionNpcs.xml`、`Corpses.xml` | npcset/npc/ItemSet 字段 |
| 原版背景生物 | `...\Content\BackgroundCreatures\BackgroundCreaturePrefabs.xml`(21 KB) | 背景生物字段 |
| 原版词条 | `...\Content\Afflictions.xml`、`AfflictionsGeneticMaterial.xml`、`ContainerTags.xml`、`Jobs.xml`、`Missions.xml`、`Orders.xml`、`randomevents_campaign.xml` | 各类定义字段 |
| 原版内容包 | `...\Content\ContentPackages\Vanilla.xml` | 官方 filelist 写法 |
| LuaCs 声明式清单 | `...\Data\Mods\LuaCsForBarotrauma\SettingsData.xml` | CsRunPolicy 设置 |
| LuaCs 全局开关 | `F:\SteamLibrary\steamapps\common\Barotrauma\LuaCsSetupConfig.xml` | `EnableCsScripting="true"` 等 |
| 官方 XML 文档 | `https://regalis11.github.io/BaroModDoc/` | 交叉验证（本次未逐页抓取） |
| 官方 LuaCs 文档 | `https://luatrauma.github.io/Luatrauma.Docs/` | 重构后 API / ModConfig.xml |
