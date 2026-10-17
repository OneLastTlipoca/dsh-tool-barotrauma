/**
 * dsh-tool-barotrauma — 内容包读写。
 *
 * 全部走**文本级操作**而不是 XML 序列化，理由：
 *   1. 真实 mod 的 filelist.xml 里存在我们没取证的属性（steamworkshopid / installtime / expectedhash），
 *      序列化会丢掉它们；
 *   2. XML 元素/属性名大小写不敏感，真实 mod 两种写法并存，重排会制造无意义的 diff。
 * 所以策略是「只插入，不重写」。
 * @module dsh-tool-barotrauma/pack-io
 */

import { join } from 'node:path'
import {
  BarotraumaError,
  asString,
  pathExists,
  readTextSafe,
  writeFileEnsured,
} from './util.js'
import { XML_HEADER, type FilelistEntry } from './xml.js'

/** filelist.xml 的解析结果。 */
export interface FilelistDoc {
  path: string
  /** `<contentpackage>` 上的全部属性（原样保留，含我们没取证的）。 */
  attributes: Record<string, string>
  /** 已登记的内容记录。 */
  entries: FilelistEntry[]
  raw: string
}

/** 解析 `<contentpackage ...>` 上的属性（大小写不敏感地保留原名）。 */
function parseAttributes(openTag: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  const pattern = /([A-Za-z_][\w.:-]*)\s*=\s*"([^"]*)"/g
  let match = pattern.exec(openTag)
  while (match !== null) {
    const key = match[1]
    const value = match[2]
    if (key !== undefined && value !== undefined) attributes[key] = value
    match = pattern.exec(openTag)
  }
  return attributes
}

/** 读取并解析 `<modDir>/filelist.xml`。 */
export async function readFilelist(modDir: string): Promise<FilelistDoc> {
  const path = join(modDir, 'filelist.xml')
  const raw = await readTextSafe(path, '')
  if (raw === '') {
    throw new BarotraumaError(
      'NO_FILELIST',
      `${path} 不存在或为空 —— 不是合法内容包。请先用 barotrauma_create_mod 建骨架，或用 barotrauma_detect_env 确认 mod 目录。`,
    )
  }
  const openTag = /<contentpackage\b[^>]*>/i.exec(raw)?.[0] ?? ''
  const entries: FilelistEntry[] = []
  const entryPattern = /<([A-Za-z][\w]*)\s+file\s*=\s*"%ModDir%\/([^"]*)"\s*\/?>/gi
  let match = entryPattern.exec(raw)
  while (match !== null) {
    const tag = match[1]
    const file = match[2]
    if (tag !== undefined && file !== undefined) entries.push({ tag, file })
    match = entryPattern.exec(raw)
  }
  return { path, attributes: parseAttributes(openTag), entries, raw }
}

/** 内容包清单里的 `name` 属性。 */
export function filelistName(doc: FilelistDoc): string {
  return asString(doc.attributes['name'])
}

/** 内容包清单里的 `gameversion` 属性。 */
export function filelistGameVersion(doc: FilelistDoc): string {
  return asString(doc.attributes['gameversion'])
}

/**
 * 确保某文件已登记在 filelist.xml 里；未登记则插入一条记录。
 * 已存在（路径大小写不敏感）时**不重复插入**。
 */
export async function ensureRegistered(
  modDir: string,
  tag: string,
  file: string,
): Promise<{ added: boolean; filelistPath: string }> {
  const doc = await readFilelist(modDir)
  const normalized = file.replace(/\\/g, '/')
  const exists = doc.entries.some(
    (entry) => entry.file.toLowerCase() === normalized.toLowerCase(),
  )
  if (exists) return { added: false, filelistPath: doc.path }

  const line = `  <${tag} file="%ModDir%/${normalized}" />`
  const closingIndex = doc.raw.toLowerCase().lastIndexOf('</contentpackage>')
  if (closingIndex < 0) {
    throw new BarotraumaError('BROKEN_FILELIST', `${doc.path} 里找不到 </contentpackage> 结束标签，文件可能损坏。`)
  }
  const next = `${doc.raw.slice(0, closingIndex).replace(/\s*$/, '\n')}${line}\n${doc.raw.slice(closingIndex)}`
  await writeFileEnsured(doc.path, next)
  return { added: true, filelistPath: doc.path }
}

/** 写入结果。 */
export type AppendOutcome = 'created' | 'appended'

/**
 * 往 XML 内容文件里追加一段区块。
 *
 * - 文件不存在 → 以 `rootTag` 建一个只有一个子区块的新文件；
 * - 文件已存在 → 插到**最后一个** `</rootTag>` 之前（这样 `<override><Items>…` 也能正确处理）。
 */
export async function appendXmlBlock(
  filePath: string,
  block: string,
  rootTag: string,
): Promise<AppendOutcome> {
  const existing = await readTextSafe(filePath, '')
  const indented = block.trimEnd()
  if (existing.trim() === '') {
    await writeFileEnsured(filePath, `${XML_HEADER}\n<${rootTag}>\n${indented}\n</${rootTag}>\n`)
    return 'created'
  }
  const closing = `</${rootTag}>`
  const index = existing.toLowerCase().lastIndexOf(closing.toLowerCase())
  if (index < 0) {
    throw new BarotraumaError(
      'BROKEN_XML_ROOT',
      `${filePath} 里找不到 ${closing}，无法追加。请手工修复该文件的根元素。`,
    )
  }
  const next = `${existing.slice(0, index)}${indented}\n${existing.slice(index)}`
  await writeFileEnsured(filePath, next)
  return 'appended'
}

/**
 * 把一段区块插进某个容器元素（例如 `<EventPrefabs>`）里。
 *
 * - 容器已存在 → 插到**最后一个** `</containerTag>` 之前；
 * - 容器不存在 → 用容器标签包住区块，插到**最后一个** `</rootTag>` 之前；
 * - 文件为空 → 以 `rootTag` 新建。
 *
 * 事件文件需要这个能力：`EventPrefabs` 与 `EventSet` 必须落在同一个 `<Randomevents>` 里，
 * 不能像物品那样简单地往根元素尾部追加。
 */
export async function appendIntoContainer(
  filePath: string,
  block: string,
  containerTag: string,
  rootTag: string,
): Promise<AppendOutcome> {
  const existing = await readTextSafe(filePath, '')
  const indented = block.trimEnd()
  if (existing.trim() === '') {
    await writeFileEnsured(
      filePath,
      `${XML_HEADER}\n<${rootTag}>\n  <${containerTag}>\n${indented}\n  </${containerTag}>\n</${rootTag}>\n`,
    )
    return 'created'
  }

  const containerClosing = `</${containerTag}>`
  const containerIndex = existing.toLowerCase().lastIndexOf(containerClosing.toLowerCase())
  if (containerIndex >= 0) {
    const next = `${existing.slice(0, containerIndex)}${indented}\n${existing.slice(containerIndex)}`
    await writeFileEnsured(filePath, next)
    return 'appended'
  }

  const rootClosing = `</${rootTag}>`
  const rootIndex = existing.toLowerCase().lastIndexOf(rootClosing.toLowerCase())
  if (rootIndex < 0) {
    throw new BarotraumaError(
      'BROKEN_XML_ROOT',
      `${filePath} 里既没有 ${containerClosing} 也没有 ${rootClosing}，无法追加。请手工修复该文件。`,
    )
  }
  const wrapped = `  <${containerTag}>\n${indented}\n  </${containerTag}>\n`
  const next = `${existing.slice(0, rootIndex)}${wrapped}${existing.slice(rootIndex)}`
  await writeFileEnsured(filePath, next)
  return 'appended'
}

/** 在 mod 里找出一个语言文件（filelist 里第一条 `<Text>` 记录）。 */
export async function findLanguageFile(modDir: string): Promise<string | null> {
  const doc = await readFilelist(modDir)
  const text = doc.entries.find((entry) => entry.tag.toLowerCase() === 'text')
  if (text === undefined) return null
  const target = join(modDir, text.file)
  return await pathExists(target) ? target : null
}

/**
 * 往语言文件里补充条目；已存在的键不覆盖。
 * 返回实际写入的条数。
 */
export async function appendLanguageEntries(
  filePath: string,
  entries: ReadonlyArray<{ key: string; text: string }>,
): Promise<number> {
  const existing = await readTextSafe(filePath, '')
  if (existing.trim() === '') {
    throw new BarotraumaError('BROKEN_LANGUAGE_FILE', `${filePath} 不存在或为空。`)
  }
  const closingIndex = existing.toLowerCase().lastIndexOf('</infotexts>')
  if (closingIndex < 0) {
    throw new BarotraumaError('BROKEN_LANGUAGE_FILE', `${filePath} 里找不到 </infotexts>。`)
  }
  const additions: string[] = []
  for (const entry of entries) {
    const key = entry.key.trim()
    if (key === '') continue
    // 键已存在就跳过（不覆盖译者已有的工作）
    const marker = `<${key}>`
    if (existing.toLowerCase().includes(marker.toLowerCase())) continue
    additions.push(`  <${key}>${escapeText(entry.text)}</${key}>`)
  }
  if (additions.length === 0) return 0
  const next = `${existing.slice(0, closingIndex)}${additions.join('\n')}\n${existing.slice(closingIndex)}`
  await writeFileEnsured(filePath, next)
  return additions.length
}

/** XML 文本转义（本地副本，避免 pack-io 依赖 xml 的转义命名）。 */
function escapeText(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** 列出 mod 目录下所有 `.xml` 文件（相对 mod 根，正斜杠）。 */
export async function listModXmlFiles(modDir: string, maxDepth = 4): Promise<string[]> {
  const { readdir } = await import('node:fs/promises')
  const result: string[] = []
  async function walk(dir: string, prefix: string, depth: number): Promise<void> {
    if (depth > maxDepth) return
    let dirents
    try {
      dirents = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const dirent of dirents) {
      const rel = prefix === '' ? dirent.name : `${prefix}/${dirent.name}`
      if (dirent.isDirectory()) {
        if (dirent.name.startsWith('.')) continue
        await walk(join(dir, dirent.name), rel, depth + 1)
      } else if (dirent.isFile() && dirent.name.toLowerCase().endsWith('.xml')) {
        result.push(rel)
      }
    }
  }
  await walk(modDir, '', 0)
  return result.sort()
}
