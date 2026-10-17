/**
 * dsh-tool-barotrauma — 通用工具函数。
 *
 * 约定：所有面向模型的入口参数都是 `unknown`，必须在这里显式收窄，
 * 不允许把未校验的值直接拼进 XML 或路径。
 * @module dsh-tool-barotrauma/util
 */

import type { Context } from '@deepseek-ai/cordis'
import type { ToolDefinition } from '@deepseek-ai/dsh-tools'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, normalize, resolve, sep } from 'node:path'

/** 本插件抛出的结构化错误。 */
export class BarotraumaError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'BarotraumaError'
    this.code = code
  }
}

// ── 模型入参收窄 ─────────────────────────────────────────────────────────────

/** 收窄为字符串；非字符串时用 fallback。 */
export function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

/** 收窄为有限数字。 */
export function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

/** 收窄为布尔。 */
export function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

/** 收窄为数组；非数组时返回空数组。 */
export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

/** 收窄为对象；非对象时返回空对象。 */
export function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

/** 收窄为字符串数组，过滤空串。 */
export function asStringArray(value: unknown): string[] {
  return asArray(value)
    .map((item) => asString(item).trim())
    .filter((item) => item !== '')
}

/** 必填字符串；缺失即抛错，错误信息指明字段名。 */
export function requireString(value: unknown, field: string): string {
  const text = asString(value).trim()
  if (text === '') {
    throw new BarotraumaError('MISSING_ARGUMENT', `缺少必填参数 ${field}`)
  }
  return text
}

/** 取整并夹在 [min, max] 区间内。 */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Math.trunc(asNumber(value, fallback))
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

/** 收窄到给定的字面量集合。 */
export function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T, field: string): T {
  const raw = asString(value, fallback).trim()
  if ((allowed as readonly string[]).includes(raw)) return raw as T
  throw new BarotraumaError('INVALID_ARGUMENT', `${field} 不合法：${raw}（可用：${allowed.join(' / ')}）`)
}

// ── 文件系统 ─────────────────────────────────────────────────────────────────

/** 确保目录存在（递归创建）。 */
export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true })
}

/** 路径是否存在。 */
export async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target)
    return true
  } catch {
    return false
  }
}

/** 读文本；失败返回 fallback。 */
export async function readTextSafe(target: string, fallback = ''): Promise<string> {
  try {
    return await readFile(target, 'utf8')
  } catch {
    return fallback
  }
}

/** 写文本并自动建父目录。 */
export async function writeFileEnsured(target: string, content: string): Promise<void> {
  await ensureDir(dirname(target))
  await writeFile(target, content, 'utf8')
}

/** 列出目录下的子目录绝对路径；目录不存在时返回空数组。 */
export async function listDirs(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries.filter((entry) => entry.isDirectory()).map((entry) => resolve(dir, entry.name))
  } catch {
    return []
  }
}

/** 列出目录下的文件绝对路径；目录不存在时返回空数组。 */
export async function listFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries.filter((entry) => entry.isFile()).map((entry) => resolve(dir, entry.name))
  } catch {
    return []
  }
}

/**
 * 把若干路径片段拼到 base 之下，并拒绝逃逸出 base 的相对路径（`..`）。
 * 生成器会用模型给的 slug 建目录，必须挡住路径穿越。
 */
export function resolveInside(base: string, ...parts: string[]): string {
  const root = resolve(base)
  const target = resolve(root, ...parts)
  const rootWithSep = root.endsWith(sep) ? root : root + sep
  if (target !== root && !target.startsWith(rootWithSep)) {
    throw new BarotraumaError('PATH_ESCAPE', `路径逃逸：${parts.join('/')} 不在 ${root} 之内`)
  }
  return target
}

/** 绝对路径原样返回，相对路径按 cwd 解析。 */
export function toAbsolute(target: string): string {
  return isAbsolute(target) ? normalize(target) : resolve(process.cwd(), target)
}

// ── 文本处理 ─────────────────────────────────────────────────────────────────

/** 转 kebab/snake 友好的 slug，只保留 [a-z0-9_-]。 */
export function slugify(input: string, fallback = 'unnamed'): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return slug === '' ? fallback : slug
}

/**
 * 潜渊症 identifier 用的 PascalCase 片段。
 * 中文等非 ASCII 会被丢弃，因此调用方必须检查返回值是否为空。
 */
export function pascalCase(input: string): string {
  const parts = input.trim().split(/[^A-Za-z0-9]+/).filter((part) => part !== '')
  if (parts.length === 0) return ''
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/** XML 文本转义（`&` 必须最先替换）。 */
export function xmlEscape(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** XML 属性值转义（额外处理引号）。 */
export function xmlAttr(input: string): string {
  return xmlEscape(input).replace(/"/g, '&quot;')
}

/** 当前时间（ISO 8601，秒级）。 */
export function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/** 人类可读的字节数。 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * 收集一段 XML 里所有资源引用，两种都要收：
 *   - `%ModDir%/...`：mod 自己的资源（`%ModDir%` = **mod 根**，不是 XML 所在目录）；
 *     这里不要求带扩展名，因为真实 mod 也用它引用**目录**（`ragdolls folder="%ModDir%/…/Ragdolls/"`）。
 *   - `Content/...`：引用**原版游戏**资源。
 *
 * **不能按空白切分**：真实 mod 的文件名里含空格（如 `Sounds/雪叶子 - 天街桜.ogg`），
 * 按空白切会把路径截断成 `Sounds/雪叶子`，进而报出"引用的文件不存在"这种假问题。
 * 这里改为走**属性值解析**，并按「下一个路径起点」划界。
 */
export function collectAssetReferences(raw: string): string[] {
  const result = new Set<string>()
  const attrPattern = /[A-Za-z_][\w.:-]*\s*=\s*"([^"]*)"/g
  let match = attrPattern.exec(raw)
  while (match !== null) {
    for (const path of pathsInAttributeValue(match[1] ?? '')) result.add(path)
    match = attrPattern.exec(raw)
  }
  return [...result]
}

/**
 * 从一个属性值里抽出所有 `%ModDir%/…` 或 `Content/…` 路径。
 *
 * 边界 = 行首 / 空白 / 逗号 / 分号。这样 `%ModDir%/Content/x.png` 里的 `Content/`
 * 不会被误判成第二个路径（它前面是 `/`）。
 */
function pathsInAttributeValue(value: string): string[] {
  const boundary = /(?:^|[\s,;])(%ModDir%\/|Content\/)/g
  const starts: number[] = []
  let match = boundary.exec(value)
  while (match !== null) {
    const prefix = match[1] ?? ''
    starts.push(match.index + match[0].length - prefix.length)
    match = boundary.exec(value)
  }
  const out: string[] = []
  for (let index = 0; index < starts.length; index += 1) {
    const from = starts[index]
    if (from === undefined) continue
    const to = index + 1 < starts.length ? starts[index + 1] : value.length
    const token = value.slice(from, to).trim().replace(/[\s,;]+$/, '')
    if (token !== '') out.push(token)
  }
  return out
}

// ── 插件注册 ─────────────────────────────────────────────────────────────────

/**
 * 注册一个工具，并把「注册动作」绑定到当前 fiber 的 effect 上。
 * 插件卸载时 Cordis 会逐一注销，不需要手工管理 disposer。
 */
export function registerTool(ctx: Context, definition: ToolDefinition): void {
  ctx.effect(() => ctx.tools.register(definition), `tool:${definition.name}`)
}
