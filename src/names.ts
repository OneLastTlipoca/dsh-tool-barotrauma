/**
 * dsh-tool-barotrauma — XML 名称校对（拼写检测）。
 *
 * 潜渊症对**拼错的元素名/属性名通常静默忽略**：写错一个属性，游戏不会报错，
 * 只是那个功能悄悄不生效 —— 这是最难排查的一类 bug。
 *
 * **基准的选择很关键**：一开始用合作者那份社区词表（517 个属性名）做基准，
 * 实测全量 LocalMods 会刷出 **1600+ 条误报** —— 因为原版实际用到的属性名有近 3000 个，
 * 大量正常属性与词表里某个名字只差 1-2 个字符。
 * 所以这里改用**原版游戏 XML 抽取的名称全集**（`known-names.ts`）作为基准，
 * 社区词表只负责中文对照与给出建议。
 *
 * 即便如此，仍坚持「**未收录 ≠ 非法**」：只在名称与已知名称高度相似时才提示。
 * @module dsh-tool-barotrauma/names
 */

import { KNOWN_ATTRS_VANILLA, KNOWN_TAGS_VANILLA, KNOWN_VALUES_VANILLA } from './known-names.js'
import {
  ATTR_EN_TO_ZH,
  ATTR_ZH_TO_EN,
  KNOWN_EN_ATTRS,
  KNOWN_EN_TAGS,
  KNOWN_EN_VALUES,
  TAG_EN_TO_ZH,
  TAG_ZH_TO_EN,
  VALUE_ATTRS_ZH,
  VALUE_EN_TO_ZH,
  VALUE_ZH_TO_EN,
} from './vocabulary.js'

/** 一个名称索引：精确查找表 + 按长度分桶（近似匹配只扫相邻长度的桶）。 */
export interface NameIndex {
  exact: ReadonlyMap<string, string>
  byLength: ReadonlyMap<number, ReadonlyArray<{ key: string; display: string }>>
}

/**
 * 构建名称索引。
 *
 * 按长度分桶是**性能必需**：原版有上万个元素名，逐条算编辑距离会让大 mod 卡住；
 * 而编辑距离 ≤2 只可能出现在长度差 ≤2 的名称之间，所以只扫 L-2..L+2 三个桶。
 */
export function buildNameIndex(names: Iterable<string>): NameIndex {
  const exact = new Map<string, string>()
  const buckets = new Map<number, Array<{ key: string; display: string }>>()
  for (const name of names) {
    const key = name.toLowerCase()
    if (exact.has(key)) continue
    exact.set(key, name)
    const bucket = buckets.get(key.length)
    if (bucket === undefined) buckets.set(key.length, [{ key, display: name }])
    else bucket.push({ key, display: name })
  }
  return { exact, byLength: buckets }
}

/** 合并多个名称源的索引（原版全集 ∪ 社区词表）。 */
function buildMergedIndex(...sources: Array<Iterable<string>>): NameIndex {
  const all = new Set<string>()
  for (const source of sources) for (const name of source) all.add(name)
  return buildNameIndex(all)
}

/** 元素名基准（原版全集 ∪ 社区词表）。 */
export const TAG_INDEX: NameIndex = buildMergedIndex(KNOWN_TAGS_VANILLA, KNOWN_EN_TAGS)

/** 属性名基准（原版全集 ∪ 社区词表）。 */
export const ATTR_INDEX: NameIndex = buildMergedIndex(KNOWN_ATTRS_VANILLA, KNOWN_EN_ATTRS)

/** 枚举取值基准（原版全集 ∪ 社区词表）。 */
export const VALUE_INDEX: NameIndex = buildMergedIndex(KNOWN_VALUES_VANILLA, KNOWN_EN_VALUES)

/** 名称对照索引（lower → 目标名），供中英互转用。社区词表。 */
function buildTranslation(record: Record<string, string>): Map<string, string> {
  const map = new Map<string, string>()
  for (const [from, to] of Object.entries(record)) map.set(from.toLowerCase(), to)
  return map
}

/** 元素名：英文 → 中文（lower 键）。 */
export const TAG_EN_TO_ZH_INDEX: ReadonlyMap<string, string> = buildTranslation(TAG_EN_TO_ZH)

/** 元素名：中文 → 英文（lower 键，中文不受影响）。 */
export const TAG_ZH_TO_EN_INDEX: ReadonlyMap<string, string> = buildTranslation(TAG_ZH_TO_EN)

/** 属性名：英文 → 中文（lower 键）。 */
export const ATTR_EN_TO_ZH_INDEX: ReadonlyMap<string, string> = buildTranslation(ATTR_EN_TO_ZH)

/** 属性名：中文 → 英文（lower 键）。 */
export const ATTR_ZH_TO_EN_INDEX: ReadonlyMap<string, string> = buildTranslation(ATTR_ZH_TO_EN)

/** 枚举值：英文 → 中文（lower 键）。 */
export const VALUE_EN_TO_ZH_INDEX: ReadonlyMap<string, string> = buildTranslation(VALUE_EN_TO_ZH)

/** 枚举值：中文 → 英文（lower 键）。 */
export const VALUE_ZH_TO_EN_INDEX: ReadonlyMap<string, string> = buildTranslation(VALUE_ZH_TO_EN)

/**
 * 值需要做枚举映射的属性集合（英文名，lower）。
 *
 * 原工具里 `VAL_ATTRS` 定义了却没用，导致**所有**属性的值都被逐词映射，
 * 自由文本（`name` / `description` / `text`）可能被污染。这里把白名单真正用起来。
 */
export const VALUE_ATTR_INDEX: ReadonlySet<string> = (() => {
  const set = new Set<string>()
  for (const zh of VALUE_ATTRS_ZH) {
    const en = ATTR_ZH_TO_EN[zh]
    if (en !== undefined) set.add(en.toLowerCase())
    set.add(zh.toLowerCase())
  }
  return set
})()

/**
 * 有界编辑距离（Levenshtein）。
 * 超过 `max` 立刻返回 `max + 1`，避免在长字符串上做无谓计算。
 */
export function editDistance(a: string, b: string, max: number): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1
  let previous = new Array<number>(b.length + 1)
  let current = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j += 1) previous[j] = j
  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i
    let rowMin = current[0] ?? 0
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const deletion = (previous[j] ?? 0) + 1
      const insertion = (current[j - 1] ?? 0) + 1
      const substitution = (previous[j - 1] ?? 0) + cost
      const value = Math.min(deletion, insertion, substitution)
      current[j] = value
      if (value < rowMin) rowMin = value
    }
    if (rowMin > max) return max + 1
    const swap = previous
    previous = current
    current = swap
  }
  return previous[b.length] ?? max + 1
}

/** 名称检查结果。 */
export interface NameCheck {
  /** 是否精确命中已知名称（大小写不敏感）。 */
  known: boolean
  /** 疑似正确写法（只在 `known=false` 且足够相似时给出）。 */
  suggestion: string | null
  /** 与 suggestion 的编辑距离。 */
  distance: number
}

/** 短名称容错更严：长度 ≤ 5 只允许距离 1。 */
function thresholdFor(name: string, explicit?: number): number {
  if (explicit !== undefined) return explicit
  return name.length <= 5 ? 1 : 2
}

/**
 * 检查一个名称是否疑似拼写错误。
 *
 * 命中规则：
 *   - 大小写不敏感地存在于基准 → `known: true`（Barotrauma 名称大小写不敏感，不报）
 *   - 不在基准，但存在编辑距离 ≤ 阈值的已知名称 → 给出 `suggestion`
 *   - 不在基准且没有相似项 → `known: false, suggestion: null`（**不报**）
 */
export function checkName(name: string, index: NameIndex, explicitThreshold?: number): NameCheck {
  const key = name.toLowerCase()
  const exact = index.exact.get(key)
  if (exact !== undefined) return { known: true, suggestion: null, distance: 0 }

  const max = thresholdFor(key, explicitThreshold)
  let best: string | null = null
  let bestDistance = max + 1
  for (let length = key.length - max; length <= key.length + max; length += 1) {
    const bucket = index.byLength.get(length)
    if (bucket === undefined) continue
    for (const entry of bucket) {
      const distance = editDistance(key, entry.key, max)
      if (distance < bestDistance) {
        bestDistance = distance
        best = entry.display
        if (distance === 1) return { known: false, suggestion: best, distance: 1 }
      }
    }
  }
  if (best === null || bestDistance > max) return { known: false, suggestion: null, distance: bestDistance }
  return { known: false, suggestion: best, distance: bestDistance }
}

/**
 * 把一段属性值里的枚举词做中英映射。
 *
 * 只应在**值需要映射的属性**上调用（见 {@link VALUE_ATTR_INDEX}），
 * 否则自由文本会被破坏。保留 `,` 与 `+` 分隔符的原始形式。
 */
export function mapValueTokens(value: string, map: ReadonlyMap<string, string>): string {
  return value
    .split(/([,+])/)
    .map((part) => {
      if (part === ',' || part === '+') return part
      return part
        .split(' ')
        .map((token) => map.get(token.toLowerCase()) ?? token)
        .join(' ')
    })
    .join('')
}
