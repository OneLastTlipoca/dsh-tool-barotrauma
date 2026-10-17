/**
 * dsh-tool-barotrauma — 元素名/属性名/枚举值的中英互转
 * （`barotrauma_convert_names`）。
 *
 * 用途（对应合作者「渊深 XML 翻译工具」的两个场景）：
 *   - `en-to-zh`：把英文 XML 变成中文名版本，**方便中文 modder 阅读理解**
 *   - `zh-to-en`：把写好的中文名 XML 变回英文名版本，**交给游戏/发布**
 *
 * 与那份工具的三点差别（都是刻意修正）：
 *   1. **格式保真**：只在标签内部替换名字，其余字节（缩进、换行、注释、CDATA、
 *      文本空白、属性顺序、转义写法）**原样保留**。原工具用 `lxml` 的
 *      `pretty_print=True` 重新序列化，会重排整个文件 —— 而语言文件里
 *      有 `nowhitespace` 这种对空白敏感的设定。
 *   2. **值映射受白名单约束**：只对「值需要映射」的属性做枚举值替换，
 *      自由文本（`name` / `description` / `text` / `msg`）一律不动。
 *      原工具定义了 `VAL_ATTRS` 白名单却从未使用，会对所有属性的值逐词映射。
 *   3. **绝不覆盖原文件**：输出写到单独的文件/目录。
 * @module dsh-tool-barotrauma/convert
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import { basename, dirname, extname, join, relative } from 'node:path'
import { stat } from 'node:fs/promises'
import type { BarotraumaPluginConfig } from './config.js'
import { listModXmlFiles } from './pack-io.js'
import {
  ATTR_EN_TO_ZH_INDEX,
  ATTR_ZH_TO_EN_INDEX,
  mapValueTokens,
  TAG_EN_TO_ZH_INDEX,
  TAG_ZH_TO_EN_INDEX,
  VALUE_ATTR_INDEX,
  VALUE_EN_TO_ZH_INDEX,
  VALUE_ZH_TO_EN_INDEX,
} from './names.js'
import { VOCABULARY_SIZE } from './vocabulary.js'
import {
  asBoolean,
  asNumber,
  asString,
  BarotraumaError,
  ensureDir,
  pathExists,
  readTextSafe,
  registerTool,
  resolveInside,
  writeFileEnsured,
} from './util.js'

type Direction = 'en-to-zh' | 'zh-to-en'

/** 一次替换的统计。 */
interface TransformStats {
  tags: number
  attrs: number
  values: number
}

/** 一次转换的上下文。 */
interface TransformContext {
  tagMap: ReadonlyMap<string, string>
  attrMap: ReadonlyMap<string, string>
  valueMap: ReadonlyMap<string, string>
  /** 需要做枚举值映射的属性（lower，英文与中文都收录在内）。 */
  valueAttrs: ReadonlySet<string>
}

/** 按方向选表。 */
function contextFor(direction: Direction): TransformContext {
  return direction === 'en-to-zh'
    ? {
        tagMap: TAG_EN_TO_ZH_INDEX,
        attrMap: ATTR_EN_TO_ZH_INDEX,
        valueMap: VALUE_EN_TO_ZH_INDEX,
        valueAttrs: VALUE_ATTR_INDEX,
      }
    : {
        tagMap: TAG_ZH_TO_EN_INDEX,
        attrMap: ATTR_ZH_TO_EN_INDEX,
        valueMap: VALUE_ZH_TO_EN_INDEX,
        valueAttrs: VALUE_ATTR_INDEX,
      }
}

/**
 * 名称字符集：**不能假设是 ASCII**。
 *
 * 在 zh→en 方向上，源文件的元素名/属性名是**汉字**，
 * 用 `[A-Za-z_][\w.:-]*` 会一个都匹配不到（实测：整份文件 0 替换）。
 * 这里改为「排除分隔符」的写法，中英文名都能匹配。
 * 排除集：空白、`<` `>` `/` `"` `'` `=`，以及 `?` `!`（避开 XML 声明与注释/CDATA）。
 */
const NAME_PATTERN = /^[^\s<>/"'=?!]+/

/** 元素名：紧跟 `<` 或 `</` 的那个名字。 */
const ELEMENT_PATTERN = /^<(\/?)([^\s<>/"'=?!]+)/

/**
 * 重写单个标签（形如 `</Item>`、`<Item a="b" />`）。
 *
 * 做法：线性扫描，遇到引号就整段跳过 —— 这样属性值里形如 `a=b` 的内容
 * 不会被误当成属性名。只在引号外替换元素名与属性名。
 */
function rewriteTag(tag: string, context: TransformContext, stats: TransformStats): string {
  // 元素名：紧跟 < 或 </
  const head = ELEMENT_PATTERN.exec(tag)
  let rest = tag
  if (head !== null) {
    const renamed = context.tagMap.get((head[2] ?? '').toLowerCase())
    if (renamed !== undefined) {
      rest = `<${head[1] ?? ''}${renamed}${tag.slice(head[0].length)}`
      stats.tags += 1
    }
  }

  let out = ''
  let index = 0
  /** 最近一次在引号外看到的、后面紧跟 `=` 的标识符（用于判断属性值要不要映射）。 */
  let pendingAttr = ''
  while (index < rest.length) {
    const char = rest[index]
    if (char === '"' || char === "'") {
      const end = rest.indexOf(char, index + 1)
      const stop = end === -1 ? rest.length : end + 1
      const inner = rest.slice(index + 1, end === -1 ? rest.length : end)
      let mapped = inner
      if (pendingAttr !== '' && context.valueAttrs.has(pendingAttr.toLowerCase())) {
        mapped = mapValueTokens(inner, context.valueMap)
        if (mapped !== inner) stats.values += 1
      }
      out += char + mapped + (end === -1 ? '' : char)
      index = stop
      pendingAttr = ''
      continue
    }
    // 标识符？（中英文名都支持）
    const identifier = char === '<' || char === '/' ? null : NAME_PATTERN.exec(rest.slice(index))
    if (identifier !== null && char !== '>' && char !== '=') {
      const name = identifier[0]
      // 后面（跳过空白）紧跟 `=` 才算属性名
      const after = /^\s*=/.test(rest.slice(index + name.length))
      if (after) {
        const renamed = context.attrMap.get(name.toLowerCase())
        out += renamed ?? name
        if (renamed !== undefined) stats.attrs += 1
        pendingAttr = renamed ?? name
        index += name.length
        continue
      }
    }
    out += char
    index += 1
  }
  return out
}

/**
 * 转换整段 XML 文本。**只动标签内部的名字与白名单属性的枚举值**，
 * 其余内容（含全部空白与注释）逐字保留。
 */
export function transformXmlText(raw: string, direction: Direction): { text: string; stats: TransformStats } {
  const context = contextFor(direction)
  const stats: TransformStats = { tags: 0, attrs: 0, values: 0 }
  let out = ''
  let index = 0
  while (index < raw.length) {
    const open = raw.indexOf('<', index)
    if (open === -1) {
      out += raw.slice(index)
      break
    }
    out += raw.slice(index, open)

    // 注释 / CDATA / 处理指令：整段原样跳过，不解析内部
    if (raw.startsWith('<!--', open)) {
      const end = raw.indexOf('-->', open)
      const stop = end === -1 ? raw.length : end + 3
      out += raw.slice(open, stop)
      index = stop
      continue
    }
    if (raw.startsWith('<![CDATA[', open)) {
      const end = raw.indexOf(']]>', open)
      const stop = end === -1 ? raw.length : end + 3
      out += raw.slice(open, stop)
      index = stop
      continue
    }

    const close = raw.indexOf('>', open)
    if (close === -1) {
      out += raw.slice(open)
      break
    }
    const tag = raw.slice(open, close + 1)
    out += rewriteTag(tag, context, stats)
    index = close + 1
  }
  return { text: out, stats }
}

/** 默认输出后缀。 */
function defaultSuffix(direction: Direction): string {
  return direction === 'en-to-zh' ? '_zh' : '_en'
}

/** 注册名称互转工具。 */
export function registerConvertTools(ctx: Context, _config: BarotraumaPluginConfig): void {
  registerTool(ctx, defineTool({
    name: 'barotrauma_convert_names',
    description:
      '在「英文名 XML」与「中文名 XML」之间互转元素名、属性名与枚举值（词表来自合作者的渊深 XML 翻译工具，' +
      `元素名 ${VOCABULARY_SIZE.tags} / 属性名 ${VOCABULARY_SIZE.attrs} / 枚举值 ${VOCABULARY_SIZE.values} 条）。` +
      'en-to-zh 用来把英文 XML 变成中文名版本方便阅读；zh-to-en 用来把中文名版本转回游戏要的英文名。' +
      '**格式保真**：只替换标签内部的名字，缩进/换行/注释/CDATA/属性顺序原样保留；' +
      '只有「值需要映射」的属性才做枚举值替换，自由文本一律不动。**绝不覆盖原文件。**',
    parameters: {
      path: { type: 'string', required: true, description: '要转换的 XML 文件，或包含 XML 的目录（递归）。' },
      direction: { type: 'string', enum: ['en-to-zh', 'zh-to-en'], description: '转换方向，默认 en-to-zh。' },
      outputDir: { type: 'string', description: '输出目录；文件输入时默认写在同目录，目录输入时默认写在其旁边。' },
      outputSuffix: { type: 'string', description: '输出文件后缀，默认 _zh（en-to-zh）/ _en（zh-to-en）。' },
      limit: { type: 'integer', description: '目录模式下最多处理多少个 XML，默认 500。' },
      overwrite: { type: 'boolean', description: '输出文件已存在时是否覆盖，默认 false。' },
      dryRun: { type: 'boolean', description: '只统计不写盘，默认 false。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          direction: { type: 'string', required: true },
          inputPath: { type: 'string', required: true },
          inputKind: { type: 'string', required: true },
          outputRoot: { type: 'string', required: true },
          files: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                source: { type: 'string', required: true },
                output: { type: 'string', required: true },
                tags: { type: 'integer', required: true },
                attrs: { type: 'integer', required: true },
                values: { type: 'integer', required: true },
              },
            },
          },
          totalTags: { type: 'integer', required: true },
          totalAttrs: { type: 'integer', required: true },
          totalValues: { type: 'integer', required: true },
          skipped: { type: 'integer', required: true },
          dryRun: { type: 'boolean', required: true },
          warnings: { type: 'array', required: true, items: { type: 'string' } },
        },
      },
      render: (_args, value) => {
        const lines = [
          `${value.dryRun ? '[dry-run] ' : ''}名称互转（${value.direction}）：${value.inputKind === 'file' ? '单文件' : '整个目录'}`,
          `输入：${value.inputPath}`,
          `输出：${value.outputRoot || '(未写盘)'}`,
          `替换合计：元素名 ${value.totalTags} / 属性名 ${value.totalAttrs} / 枚举值 ${value.totalValues}`,
          `文件 ${value.files.length} 个${value.skipped > 0 ? `，跳过 ${value.skipped} 个（已存在）` : ''}`,
        ]
        for (const file of value.files.slice(0, 12)) {
          lines.push(`  ${file.source} → ${file.output}  (tag ${file.tags} / attr ${file.attrs} / val ${file.values})`)
        }
        if (value.files.length > 12) lines.push(`  … 另有 ${value.files.length - 12} 个`)
        for (const warning of value.warnings) lines.push(`⚠️ ${warning}`)
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    timeoutMs: 180_000,
    isConcurrencySafe: () => false,
    async execute(args) {
      const inputPath = asString(args.path).trim()
      if (inputPath === '') throw new BarotraumaError('MISSING_ARGUMENT', '缺少必填参数 path')
      const directionRaw = asString(args.direction, 'en-to-zh')
      const direction: Direction = directionRaw === 'zh-to-en' ? 'zh-to-en' : 'en-to-zh'
      const suffix = asString(args.outputSuffix).trim() || defaultSuffix(direction)
      const limit = Math.max(1, Math.trunc(asNumber(args.limit, 500)))
      const dryRun = asBoolean(args.dryRun, false)
      const overwrite = asBoolean(args.overwrite, false)

      const info = await stat(inputPath).catch(() => null)
      if (info === null) throw new BarotraumaError('PATH_NOT_FOUND', `路径不存在：${inputPath}`)

      const warnings: string[] = []
      const files: Array<{ source: string; output: string; tags: number; attrs: number; values: number }> = []
      let skipped = 0
      let outputRoot = ''

      /** 处理一个文件。 */
      const handle = async (sourcePath: string, outputPath: string, sourceLabel: string): Promise<void> => {
        const raw = await readTextSafe(sourcePath, '')
        if (raw === '') {
          skipped += 1
          return
        }
        const result = transformXmlText(raw, direction)
        if (result.stats.tags === 0 && result.stats.attrs === 0 && result.stats.values === 0) {
          skipped += 1
          warnings.push(`${sourceLabel}：没有任何名称命中词表（可能已经是目标语言，或该内容不在词表覆盖范围内）。`)
          return
        }
        files.push({
          source: sourceLabel,
          output: outputPath,
          tags: result.stats.tags,
          attrs: result.stats.attrs,
          values: result.stats.values,
        })
        if (dryRun) return
        if (!overwrite && await pathExists(outputPath)) {
          skipped += 1
          warnings.push(`${outputPath} 已存在且 overwrite=false —— 跳过。`)
          return
        }
        await writeFileEnsured(outputPath, result.text)
      }

      if (info.isFile()) {
        const ext = extname(inputPath)
        const stem = basename(inputPath, ext)
        const explicitOut = asString(args.outputDir).trim()
        const outputPath = explicitOut !== ''
          ? join(resolveInside(explicitOut, '.'), `${stem}${suffix}${ext || '.xml'}`)
          : join(dirname(inputPath), `${stem}${suffix}${ext || '.xml'}`)
        outputRoot = dirname(outputPath)
        await handle(inputPath, outputPath, basename(inputPath))
      } else {
        const explicitOut = asString(args.outputDir).trim()
        outputRoot = explicitOut !== ''
          ? resolveInside(explicitOut, '.')
          : join(dirname(inputPath.replace(/[\\/]+$/, '')), `${basename(inputPath.replace(/[\\/]+$/, ''))}${suffix}`)
        const xmlFiles = await listModXmlFiles(inputPath, 6)
        const selected = xmlFiles.slice(0, limit)
        if (xmlFiles.length > limit) {
          warnings.push(`目录下共 ${xmlFiles.length} 个 XML，本次只处理前 ${limit} 个（可用 limit 调整）。`)
        }
        if (!dryRun) await ensureDir(outputRoot)
        for (const relativePath of selected) {
          const sourcePath = join(inputPath, relativePath)
          const stem = relativePath.replace(/\.xml$/i, '')
          const outputPath = join(outputRoot, `${stem}${suffix}.xml`)
          if (!dryRun) await ensureDir(dirname(outputPath))
          await handle(sourcePath, outputPath, relativePath.replace(/\\/g, '/'))
        }
      }

      const total = files.reduce(
        (sum, file) => ({
          tags: sum.tags + file.tags,
          attrs: sum.attrs + file.attrs,
          values: sum.values + file.values,
        }),
        { tags: 0, attrs: 0, values: 0 },
      )

      if (direction === 'en-to-zh') {
        warnings.push('en-to-zh 产出的是**阅读辅助版本**，不能直接给游戏用（游戏要的是英文元素名/属性名）。')
      }

      return {
        ok: true,
        direction,
        inputPath,
        inputKind: info.isFile() ? 'file' : 'directory',
        outputRoot: dryRun ? '' : outputRoot,
        files: files.map((file) => ({ ...file, output: dryRun ? '(dry-run)' : relative(process.cwd(), file.output) })),
        totalTags: total.tags,
        totalAttrs: total.attrs,
        totalValues: total.values,
        skipped,
        dryRun,
        warnings,
      }
    },
  }))
}
