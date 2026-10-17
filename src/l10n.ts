/**
 * dsh-tool-barotrauma — 阶段四：本地化（`barotrauma_scan_l10n` / `barotrauma_translate`）。
 *
 * 关键事实（refs/reference.md G）：
 *   - 语言文件根 = `<infotexts language="Simplified Chinese" nowhitespace="true" translatedname="中文(简体)">`；
 *   - 条目 = `<键>文本</键>`，键前缀决定用途：
 *       entityname.<id> / entitydescription.<id>（物品）
 *       afflictionname.<id> / afflictiondescription.<id>（状态效果）
 *       character.<SpeciesName>（角色）
 *       eventtext.<key>（事件）
 *   - `name=""` 的实体**必须**有本地化键，否则游戏里显示原始键名。
 *
 * 设计约束：本工具**不生成译文**。译文必须由调用方（模型）提供 ——
 * 机器直译的中文游戏文本质量很差，宁可让它出清单再逐条翻译。
 * @module dsh-tool-barotrauma/l10n
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { BarotraumaPluginConfig } from './config.js'
import { appendLanguageEntries, ensureRegistered, listModXmlFiles, readFilelist } from './pack-io.js'
import {
  buildLanguageFile,
  CONTENT_TAGS,
  LANGUAGES,
  normalizeLocale,
  XML_HEADER,
} from './xml.js'
import {
  asArray,
  asBoolean,
  asRecord,
  asString,
  BarotraumaError,
  ensureDir,
  pathExists,
  readTextSafe,
  registerTool,
  resolveInside,
  writeFileEnsured,
} from './util.js'

/** 一条待翻译条目。 */
interface L10nEntry {
  key: string
  /** 取值来源（XML 文件相对路径）。 */
  source: string
  /**
   * 这条键是**怎么被判定为需要的**：
   *   - `name-attribute`：实体写了 `name=""`，显式要求走本地化
   *   - `implicit`：实体**压根没有 name 属性**，游戏会退回显示 identifier（真缺口，但只影响显示名）
   *   - `always`：角色等总是需要显示名
   *   - `referenced`：XML 里引用了这个键（如 eventtext.*）
   */
  reason: 'name-attribute' | 'implicit' | 'always' | 'referenced'
}

/**
 * 从语言文件里取出已定义的键（**统一小写**）。
 *
 * 两个关键点：
 *   1. 键名字符集放宽到 `[^\s<>/]+` —— 真实键里可能出现 `-` 等字符，
 *      旧版只认 `[A-Za-z][\w.]*` 会把这类键漏掉，进而误报"缺失"。
 *   2. 统一小写比较 —— 游戏侧 XML 元素/属性名大小写不敏感，
 *      `<entityname.X>` 与 `<EntityName.X>` 是同一个键。
 */
export function parseLanguageKeys(raw: string): Set<string> {
  const keys = new Set<string>()
  // 只匹配**最内层**元素（内容里不含 `<`）：这样 `<Override>` 包裹层不会吃掉里面的键
  const pattern = /<([^\s<>/]+)(?:\s[^<>]*)?>([^<]*)<\/\1\s*>/g
  let match = pattern.exec(raw)
  while (match !== null) {
    const key = (match[1] ?? '').toLowerCase()
    if (key !== '' && key !== 'infotexts' && key !== 'override') keys.add(key)
    match = pattern.exec(raw)
  }
  return keys
}

/**
 * 根元素是不是 `<override>`。
 *
 * `<override>` 包裹的内容是**覆盖原版**，显示名会继承原版的本地化键，
 * 因此不需要 mod 自己再提供一份 —— 对这类文件提本地化需求就是误报。
 * 取证：`MolochMilk/Characters/Moloch/Moloch.xml` 第一行就是 `<override>`。
 */
function isOverrideRoot(raw: string): boolean {
  const withoutDecl = raw
    .replace(/<\?xml[^>]*\?>/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trimStart()
  return /^<override[\s>]/i.test(withoutDecl)
}

/**
 * 扫描 mod 里需要本地化的条目。
 *
 * 判定规则（`reason` 标注依据）：
 *   - `<Item name="" identifier="X">` → entityname/entitydescription，`name-attribute`
 *   - `<Item identifier="X" category=…>` **完全没有 name 属性** → entityname，`implicit`
 *     （游戏会退回显示 identifier。带 `fallbacknameidentifier`/`nameidentifier` 的会借用别的物品名，不算缺口。）
 *   - `<Affliction … maxstrength=…>` 定义 → afflictionname/afflictiondescription
 *   - `<Character SpeciesName="X">`（且没硬编码 DisplayName） → character.X，`always`
 *   - 任何 `eventtext.<…>` 引用 → 该键，`referenced`
 *
 * 跳过的情况：`name="非空"`（硬编码显示名）、`<override>` 文件（继承原版本地化）。
 */
async function scanEntries(
  modDir: string,
  /** 只扫描这些文件（相对 mod 根）。不传则扫描全部 —— 用于"这个 mod 里有什么"的视角。 */
  onlyFiles?: ReadonlySet<string>,
): Promise<{ entries: L10nEntry[]; scannedFiles: string[] }> {
  const files = await listModXmlFiles(modDir, 5)
  const entries: L10nEntry[] = []
  const seen = new Set<string>()
  const scannedFiles: string[] = []

  const add = (key: string, source: string, reason: L10nEntry['reason']): void => {
    if (seen.has(key.toLowerCase())) return
    seen.add(key.toLowerCase())
    entries.push({ key, source, reason })
  }

  for (const file of files) {
    if (onlyFiles !== undefined && !onlyFiles.has(file)) continue
    const raw = await readTextSafe(join(modDir, file), '')
    if (raw === '') continue
    // 语言文件自身不算内容，跳过（否则它的键会被当成待翻译项）
    if (/<infotexts[\s>]/i.test(raw)) continue
    scannedFiles.push(file)
    // 覆盖原版的文件继承原版本地化，不产生需求
    if (isOverrideRoot(raw)) continue

    // 物品
    const itemPattern = /<(?:Item|override)\b([^>]*)>/gi
    let match = itemPattern.exec(raw)
    while (match !== null) {
      const attrs = match[1] ?? ''
      const identifier = /\bidentifier\s*=\s*"([^"]+)"/i.exec(attrs)?.[1]
      if (identifier !== undefined) {
        const nameIsEmpty = /\bname\s*=\s*""/i.test(attrs)
        const hasName = /\bname\s*=/i.test(attrs)
        const borrowsName = /\b(fallbacknameidentifier|nameidentifier)\s*=/i.test(attrs)
        const looksLikeDefinition = /\b(category|tags|scale|maxstacksize|description)\s*=/i.test(attrs)
        // `descriptionidentifier` = 描述借用别的物品（官方 Item 页），不需要自己提供 entitydescription.
        const borrowsDescription = /\bdescriptionidentifier\s*=/i.test(attrs)
        if (nameIsEmpty) {
          add(`entityname.${identifier}`, file, 'name-attribute')
          if (!borrowsDescription) add(`entitydescription.${identifier}`, file, 'name-attribute')
        } else if (!hasName && !borrowsName && looksLikeDefinition) {
          add(`entityname.${identifier}`, file, 'implicit')
        }
      }
      match = itemPattern.exec(raw)
    }

    // 状态效果定义：带 maxstrength 的是定义，不带的是引用。
    // 元素名允许带后缀（官方 Afflictions 页有多种 AfflictionPrefab 变体，如 <AfflictionHusk>/<AfflictionBleeding>）。
    const afflictionPattern = /<Affliction[A-Za-z]*\b([^>]*)>/gi
    match = afflictionPattern.exec(raw)
    while (match !== null) {
      const attrs = match[1] ?? ''
      const identifier = /\bidentifier\s*=\s*"([^"]+)"/i.exec(attrs)?.[1]
      // `TranslationOverride` = 复用别的 affliction 的名字与描述（官方 Afflictions 页）→ 不需要自己提供
      const translationOverride = /\bTranslationOverride\s*=\s*"([^"]*)"/i.exec(attrs)?.[1]?.trim() ?? ''
      if (identifier !== undefined && /\bmaxstrength\s*=/i.test(attrs) && translationOverride === '') {
        const nameIsEmpty = /\bname\s*=\s*""/i.test(attrs)
        const reason: L10nEntry['reason'] = nameIsEmpty ? 'name-attribute' : 'implicit'
        add(`afflictionname.${identifier}`, file, reason)
        add(`afflictiondescription.${identifier}`, file, reason)
      }
      match = afflictionPattern.exec(raw)
    }

    // 角色：硬编码了 DisplayName / SpeciesTranslationOverride / TranslationOverride 的不需要键
    const characterPattern = /<Character\b([^>]*)>/gi
    match = characterPattern.exec(raw)
    while (match !== null) {
      const attrs = match[1] ?? ''
      const species = /\bSpeciesName\s*=\s*"([^"]+)"/i.exec(attrs)?.[1]
      if (species !== undefined) {
        const displayName = /\bDisplayName\s*=\s*"([^"]*)"/i.exec(attrs)?.[1]?.trim() ?? ''
        const override = /\bSpeciesTranslationOverride\s*=\s*"([^"]*)"/i.exec(attrs)?.[1]?.trim() ?? ''
        const translationOverride = /\bTranslationOverride\s*=\s*"([^"]*)"/i.exec(attrs)?.[1]?.trim() ?? ''
        if (displayName === '' && override === '' && translationOverride === '') {
          add(`character.${species}`, file, 'always')
        }
      }
      match = characterPattern.exec(raw)
    }

    // 事件文本引用
    for (const ref of raw.matchAll(/\beventtext\.[A-Za-z0-9_.]+/gi)) {
      add(ref[0], file, 'referenced')
    }
  }

  return { entries, scannedFiles }
}

/**
 * 读出 mod 里所有语言文件。
 *
 * **按内容识别**，而不是只看 filelist 里 `<Text>` 登记：
 * 真实 mod 里语言文件也用 `<Other>` 注册过（Neurotrauma 的德语就是 `<Other>`），
 * 只认 `<Text>` 会漏掉它，导致那个语言的所有键都被误报成"缺失"。
 */
async function readLanguageFiles(modDir: string): Promise<Array<{ file: string; locale: string; keys: Set<string> }>> {
  const result: Array<{ file: string; locale: string; keys: Set<string> }> = []
  const seen = new Set<string>()
  const add = (file: string, raw: string): void => {
    const identity = file.toLowerCase().replace(/\\/g, '/')
    if (seen.has(identity) || raw.trim() === '') return
    seen.add(identity)
    const language = /<infotexts\b[^>]*\blanguage\s*=\s*"([^"]*)"/i.exec(raw)?.[1] ?? ''
    result.push({ file, locale: language, keys: parseLanguageKeys(raw) })
  }

  // 主路径：根元素是 <infotexts> 的 XML 就是语言文件，不看它怎么登记的
  for (const file of await listModXmlFiles(modDir, 5)) {
    const raw = await readTextSafe(join(modDir, file), '')
    if (/<infotexts[\s>]/i.test(raw)) add(file, raw)
  }

  // 兜底：filelist 里 <Text> 登记但内容识别没命中的（例如编码/BOM 导致首标签失配）
  const doc = await readFilelist(modDir)
  for (const entry of doc.entries) {
    if (entry.tag.toLowerCase() !== 'text') continue
    add(entry.file, await readTextSafe(join(modDir, entry.file), ''))
  }
  return result
}

/** 注册本地化工具。 */
export function registerL10nTools(ctx: Context, _config: BarotraumaPluginConfig): void {
  // ── barotrauma_scan_l10n ─────────────────────────────────────────────────
  registerTool(ctx, defineTool({
    name: 'barotrauma_scan_l10n',
    description:
      '扫描潜渊症 mod 里需要本地化的条目，并报告每种语言缺哪些键。' +
      '识别 entityname/entitydescription（物品）、afflictionname/afflictiondescription（状态效果）、' +
      'character.（角色）、eventtext.（事件）。' +
      '注意：name 非空（硬编码显示名）的实体不需要本地化键，会被跳过。本工具只出清单，不产出译文。',
    parameters: {
      modDir: { type: 'string', required: true, description: 'mod 根目录。' },
      limit: { type: 'integer', description: '最多返回多少条待翻译项，默认 200。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          modDir: { type: 'string', required: true },
          scannedFileCount: { type: 'integer', required: true },
          requiredKeyCount: { type: 'integer', required: true },
          missingKeyCount: { type: 'integer', required: true },
          languages: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                file: { type: 'string', required: true },
                locale: { type: 'string', required: true },
                definedKeyCount: { type: 'integer', required: true },
                missingKeys: { type: 'array', required: true, items: { type: 'string' } },
              },
            },
          },
          requiredKeys: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                key: { type: 'string', required: true },
                source: { type: 'string', required: true },
                reason: { type: 'string', required: true },
              },
            },
          },
          /** 实体压根没写 name 属性的：真缺口，但只影响显示名 */
          implicitNameKeys: { type: 'array', required: true, items: { type: 'string' } },
          warnings: { type: 'array', required: true, items: { type: 'string' } },
        },
      },
      render: (_args, value) => {
        const lines = [
          `本地化扫描：${value.modDir}`,
          `扫描 ${value.scannedFileCount} 个 XML，需要 ${value.requiredKeyCount} 个键`,
          `缺失合计：${value.missingKeyCount}`,
          '',
        ]
        for (const language of value.languages) {
          lines.push(`${language.file}（${language.locale || '未知语言'}）：已定义 ${language.definedKeyCount}，缺 ${language.missingKeys.length}`)
          for (const key of language.missingKeys.slice(0, 20)) lines.push(`   - ${key}`)
          if (language.missingKeys.length > 20) lines.push(`   … 另有 ${language.missingKeys.length - 20} 个`)
        }
        if (value.languages.length === 0) lines.push('（没找到任何语言文件：根元素是 <infotexts> 的 XML 会被识别为语言文件，不论它怎么登记）')
        lines.push('', '下一步：调用 barotrauma_translate，把 translations 传进去（本插件不会自己编译文）。')
        if (value.implicitNameKeys.length > 0) {
          lines.push('', `另：${value.implicitNameKeys.length} 个实体的显示名没有任何来源（既没写 name 属性，语言文件里也没条目），游戏里会显示原始 identifier：`)
          for (const key of value.implicitNameKeys.slice(0, 10)) lines.push(`   ? ${key}`)
          if (value.implicitNameKeys.length > 10) lines.push(`   … 另有 ${value.implicitNameKeys.length - 10} 个`)
        }
        lines.push(...value.warnings.map((warning) => `⚠️ ${warning}`))
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    timeoutMs: 60_000,
    isConcurrencySafe: () => true,
    async execute(args) {
      const modDir = asString(args.modDir).trim()
      if (modDir === '') throw new BarotraumaError('MISSING_ARGUMENT', '缺少必填参数 modDir')
      const limit = Math.max(1, Math.trunc(Number(asString(args.limit, '200')) || 200))

      const warnings: string[] = []
      const { entries, scannedFiles } = await scanEntries(modDir)
      const languages = await readLanguageFiles(modDir)
      if (languages.length === 0) {
        warnings.push('没找到任何语言文件。根元素是 <infotexts> 的 XML 会被识别为语言文件；如果这个 mod 还没有语言文件，先用 barotrauma_create_mod 建骨架或手工加一个。')
      }

      const sliced = entries.slice(0, limit)
      if (entries.length > limit) warnings.push(`待翻译条目共 ${entries.length} 条，本次只返回前 ${limit} 条（可用 limit 调整）。`)

      let missingTotal = 0
      // 「缺失」只统计**声明式**需求（name="" / 角色 / 事件引用）；
      // 「压根没写 name 属性」的单独列在 implicitNameKeys 里，避免同一件事报两遍、把数字撑大。
      const declared = sliced.filter((entry) => entry.reason !== 'implicit')
      const languageReports = languages.map((language) => {
        // 键比较统一小写：游戏侧 XML 大小写不敏感
        const missing = declared
          .filter((entry) => !language.keys.has(entry.key.toLowerCase()))
          .map((entry) => entry.key)
        missingTotal += missing.length
        return {
          file: language.file,
          locale: language.locale,
          definedKeyCount: language.keys.size,
          missingKeys: missing,
        }
      })
      // 「没有 name 属性」只有在**语言文件里也没有对应键**时才算缺口 ——
      // 有条目（哪怕作者故意留空）就说明显示名已经处理过了，再报就是噪音。
      const allLanguageKeys = new Set<string>()
      for (const language of languages) for (const key of language.keys) allLanguageKeys.add(key.toLowerCase())
      const implicitNameKeys = entries
        .filter((entry) => entry.reason === 'implicit' && !allLanguageKeys.has(entry.key.toLowerCase()))
        .map((entry) => entry.key)

      return {
        ok: true,
        modDir,
        scannedFileCount: scannedFiles.length,
        requiredKeyCount: entries.length,
        missingKeyCount: missingTotal,
        languages: languageReports,
        requiredKeys: sliced.map((entry) => ({ key: entry.key, source: entry.source, reason: entry.reason })),
        implicitNameKeys,
        warnings,
      }
    },
  }))

  // ── barotrauma_translate ─────────────────────────────────────────────────
  registerTool(ctx, defineTool({
    name: 'barotrauma_translate',
    description:
      '把**调用方提供的译文**写进潜渊症语言文件（<infotexts> 格式）。' +
      'translations 传 { "entityname.X": "显示名" } 这样的键值对；也支持 entries 传 [{key,text}]。' +
      '不传译文时只返回待翻译清单，**不会自动编造译文**。语言文件不存在会自动创建并登记进 filelist。' +
      '已有键不会被覆盖，保护你已有的翻译。',
    parameters: {
      modDir: { type: 'string', required: true, description: 'mod 根目录。' },
      locale: { type: 'string', description: '目标语言，如 zh-cn / en / ru / ko，默认 zh-cn。' },
      translations: { type: 'object', additionalProperties: true, description: '译文键值对：{ "entityname.PlasmaRifle": "等离子步枪" }。' },
      entries: { type: 'array', items: { type: 'object', additionalProperties: true, properties: {} }, description: '译文列表：[{key, text}]，与 translations 等价。' },
      createIfMissing: { type: 'boolean', description: '语言文件不存在时是否创建，默认 true。' },
      dryRun: { type: 'boolean', description: '只统计不写盘，默认 false。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          modDir: { type: 'string', required: true },
          locale: { type: 'string', required: true },
          languageFile: { type: 'string', required: true },
          created: { type: 'boolean', required: true },
          filelistAdded: { type: 'boolean', required: true },
          submitted: { type: 'integer', required: true },
          written: { type: 'integer', required: true },
          skipped: { type: 'array', required: true, items: { type: 'string' } },
          requiredKeys: { type: 'array', required: true, items: { type: 'string' } },
          dryRun: { type: 'boolean', required: true },
          warnings: { type: 'array', required: true, items: { type: 'string' } },
        },
      },
      render: (_args, value) => {
        const lines = [
          `本地化写入：${value.languageFile || '(未确定)'}（${value.locale}）`,
          value.created ? '语言文件：新建' : '语言文件：已存在',
          `提交 ${value.submitted} 条，实际写入 ${value.written} 条`,
        ]
        if (value.skipped.length > 0) {
          lines.push(`跳过 ${value.skipped.length} 条（键已存在，保留原译文）：`)
          for (const key of value.skipped.slice(0, 15)) lines.push(`   = ${key}`)
        }
        if (value.requiredKeys.length > 0) {
          lines.push('', `仍需翻译的键 ${value.requiredKeys.length} 个：`, ...value.requiredKeys.slice(0, 25).map((key) => `   - ${key}`))
        }
        lines.push(...value.warnings.map((warning) => `⚠️ ${warning}`))
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    timeoutMs: 60_000,
    isConcurrencySafe: () => false,
    async execute(args) {
      const modDir = asString(args.modDir).trim()
      if (modDir === '') throw new BarotraumaError('MISSING_ARGUMENT', '缺少必填参数 modDir')
      const localeKey = normalizeLocale(asString(args.locale, 'zh-cn'))
      if (localeKey === null) {
        throw new BarotraumaError('INVALID_ARGUMENT', `认不出的语言：${asString(args.locale)}（可用：${Object.keys(LANGUAGES).join(' / ')}）`)
      }
      const language = LANGUAGES[localeKey]
      if (language === undefined) {
        throw new BarotraumaError('INVALID_ARGUMENT', `语言表缺少 ${localeKey}`)
      }

      const warnings: string[] = []
      // 收集译文
      const translations: Array<{ key: string; text: string }> = []
      const push = (key: unknown, text: unknown): void => {
        const k = asString(key).trim()
        const t = asString(text)
        if (k !== '' ) translations.push({ key: k, text: t })
      }
      const map = asRecord(args.translations)
      for (const [key, value] of Object.entries(map)) push(key, value)
      for (const raw of asArray(args.entries)) {
        const record = asRecord(raw)
        push(record['key'], record['text'])
      }

      const { entries } = await scanEntries(modDir)
      const languages = await readLanguageFiles(modDir)
      const sameLocale = languages.find((item) => item.locale.toLowerCase() === language.language.toLowerCase())

      // 目标语言文件：优先已有的同语言文件，否则按惯例建一个
      let languageFile = sameLocale?.file ?? ''
      let created = false
      const dryRun = asBoolean(args.dryRun, false)
      let filelistAdded = false

      if (languageFile === '' ) {
        if (!asBoolean(args.createIfMissing, true)) {
          throw new BarotraumaError('NO_LANGUAGE_FILE', `mod 里没有 ${language.language} 语言文件，且 createIfMissing=false。`)
        }
        languageFile = `Localization/${localeKey === 'zh-cn' ? 'SimplifiedChinese' : localeKey}.xml`
      }

      const target = resolveInside(modDir, languageFile)
      const exists = await pathExists(target)
      if (!exists) {
        if (!dryRun) {
          await ensureDir(join(modDir, 'Localization'))
          await writeFileEnsured(target, buildLanguageFile({
            language: language.language,
            translatedName: language.translatedName,
            noWhitespace: language.noWhitespace,
            entries: [],
          }))
          created = true
          const registration = await ensureRegistered(modDir, CONTENT_TAGS.text, languageFile)
          filelistAdded = registration.added
        } else {
          created = true
        }
        warnings.push(`语言文件 ${languageFile} 原不存在，已按惯例创建${dryRun ? '（dry-run 未写盘）' : ''}。`)
      }

      // 已存在的键（任意语言文件里的键都算已翻译过）；统一小写比较
      const existingKeys = new Set<string>()
      for (const item of languages) for (const key of item.keys) existingKeys.add(key.toLowerCase())

      const toWrite: Array<{ key: string; text: string }> = []
      const skipped: string[] = []
      for (const entry of translations) {
        if (existingKeys.has(entry.key.toLowerCase())) {
          skipped.push(entry.key)
          continue
        }
        if (entry.text.trim() === '') {
          skipped.push(`${entry.key}（空译文）`)
          continue
        }
        toWrite.push(entry)
      }

      let written = 0
      if (!dryRun && toWrite.length > 0) {
        written = await appendLanguageEntries(target, toWrite)
      }

      // 仍缺的键
      const nowDefined = new Set(existingKeys)
      for (const entry of toWrite) nowDefined.add(entry.key.toLowerCase())
      const requiredKeys = entries.filter((entry) => !nowDefined.has(entry.key.toLowerCase())).map((entry) => entry.key)

      if (translations.length === 0) {
        warnings.push('没有传入 translations —— 只返回清单，未写入任何内容（本插件不会自动编造译文）。')
      }

      return {
        ok: true,
        modDir,
        locale: language.language,
        languageFile,
        created,
        filelistAdded,
        submitted: translations.length,
        written,
        skipped,
        requiredKeys,
        dryRun,
        warnings,
      }
    },
  }))
}

/** 供 validate 复用：扫描需要本地化的键（`parseLanguageKeys` 已在上方直接导出）。 */
export { scanEntries }

/** 空语言文件文本（供测试）。 */
export const EMPTY_LANGUAGE_TEMPLATE = `${XML_HEADER}\n<infotexts language="Simplified Chinese" nowhitespace="true" translatedname="中文(简体)">\n</infotexts>\n`

/** 供测试复用。 */
export async function readUtf8(path: string): Promise<string> {
  return await readFile(path, 'utf8')
}
