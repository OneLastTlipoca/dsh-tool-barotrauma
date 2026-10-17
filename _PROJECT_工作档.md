# dsh-tool-barotrauma 工作档（机器快照）

> 只记终态事实，不写原因。原因见 `_PROJECT_修改日志.md`。

## 路径（绝对）

```
工程根      E:\Desktop\001\_barotrauma_tool
源码        E:\Desktop\001\_barotrauma_tool\src
编译输出    E:\Desktop\001\_barotrauma_tool\lib
入口        E:\Desktop\001\_barotrauma_tool\lib\index.js
测试        E:\Desktop\001\_barotrauma_tool\tools\{smoke,test-planning,test-items,test-e2e}.mjs
参考文档    E:\Desktop\001\_barotrauma_tool\refs\reference.md
临时产物    E:\Desktop\001\_barotrauma_tool\.scratch\   （可整目录删除）
profile     C:\Users\OtobeSpica\.dsh\profiles\desktop
备份        C:\Users\OtobeSpica\.dsh\profiles\desktop\{package.json,pnpm-lock.yaml}.bak-20261010-133618
```

## 环境 / 工具链

```
node        C:\Users\OtobeSpica\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe   (v24.21.0)
pnpm        C:\Users\OtobeSpica\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\pnpm\bin\pnpm.mjs   (v11.7.0)
tsc         <工程>\node_modules\typescript\bin\tsc                                                     (5.9.3)
python      C:\Users\OtobeSpica\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe   (含 lxml 6.1.3，做 XML 良构校验)
DSH 包      C:\Users\OtobeSpica\.dsh\profiles\node_modules\@deepseek-ai\*
            cordis 4.0.1 / dsh-tools 0.1.0-rc.5  ← 编译期 paths 指向这里，与运行期一致
```

## 工作流（关键）

```powershell
Set-Location E:\Desktop\001\_barotrauma_tool
$node="C:\Users\OtobeSpica\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
& $node ".\node_modules\typescript\bin\tsc" -p tsconfig.json   # 编译
& $node tools\test-e2e.mjs                                     # 全链路测试
```

坑：
- 测试假 ctx 的 `effect` 必须立即调用工厂函数，否则注册不生效。
- 二进制（zip/png）走 `writeFile(path, Uint8Array)`，不可经 utf8 文本写入。
- `@deepseek-ai/*` 不进 `dependencies`。
- 删目录软链用 `cmd /c rmdir`，执行前核对 LinkType/Target。

## key 常量 / 数据映射

```
插件名            dsh-tool-barotrauma
工具前缀          barotrauma_
工具数            15
TOOL_NAMES        detect_env / plan / create_mod / gen_item / gen_affliction / gen_character /
                  gen_event / gen_lua / gen_csharp / scan_l10n / translate / validate /
                  gen_icon / pack / publish
默认 features     items, localization
filelist 根       <contentpackage name= modversion= corepackage="False" gameversion= >
filelist 子元素   <Item> <Character> <RandomEvents> <Text> <Afflictions> <Other>
                  （元素名 = 内容类型；唯一属性 file="%ModDir%/…"）
语言文件根        <infotexts language="Simplified Chinese" nowhitespace="true" translatedname="中文(简体)">
本地化键          entityname.<id> / entitydescription.<id> / afflictionname.<id> /
                  afflictiondescription.<id> / character.<SpeciesName> / eventtext.<key>
硬编码目录        Lua/Autorun/  CSharp/{Shared,Client,Server}/  bin/<Client|Server>/<平台>/
硬编码文件        CSharp/RunConfig.xml （<Server>Standard</Server><Client>Forced</Client>）
预览图真名        PreviewImage.png
物品根            两种：<Items> 与 <override><Items>（覆盖同 identifier）
角色根            单个 <Character SpeciesName="…">（一个文件一个物种）
事件根            <Randomevents>；需 <EventPrefabs> 定义 + <EventSet> 挂载
状态效果根        <Afflictions>
Lua 钩子          Hook.Add(事件名, 唯一钩子名, 回调)   ← 大写
Lua 全局          CLIENT / SERVER / Game.IsMultiplayer / Timer.Wait / Networking.Receive /
                  File.Read|Write|Exists / json.parse|serialize / dofile / require / print
Lua mod 根路径    table.pack(...)[1]
C# 默认写法       legacy: partial class X : ACsMod + 构造函数 + Start()/Stop() + LuaCsSetup.PrintCsMessage
C# 新写法         modern: IAssemblyPlugin + [assembly: IgnoreAccessChecksTo] + LuaCsLogger.Log  ⚠️ 未实测
```

## 本次改动终态

- 15 个 `barotrauma_*` 工具全部实现，`tsc` exit 0。
- 插件已装进 `desktop` profile：`package.json` 里 `dependencies["dsh-tool-barotrauma"]="link:E:/Desktop/001/_barotrauma_tool"`，
  `dsh.profile.bundles` 末尾加 `dsh-tool-barotrauma`。
- DSH 现场已加载：工具列表注入 15 个新 schema；profile 条目数 202 → 203。
- `detect_env` 实测回值：gameDir `F:\SteamLibrary\steamapps\common\Barotrauma`、1.13.4.0、buildid 23799131、
  LocalMods 在游戏目录内、LuaCs 已装、0Harmony.dll 在。
- 真实验证 mod 已落盘：`F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\DSH_验证mod_可删除`
  （含 `DshTestWidget` 物品 + 中文名/描述 + Lua autorun + validation-report.md），校验 blocker/major/minor 全 0。

## key 常量 / 数据映射（校验器）

```
只检查"会被加载"的文件        = filelist 登记 ∪ folder=/path= 约定 ∪ Ragdolls|Animations|Names 固定目录
                                ∪ NO_REGISTRATION_NEEDED ∪ filelist.xml 自身
NO_REGISTRATION_NEEDED        lua/ csharp/ bin/ config/ publish/ dist/ assets/{content,config}/
                              validation-report.md plan.json previewimage.png modconfig.xml runconfig.xml
                              （注意 Localization/ **不在**名单里：语言文件也必须登记才会加载）
CONVENTION_DIR_PATTERN        (^|/)(ragdolls|animations|names)(/|$)      ← 引擎按固定子目录名读取
跨 mod 引用                   引用文件不在本 mod → 去 dirname(modDir) 的兄弟目录找；找到报 ASSET_CROSS_MOD(minor)
资源路径解析                   按属性值解析；按「下一个 %ModDir%/ 或 Content/ 起点」划界
                              ← 不能按空白切分，真实文件名含空格（雪叶 子 - 天街桜.ogg）
跳过静态检查的路径            含 [ ] { } 占位符的（如 captain_torso_[GENDER]_1.png）
语言文件识别                   按内容：/<infotexts[\s>]/i（不看 filelist 里是 <Text> 还是 <Other>）
本地化键比较                   统一小写
<conditional> 运算符           e/eq/equals ne/neq/notequals/! !e !eq !equals
                              lt/lessthan/l lte/lteq/lessthanequals/le
                              gt/greaterthan/g gte/gteq/greaterthanequals/ge
                              （值含 ":" 的跳过 —— hasstatustag="tag: value" 不是关系式）
comparison/conditionalcomparison  只允许 and / or（大小写不敏感）
identifier 重复判定            需像定义（有 name/category/tags/scale/maxstacksize）
                              且不是装配实例（无 ID= / rect= / conditionpercentage=）
L10N reason 取值               name-attribute / implicit / always / referenced
                               implicit 只在语言文件里也没该键时才算缺口
<override> 包裹的文件           不产生本地化需求（继承原版键）
```

## 待办 / 未完成

1. **重载最新代码**：插件已加载的旧模块常驻进程；本会话后半段的修改（validate 的原版资源检查、
   gen_item 的贴图当场校验）需要**重载 profile 或重启 DSH** 才会生效。
2. C# `modern` 写法（IAssemblyPlugin）在 LuaCs 1.0.109 下的兼容性未实测。
3. Harmony 写法未取证（本机 `Harmony` 命中 0 处），`gen_csharp` 未输出 Harmony 补丁。
4. 未实现：潜艇（`.sub`）编辑、贴图像素尺寸与 `sourcerect` 的匹配检查。
5. `refs/reference.md` 里 16 条「待实测清单」中若干项仍未验证：
   `filelist` 的 `hidden` / `submarines` 属性、贴图路径跨平台大小写敏感性。
6. `SmartPistol` 的真实缺陷（`name=""` 却无语言文件）未修 —— 那是用户的 mod，待其确认后再动。

## 交付物（本次会话最终产出）

```
安装包（桌面）
  E:\Desktop\dsh-tool-barotrauma-0.1.0\        解压即用目录，92 文件 / 0.76 MB
  E:\Desktop\dsh-tool-barotrauma-0.1.0.zip    251.1 KB
工程（源码）
  E:\Desktop\001\_barotrauma_tool
安装位置（已装且已在 DSH 现场验证加载）
  C:\Users\OtobeSpica\.dsh\profiles\desktop   link:E:/Desktop/001/_barotrauma_tool
游戏内验证 mod（用户已实测通过）
  F:\SteamLibrary\steamapps\common\Barotrauma\LocalMods\DSH_验证mod_可删除
```

包内新增文件：`install.ps1`（UTF-8 **with BOM**，PS 5.1 必须）、`INSTALL.md`、`功能说明.md`、`LICENSE`、`docs/reference.md`。

## 踩坑记录（重要）

1. `plugin_manager install_bundle` 装本地路径包 → 超时 600s、`application: failed`、回滚 package.json 但不回滚 node_modules 软链。**改用手动安装**。
2. 该超时顺带触发 pnpm 清理 27 个多余包；已确认 profile 完好（lockfile 未变、frozen install 通过、9 bundle 解析正常）。
3. 校验器最初对 `CSharp/RunConfig.xml` 与 XML 注释内容误报，已修。
4. `collectAssetReferences` 最初只匹配 `%ModDir%/`，`Content/` 检查是死代码；修好后立刻抓出我自己写的错误贴图引用。
5. **本机 DSH 的 `pwsh` 工具跑的是 Windows PowerShell 5.1**（不是 PS7）。含非 ASCII 的 `.ps1` 必须写 **UTF-8 with BOM**，
   否则 5.1 按 GBK 解码会让中文字符吃掉后面的引号 → 语法错误、脚本根本跑不起来。
6. 本机 `pwsh` 不在 PATH（`& pwsh` 报 CommandNotFound）；直接 `& script.ps1` 会被执行策略拦（`UnauthorizedAccess`），
   要 `powershell -ExecutionPolicy Bypass -File`。
