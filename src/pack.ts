/**
 * dsh-tool-barotrauma — 阶段五之二：打包与发布（`barotrauma_pack` / `barotrauma_publish`）。
 *
 * 说明两件事：
 *   1. **创意工坊上传是在游戏里做的**（Mods → Publish 标签），没有公开的免登录上传接口。
 *      所以 `barotrauma_publish` 产出的是「可直接粘贴的发布文案 + 逐步操作清单」，不代传。
 *   2. 打包用**自带的最小 ZIP 写入器**（store 模式，不压缩），不依赖任何外部库或系统工具。
 *      原因：插件运行在 DSH 宿主进程里，不能假设有 sharp/7z/PowerShell 可用。
 * @module dsh-tool-barotrauma/pack
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import { readdir, readFile, stat } from 'node:fs/promises'
import { basename, join, relative } from 'node:path'
import type { BarotraumaPluginConfig } from './config.js'
import { readFilelist } from './pack-io.js'
import {
  asBoolean,
  asString,
  asStringArray,
  BarotraumaError,
  ensureDir,
  formatBytes,
  nowIso,
  pathExists,
  registerTool,
  resolveInside,
  writeFileEnsured,
} from './util.js'

// ── 最小 ZIP 写入器（store 模式） ────────────────────────────────────────────

/** CRC32 查表。 */
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = (c & 1) !== 0 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

/** 计算 CRC32。 */
function crc32(data: Uint8Array): number {
  let c = 0xFFFFFFFF
  for (const byte of data) {
    const index = (c ^ byte) & 0xFF
    c = (CRC_TABLE[index] ?? 0) ^ (c >>> 8)
  }
  return (c ^ 0xFFFFFFFF) >>> 0
}

/** 把 Date 转成 DOS 时间/日期。 */
function dosDateTime(date: Date): { time: number; date: number } {
  const time = ((date.getHours() & 0x1F) << 11) | ((date.getMinutes() & 0x3F) << 5) | ((Math.floor(date.getSeconds() / 2)) & 0x1F)
  const day = (((date.getFullYear() - 1980) & 0x7F) << 9) | (((date.getMonth() + 1) & 0x0F) << 5) | (date.getDate() & 0x1F)
  return { time, date: day }
}

/** 写入 16 位小端。 */
function u16(value: number): number[] {
  return [value & 0xFF, (value >> 8) & 0xFF]
}

/** 写入 32 位小端。 */
function u32(value: number): number[] {
  return [value & 0xFF, (value >> 8) & 0xFF, (value >> 16) & 0xFF, (value >>> 24) & 0xFF]
}

/** 打包：把 `entries`（zip 内路径 → 内容）写成 zip 字节。 */
function buildZip(entries: ReadonlyArray<{ name: string; data: Uint8Array }>, modified: Date): Uint8Array {
  const { time, date } = dosDateTime(modified)
  const chunks: number[] = []
  const central: number[] = []

  for (const entry of entries) {
    const nameBytes = [...Buffer.from(entry.name, 'utf8')]
    const crc = crc32(entry.data)
    const size = entry.data.length
    const offset = chunks.length

    // local file header
    chunks.push(...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(time), ...u16(date))
    chunks.push(...u32(crc), ...u32(size), ...u32(size), ...u16(nameBytes.length), ...u16(0))
    chunks.push(...nameBytes, ...entry.data)

    // central directory header
    central.push(...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(time), ...u16(date))
    central.push(...u32(crc), ...u32(size), ...u32(size), ...u16(nameBytes.length))
    central.push(...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset))
    central.push(...nameBytes)
  }

  const centralOffset = chunks.length
  chunks.push(...central)
  chunks.push(
    ...u32(0x06054b50), ...u16(0), ...u16(0),
    ...u16(entries.length), ...u16(entries.length),
    ...u32(central.length), ...u32(centralOffset), ...u16(0),
  )
  return new Uint8Array(chunks)
}

/** 递归收集一个目录下的所有文件（返回 zip 内路径与绝对路径）。 */
async function collectFiles(
  root: string,
  prefix: string,
  skip: readonly string[],
  depth = 0,
): Promise<Array<{ name: string; absolute: string; size: number }>> {
  if (depth > 8) return []
  const result: Array<{ name: string; absolute: string; size: number }> = []
  let dirents
  try {
    dirents = await readdir(root, { withFileTypes: true })
  } catch {
    return result
  }
  for (const dirent of dirents) {
    const absolute = join(root, dirent.name)
    const name = prefix === '' ? dirent.name : `${prefix}/${dirent.name}`
    if (skip.some((pattern) => name === pattern || name.startsWith(`${pattern}/`) || dirent.name === pattern)) continue
    if (dirent.isDirectory()) {
      result.push(...await collectFiles(absolute, name, skip, depth + 1))
    } else if (dirent.isFile()) {
      const info = await stat(absolute)
      result.push({ name, absolute, size: info.size })
    }
  }
  return result
}

/** 注册打包与发布工具。 */
export function registerPackTools(ctx: Context, _config: BarotraumaPluginConfig): void {
  // ── barotrauma_pack ──────────────────────────────────────────────────────
  registerTool(ctx, defineTool({
    name: 'barotrauma_pack',
    description:
      '把 mod 目录打包成可直接分发的 zip（内含 mod 顶层目录，解压进 LocalMods 即可用）。' +
      '使用自带的最小 ZIP 写入器（store 模式），不依赖 7z/PowerShell 等外部工具。' +
      '可选把预览图复制成 PreviewImage.png（创意工坊预览用，1.13.x 的真实文件名是 PreviewImage.png 而不是 preview.png）。',
    parameters: {
      modDir: { type: 'string', required: true, description: 'mod 根目录。' },
      outputDir: { type: 'string', description: 'zip 输出目录，默认 <modDir>/dist。' },
      zipName: { type: 'string', description: 'zip 文件名（不含 .zip），默认取 mod 目录名。' },
      includePreview: { type: 'string', description: '预览图源文件绝对路径；给了就复制成 mod 内的 PreviewImage.png 并一起打包。' },
      exclude: { type: 'array', items: { type: 'string' }, description: '额外排除的顶层名称，例如 ["dist","validation-report.md"]。' },
      dryRun: { type: 'boolean', description: '只统计不写盘，默认 false。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          modDir: { type: 'string', required: true },
          zipPath: { type: 'string', required: true },
          zipBytes: { type: 'integer', required: true },
          zipSizeText: { type: 'string', required: true },
          fileCount: { type: 'integer', required: true },
          entryPoint: { type: 'string', required: true },
          previewWritten: { type: 'boolean', required: true },
          skipped: { type: 'array', required: true, items: { type: 'string' } },
          dryRun: { type: 'boolean', required: true },
          warnings: { type: 'array', required: true, items: { type: 'string' } },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: [
          `${value.dryRun ? '[dry-run] ' : ''}打包完成：${value.zipPath}`,
          `体积：${value.zipSizeText}（${value.zipBytes} B）　文件数：${value.fileCount}`,
          `解压后顶层目录：${value.entryPoint || '(见包内)'}`,
          `预览图：${value.previewWritten ? '已写入 PreviewImage.png' : '未提供'}`,
          ...(value.skipped.length > 0 ? [`已排除：${value.skipped.join(', ')}`] : []),
          ...value.warnings.map((warning) => `⚠️ ${warning}`),
        ].join('\n'),
      }],
    },
    timeoutMs: 120_000,
    isConcurrencySafe: () => false,
    async execute(args) {
      const modDir = asString(args.modDir).trim()
      if (modDir === '') throw new BarotraumaError('MISSING_ARGUMENT', '缺少必填参数 modDir')
      if (!await pathExists(join(modDir, 'filelist.xml'))) {
        throw new BarotraumaError('NO_FILELIST', `${modDir} 下没有 filelist.xml —— 这不是一个合法内容包，先跑 barotrauma_validate 看看。`)
      }

      const warnings: string[] = []
      const dryRun = asBoolean(args.dryRun, false)
      const doc = await readFilelist(modDir)
      const folderName = basename(modDir.replace(/[\\/]+$/, ''))
      const zipName = asString(args.zipName).trim() || folderName
      const outputDir = asString(args.outputDir).trim() || join(modDir, 'dist')

      // 预览图：二进制按字节复制，不能走文本写入路径
      const previewSource = asString(args.includePreview).trim()
      let previewWritten = false
      if (previewSource !== '') {
        if (!await pathExists(previewSource)) {
          warnings.push(`预览图源文件不存在：${previewSource}`)
        } else {
          if (!dryRun) {
            const { copyFile } = await import('node:fs/promises')
            await copyFile(previewSource, join(modDir, 'PreviewImage.png'))
          }
          previewWritten = true
        }
      } else {
        const hasPreview = await pathExists(join(modDir, 'PreviewImage.png'))
        if (!hasPreview) {
          warnings.push('mod 里没有 PreviewImage.png（创意工坊预览图）。请在游戏 Mods → Publish 里上传，或用 includePreview 参数指定一张图。')
        }
      }

      const skip = ['dist', '.git', 'node_modules', 'validation-report.md', ...asStringArray(args.exclude)]
      const files = await collectFiles(modDir, folderName, skip)
      if (files.length === 0) {
        throw new BarotraumaError('EMPTY_PACK', `${modDir} 下没有可打包的文件。`)
      }

      let zipPath = resolveInside(outputDir, `${zipName}.zip`)
      let zipBytes = 0
      if (!dryRun) {
        await ensureDir(outputDir)
        const entries: Array<{ name: string; data: Uint8Array }> = []
        for (const file of files) {
          entries.push({ name: file.name, data: new Uint8Array(await readFile(file.absolute)) })
        }
        const archive = buildZip(entries, new Date())
        // zip 是二进制：必须按字节写，不能经过 utf8 文本写入
        const { writeFile } = await import('node:fs/promises')
        await writeFile(zipPath, archive)
        zipBytes = archive.length
      } else {
        zipBytes = files.reduce((sum, file) => sum + file.size, 0)
        zipPath = ''
      }

      return {
        ok: true,
        modDir,
        zipPath,
        zipBytes,
        zipSizeText: formatBytes(zipBytes),
        fileCount: files.length,
        entryPoint: `${folderName}/${doc.entries[0]?.file ?? 'filelist.xml'}`,
        previewWritten,
        skipped: skip,
        dryRun,
        warnings,
      }
    },
  }))

  // ── barotrauma_publish ───────────────────────────────────────────────────
  registerTool(ctx, defineTool({
    name: 'barotrauma_publish',
    description:
      '生成创意工坊发布文案与操作清单（标题、简介、标签、变更日志）+ 发布前检查。' +
      '注意：创意工坊**上传必须在游戏里做**（开始界面 Mods → Publish 标签），没有免登录的公开上传接口，本工具不代传。',
    parameters: {
      modDir: { type: 'string', required: true, description: 'mod 根目录。' },
      title: { type: 'string', description: '工坊标题，默认取 filelist 的 name。' },
      summary: { type: 'string', description: '一句话简介。' },
      description: { type: 'string', description: '详细描述（支持多段）。' },
      tags: { type: 'array', items: { type: 'string' }, description: '标签，例如 ["Items","Weapons","Chinese"]。' },
      changelog: { type: 'array', items: { type: 'string' }, description: '本次变更点。' },
      version: { type: 'string', description: '版本号，默认 1.0.0。' },
      authors: { type: 'array', items: { type: 'string' }, description: '作者列表。' },
      writeFile: { type: 'boolean', description: '是否写到 <modDir>/publish/workshop.md，默认 true。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          modDir: { type: 'string', required: true },
          title: { type: 'string', required: true },
          version: { type: 'string', required: true },
          filelistName: { type: 'string', required: true },
          tags: { type: 'array', required: true, items: { type: 'string' } },
          checklist: { type: 'array', required: true, items: { type: 'string' } },
          blockingIssues: { type: 'array', required: true, items: { type: 'string' } },
          documentPath: { type: 'string', required: true },
          markdown: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: [
          `发布材料：${value.title} v${value.version}`,
          `注意：工坊上传要在游戏里操作（Mods → Publish），本工具只产出文案。`,
          value.documentPath !== '' ? `已写入：${value.documentPath}` : '',
          '',
          ...(value.blockingIssues.length > 0 ? ['⛔ 发布前必须先处理：', ...value.blockingIssues.map((item) => `   - ${item}`), ''] : ['✅ 发布前检查未发现阻塞项。', '']),
          value.markdown,
        ].filter((line) => line !== '').join('\n'),
      }],
    },
    timeoutMs: 60_000,
    isConcurrencySafe: () => true,
    async execute(args) {
      const modDir = asString(args.modDir).trim()
      if (modDir === '') throw new BarotraumaError('MISSING_ARGUMENT', '缺少必填参数 modDir')
      const doc = await readFilelist(modDir)
      const filelistName = asString(doc.attributes['name'])
      const title = asString(args.title).trim() || filelistName || basename(modDir)
      const version = asString(args.version, '1.0.0').trim() || '1.0.0'
      const summary = asString(args.summary).trim()
      const description = asString(args.description)
      const tags = asStringArray(args.tags)
      const changelog = asStringArray(args.changelog)
      const authors = asStringArray(args.authors)

      // 发布前检查（不重复跑完整 validate，只查最容易漏的几项）
      const blockingIssues: string[] = []
      if (!await pathExists(join(modDir, 'filelist.xml'))) blockingIssues.push('缺 filelist.xml')
      if (filelistName === '') blockingIssues.push('filelist.xml 缺 name 属性')
      const missing = []
      for (const entry of doc.entries) {
        if (!await pathExists(join(modDir, entry.file))) missing.push(entry.file)
      }
      if (missing.length > 0) blockingIssues.push(`filelist 里有 ${missing.length} 条记录指向不存在的文件：${missing.slice(0, 3).join(', ')}`)
      if (!await pathExists(join(modDir, 'PreviewImage.png'))) blockingIssues.push('缺 PreviewImage.png 预览图（工坊里会显示空白）')
      for (const entry of doc.entries) {
        if (/\.(psd|xcf|rar|zip)$/i.test(entry.file)) blockingIssues.push(`filelist 里登记了源文件 ${entry.file}（应排除）`)
      }

      const markdown = [
        `# ${title} — 创意工坊发布材料`,
        '',
        `- 版本：${version}`,
        `- 适配游戏版本：${asString(doc.attributes['gameversion'], '未知')}`,
        `- 内容包 name：${filelistName || '(缺)'}`,
        `- 作者：${authors.length > 0 ? authors.join('、') : '(未填)'}`,
        `- 生成时间：${nowIso()}`,
        '',
        '## 标题（粘贴到工坊 Title）',
        '',
        title,
        '',
        '## 简介（一句话）',
        '',
        summary || '(未填)',
        '',
        '## 详细描述（粘贴到 Description）',
        '',
        description || '(未填)',
        '',
        '## 标签（工坊 Tags）',
        '',
        tags.length > 0 ? tags.map((tag) => `- ${tag}`).join('\n') : '(未填)',
        '',
        '## 变更日志（粘贴到 Change Notes）',
        '',
        changelog.length > 0 ? changelog.map((item) => `- ${item}`).join('\n') : '- 首次发布',
        '',
        '## 发布操作清单（必须在游戏里做）',
        '',
        '1. 启动潜渊症 → 主界面 **Mods** → 选中本 mod → 切到 **Publish** 标签。',
        '2. 填 Title / Description / Tags / Change Notes（上面各节可直接粘贴）。',
        '3. 上传 PreviewImage.png（工坊封面，建议 512×512 或更大方图）。',
        '4. 点 Publish 上传；首次发布后记下工坊 ID，回填到 filelist.xml 的 steamworkshopid 属性。',
        '5. 上传后用另一个账号订阅，确认依赖与加载都正常。',
        '',
        '## 发布前检查',
        '',
        blockingIssues.length > 0 ? blockingIssues.map((item) => `- ⛔ ${item}`).join('\n') : '- ✅ 未发现阻塞项',
        '',
      ].join('\n')

      let documentPath = ''
      if (asBoolean(args.writeFile, true)) {
        documentPath = join(modDir, 'publish', 'workshop.md')
        await writeFileEnsured(documentPath, markdown)
      }

      return {
        ok: blockingIssues.length === 0,
        modDir,
        title,
        version,
        filelistName,
        tags,
        checklist: [
          'mod 能进游戏并在 Mods 列表里启用',
          '订阅后依赖完整、无缺失内容包报错',
          'PreviewImage.png 已上传',
          'filelist.xml 回填 steamworkshopid',
        ],
        blockingIssues,
        documentPath,
        markdown,
      }
    },
  }))
}

/** 供测试复用：相对路径工具。 */
export { relative }
