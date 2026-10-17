/**
 * dsh-tool-barotrauma — 阶段五之一：校验（`barotrauma_validate`）。
 *
 * 检查项（每一项都对应一个会让 mod 在游戏里静默失效的真实原因）：
 *   1. `filelist.xml` 存在、有 `name`、每条 `file` 记录指向的文件真实存在；
 *   2. 登记的 XML **结构性良构**（标签闭合、属性引号成对）—— 自带检查器，不依赖外部解析器；
 *   3. 物品 `identifier` 重复（**撞 identifier 会让整个 mod 被游戏禁用**，官方 Troubleshooting 页）；
 *   4. `%ModDir%/…` 引用的贴图/音效文件缺失；`Content/…` 原版引用是否真实存在；
 *   5. `name=""` 的实体缺本地化键（**大小写不敏感**、**按内容识别语言文件**）；
 *   6. 实体**压根没有 name 属性**（游戏退回显示 identifier，只影响显示名，记 minor）；
 *   7. mod 里存在但没登记进 filelist 的 XML —— **排除**硬编码目录与通过 `folder=` / `path=`
 *      属性按目录加载的文件（Ragdolls / Animations / Names 等）；
 *   8. `<conditional>` 语义：关系运算符是否合法、`comparison` 取值是否合法（照引擎实测写法）；
 *   9. 语言文件结构：重复键、空文本。
 *
 * 针对真实 mod 反馈的三类**误报**专门做了处理（都会附在代码注释里说明原因）：
 *   - **资源路径不能按空白切分**：文件名里有空格（`Sounds/雪叶子 - 天街桜.ogg`）会被截断 →
 *     改成按属性值解析、按「下一个路径起点」划界；
 *   - **语言文件按内容识别**：真实 mod 里语言文件也用 `<Other>` 注册过，
 *     只认 filelist 的 `<Text>` 会漏掉整个文件、导致其所有键被误报为缺失；
 *   - **键名比较统一小写**：游戏侧 XML 元素/属性名大小写不敏感。
 *
 * 说明：第 2 项是**结构检查**而不是完整 XML 解析器。它足以抓出真实的语法破坏
 * （少了 `/>`、标签没闭、引号不成对），但不做 DTD/命名空间语义校验。
 * @module dsh-tool-barotrauma/validate
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import { basename, dirname, join, resolve } from 'node:path'
import type { BarotraumaPluginConfig } from './config.js'
import { listModXmlFiles, readFilelist } from './pack-io.js'
import { parseLanguageKeys, scanEntries } from './l10n.js'
import { ATTR_INDEX, buildNameIndex, checkName, TAG_INDEX, VALUE_ATTR_INDEX, VALUE_INDEX } from './names.js'
import { CONTENT_TYPES, CONTENT_TYPES_LOWER } from './xml.js'
import {
  ITEM_CATEGORIES,
  ITEM_CATEGORIES_LOWER,
  STATUS_EFFECT_TARGETS,
  STATUS_EFFECT_TARGETS_LOWER,
  STATUS_EFFECT_TYPES,
  STATUS_EFFECT_TYPES_LOWER,
} from './schemas.js'
import { COMPONENT_NAMES, COMPONENT_NAMES_LOWER } from './components.js'
import { VOCABULARY_SIZE } from './vocabulary.js'
import { KNOWN_TAGS_VANILLA, VANILLA_NAME_STATS } from './known-names.js'
import {
  asBoolean,
  asString,
  BarotraumaError,
  collectAssetReferences,
  listDirs,
  pathExists,
  readTextSafe,
  registerTool,
  writeFileEnsured,
} from './util.js'

type Severity = 'blocker' | 'major' | 'minor'

/** 一条校验问题。 */
interface Issue {
  severity: Severity
  code: string
  message: string
  file: string
}

/** 去掉 XML 注释与 CDATA，避免注释里的内容被当成真实引用。 */
function stripComments(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
}

/** 解析一段属性串。 */
function parseAttrs(input: string): Array<[string, string]> {
  const out: Array<[string, string]> = []
  const pattern = /([A-Za-z_][\w.:-]*)\s*=\s*"([^"]*)"/g
  let match = pattern.exec(input)
  while (match !== null) {
    out.push([match[1] ?? '', match[2] ?? ''])
    match = pattern.exec(input)
  }
  return out
}

/**
 * 硬编码目录/文件：里面的东西**不需要**（也不应该）登记进 filelist。
 * 把这些当成「漏登记」是纯误报。
 *
 * ⚠️ 这里**不再整片豁免** `config/` 与 `assets/`：
 * 官方文档确认 `Config` 不是内容类型，LuaCs 的 `Config/` / `Assets/` 是由
 * `ModConfig.xml` **声明式**加载的 —— 所以只有**存在 ModConfig.xml 时**才豁免，
 * 见下面的 `MODCONFIG_DECLARED`。
 *
 * 注意：`Localization/` **不在**这个名单里 —— 语言文件同样要登记
 * （`<Text>` 或 `<Other>`）才会被加载，漏登记就是真问题。
 */
const NO_REGISTRATION_NEEDED =
  /^(lua\/|csharp\/|bin\/|publish\/|dist\/|validation-report\.md$|plan\.json$|previewimage\.png$|modconfig\.xml$|runconfig\.xml$|assets\/content\/modconfig\.xml$)/i

/** 存在 `ModConfig.xml` 时，这些前缀下的文件由它声明加载，无需 filelist 登记。 */
const MODCONFIG_DECLARED = /^(config\/|assets\/)/i

/** 官方内容类型索引（用于给写错的 filelist 子元素名提建议）。 */
const CONTENT_TYPE_INDEX = buildNameIndex(CONTENT_TYPES)

/** StatusEffect 类型索引（用于给写错的 type 提建议）。 */
const STATUS_EFFECT_TYPE_INDEX = buildNameIndex(STATUS_EFFECT_TYPES)

/** 物品组件名索引（用于识别拼错的组件元素名）。 */
const COMPONENT_INDEX = buildNameIndex(COMPONENT_NAMES)

/** 原版元素名的 lower 集合（判定"这是真实元素名，不是拼错的组件"）。 */
const KNOWN_TAGS_VANILLA_LOWER: ReadonlySet<string> = new Set(
  [...KNOWN_TAGS_VANILLA].map((v) => v.toLowerCase()),
)

/**
 * 官方**封闭枚举**校验 —— 这类检查是**精确**的，不依赖"编辑距离相似"的猜测：
 * 取值不在官方名单里就是错的，不需要启发式。
 *
 * 依据：`refs/barodoc-remaining.md`（官方文档逐条摘录）的 B 节机读清单 +
 * `/ContentTypes/Item.html` 的 `category` 闭集。
 *
 * 覆盖：
 *   - `<StatusEffect type="…">` —— 官方 27 种；写错 → 该状态效果**不会触发**
 *   - `<StatusEffect target="…">` —— 官方 12 种（可逗号组合）
 *   - `<Item category="…">` —— 官方 12 种；影响商店与编辑器归类
 */
function checkClosedEnums(raw: string, file: string): Issue[] {
  const issues: Issue[] = []
  const seen = new Set<string>()
  const push = (issue: Issue, key: string): void => {
    if (seen.has(key) || seen.size >= 10) return
    seen.add(key)
    issues.push(issue)
  }

  for (const match of raw.matchAll(/<StatusEffect\b([^>]*)>/gi)) {
    const attrs = match[1] ?? ''
    const type = (/\btype\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? '').trim()
    if (type !== '' && !STATUS_EFFECT_TYPES_LOWER.has(type.toLowerCase())) {
      const suggestion = checkName(type, STATUS_EFFECT_TYPE_INDEX)
      push({
        severity: 'major',
        code: 'STATUSEFFECT_BAD_TYPE',
        message: `<StatusEffect type="${type}"> 不是官方 StatusEffect 类型（官方共 ${STATUS_EFFECT_TYPES.length} 种）${suggestion.suggestion !== null ? `，最接近的是 "${suggestion.suggestion}"` : ''} —— 该状态效果不会触发`,
        file,
      }, `st:${type.toLowerCase()}`)
    }
    const target = (/\btarget\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? '').trim()
    if (target !== '') {
      for (const token of target.split(',')) {
        const value = token.trim()
        if (value === '' || STATUS_EFFECT_TARGETS_LOWER.has(value.toLowerCase())) continue
        push({
          severity: 'major',
          code: 'STATUSEFFECT_BAD_TARGET',
          message: `<StatusEffect target="${target}"> 里的 "${value}" 不是官方 target 取值（官方 ${STATUS_EFFECT_TARGETS.length} 种：${STATUS_EFFECT_TARGETS.join(' / ')}）`,
          file,
        }, `stt:${value.toLowerCase()}`)
      }
    }
  }

  for (const match of raw.matchAll(/<Item\b([^>]*)>/gi)) {
    const category = (/\bcategory\s*=\s*"([^"]*)"/i.exec(match[1] ?? '')?.[1] ?? '').trim()
    if (category === '') continue
    for (const token of category.split(',')) {
      const value = token.trim()
      if (value === '' || ITEM_CATEGORIES_LOWER.has(value.toLowerCase())) continue
      push({
        severity: 'minor',
        code: 'ITEM_BAD_CATEGORY',
        message: `<Item category="${category}"> 里的 "${value}" 不是已知 category 取值（已知 ${ITEM_CATEGORIES.length} 种：${ITEM_CATEGORIES.join(' / ')}）—— category 影响商店与编辑器归类；mod 自造分类是允许的，所以记为 minor`,
        file,
      }, `cat:${value.toLowerCase()}`)
    }
  }

  return issues
}

/**
 * 引擎**按固定子目录名**读取、不需要 filelist 登记的目录。
 *
 * 取证：`WarhammerCreature/Characters/MudraptorLegacy/MudraptorLegacy.xml` 里写的是
 * `<ragdolls />` / `<animations />` —— **没有 folder 属性**，引擎直接读 XML 旁边的
 * `Ragdolls/`、`Animations/` 目录。`<names />` 同理读 `Names/`。
 * （filelist 实测的 28 种内容标签里没有 Ragdoll / Animation / Names，因此这类 XML 永远不会被登记。）
 */
const CONVENTION_DIR_PATTERN = /(^|\/)(ragdolls|animations|names)(\/|$)/i

/** 路径规范化：统一正斜杠、去前导 `./` 与尾随 `/`、转小写。 */
function normalizeRel(input: string): string {
  return input
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+$/, '')
    .toLowerCase()
}

/** `file` 是否落在目录 `dir` 之下（自身相等也算）。 */
function isUnder(file: string, dir: string): boolean {
  return file === dir || file.startsWith(`${dir}/`)
}

/**
 * 收集「按 `folder=` / `path=` 属性加载」的目录与文件。
 *
 * 这些是引擎按路径/目录直接读的（`<ragdolls folder=…>`、`<animations folder=…>`、`<names path=…>`），
 * 本就不进 filelist，所以不能报「漏登记」。
 * 值可能相对 `%ModDir%` 根，也可能相对该 XML 所在目录 —— 两种都算。
 */
function collectConventionPaths(raw: string, file: string): { dirs: string[]; files: string[] } {
  const dirs: string[] = []
  const files: string[] = []
  const baseDir = dirname(file.replace(/\\/g, '/'))
  for (const [name, value] of parseAttrs(raw)) {
    const attribute = name.toLowerCase()
    if (attribute !== 'folder' && attribute !== 'path') continue
    const trimmed = value.trim()
    if (trimmed === '') continue
    const candidates: string[] = []
    if (/^%ModDir%\//i.test(trimmed)) {
      candidates.push(trimmed.replace(/^%ModDir%\//i, ''))
    } else {
      candidates.push(trimmed)
      if (baseDir !== '.' && baseDir !== '') candidates.push(`${baseDir}/${trimmed}`)
    }
    for (const candidate of candidates) {
      const normalized = normalizeRel(candidate)
      if (normalized === '') continue
      if (/\.[A-Za-z0-9]{1,6}$/.test(normalized)) files.push(normalized)
      else dirs.push(normalized)
    }
  }
  return { dirs, files }
}

/**
 * 轻量 XML 结构检查。
 * 处理：XML 声明、注释、CDATA、自闭合标签、嵌套闭合匹配、属性引号成对。
 */
function checkXmlStructure(raw: string, file: string): Issue[] {
  const issues: Issue[] = []
  const stripped = stripComments(raw)

  const stack: string[] = []
  let rootCount = 0
  const tagPattern = /<(\/?)([A-Za-z_][\w.:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g
  let match = tagPattern.exec(stripped)
  let consumed = 0
  while (match !== null) {
    consumed = tagPattern.lastIndex
    const closing = match[1] === '/'
    const tagName = match[2]
    const attrs = match[3] ?? ''
    const selfClosing = match[4] === '/'
    if (tagName === undefined) {
      match = tagPattern.exec(stripped)
      continue
    }
    const quotes = (attrs.match(/"/g) ?? []).length
    if (quotes % 2 !== 0) {
      issues.push({
        severity: 'blocker',
        code: 'XML_UNBALANCED_QUOTES',
        message: `<${tagName}> 的属性引号不成对（出现 ${quotes} 个 "）`,
        file,
      })
    }
    // 官方 XML 页的硬约束之一：同一个标签里不能有同名属性（后者静默覆盖前者）。
    // 大小写不同的"同名"（如 `Texture` 与 `texture`）严格 XML 允许，但游戏侧名称不敏感 → 等于重复。
    const seenAttrs = new Map<string, string>()
    for (const [attrName] of parseAttrs(attrs)) {
      const key = attrName.toLowerCase()
      const previous = seenAttrs.get(key)
      if (previous !== undefined) {
        const caseOnly = previous !== attrName
        issues.push({
          severity: caseOnly ? 'major' : 'blocker',
          code: 'XML_DUPLICATE_ATTRIBUTE',
          message: caseOnly
            ? `<${tagName}> 里出现了大小写不同的同名属性 ${previous} / ${attrName} —— 严格 XML 允许，但游戏侧名称不敏感，等于重复，谁生效不确定`
            : `<${tagName}> 里属性 ${attrName} 出现了两次 —— XML 不允许同名属性，后者会静默覆盖前者`,
          file,
        })
      }
      if (previous === undefined) seenAttrs.set(key, attrName)
    }
    // 官方 XML 页的硬约束之二：一个 XML 只能有一个根元素
    if (!closing && stack.length === 0) {
      rootCount += 1
      if (rootCount === 2) {
        issues.push({
          severity: 'blocker',
          code: 'XML_MULTIPLE_ROOTS',
          message: `出现第二个顶层元素 <${tagName}> —— 一个 XML 文件只能有一个根元素`,
          file,
        })
      }
    }
    if (closing) {
      const expected = stack.pop()
      if (expected === undefined) {
        issues.push({ severity: 'blocker', code: 'XML_STRAY_CLOSE', message: `多余的结束标签 </${tagName}>`, file })
      } else if (expected.toLowerCase() !== tagName.toLowerCase()) {
        issues.push({
          severity: 'blocker',
          code: 'XML_TAG_MISMATCH',
          message: `标签不匹配：<${expected}> 被 </${tagName}> 关闭`,
          file,
        })
      }
    } else if (!selfClosing) {
      stack.push(tagName)
    }
    match = tagPattern.exec(stripped)
  }

  const leftover = stripped.slice(consumed)
  if (leftover.includes('<')) {
    issues.push({ severity: 'blocker', code: 'XML_UNPARSED', message: '存在无法解析的 `<`（标签写法有误）', file })
  }
  if (stack.length > 0) {
    issues.push({
      severity: 'blocker',
      code: 'XML_UNCLOSED',
      message: `以下标签没有关闭：${stack.slice(0, 6).join(', ')}${stack.length > 6 ? ` … 共 ${stack.length} 个` : ''}`,
      file,
    })
  }
  return issues
}

/** XML 标签扫描：一次拿到元素名与属性串。 */
const TAG_SCAN = /<([^\s<>/"'=?!]+)((?:"[^"]*"|'[^']*'|[^>"'])*?)\/?>/g

/**
 * 名称拼写检查（依赖社区词表，见 `vocabulary.ts`）。
 *
 * 潜渊症对**拼错的属性名通常静默忽略** —— 写错一个属性，游戏不报错，
 * 只是那个功能悄悄不生效，这是最难排查的一类 bug。
 *
 * **只查属性名与部分枚举取值，不查元素名**（实测校准结论）：
 *   - 元素名在本作里高度自由 —— 物品/角色的元素名就是 prefab 名（`<Bandage>`、`<Heads>`），
 *     语言文件里的"元素名"更是本地化键（`<afflictionname.x>`）。拿词表核对只会刷误报。
 *   - `<conditional>` 的属性名是「目标对象属性 / affliction 标识符」，也是自由命名 → 跳过。
 *   - `tags` 的值是自由标签（官方 Item 页：a list of strings used to group items）→ 跳过。
 *   - 属性名收「出现 ≥1 次」的原版属性做基准（用 ≥2 会把 `skincolors` 这类稀有但真实的属性漏掉）。
 */
function checkXmlNames(raw: string, file: string): Issue[] {
  const issues: Issue[] = []
  const reported = new Set<string>()
  const push = (issue: Issue, key: string): void => {
    if (reported.has(key) || reported.size >= 12) return
    reported.add(key)
    issues.push(issue)
  }

  for (const tag of raw.matchAll(TAG_SCAN)) {
    const element = tag[1] ?? ''
    const lower = element.toLowerCase()
    // 物品组件名拼写：官方只有 85 个组件名（封闭清单），拼错 = 该组件整块不生效。
    // 精度关键：**先排除原版已有的真实元素名**（`<Sprite>`/`<Body>`/`<Price>` 等上万种），
    // 只对"既不是已知元素名、又离某个官方组件名只有 1 个字符"的情况报。
    if (lower !== '' && !COMPONENT_NAMES_LOWER.has(lower) && !KNOWN_TAGS_VANILLA_LOWER.has(lower)) {
      const componentCheck = checkName(element, COMPONENT_INDEX)
      if (componentCheck.suggestion !== null && componentCheck.distance === 1) {
        push({
          severity: 'major',
          code: 'ITEM_COMPONENT_TYPO',
          message: `元素名 <${element}> 疑似拼错的物品组件（最接近的官方组件是 <${componentCheck.suggestion}>）—— 拼错的组件整块不会生效`,
          file,
        }, `comp:${lower}`)
      }
    }
    const attrs = tag[2] ?? ''
    // `<conditional>` 的属性名是自由命名，不做核对
    if (element.toLowerCase() === 'conditional') continue

    for (const [name, value] of parseAttrs(attrs)) {
      const attrCheck = checkName(name, ATTR_INDEX)
      if (!attrCheck.known && attrCheck.suggestion !== null) {
        push({
          severity: attrCheck.distance === 1 ? 'major' : 'minor',
          code: 'SUSPECT_TYPO_ATTRIBUTE',
          message: `属性 ${name}="${value}" 疑似拼写错误（最接近的已知名称：${attrCheck.suggestion}）—— 拼错的属性会被静默忽略，该功能不会生效`,
          file,
        }, `a:${name.toLowerCase()}`)
      }
      // 枚举值只对「值需要映射」的属性检查；`tags` 是自由标签，跳过
      const lowerName = name.toLowerCase()
      if (!VALUE_ATTR_INDEX.has(lowerName) || lowerName === 'tags' || lowerName === '多个标签') continue
      for (const token of value.split(/[,+ ]+/)) {
        if (token === '' || /^-?[\d.]+$/.test(token)) continue
        const valueCheck = checkName(token, VALUE_INDEX)
        if (!valueCheck.known && valueCheck.suggestion !== null) {
          push({
            severity: valueCheck.distance === 1 ? 'major' : 'minor',
            code: 'SUSPECT_TYPO_VALUE',
            message: `${name}="${value}" 里的取值「${token}」疑似拼写错误（最接近的已知取值：${valueCheck.suggestion}）—— 拼错的取值会让该属性回退到默认行为`,
            file,
          }, `v:${token.toLowerCase()}`)
        }
      }
    }
  }
  return issues
}

/** 文件根元素是不是 `<override>`（"包外"写法：`<override><Items>…`）。 */
function isOverrideRootXml(raw: string): boolean {
  const head = stripComments(raw).replace(/<\?xml[^>]*\?>/, '').trimStart()
  return /^<override[\s>]/i.test(head)
}

/**
 * 找出文件里所有 `<Override>…</Override>` 区块的字符区间。
 *
 * 真实 mod 里 override 有**两种写法**，都要认：
 *   - 包外：`<override><Items><Item …/></Items></override>`
 *   - 包内：`<Items><Override><Item …/></Override></Items>`
 *     （实测 `磁轨炮 测试/Pucs/engineer_talent_items.xml`：第 2 行 `<Items>`、第 3 行 `<Override>`）
 * 只检查根元素会漏掉包内写法，把合法的覆盖误报成"撞 identifier"。
 */
function overrideBlockRanges(raw: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = []
  const open = /<override\b[^>]*>/gi
  let match = open.exec(raw)
  while (match !== null) {
    const close = raw.toLowerCase().indexOf('</override>', match.index)
    ranges.push({ start: match.index, end: close === -1 ? raw.length : close })
    match = open.exec(raw)
  }
  return ranges
}

/** 收集 `<Item identifier="X">` 物品定义（含所在文件与是否 override）。 */
function collectItemIdentifiers(
  raw: string,
  file: string,
): Array<{ identifier: string; file: string; isOverride: boolean }> {
  const result: Array<{ identifier: string; file: string; isOverride: boolean }> = []
  const rootOverride = isOverrideRootXml(raw)
  const ranges = overrideBlockRanges(raw)
  for (const match of raw.matchAll(/<(?:Item|override)\b([^>]*)>/gi)) {
    const attrs = match[1] ?? ''
    const identifier = /\bidentifier\s*=\s*"([^"]+)"/i.exec(attrs)?.[1]
    if (identifier === undefined) continue
    // 引用式不算定义，否则会假报重复。
    // 只认**定义专有**的属性：`name` / `category` / `maxstacksize`。
    // 注意**不能**把 `tags` 或 `scale` 当定义标志 —— 实测 NPC 库存/职业起始物品也会带
    // `tags`（`<Item identifier="idcard" equip="true" tags="id_outpostsecurity" />`），
    // 用它们判定会把同一个 `idcard` 在一个文件里数成 11 次"定义"。
    const looksLikeDefinition = /\b(name|category|maxstacksize)\s*=/i.test(attrs)
    // 物品装配（ItemAssembly）里的实例会重复出现同一个 identifier，但那不是"重复定义"。
    // 实例特征：带 ID= / rect= / conditionpercentage=（实测自 divingsuit 装配条目）。
    const isAssemblyInstance = /\b(ID|rect|conditionpercentage)\s*=/i.test(attrs)
    if (!looksLikeDefinition || isAssemblyInstance) continue
    const index = match.index ?? 0
    const inBlock = ranges.some((range) => index >= range.start && index < range.end)
    result.push({ identifier, file, isOverride: rootOverride || inBlock })
  }
  return result
}

/**
 * 关系运算符词表。
 *
 * **权威来源**：`https://regalis11.github.io/BaroModDoc/Misc/Conditional.html` 小节「Comparison operators」，
 * 原文全表 = `e|eq|equals` / `ne|neq|notequals|!|!e|!eq|!equals` / `lt|lessthan` /
 * `lte|lteq|lessthanequals` / `gt|greaterthan` / `gte|gteq|greaterthanequals`；
 * 不写运算符 = equals；运算符写在值前面。
 *
 * 唯一例外：`ge` **不在文档表里**，但原版 `Content/Talents/Security/TalentsSecurity.xml`
 * 在用它（`maxhealth="ge 1000"`）→ 保留。
 * 早先版本还收过 `l`/`le`/`g` —— 文档无、原版与本机 LocalMods 也全无实例，
 * 会把真正的拼错当合法，已删除。
 */
const CONDITIONAL_OPERATORS = new Set([
  'e', 'eq', 'equals',
  'ne', 'neq', 'notequals', '!', '!e', '!eq', '!equals',
  'lt', 'lessthan',
  'lte', 'lteq', 'lessthanequals',
  'gt', 'greaterthan',
  'gte', 'gteq', 'greaterthanequals',
  // 文档漏列、原版在用
  'ge',
])

/**
 * `<conditional>` 语义检查。
 *
 * 真实写法（本机取证）：
 *   `<conditional ishuman="true" />`            裸布尔 = 等于
 *   `<conditional afmannitol="lte 0.5" />`      带关系运算符
 *   `<conditional th_amputation="gt 0" />`
 *   `<conditional hasstatustag="tag: value" />` **不是运算符形式**，是「标签: 值」，必须排除
 * `comparison` / `conditionalcomparison` 的实测取值只有 `and` / `or`（大小写混用都出现过）。
 *
 * 运算符拼错是**静默失效**类错误：条件永远不成立，StatusEffect 看着写了其实不触发，
 * 所以按 major 报。
 */
function checkConditionals(raw: string, file: string): Issue[] {
  const issues: Issue[] = []
  for (const match of raw.matchAll(/<conditional\b([^>]*?)\/?>/gi)) {
    const attrs = match[1] ?? ''
    for (const [name, value] of parseAttrs(attrs)) {
      const trimmed = value.trim()
      // `hasstatustag="a: b"` 这类「名称: 值」不是关系表达式，跳过
      if (trimmed.includes(':')) continue
      const tokens = trimmed.split(/\s+/)
      if (tokens.length < 2) continue // 裸值 = 隐式 equals，合法
      const operator = (tokens[0] ?? '').toLowerCase()
      if (!CONDITIONAL_OPERATORS.has(operator)) {
        issues.push({
          severity: 'major',
          code: 'CONDITIONAL_UNKNOWN_OPERATOR',
          message: `<conditional ${name}="${value}"> 里的关系运算符「${tokens[0]}」不是引擎认得的写法 —— 条件永远不成立，这个效果会静默失效`,
          file,
        })
      }
    }
  }
  for (const match of raw.matchAll(/\b(conditionalcomparison|comparison)\s*=\s*"([^"]*)"/gi)) {
    const value = (match[2] ?? '').trim().toLowerCase()
    if (value !== 'and' && value !== 'or') {
      issues.push({
        severity: 'major',
        code: 'CONDITIONAL_BAD_COMPARISON',
        message: `${match[1]}="${match[2]}" 不是合法取值（实测只有 and / or，大小写不敏感）—— 条件组合行为不确定`,
        file,
      })
    }
  }
  return issues
}

/**
 * 语言文件结构检查：重复键、空文本。
 *
 * 两类都**聚合成一条**而不是逐条报 —— 真实 mod 里作者会故意把某些条目留成空白
 * （例如 `MolochMilk` 的 `<afflictionname.sat5> </afflictionname.sat5>`），
 * 逐条报会刷屏，把真正的问题淹掉。
 */
function checkLanguageStructure(raw: string, file: string): Issue[] {
  const issues: Issue[] = []
  const counts = new Map<string, { count: number; display: string }>()
  const emptyKeys: string[] = []
  const pattern = /<([^\s<>/]+)(?:\s[^<>]*)?>([^<]*)<\/\1\s*>/g
  let match = pattern.exec(raw)
  while (match !== null) {
    const key = match[1] ?? ''
    const text = match[2] ?? ''
    const lower = key.toLowerCase()
    if (lower !== 'infotexts' && lower !== 'override') {
      const entry = counts.get(lower) ?? { count: 0, display: key }
      entry.count += 1
      counts.set(lower, entry)
      if (text.trim() === '') emptyKeys.push(key)
    }
    match = pattern.exec(raw)
  }
  const duplicated = [...counts.values()].filter((entry) => entry.count > 1)
  if (duplicated.length > 0) {
    issues.push({
      severity: 'minor',
      code: 'L10N_DUPLICATE_KEY',
      message: `${duplicated.length} 个键在同一语言文件里重复出现（后者在前者之后，行为不确定）：${duplicated.slice(0, 4).map((entry) => `${entry.display}×${entry.count}`).join(', ')}${duplicated.length > 4 ? ' …' : ''}`,
      file,
    })
  }
  if (emptyKeys.length > 0) {
    issues.push({
      severity: 'minor',
      code: 'L10N_EMPTY',
      message: `${emptyKeys.length} 个条目文本为空（可能是有意留空，也可能是漏填）：${emptyKeys.slice(0, 4).join(', ')}${emptyKeys.length > 4 ? ' …' : ''}`,
      file,
    })
  }
  return issues
}

/** 注册校验工具。 */
export function registerValidateTools(ctx: Context, config: BarotraumaPluginConfig): void {
  registerTool(ctx, defineTool({
    name: 'barotrauma_validate',
    description:
      '校验潜渊症内容包：filelist 记录与实际文件是否对得上、XML 结构是否良构、物品 identifier 是否重复、' +
      '贴图引用是否缺失（含 Content/ 原版引用）、是否需要本地化键、有没有漏登记的 XML、' +
      '<conditional> 语义（关系运算符 / comparison 取值）、语言文件结构，' +
      `以及**元素名/属性名/枚举值疑似拼写错误**（依据 ${VOCABULARY_SIZE.tags} 个元素名 / ${VOCABULARY_SIZE.attrs} 个属性名 / ${VOCABULARY_SIZE.values} 个枚举值的社区词表做近似匹配，` +
      '拼错的标签会被游戏静默忽略）。' +
      '返回按严重度分级（blocker / major / minor）的问题清单。' +
      '已专门处理三类常见误报：文件名含空格、folder=/path= 按目录加载的 XML、语言文件用 <Other> 注册。',
    parameters: {
      modDir: { type: 'string', required: true, description: 'mod 根目录。' },
      maxIssues: { type: 'integer', description: '最多返回多少条问题，默认 200。' },
      writeReport: { type: 'boolean', description: '是否把报告写到 <modDir>/validation-report.md，默认 false。' },
      gameDir: { type: 'string', description: '游戏目录；给了才能校验 Content/... 引用的原版贴图是否真实存在。' },
      checkTypos: {
        type: 'boolean',
        description:
          '是否开启元素名/属性名/枚举值的**疑似拼写错误**检测，默认 false。'
          + `基准是原版游戏抽取的名称全集（元素名 ${VANILLA_NAME_STATS.elements} / 属性名 ${VANILLA_NAME_STATS.attributes} / 取值 ${VANILLA_NAME_STATS.values}）。`
          + '它抓的是「拼错的标签被游戏静默忽略」这一类硬伤，但**噪声较大**（大量 mod 自有属性与某个原版名只差 1-2 字符），'
          + '所以默认关闭；做专门的拼写审计时再开。',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          modDir: { type: 'string', required: true },
          packageName: { type: 'string', required: true },
          gameVersion: { type: 'string', required: true },
          registeredFileCount: { type: 'integer', required: true },
          scannedXmlCount: { type: 'integer', required: true },
          languageFileCount: { type: 'integer', required: true },
          conventionLoadedFileCount: { type: 'integer', required: true },
          blockerCount: { type: 'integer', required: true },
          majorCount: { type: 'integer', required: true },
          minorCount: { type: 'integer', required: true },
          issues: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                severity: { type: 'string', required: true },
                code: { type: 'string', required: true },
                message: { type: 'string', required: true },
                file: { type: 'string', required: true },
              },
            },
          },
          reportFile: { type: 'string', required: true },
          warnings: { type: 'array', required: true, items: { type: 'string' } },
        },
      },
      render: (_args, value) => {
        const lines = [
          `内容包校验：${value.packageName || '(无 name)'}　gameversion=${value.gameVersion || '(无)'}`,
          `filelist 记录 ${value.registeredFileCount} 条，扫描 XML ${value.scannedXmlCount} 个，语言文件 ${value.languageFileCount} 个`,
          `问题：blocker ${value.blockerCount} / major ${value.majorCount} / minor ${value.minorCount}`,
        ]
        if (value.issues.length === 0) {
          lines.push('', '✅ 没发现结构性问题。仍需进游戏实测加载效果。')
        } else {
          lines.push('')
          for (const issue of value.issues) {
            const mark = issue.severity === 'blocker' ? '⛔' : issue.severity === 'major' ? '❌' : '⚠️'
            lines.push(`${mark} [${issue.code}] ${issue.message}${issue.file !== '' ? `　(${issue.file})` : ''}`)
          }
        }
        if (value.reportFile !== '') lines.push('', `报告已写入：${value.reportFile}`)
        for (const warning of value.warnings) lines.push(`⚠️ ${warning}`)
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    timeoutMs: 120_000,
    isConcurrencySafe: () => true,
    async execute(args) {
      const modDir = asString(args.modDir).trim()
      if (modDir === '') throw new BarotraumaError('MISSING_ARGUMENT', '缺少必填参数 modDir')
      const maxIssues = Math.max(1, Math.trunc(Number(asString(args.maxIssues, '200')) || 200))
      const checkTypos = asBoolean(args.checkTypos, false)

      const issues: Issue[] = []
      const warnings: string[] = []
      const doc = await readFilelist(modDir)
      const packageName = asString(doc.attributes['name'])
      const gameVersion = asString(doc.attributes['gameversion'])

      // 校验 Content/... 需要知道游戏装在哪
      let gameDir = asString(args.gameDir).trim() || config.gameDir || ''
      if (gameDir === '') {
        const { detectEnv } = await import('./env.js')
        gameDir = (await detectEnv('', '')).gameDir
      }
      if (gameDir === '') {
        warnings.push('没找到游戏目录，已跳过 Content/... 原版资源引用检查（这个检查能抓出「引用不存在的原版贴图」这类隐形错误）。')
      }

      if (packageName === '') {
        issues.push({ severity: 'blocker', code: 'FILENAME_MISSING', message: 'filelist.xml 的 <contentpackage> 缺少 name 属性', file: 'filelist.xml' })
      }
      if (gameVersion === '') {
        issues.push({ severity: 'minor', code: 'GAMEVERSION_MISSING', message: 'filelist.xml 缺少 gameversion 属性（游戏通常会自动补上）', file: 'filelist.xml' })
      }
      if (doc.entries.length === 0) {
        issues.push({ severity: 'major', code: 'FILELIST_EMPTY', message: 'filelist.xml 里没有任何内容记录 —— 这个 mod 加载后是空的', file: 'filelist.xml' })
      }

      // 1) 登记的文件是否存在
      for (const entry of doc.entries) {
        if (!await pathExists(join(modDir, entry.file))) {
          issues.push({
            severity: 'blocker',
            code: 'FILELIST_DANGLING',
            message: `<${entry.tag} file="%ModDir%/${entry.file}" /> 指向的文件不存在 —— 内容包会加载失败`,
            file: 'filelist.xml',
          })
        }
      }

      // 1b) filelist 子元素名必须是**官方内容类型**
      // 权威依据：官方 ContentPackages · File list ——
      // "The name of each of these child elements must be one of the content types"。
      // 写错的后果不是"这一条不生效"，而是**整个内容包加载失败**，所以记 blocker。
      for (const entry of doc.entries) {
        if (CONTENT_TYPES_LOWER.has(entry.tag.toLowerCase())) continue
        const suggestion = checkName(entry.tag, CONTENT_TYPE_INDEX)
        issues.push({
          severity: 'blocker',
          code: 'FILELIST_UNKNOWN_TYPE',
          message: `filelist 里的 <${entry.tag}> 不是官方内容类型${suggestion.suggestion !== null ? `（最接近的是 <${suggestion.suggestion}>）` : ''} —— 子元素名必须是内容类型之一，否则整个内容包加载失败`,
          file: 'filelist.xml',
        })
      }

      // 先把所有 XML 读进来：后面的检查需要两趟（先收集约定路径，再判定）
      const xmlFiles = await listModXmlFiles(modDir, 5)
      const contents = new Map<string, string>()
      for (const file of xmlFiles) contents.set(file, await readTextSafe(join(modDir, file), ''))

      // 第 1 趟：按 folder= / path= 加载的约定目录与文件
      const conventionDirs: string[] = []
      const conventionFiles = new Set<string>()
      for (const [file, raw] of contents) {
        if (raw === '') continue
        const collected = collectConventionPaths(stripComments(raw), file)
        conventionDirs.push(...collected.dirs)
        for (const item of collected.files) conventionFiles.add(item)
      }

      const registered = new Set(doc.entries.map((entry) => normalizeRel(entry.file)))
      const identifierOwners = new Map<string, Array<{ file: string; isOverride: boolean }>>()
      const unregistered: string[] = []
      const loadedFiles = new Set<string>()
      // 有 ModConfig.xml 时，Config/ 与 Assets/ 由它声明式加载，无需 filelist 登记
      const hasModConfig = [...contents.keys()].some((file) => normalizeRel(file) === 'modconfig.xml')

      // 同一 LocalMods 下的兄弟 mod（识别跨 mod 资源引用用）
      let siblingMods: string[] = []
      try {
        const parent = dirname(resolve(modDir))
        siblingMods = (await listDirs(parent)).filter((dir) => resolve(dir) !== resolve(modDir))
      } catch {
        siblingMods = []
      }

      /**
       * 第 2 趟：逐文件检查。
       *
       * **只检查会被真正加载的文件** —— 没登记的 XML 引擎根本不读，
       * 对它报"贴图缺失""identifier 重复""条件写错"全是噪音
       * （实测：`ACAWeaponsExpand` 的 `Afflictions/Raptor*.xml` 既没登记、又引用了不存在的贴图，
       * 一条聚合的"没登记"就够了，不该刷出几十条下游问题）。
       */
      for (const [file, raw] of contents) {
        if (raw === '') continue
        const normalized = normalizeRel(file)
        const isLanguageFile = /<infotexts[\s>]/i.test(raw)
        const conventionLoaded =
          CONVENTION_DIR_PATTERN.test(normalized) ||
          conventionFiles.has(normalized) ||
          conventionDirs.some((dir) => isUnder(normalized, dir))
        const isLoaded =
          registered.has(normalized) ||
          conventionLoaded ||
          NO_REGISTRATION_NEEDED.test(normalized) ||
          (hasModConfig && MODCONFIG_DECLARED.test(normalized)) ||
          /^filelist\.xml$/.test(normalized)

        if (!isLoaded) {
          unregistered.push(file)
          // 语言文件即使没登记，也要继续做结构检查（它的键可能已在别处被引用）
          if (isLanguageFile) issues.push(...checkLanguageStructure(stripComments(raw), file))
          continue
        }
        loadedFiles.add(file)

        issues.push(...checkXmlStructure(raw, file))

        const effective = stripComments(raw)
        issues.push(...checkConditionals(effective, file))
        // 官方封闭枚举：精确检查，始终开启（不依赖启发式）
        issues.push(...checkClosedEnums(effective, file))
        // 拼写检测是**可选**的：基准虽已换成原版全集，仍会有"mod 自有属性撞上某个原版名"的噪声
        // 语言文件必须排除 —— 它的"元素名"是本地化键（`<afflictionname.x>`），不是 XML 元素
        if (checkTypos && !isLanguageFile) issues.push(...checkXmlNames(effective, file))

        if (isLanguageFile) issues.push(...checkLanguageStructure(effective, file))

        for (const item of collectItemIdentifiers(effective, file)) {
          const owners = identifierOwners.get(item.identifier) ?? []
          owners.push({ file: item.file, isOverride: item.isOverride })
          identifierOwners.set(item.identifier, owners)
        }

        for (const asset of collectAssetReferences(effective)) {
          // 跨 mod 资源引用：`%ModDir:[MOD NAME]%/…`（官方 XML 页的路径变量）。
          // 指向的是**另一个内容包**，本 mod 单独无法校验 —— 跳过，不当缺失。
          if (/^%ModDir:/i.test(asset)) continue
          // 带占位符的路径无法静态检查：真实 mod 用 `[GENDER]` 这类占位，
          // 引擎运行时才替换（实测 Horny Europa 的 captain_torso_[GENDER]_1.png）。
          if (/[[\]{}]/.test(asset)) continue
          if (/^Content[\\/]/i.test(asset)) {
            if (gameDir !== '' && !await pathExists(join(gameDir, asset))) {
              issues.push({
                severity: 'major',
                code: 'VANILLA_ASSET_MISSING',
                message: `${asset} 在原版资源里不存在（游戏目录下找不到该文件）—— 游戏里会显示不出贴图`,
                file,
              })
            }
            continue
          }
          const relative = asset.replace(/^%ModDir%\//i, '')
          if (!await pathExists(join(modDir, relative))) {
            // 兄弟 mod：真实 mod 之间存在**跨 mod 资源引用**
            // （实测 ACA_NonHumanRaces_Extend 的 `<huskappendage path="%ModDir%/Afflictions/Raptor*.xml">`
            //   指向的是隔壁 ACAWeaponsExpand 的文件）。这种情况单独标注，不当作错误。
            let crossMod = ''
            for (const sibling of siblingMods) {
              if (await pathExists(join(sibling, relative))) {
                crossMod = basename(sibling)
                break
              }
            }
            if (crossMod !== '') {
              issues.push({
                severity: 'minor',
                code: 'ASSET_CROSS_MOD',
                message: `${asset} 不在本 mod 里，但在同一个 LocalMods 下的「${crossMod}」里 —— 跨 mod 引用，需要那个 mod 同时启用`,
                file,
              })
            } else {
              issues.push({
                severity: 'major',
                code: 'ASSET_MISSING',
                message: `${asset} 引用的文件不存在`,
                file,
              })
            }
          }
        }

        // 弹药配套。注意 `<RequiredItem>`（单数）与 `<RequiredItems>`（复数）**都是合法别名**
        // （官方 Item 页；本机 ACAWeaponsExpand/Items/Heavy_Weapons.xml 用的是单数）。
        // 早先只写复数，导致该检查对单数写法**永不触发**。
        //
        // 还必须要求**确实有 `<RangedWeapon>`**：`<RequiredItems type="Contained">` 有两种语义 ——
        // 武器的弹药，和**工具需要的燃料**（原版 weldingtool 就把它写在 `<RepairTool>` 里，
        // 那种情况本来就不需要 `<ItemContainer>`）。不区分会把焊接工具类物品全部误报。
        if (
          /<RangedWeapon\b/i.test(effective) &&
          /<RequiredItems?\b[^>]*\btype\s*=\s*"Contained"/i.test(effective) &&
          !/<ItemContainer\b/i.test(effective)
        ) {
          issues.push({
            severity: 'major',
            code: 'AMMO_CONTAINER_MISSING',
            message: '有 <RequiredItem(s) type="Contained"> 但没有 <ItemContainer> —— 武器装不进弹药，开不了火',
            file,
          })
        }
      }

      // 漏登记：聚合成一条（逐条报会在大型 mod 里刷屏，把真问题淹掉）
      if (unregistered.length > 0) {
        issues.push({
          severity: 'minor',
          code: 'XML_NOT_REGISTERED',
          message: `${unregistered.length} 个 XML 没有被 filelist.xml 登记，不会被加载：${unregistered.slice(0, 5).join(', ')}${unregistered.length > 5 ? ` …（另有 ${unregistered.length - 5} 个）` : ''}`,
          file: 'filelist.xml',
        })
      }

      // 3) identifier 重复
      // 权威依据：官方 Troubleshooting 页 —— 撞 identifier 而不写 <override> 会让
      // **整个 mod 被游戏禁用**（原报错 "Failed to add the prefab X…try overriding"）。
      // 但用 `<override>` 覆盖是**官方推荐做法**，不算撞车，所以只统计"非 override 定义"。
      for (const [identifier, owners] of identifierOwners) {
        const plain = owners.filter((owner) => !owner.isOverride)
        if (plain.length > 1) {
          const uniqueFiles = [...new Set(plain.map((owner) => owner.file))]
          issues.push({
            severity: 'blocker',
            code: 'DUPLICATE_IDENTIFIER',
            message: `identifier "${identifier}" 有 ${plain.length} 处非 override 定义（涉及 ${uniqueFiles.length} 个文件）—— 撞 identifier 会让**整个 mod 被游戏禁用**（官方报错 "Failed to add the prefab … try overriding"）。解法：删掉重复定义，或用 <override> 明确覆盖`,
            file: uniqueFiles.join(', '),
          })
        }
      }

      // 5/6) 本地化（只统计**会被加载**的文件提出的需求）
      const { entries: l10nEntries } = await scanEntries(modDir, loadedFiles)
      const languageFiles: Array<{ file: string; keys: Set<string> }> = []
      for (const [file, raw] of contents) {
        if (/<infotexts[\s>]/i.test(raw)) languageFiles.push({ file, keys: parseLanguageKeys(raw) })
      }
      // 兜底：filelist 里 <Text> 登记但内容识别没命中的
      for (const entry of doc.entries) {
        if (entry.tag.toLowerCase() !== 'text') continue
        if (languageFiles.some((item) => normalizeRel(item.file) === normalizeRel(entry.file))) continue
        const raw = await readTextSafe(join(modDir, entry.file), '')
        if (raw !== '') languageFiles.push({ file: entry.file, keys: parseLanguageKeys(raw) })
      }

      const allKeys = new Set<string>()
      for (const language of languageFiles) for (const key of language.keys) allKeys.add(key.toLowerCase())

      const declared = l10nEntries.filter((entry) => entry.reason !== 'implicit')
      // 「没有 name 属性」只有在语言文件里也没有对应键时才算缺口 ——
      // 有条目（哪怕故意留空）就说明显示名已处理过。
      const implicit = l10nEntries.filter(
        (entry) => entry.reason === 'implicit' && !allKeys.has(entry.key.toLowerCase()),
      )

      if (declared.length > 0 && languageFiles.length === 0) {
        issues.push({
          severity: 'major',
          code: 'NO_LANGUAGE_FILE',
          message: `有 ${declared.length} 个实体用 name="" 走本地化，但 mod 里没有语言文件（根元素为 <infotexts> 的 XML）—— 游戏里会显示原始键名`,
          file: 'filelist.xml',
        })
      } else if (declared.length > 0) {
        const missing = declared.filter((entry) => !allKeys.has(entry.key.toLowerCase()))
        if (missing.length > 0) {
          issues.push({
            severity: 'minor',
            code: 'L10N_MISSING',
            message: `缺 ${missing.length} 个本地化键，例如 ${missing.slice(0, 5).map((entry) => entry.key).join(', ')}`,
            file: 'filelist.xml',
          })
        }
      }
      if (implicit.length > 0) {
        issues.push({
          severity: 'minor',
          code: 'L10N_NAME_IMPLICIT',
          message: `${implicit.length} 个实体的显示名没有任何来源（既没写 name 属性，语言文件里也没条目），游戏里会显示原始 identifier：${implicit.slice(0, 4).map((entry) => entry.key).join(', ')}${implicit.length > 4 ? ' …' : ''}`,
          file: 'filelist.xml',
        })
      }

      // 去重 + 计数
      const unique: Issue[] = []
      const seenIssues = new Set<string>()
      for (const issue of issues) {
        const identity = `${issue.code}|${issue.message}|${issue.file}`
        if (seenIssues.has(identity)) continue
        seenIssues.add(identity)
        unique.push(issue)
      }

      const blockerCount = unique.filter((issue) => issue.severity === 'blocker').length
      const majorCount = unique.filter((issue) => issue.severity === 'major').length
      const minorCount = unique.filter((issue) => issue.severity === 'minor').length

      let reportFile = ''
      if (asBoolean(args.writeReport, false)) {
        const lines = [
          `# 内容包校验报告：${packageName || modDir}`,
          '',
          `- 目录：\`${modDir}\``,
          `- gameversion：${gameVersion || '(无)'}`,
          `- filelist 记录：${doc.entries.length} 条`,
          `- 扫描 XML：${xmlFiles.length} 个（其中按 folder=/path= 加载的约定文件 ${conventionFiles.size} 个、约定目录 ${conventionDirs.length} 个）`,
          `- 语言文件：${languageFiles.length} 个`,
          `- 问题：blocker ${blockerCount} / major ${majorCount} / minor ${minorCount}`,
          '',
          '| 严重度 | 代码 | 说明 | 位置 |',
          '|---|---|---|---|',
          ...unique.map((issue) => `| ${issue.severity} | ${issue.code} | ${issue.message.replace(/\|/g, '\\|')} | ${issue.file} |`),
          '',
        ]
        reportFile = join(modDir, 'validation-report.md')
        await writeFileEnsured(reportFile, lines.join('\n'))
      }

      return {
        ok: blockerCount === 0,
        modDir,
        packageName,
        gameVersion,
        registeredFileCount: doc.entries.length,
        scannedXmlCount: xmlFiles.length,
        languageFileCount: languageFiles.length,
        conventionLoadedFileCount: conventionFiles.size,
        blockerCount,
        majorCount,
        minorCount,
        issues: unique.slice(0, maxIssues).map((issue) => ({ ...issue })),
        reportFile,
        warnings,
      }
    },
  }))
}
