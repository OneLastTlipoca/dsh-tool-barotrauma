/**
 * dsh-tool-barotrauma — Barotrauma XML 文本构造。
 *
 * 所有字段名与元素名都来自本机真实 mod 实测（见 `refs/reference.md`），
 * 未取证的字段一律不写，宁缺毋滥 —— 多写一个不存在的属性只会让 mod 加载失败。
 * @module dsh-tool-barotrauma/xml
 */

import { xmlAttr, xmlEscape } from './util.js'

/** XML 声明（真实 mod 全部使用小写 utf-8）。 */
export const XML_HEADER = '<?xml version="1.0" encoding="utf-8"?>'

/** 内容包清单里的一条记录；`tag` 是内容类型元素名，`file` 是相对 mod 根的路径。 */
export interface FilelistEntry {
  tag: string
  file: string
}

/**
 * 内容类型 → filelist 元素名。
 * 实测出现过的 28 种里挑出生成器会用到的；元素名大小写不敏感，这里统一用官方常见写法。
 */
export const CONTENT_TAGS = {
  item: 'Item',
  character: 'Character',
  randomEvents: 'RandomEvents',
  text: 'Text',
  afflictions: 'Afflictions',
  sounds: 'Sounds',
  particles: 'Particles',
  submarine: 'Submarine',
  other: 'Other',
} as const

export type ContentKind = keyof typeof CONTENT_TAGS

/**
 * **官方内容类型全表**（45 个）。
 *
 * 来源：`https://regalis11.github.io/BaroModDoc/Intro/ContentTypes.html` 小节「Content types」
 * （原文注明 "As of v0.17.12.0"），配合「ContentPackages · File list」的硬约束：
 * *"The name of each of these child elements must be one of the content types"*。
 *
 * 也就是说 **filelist.xml 的子元素名写错 → 整个内容包加载失败**，
 * 所以这是必须校验的一项（`barotrauma_validate` 的 `FILELIST_UNKNOWN_TYPE`）。
 *
 * 注意：`Ragdolls` / `Animations` / `Names` / `Lua` / `CSharp` / `Config`
 * **都不在这个清单里** —— 它们既不是内容类型也不是 filelist 子元素。
 * （Lua/CSharp「不需登记」的依据在 LuaCsForBarotrauma 文档，不在官方 modding 文档里。）
 */
export const CONTENT_TYPES: readonly string[] = [
  // 编辑器创建/编辑
  'Submarine', 'BeaconStation', 'EnemySubmarine', 'Outpost', 'OutpostModule', 'Wreck',
  // 半自动生成文档
  'Item', 'Character', 'Afflictions',
  // 全自动生成文档
  'BackgroundCreaturePrefabs', 'BallastFlora', 'CaveGenerationParameters', 'Corpses', 'Decals',
  'EventManagerSettings', 'Factions', 'ItemAssembly', 'Jobs', 'LevelGenerationParameters',
  'LevelObjectPrefabs', 'LocationTypes', 'MapGenerationParameters', 'Missions', 'NPCConversations',
  'NPCPersonalityTraits', 'NPCSets', 'Orders', 'OutpostConfig', 'Particles', 'RandomEvents',
  'RuinConfig', 'ServerExecutable', 'SkillSettings', 'Sounds', 'StartItems', 'Structure',
  'Talents', 'TalentTrees', 'Text', 'TraitorMissions', 'Tutorials', 'UIStyle', 'UpgradeModules',
  'WreckAIConfig', 'Other',
]

/** 内容类型的 lower 集合（Barotrauma 的 XML 名称大小写不敏感）。 */
export const CONTENT_TYPES_LOWER: ReadonlySet<string> = new Set(
  CONTENT_TYPES.map((name) => name.toLowerCase()),
)

/** 构造 `filelist.xml` 全文。 */
export function buildFilelist(input: {
  name: string
  modVersion: string
  gameVersion: string
  corePackage?: boolean
  entries: readonly FilelistEntry[]
}): string {
  const attrs = [
    `name="${xmlAttr(input.name)}"`,
    `modversion="${xmlAttr(input.modVersion)}"`,
    `corepackage="${input.corePackage === true ? 'True' : 'False'}"`,
    `gameversion="${xmlAttr(input.gameVersion)}"`,
  ].join(' ')
  const body = input.entries
    .map((entry) => `  <${entry.tag} file="%ModDir%/${xmlAttr(entry.file)}" />`)
    .join('\n')
  return `${XML_HEADER}\n<contentpackage ${attrs}>\n${body}\n</contentpackage>\n`
}

/** 构造本地化语言文件全文（`<infotexts>` 根）。 */
export function buildLanguageFile(input: {
  language: string
  translatedName: string
  noWhitespace: boolean
  entries: ReadonlyArray<{ key: string; text: string }>
}): string {
  const lines = [
    XML_HEADER,
    `<infotexts language="${xmlAttr(input.language)}" nowhitespace="${input.noWhitespace ? 'true' : 'false'}" translatedname="${xmlAttr(input.translatedName)}">`,
  ]
  for (const entry of input.entries) {
    lines.push(`  <${entry.key}>${xmlEscape(entry.text)}</${entry.key}>`)
  }
  lines.push('</infotexts>')
  return `${lines.join('\n')}\n`
}

/**
 * 语言区域 → (language, translatedname, nowhitespace)。
 * 三条实测来源：English / Korean / Simplified Chinese（见 reference.md G.2）。
 */
export const LANGUAGES: Record<string, { language: string; translatedName: string; noWhitespace: boolean }> = {
  en: { language: 'English', translatedName: 'English', noWhitespace: false },
  'zh-cn': { language: 'Simplified Chinese', translatedName: '中文(简体)', noWhitespace: true },
  'zh-tw': { language: 'Traditional Chinese', translatedName: '中文(繁體)', noWhitespace: true },
  ko: { language: 'Korean', translatedName: '한국어', noWhitespace: false },
  ru: { language: 'Russian', translatedName: 'Русский', noWhitespace: false },
  de: { language: 'German', translatedName: 'Deutsch', noWhitespace: false },
  fr: { language: 'French', translatedName: 'Français', noWhitespace: false },
  es: { language: 'Spanish', translatedName: 'Español', noWhitespace: false },
  pt: { language: 'Portuguese', translatedName: 'Português', noWhitespace: false },
  pl: { language: 'Polish', translatedName: 'Polski', noWhitespace: false },
  tr: { language: 'Turkish', translatedName: 'Türkçe', noWhitespace: false },
  ja: { language: 'Japanese', translatedName: '日本語', noWhitespace: true },
}

/** 把语言代码规整成 LANGUAGES 的键；认不出返回 null。 */
export function normalizeLocale(input: string): string | null {
  const raw = input.trim().toLowerCase().replace(/_/g, '-')
  if (raw === '') return null
  if (raw in LANGUAGES) return raw
  // zh-Hans / zh-CN / zh 都归到简中
  if (raw.startsWith('zh')) {
    if (raw.includes('tw') || raw.includes('hk') || raw.includes('hant')) return 'zh-tw'
    return 'zh-cn'
  }
  const base = raw.split('-')[0] ?? ''
  return base in LANGUAGES ? base : null
}

/** 生成器统一使用的 `name=""` 写法：显示名走本地化键 `entityname.<identifier>`。 */
export const LOCALIZED_NAME = ''

/** 本地化键：物品名。 */
export function entityNameKey(identifier: string): string {
  return `entityname.${identifier}`
}

/** 本地化键：物品描述。 */
export function entityDescriptionKey(identifier: string): string {
  return `entitydescription.${identifier}`
}

/** 本地化键：状态效果名。 */
export function afflictionNameKey(identifier: string): string {
  return `afflictionname.${identifier}`
}

/** 本地化键：状态效果描述。 */
export function afflictionDescriptionKey(identifier: string): string {
  return `afflictiondescription.${identifier}`
}

/** 本地化键：角色/物种名。 */
export function characterNameKey(speciesName: string): string {
  return `character.${speciesName}`
}

/** 本地化键：事件文本（`eventtext.<key>`）。 */
export function eventTextKey(key: string): string {
  return `eventtext.${key}`
}
