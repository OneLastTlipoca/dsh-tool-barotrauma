# 潜渊症 XML 翻译工具 · 源码分析与改进建议

> 分析对象：`E:\Desktop\001\_barotrauma_tool\.scratch\devtool\渊深xml翻译工具\`
> 分析日期：本次会话；分析方式：只读 + 在 `%TEMP%\xltool` 下复现运行（**未修改任何被读取的文件**）
> 对照对象：本插件 `E:\Desktop\001\_barotrauma_tool\src\l10n.ts`、`src\pack-io.ts`

---

## 0. 结论速览（先给答案）

1. **它不是机器翻译，也不做任何游戏文本翻译。** 全源码只 `import re`（未使用）和 `from lxml import etree`，
   没有任何 HTTP / socket / 模型客户端代码（证据：`打包前源码\translator.py:1-2`、`打包前源码\fan_yi.py:1-2`；
   全目录 grep `requests|urllib|http|socket|openai|key|token|api` 只命中 map 字面量，见本文 §A2）。
2. **它做的是「XML 结构名（标签名 / 属性名 / 部分属性值）的中英对照替换」**：把人写的中文标签名还原成游戏认识的
   英文标签名，或反过来把英文结构名标成中文方便人类编辑。**元素文本（text node）从头到尾没被读过、没被写过。**
3. 因此它在潜渊症语境下**不产生任何玩家可见的本地化**：`name=""`（物品显示名走 `entityname.*`）、
   `<Description>` 等文本一律原样保留（实测见 §A3、§B2）。
4. 核心算法是「扁平双语词典 + lxml 递归改写 tag/attrib」，唯一亮点是 `fan_yi.build_reverse()` 由正向表自动生成反向表。
5. 主要缺陷：**无任何值域白名单**（`VAL_ATTRS` 定义了但从未使用，`translator.py:1004-1018`），
   导致 `identifier` / `name` / `tags` 这类**自由文本或大小写敏感值被无条件改写**，并已被实测证明会造成数据损坏（§B7）。
6. **没有硬编码凭据，没有危险行为**（§E）；唯一风险是无条件覆盖 `输出.xml`。

---

## A. 它到底做什么

### A1. 用途、输入输出、CLI 交互流程

产物：`潜渊XML翻译工具.exe`（约 14.6 MB，PyInstaller 打包）+ `打包前源码\`。
`使用方法.txt:5-11` 说明整个工具的交互模型是「**只认两个固定文件名**」：

| 文件 | 角色 | 证据 |
| --- | --- | --- |
| `源.xml` | 输入（手工改名/粘贴） | `使用方法.txt:6-7`、`run.py:24`、`run.py:34` |
| `输出.xml` | 输出（每次覆盖） | `使用方法.txt:8`、`使用方法.txt:52`、`run.py:29`、`run.py:39` |

入口 `run.py`（无命令行参数，纯交互循环）：

- `run.py:52-55`：`while True: one_round()`，每轮结束 `input("按回车继续...")`。
- `run.py:12-21`：打印菜单，`input("请输入数字 [1-3]: ")`。
- `run.py:23-31`（**选 1 = 英文 → 中文**）：检查 `源.xml` 存在后调用 `fan_yi.reverse_file("源.xml", "输出.xml")`（`run.py:29`）。
- `run.py:33-41`（**选 2 = 中文 → 英文**）：调用 `translator.translate_file("源.xml", "输出.xml")`（`run.py:39`）。
- `run.py:43-44`：选 3 `sys.exit(0)`；其他输入 `run.py:46-48` 提示重选。
- `run.py:4` 把脚本目录插进 `sys.path`，`run.py:6-7` 导入 `translator` 与 `fan_yi`。

命名陷阱（重要）：**两个模块名与实际方向是反的**——
`fan_yi.py`（拼音「翻译」）负责 **英→中**（`fan_yi.py:90-94`），
`translator.py` 负责 **中→英**（`translator.py:1079-1083`）。`translator.py:1086-1088` 与 `fan_yi.py:97-99`
还各自提供 `__main__` 直跑；`fan_yi.py:98` 支持 `argv[1:3]`，但 `run.py` 从不传参。

`使用方法.txt:57-59` 自述覆盖范围：「涵盖常见物品，状态，药物，武器；未涵盖生物，潜艇，天赋」——
与 `TAG_MAP`（`translator.py:5-118`，112 条）中**确实没有** `角色/生物/怪物/潜艇/物种` 这类标签一致
（`ATTR_MAP` 里倒是有 `物种名: translator.py:471`、`物种组: 486` 等零散属性）。

### A2. 是机器翻译吗？——不是，纯本地词典替换

证据链（全部确认为「纯本地」）：

- `translator.py:1-2`：`import re`（**全文件再无 `re.` 使用**，死导入）与 `from lxml import etree`；没有任何网络库。
- `fan_yi.py:1-4`：`import sys`、`from lxml import etree`、`from translator import TAG_MAP, ATTR_MAP, VAL_MAP`。
- 全目录内容检索 `requests|urllib|http|socket|openai|key|token|api` 只命中三类东西：`ATTR_MAP/VAL_MAP` 里的
  字面量（如 `拾取键→pickkey: translator.py:222`）和 `import` 行——**没有任何 API 调用点**。
- 对 exe 做字节级字符串扫描（未反编译）：`api_key/apikey/API_KEY/Bearer /Authorization/openai/anthropic/deepseek/translate.googleapis`
  命中数全部为 **0**；全文唯一的 URL 是 `http://schemas.microsoft.com`（PyInstaller 版本资源里的 manifest 命名空间），
  没有任何翻译服务域名。**即：该 exe 完全离线。**
- 未确认项：exe 内部 PyInstaller 归档是压缩的（探测源码中文串 `首选容器/VAL_ATTRS/翻译工具` 在该 exe 中命中数为 0），
  **因此无法确认 exe 与给定源码逐行一致**；本次不做反编译，结论以源码为准。

### A3. `源.xml` → `输出.xml` 的实际变换（逐段对比）

目录里存在**两对样例，方向相反**，恰好把两个方向都覆盖了：

| 样例对 | 方向 | 由谁生成 |
| --- | --- | --- |
| `打包前源码\源.xml` → `打包前源码\输出.xml` | 英 → 中 | `fan_yi.reverse_file` |
| `源.xml`（根目录） → `输出.xml`（根目录） | 中 → 英 | `translator.translate_file` |

**复现验证（本次会话实跑，非推测）**：

- `translator.translate_file(根\源.xml)` 的输出与 `根\输出.xml` **逐行 0 差异（1025 行全同）**；
- `fan_yi.reverse_file(打包前源码\源.xml)` 的输出与 `打包前源码\输出.xml` **逐行 0 差异（44 行全同）**。
  ⇒ 样例就是这套代码跑出来的，所有观察都能安全映射回代码行。

#### 小样例（`打包前源码\源.xml`，44 行）逐段

`sprite`→`贴图`、`name`→`名称`……具体行：

| 位置 | 输入 | 输出 | 变了什么 / 没变什么 |
| --- | --- | --- | --- |
| L1 | `<?xml version='1.0' encoding='utf-8'?>` | `...encoding='UTF-8'?>` | 仅声明里编码大小写被序列化器改写 |
| L2-3 | `<!--示例文件 -->`、`<!--[captainsuniform1] 老水手船长袄 -->` | **原样** | 注释被完整保留 |
| L4 | `<Item name="" identifier="captainsuniform1" ... category="Equipment" tags="smallitem,clothing" impactsoundtag="impact_soft">` | `<物品 名称="" 标识符="captainsuniform1" 别名="..." 类别="装备" 多个标签="小物品,衣物" 缩放="0.5" 撞击音效标签="软质撞击">` | 标签名、属性名、**部分属性值**被换；`name=""`（空串）原样；`identifier` 值恰好不在词典里所以原样 |
| L5 | `<PreferredContainer primary="crewcab" />` | `<首选容器 主要="crewcab"/>` | 自闭合标签前的空格被吃掉 |
| L6 | `requiredfaction="coalition"` | `requiredfaction="联盟"` | **属性名 `requiredfaction` 不在 `ATTR_MAP`，但值命中了 `VAL_MAP["联盟"]="coalition"`（`translator.py:866`）被改写** |
| L14 | `<Item identifier="organicfiber" />` | `<物品 标识符="有机纤维"/>` | **`identifier` 的值被改写**（`VAL_MAP: "有机纤维":"organicfiber"`，`translator.py:837`） |
| L16 | `name="Captain's Uniform 1 Icon"` | `名称="Captain's Uniform 1 Icon"` | 自由文本，无词典命中 ⇒ 原样 |
| L20 | `name="Captain's Uniform 1 Torso"` | `名称="Captain's Uniform 1 躯干"` | **自由文本被按词命中改写（Torso→躯干）** |
| L21 | `name="Captain's Uniform 1 Right Hand"` | `名称="Captain's Uniform 1 右 手"` | **自由文本被打碎并逐词替换**（Right→右、Hand→手），语义/可读性被破坏 |
| L19 | `msg="ItemMsgPickUpSelect"` | `消息="ItemMsgPickUpSelect"` | 属性名换，值原样 |
| L34-36 | `afflictionidentifiers="blunttrauma"` | `伤病标识符="钝器创伤"` | 值按词典改写（可逆，但见 §B7 的空格/大小写问题） |
| L40-42 | `<StatusEffect type="OnWearing" target="Character">` | `<状态效果 类型="穿戴时" 目标="角色">` | 值改写；注意输出属性名是**大写 `Type`**（`ATTR_MAP: "类型":"Type"`，`translator.py:168`） |

#### 大样例（根目录，1025 行）逐段

- `源.xml:1` 与 `输出.xml:1` 完全相同；`源.xml:3`、`源.xml:64-66`（三行注释）、`源.xml:133` … 等**共 36 行两边逐字相同，
  且全部是注释行或 XML 声明**（本次对齐 diff 结果）。`源.xml:64-66` 是多行中文注释块，输出里一字未动。
- `源.xml:2` `<覆盖>` → `输出.xml:2` `<Override>`（`TAG_MAP: "覆盖":"Override"`，`translator.py:6`）。
  **注意：它不跳过 `<Override>` 文件**（这一点与现有插件相反，见 §C）。
- `源.xml:4` 是典型条目：标签名 → `Item`，属性名全部还原，`多个标签="中型物品,武器,枪械,枪匠,可挂载武器,对人类AI挑衅"`
  → `tags="mediumitem,weapon,gun,gunsmith,mountableweapon,provocativetohumanai"`，`允许作为额外货物="真"` → `allowasextracargo="true"`。
- `源.xml:193` `<条件 实体类型="等于 结构"/>` → `输出.xml:193` `<Conditional entitytype="eq Structure"/>`：
  值被**按空格切成 token 后逐 token 词典替换**（`等于`→`eq`、`结构`→`Structure`）。
- `源.xml:749` `<贴图 名称="Nuclear 枪械 Worn" ...>`：**这一行是「上一轮英→中跑过」留下的污染痕迹**——
  内部名 `name` 里的 `Gun` 被换成了 `枪械`（`VAL_MAP: "枪械":"gun"`，`translator.py:712`），
  证明 A3 小样例 L21 的问题在真实工作流里已经发生。
- 全文件**没有任何元素文本节点**：对 1025 行做 `>\s*[^<>\s][^<>]*</` 检索命中 **0**；也无一处 CDATA。
- 大样例其实「没有可翻译的文本」——这本身最有力地说明：这个工具处理的是**结构名**，不是文本。

---

## B. 核心算法（重点）

### B1. 如何遍历 XML：lxml + 手写递归

- 解析：`etree.XMLParser(remove_blank_text=False, remove_comments=False)`（`translator.py:1080`、`fan_yi.py:91`）。
  两个开关的意思：**保留作者原始空白缩进**、**保留注释**。
- 序列化：`tree.write(dst, encoding="utf-8", xml_declaration=True, pretty_print=True)`（`translator.py:1083`、`fan_yi.py:94`）。
- 遍历：手写递归，`translate_element`（`translator.py:1055-1076`）/ `reverse_element`（`fan_yi.py:71-87`）：
  1. `if not isinstance(elem.tag, str): return`（`translator.py:1056-1057`、`fan_yi.py:72-73`）——
     **这是注释 / 处理指令的安全阀**：lxml 里注释节点的 `.tag` 是函数对象，直接跳过，不会被当标签改名。
  2. 改标签名 → 改属性名/属性值 → `elem.attrib.clear()` 后逐条 `elem.set()` 回填（`translator.py:1071-1073`、`fan_yi.py:82-84`）
     ——**不保留原属性顺序之外的信息**（Python dict 保序，实测顺序与输入一致）。
  3. `for child in elem: translate_element(child)`（`translator.py:1075-1076`、`fan_yi.py:86-87`）。
- 为什么这么选（可推断的合理性）：潜渊症 XML 深度浅、无命名空间、无混合内容，递归 + 全量重写最简单；
  而且**结构名替换必须改 tag 本身**，用正则改 XML 结构比用解析器危险得多。这个取舍本身是对的；
  代价在序列化保真（§B4）。
- 遗留：`import re`（`translator.py:1`）从未使用，说明作者原本可能想上正则，后来改成解析器。

### B2. 如何决定「什么该翻译」

**规则（严格版）：没有规则。** 具体表现：

- **元素**：`elem.tag = TAG_MAP.get(elem.tag, elem.tag)`（中→英，`translator.py:1059`）
  / `elem.tag = TAG_REV.get(t.lower(), t)`（英→中，`fan_yi.py:74-75`）。
  只要是字典里有的一律改，**不分上下文**：`<Item>` 出现在 `<Deconstruct>` 里（`打包前源码\源.xml:14`）与出现在顶层
  用的是同一个词。找不到的标签原样保留（`dict.get` 回退），所以「未覆盖的标签静默放过」。
- **属性名**：`ATTR_MAP`，查不到时**回退查 `VAL_MAP`**（`translator.py:1062-1068`；`fan_yi.py:23-31` 里是 ATTR_REV→VAL_REV）。
  这个回退是个补丁：说明有些中文属性名是从值词典借来的。
- **属性值**：`new_v = trans_value(v)`，**对每一个属性的每一个值无条件执行**（`translator.py:1069`、`fan_yi.py:80`）。
- **`name=""`**：值当普通字符串处理 → 空串什么也匹配不到，原样输出（`打包前源码\输出.xml:4` 的 `名称=""`）。
  **它完全不理解 `name=""` 的语义**（这正是现有插件 `entityname.*` 规则的核心，`l10n.ts:143-149`）。
- **`description=""`**：同上；样例里 `<描述>` 标签名会被改（`TAG_MAP: "描述":"Description"`，`translator.py:88`），
  但值不翻译。
- **注释**：`remove_comments=False`（`translator.py:1080`）→ 保留；递归时被 `isinstance` 挡掉（`translator.py:1056`）→ 内容不改。
  实测：`打包前源码\输出.xml:2-3`、根 `源.xml:64-66`、根 `源.xml:311`（元素内部的注释）全部原样。
- **文本节点**：**完全不处理**。`translate_element` 从第 1055 行到 1076 行没有任何 `elem.text` / `elem.tail` 读写。
  ⇒ CDATA、`{0}`、`%s`、`[GENDER]`、大小写、空白在文本层面「被保护」的唯一原因是**它们根本没被碰过**
  （实测：`<Description>Hello {0} &amp; %s [GENDER]</Description>` 原文输出）。
- **白名单/黑名单**：只存在于作者意图里。`VAL_ATTRS`（`translator.py:1004-1018`，13 个属性名）看起来就是
  「哪些属性的值才该按 `VAL_MAP` 翻译」的白名单——**但它在整个工程里从未被引用**（全目录检索只有 1004 行那一处）。
  真正的实现走的是「所有属性值都翻译」，白名单是死代码。

### B3. 占位符 / 标签 / 转义 / 大小写 / 空白的保护机制

| 项 | 是否保护 | 机制 |
| --- | --- | --- |
| 元素文本里的占位符 `{0}`/`%s`/`[GENDER]` | **事实上保护** | 文本节点根本不进翻译流程（`translator.py:1055-1076` 无 text 操作） |
| 属性值里的占位符/花括号 | **不保护** | 值被空格+`,`+`+` 切 token 后逐 token 查表（`translator.py:1020-1052`、`fan_yi.py:34-68`） |
| XML 标签本身 | 由解析器保护 | 不改字符串文本，改的是 DOM（`translator.py:1059`） |
| 转义字符 `&`/`<` | 由 lxml 自动处理 | 实测 `&amp;` 原样、`<` 在 CDATA 里被展开后正确转义为 `&lt;` |
| 大小写 | **不保护且会丢** | 见 §B7：反向表统一 `lower()`（`fan_yi.py:12`、`fan_yi.py:26-30`、`fan_yi.py:64`），英文原值大小写不可逆 |
| 空白 | 缩进/换行保留，**属性值内空白被归一** | 缩进靠 `remove_blank_text=False`；值内 `"a  b"` 会被 `split(" ")`/`" ".join()` 压成单空格（`translator.py:1040`、`1051`） |
| 分隔符 | 只认 `,` 和 `+` | `_split_value`（`translator.py:1020-1031`）其它分隔符（`;` `\|` `/`）整段当一个 token |

### B4. 如何避免破坏 XML：转义 / CDATA / 属性内文本 / 自闭合

- **转义**：安全。属性值与文本都由 lxml 输出器转义（实测 `name="Steel Right Hand &amp; Co"` 结构保持合法）。
- **CDATA：会被销毁**。默认 `strip_cdata=True`，两处 `XMLParser` 都没关它（`translator.py:1080`、`fan_yi.py:91`）。
  实测：`<Note><![CDATA[a < b & c]]></Note>` → `<Note>a &lt; b &amp; c</Note>`（语义等价、**写法丢失**）。
- **属性内文本**：**这就是被破坏的地方**。工具把 `name`/`tags`/`identifier` 等一切属性值都当可翻译内容（§B2、§B7）。
- **自闭合标签**：`... />` 被规范化成 `.../>`（`打包前源码\源.xml:5` → `输出.xml:5`），无害但会污染 diff。
- **缩进**：作者手写的缩进被保留（大样例两边都有 1016 个以 Tab 开头的行），但**压缩成一行的文件会被
  `pretty_print=True` 重新缩进**（实测 `<?xml...?><Items><Item .../></Items>` → 变成三行、2 空格缩进）。
- **BOM：会直接崩溃**。实测带 UTF-8 BOM 的输入 → `XMLSyntaxError: Start tag expected, '<' not found, line 1, column 1`，
  两处解析都没有编码/BOM 处理（`translator.py:1080`、`fan_yi.py:91`）。
  Windows 记事本「UTF-8 with BOM」是很常见的保存方式，这是个真实的可用性坑。
- **XML 声明**：`encoding='utf-8'` → 输出 `encoding='UTF-8'`（lxml 固定大小写），也会污染 diff。

### B5. 去重 / 缓存 / 增量：全都没有

- 没有翻译记忆（TM）、没有缓存文件、没有断点续跑、没有「已翻译跳过」。
- 每次都是 `parse → 全树改写 → write`（`translator.py:1079-1083`、`fan_yi.py:90-94`），**输出文件无条件覆盖**
  （`使用方法.txt:52`「输出.xml 每次都会被覆盖，需要保留就先改名」）。
- 也没有去重：同一术语在文件里出现 N 次就查 N 次表；重复的 `{中文名 → 英文名}` 冲突只能靠 dict 字面量顺序决定（§B7）。

### B6. 错误处理：没有

- 全工程 **0 个 `try`/`except`**（内容检索 `try:|except` 在 `translator.py` 无命中）。
- 后果：XML 不合法（`打包前源码` 里实测 `Opening and ending tag mismatch`）、带 BOM、文件缺失
  （`run.py:24-28` 只检查 `源.xml` 存在）、磁盘不可写——都会抛出未捕获异常。
  PyInstaller 打包的窗口程序在异常后通常直接关闭，用户看不到原因（**未确认 exe 是否另加了异常捕获层**）。
- **没有超时、限流概念**，因为没有任何外部调用。

### B7. 实测出的数据损坏（这部分是给现有插件的核心教训）

在 `%TEMP%\xltool` 里对同一份 XML 跑「英→中→英」往返，**证明不是无损**：

| 现象 | 最小复现（输入 → 英→中 → 中→英） | 机制 |
| --- | --- | --- |
| **标识符被改写** | `<Item identifier="organicfiber"/>` → `<物品 标识符="有机纤维"/>` → 回到 `organicfiber`（本例侥幸可逆） | `translator.py:1069` 无条件对值查表；`VAL_MAP:837` |
| **标识符被改写且不可逆（大小写）** | `<Item identifier="Right"/>` → `标识符="右"` → **`identifier="right"`** | `VAL_MAP:871 "右":"Right"` 与 `VAL_MAP:974 "右":"right"` 同键，后者覆盖前者；反向表又把 `Right/right` 归一成同一个中文（`fan_yi.py:12`） |
| **标识符被改写且不可逆（词形）** | `<Item identifier="item"/>` → `标识符="物品"` → **`identifier="Item"`** | `VAL_MAP:987 "物品":"Item"` 与 `ATTR_MAP:179 "物品":"items"` 撞车 |
| **自由文本属性被逐词蹂躏** | `<sprite name="Captain's Uniform 1 Right Hand" .../>` → `名称="Captain's Uniform 1 右 手"` → **`name="Captain's Uniform 1 right Hand"`** | 值按空格切 token 查表（`fan_yi.py:55-67`） |
| **逗号列表值被污染** | `<Item identifier="steel" tags="steel,Right"/>` → `标识符="钢" 多个标签="钢,右"` → `identifier="steel" tags="steel,right"`（本例 identifier 侥幸可逆，`tags` 的 `Right` 变 `right` 不可逆） | 同上 + 大小写归一 |
| **枚举大小写被改** | `tags="and,or"` → `多个标签="且,或"` → **`tags="And,Or"`** | `VAL_MAP:648 "且":"And"` vs `650 "与":"and"`；`649 "或":"Or"` vs `651 "或非":"OR"` |
| **标签大小写被规范化** | `<sprite ...>` → `<贴图 ...>` → **`<Sprite ...>`** | `TAG_MAP:19 "贴图":"Sprite"`；反向表 `fan_yi.py:75` 用 `lower()` 查，丢失 `sprite`/`Sprite` 区别 |

词典自身的静态问题（用脚本对字面量做的统计）：

- `TAG_MAP`：112 个键，无重复。
- `ATTR_MAP`：520 个字面量、517 个唯一键，重复键 3 个：
  `目标肢体`（`:193` targetlimb / `:601` targetlimbs）、`乘以最大活力`（`:307`/`:452`，值相同）、
  `最大角度`（`:405`/`:518`，值相同）——Python 字面量**后者覆盖前者**，所以 `目标肢体` 实际永远翻成 `targetlimbs`。
- `ATTR_MAP` 值撞车：`危险`:254 → `isdangerous` 与 `危险状态`:314 → `IsDangerous`；反向表（`fan_yi.py:12-14` 首次命中优先）
  会让 `IsDangerous` 也翻成 `危险`。
- `VAL_MAP`：355 个字面量、352 个唯一键，重复键：`烫伤`（`:730`/`:768`，值相同）、
  `右`（`:871` Right / `:974` right）、`近战攻击速度`（`:880`/`:883`），并含上述 `且/与`、`或/或非` 撞车。
- 反向表规模：`TAG_REV` 112 / `ATTR_REV` 516 / `VAL_REV` 350（`fan_yi.py:18-20`）——
  **比正向表小**，即已经存在「正向能查、反向查不到」的条目。

**结论**：`identifier`、`tags`、`name`、`file`、`texture`、`msg` 这些**自由文本 / 大小写敏感 / 用逗号列表**的属性值，
必须排除在任何值替换之外——这正是 `VAL_ATTRS`（`translator.py:1004-1018`）本该做的事，但它没接线。

---

## C. 与现有插件 `dsh-tool-barotrauma` 的对比

对照文件：`E:\Desktop\001\_barotrauma_tool\src\l10n.ts`（扫描/写入本地化键）、`src\pack-io.ts`（文件写入）。

### C1. 定位差异（根本性的）

| 维度 | 渊深 XML 翻译工具 | 现有插件 |
| --- | --- | --- |
| 处理对象 | **XML 结构名**（标签名/属性名/部分属性值） | **游戏文本键**（`entityname.*` 等）与语言文件 |
| 产物 | 一份「中英结构名互换」的 XML | `<infotexts>` 语言文件（`l10n.ts:69-80` 解析、`pack-io.ts:199-224` 追加） |
| 是否动别人的 XML | 全量重写 | 只**追加**语言条目，内容 XML 只读（`pack-io.ts:221` 字符串切片拼接） |
| 译文来源 | 内置词典（结构名） | **只接受调用方传入**，绝不自动编造（`l10n.ts:13-14`、`509-511`） |
| 玩家可见文本 | 完全不管 | 正是它管的（`name=""` → `entityname.*`，`l10n.ts:143-149`） |

### C2. 它有什么是现有插件没有的

1. **一份成规模、可复用的双语术语表**：112 标签 + 517 属性名 + 352 枚举值（`translator.py:5-1001`），
   且**双向**（`fan_yi.py:7-20` 由正向表自动生成反向表）。现有插件**没有任何术语来源**，
   译文完全靠模型即兴发挥，跨文件一致性无从保证。
2. **双向一致性校验的思想**：把「中→英」当权威，反向表自动派生（比手写两份表可靠）。
   现有插件没有这类自检，`scanEntries`（`l10n.ts:110-193`）只有单向识别。
3. **`<Conditional>` 枚举值的枚举清单**：`VAL_MAP:658-663` 的 `等于/不等于/小于/小于等于/大于/大于等于` → `eq/neq/lt/lte/gt/gte`，
   以及 `VAL_MAP:660-668` 的 `OnWearing/OnContained/OnFailure/...` 事件枚举。
   现有插件不解析这些（它不需要），但插件在做 `barotrauma_validate` 类校验时可用（DSH 侧 `validate` 工具说明里已提到
   `comparison` 取值校验）。
4. **注释友好**：明确 `remove_comments=False` 保注释（`translator.py:1080`），并实测注释块（含多行块、元素内注释）零损伤。
   现有插件的正则扫描天然不看注释，但**也没有把注释当成证据**（作者的 `<!--[id] 中文名 -->` 注释其实是
   极好的「英语原文 ↔ 中文译名」对照语料，见 §D）。
5. **`<Override>` 不跳过的对照样本**：它把 `<覆盖>` 翻成 `<Override>`（根 `源.xml:2`）；
   现有插件反而用 `isOverrideRoot`（`l10n.ts:89-95`）+ `l10n.ts:134` 跳过整份文件——这是现有的**正确**决定，不必学。

### C3. 现有插件有什么是它没有的

1. **本地化键语义**：`entityname/entitydescription/afflictionname/afflictiondescription/character/eventtext`
   （`l10n.ts:5-11`、`143-189`）。翻译工具连「键」这个概念都没有。
2. **`<override>` 文件跳过**（`l10n.ts:89-95`、`134`）。
3. **`name="非空"` 跳过**（硬编码显示名，`l10n.ts:108`）。
4. **把「没写 name 属性」单独列为 implicit 缺口**，且只在语言文件里也没有该键时才报（`l10n.ts:102-103`、`341-347`）。
5. **跨语言键比对 + 大小写不敏感**（`l10n.ts:69-80`、`329`、`331`），键字符集放宽到 `[^\s<>/]+`（`l10n.ts:64-65`、`72`）。
6. **按内容识别语言文件**（根元素是 `<infotexts>`），不依赖 filelist 登记（`l10n.ts:198-217`）。
7. **不覆盖已有译文**（`l10n.ts:481-497`、`pack-io.ts:215-218`）——**增量/保护已有的对等物**，翻译工具完全没有。
8. **写入侧的格式保真**：字符串切片插入而非 DOM 重写（`pack-io.ts:207-222`），因此不会像翻译工具那样
   改 XML 声明、吃自闭合空格、毁 CDATA、被 BOM 干崩。

### C4. 「识别待翻译键」规则的实质差异

- 翻译工具**没有「待翻译清单」概念**：它对每个元素无条件做 `TAG_MAP.get(tag, tag)`（`translator.py:1059`），
  命中即改、未命中静默放过。**它是「改写语法」的，不是「识别缺口」的。**
- 现有插件的规则是**声明式缺口识别**，且每条都有 reason（`l10n.ts:46-58`）：
  `name=""`→`name-attribute`；无 `name` 属性且有定义特征→`implicit`；`<Affliction maxstrength=>`→定义；
  `<Character SpeciesName=>` 且无 `DisplayName`/`SpeciesTranslationOverride`→`always`；`eventtext.*` 引用→`referenced`。
- 分类交集：翻译工具会碰 `<Affliction>` 的属性名（`ATTR_MAP: "最大强度":"maxstrength"`，`translator.py:538`），
  但**不会新增任何 `afflictionname.*` 键**；会改 `<Character>` 里的属性名（如 `物种名`，`translator.py:471`），
  但**不知道 `character.<SpeciesName>` 这个键存在**。
- 分类差集：翻译工具独有「把 `<Item>` 本身改成 `<物品>`」这类**语法级**改写；现有插件独有
  「判断这个实体到底需不需要一条本地化键」。
- **两者互补：翻译工具的词典可以直接喂给现有插件的翻译流程当「术语提示」，而不会违反「不编造译文」原则。**

---

## D. 可以采纳的改进（按价值排序，给实现级细节）

### 第一类：纯本地逻辑（可以采纳）

**D1. 把 `TAG_MAP/ATTR_MAP/VAL_MAP` 抽取成随插件发布的「潜渊症术语表」数据文件（价值最高）**

- 采纳什么：`translator.py:5-1001` 这 981 条**已由真实游戏 XML 校验过**的中英对照
  （作者自述覆盖「物品/状态/药物/武器」，`使用方法.txt:58`）。
- 为什么：现有插件的设计原则是「不自己编译文」，但**提供术语候选**不违反它——它只是给模型的提示，
  最终仍由调用方（模型/人）决定写什么，能显著提升 `barotrauma_translate` 跨文件一致性
  （避免同一 `gunshotwound` 在一处译「枪伤」一处译「枪弹伤」）。
- 具体怎么改：
  1. 新建 `_barotrauma_tool\src\glossary.ts`，导出
     `GLOSSARY: { tags: Record<string,string>; attributes: Record<string,string>; values: Record<string,string> }`，
     数据源即三张表（建议用脚本从 `translator.py` 生成一次，保留 `zh→en` 权威方向）。
  2. `barotrauma_scan_l10n` 输出里对每条 `entityname.<id>` 附带 `hints: string[]`：
     用 `id` 去 `GLOSSARY.values` 反查（现有插件已有「按 identifier 找词」的位置：`l10n.ts:141`）。
  3. 新增只读工具 `barotrauma_lookup_term`（参数 `term`，返回 `{ en, zh, kind }`），
     供模型在翻译前查词；**工具只返回候选，不写文件**，与 `l10n.ts:13-14` 原则一致。
  4. 边界：词典来自 1.13.x 时代（`使用方法.txt:57` 声明版本 1.0.0），**必须标注「可能过时」**，
     并允许同义词并存（`烫伤/burn` 出现两次，`:730`/`:768`）。
- 风险控制：不要把词典当「自动翻译」用；把它当「术语建议 + 校验用参考词表」。

**D2. 用 `<Override>`：不，反过来——把「不写字段」的教训固化成允许清单**

- 采纳什么：`VAL_ATTRS`（`translator.py:1004-1018`）的**设计意图**——只有白名单属性才允许基于词典改值。
- 为什么：实测证明「无条件改值」会毁 `identifier`/`name`/`tags`（§B7）。任何未来的值改写功能都必须走白名单。
- 具体怎么改：在 `glossary.ts` 里定义 `VALUE_TRANSLATABLE_ATTRS = new Set(['category','tags','impactsoundtag','slots','msg'...])`
  并配 `NEVER_TOUCH_ATTRS = new Set(['identifier','name','texture','file','sourcerect','origin','targets','afflictionidentifiers'])`；
  在将来任何值处理函数的第一行做 `if (NEVER_TOUCH_ATTRS.has(attr.toLowerCase())) return value`。
  现有插件目前不写内容 XML，所以这条实际是**防未来回归的护栏**，成本极低。

**D3. 学它的「反向表自动派生 + 启动自检」，但升级为「禁止有损反向」**

- 采纳什么：`fan_yi.build_reverse`（`fan_yi.py:7-15`）由正向表自动生成反向表，保证两个方向不漂移。
- 为什么：手写双向表必然漂移；自动派生是正确方向，但它的实现有 bug（`lower()` 归一 + 首命中优先，
  实测丢 `Right→right`、`and→And`）。
- 具体怎么改：若采纳 D1 的词典，加一个构建期断言：
  `<EN, 大小写敏感> 必须唯一`，否则报错并列出冲突（把 §B7 的三类冲突挡在构建期）。
  实现为 `buildGlossary()` 里的 `Map<string,string>` + 冲突收集，测试里断言冲突集为空。

**D4. 把「注释里的中文名」当成翻译语料**

- 采纳什么：样例作者用 `<!--[identifier] 中文名 -->` 标注物品（根 `源.xml:3`、`:64-66`、`:133`、`:174`…，
  本次统计 `<!--[id]` 形式共 **25 处**）。
- 为什么：这是**人工确认过的高质量 中文名↔identifier 对照**，比模型直译可靠。
- 具体怎么改：在 `scanEntries`（`l10n.ts:110-193`）里加一条正则
  `/<!--\s*\[([A-Za-z0-9_]+)\]\s*([^>\n]+?)\s*-->/g`，
  命中后把 `entityname.<id>` 的 hint 置为该中文名，reason 记为新的 `'comment'`（`L10nEntry['reason']` 联合类型加一项，`l10n.ts:57`）。
  **仍然只当提示**：`barotrauma_translate` 不自动写入（保持 `l10n.ts:492-496` 的空译文跳过逻辑）。
  边界：注释可能标注的是「旧译名/错的」，所以必须在输出里标 reason 来源。

**D5. 学它的「多分隔符切分」**：`_split_value` 同时切 `,` 与 `+`（`translator.py:1020-1031`）。
现有插件若要给 `tags` 做提示，需要同样的切分，否则 `RightHand+LeftHand`（`打包前源码\输出.xml:19` 对应原文 `slots`）会被当成一个词。

### 第二类：需要外部服务/模型（要谨慎）

**D6. 无。** 本工具**没有**任何机器翻译 / API 调用能力（§A2 已证：源码无网络库、exe 无任何外部域名、无 key）。
因此**不存在与「绝不自动编造译文」原则冲突的现成能力**，也没有需要在 §D 里单独标注的接口形态。

如果要引入「机器翻译预填」，那是**新功能**而不是「采纳本工具」：形态上应是
「`barotrauma_translate` 收到 `translations` 时才写」+ 新增一个**可选**的 `suggest` 通道，
且必须默认关闭、明确标注译文来源是机器、并保留 `l10n.ts:13-14` 的手工复核流程。**需用户决定，本文不推荐。**

---

## E. 安全

### E1. 凭据

- **源码里没有任何凭据、API key 或 token。** `translator.py`/`fan_yi.py`/`run.py` 全文仅有 `sys/os/re/lxml` 与三段词典
  （`translator.py:1-2`、`fan_yi.py:1-4`、`run.py:1-7`）。
- exe 字节扫描：`api_key/apikey/API_KEY/Bearer /Authorization/openai/anthropic/deepseek` 命中数均为 **0**；
  唯一 URL 为 `http://schemas.microsoft.com`（PyInstaller manifest 命名空间）。
  扫描中 `sk-` 命中 **1 次**，位于 exe 偏移 **4533503** 附近的**随机二进制字节**（前后是不可打印字节，不构成 key 形态），
  判定为**误报**，非凭据。按交付要求：此处只报告存在性与位置，不摘录值。

### E2. 危险行为

| 行为 | 是否存在 | 证据 |
| --- | --- | --- |
| 删除文件 / 目录 | 否 | 无 `os.remove`/`shutil.rmtree`/`removedirs`（源码无 `shutil` 导入，`translator.py:1-2`） |
| 写注册表 / 提权 | 否 | 无 `winreg`，无 shell 调用 |
| 上传用户文件到外部 | 否 | 无任何网络代码（§A2） |
| 覆盖用户文件 | **是（唯一风险）** | `run.py:29`/`run.py:39` 固定写 `输出.xml`；`使用方法.txt:52` 明说「每次都会被覆盖」 |
| 读取范围 | 仅当前工作目录的 `源.xml` | `run.py:24`/`34` 用相对路径 |

补充说明：

- 「覆盖 `输出.xml`」在工具自身语境下是可接受的（自己声明了），但**没有备份/没有 `--dry-run`/没有确认提示**；
  如果用户不小心在别的目录双击运行、而那个目录恰好有 `输出.xml`，会被静默覆盖。
- 15 MB exe = 打包了 CPython + lxml；**本次只做字符串扫描，未反编译**，因此
  「exe 内部除源码之外是否有额外行为」**未确认**（例如第三方库的其他能力）。
  用 PyInstaller 打包本身就意味着 exe 体积大、启动慢、且杀软可能误报，这对「一个只做文本替换的小工具」是过度包装。

---

## F. 给现有插件的改进清单（按优先级）

| # | 改进 | 一句话价值 | 一句话实现要点 |
| --- | --- | --- | --- |
| 1 | 引入术语表 + `barotrauma_lookup_term` 只读工具 | 让模型翻译跨文件一致（`gunshotwound` 永远「枪伤」），不违反「不编造译文」 | 从 `translator.py:5-1001` 生成 `src\glossary.ts`，工具只返回候选、不写盘 |
| 2 | 把 `scan_l10n` 的每条 key 附上 `hints` | 模型拿到的是「键 + 候选译名」，而不是空手翻 | 用 identifier 反查术语表，复用 `l10n.ts:141` 的 identifier 抽取位置 |
| 3 | 解析 `<!--[id] 中文名 -->` 注释当人工语料 | 白捡一批人工确认过的译名，质量高于模型直译 | `l10n.ts:110-193` 内加正则，`reason` 增加 `'comment'` 并标注来源 |
| 4 | 构建期断言术语表「英文值大小写敏感唯一」 | 提前挡掉反向表丢大小写的一整类 bug | 生成 glossary 时收集撞车并抛错，测试断言为空 |
| 5 | 定义 `NEVER_TOUCH_ATTRS` 护栏常量 | 防未来任何「改值」功能重演 `identifier="Right"→"right"` 事故 | 新常量 + 单测（示例：`Right/right`、`item/Item`、`and/And`） |
| 6 | 文档化「不要用 XML 序列化器往返用户 XML」 | 保住现在的字符串切片写入优势 | 把本文件 §B4（注释保留、但自闭合空格/CDATA/BOM 崩溃）写进 `refs/reference.md` 的对照结论 |
| 7 | 语言文件写入前做 BOM 兼容读取 | 编辑器存的 BOM 文件不再静默漏键 | `readTextSafe`/`parseLanguageKeys` 入口先 `replace(/^\uFEFF/,'')`（`l10n.ts:69-80` 的键解析尤其敏感） |

> 前 3 条是「直接提升翻译产出质量」，第 4-5 条是「防回归护栏」，第 6-7 条是「低成本稳健性」。

---

## 附：本次分析的证据获取方式（可复现）

```text
只读读取：打包前源码\{run.py,fan_yi.py,translator.py,源.xml,输出.xml}、{使用方法.txt}、
          根目录\{源.xml,输出.xml}、src\l10n.ts、src\pack-io.ts
复现运行：用本机 bundled python (lxml 6.1.3) 在 %TEMP%\xltool 下调用
          translator.translate_file / fan_yi.reverse_file，输入均为被分析目录下的样例
          ⇒ 0 差异复现两份样例；往返测试、边界测试（BOM/CDATA/压缩 XML/纯文本节点）均为实测
exe 检查：UTF-8/ASCII 字节级字符串扫描（未反编译）
未做：未修改任何被读取的文件；未反编译 exe；未联网
未确认：exe 内部与源码是否逐行一致（PyInstaller 归档为压缩态，源码中文串在 exe 中不可见）
```
