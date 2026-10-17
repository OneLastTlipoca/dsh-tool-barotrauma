/**
 * dsh-tool-barotrauma — 阶段一：规划与骨架（`barotrauma_plan` / `barotrauma_create_mod`）。
 *
 * 生成的目录布局按**社区习惯**（Items/Characters/Events/Localization），
 * 但真正决定引擎加载的是 `filelist.xml` 的 `file=` 记录 —— 所以骨架的权威产物是 filelist。
 *
 * 硬编码目录（不能改名）：
 *   `Lua/Autorun/`、`CSharp/{Shared,Client,Server}/`、`bin/<Client|Server>/<平台>/`
 * @module dsh-tool-barotrauma/mod
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import { join } from 'node:path'
import type { BarotraumaPluginConfig } from './config.js'
import { requireOutputRoot } from './paths.js'
import {
  XML_HEADER,
  buildFilelist,
  buildLanguageFile,
  CONTENT_TAGS,
  LANGUAGES,
  type FilelistEntry,
} from './xml.js'
import {
  asBoolean,
  asString,
  asStringArray,
  ensureDir,
  BarotraumaError,
  nowIso,
  pascalCase,
  pathExists,
  registerTool,
  requireString,
  resolveInside,
  slugify,
  writeFileEnsured,
} from './util.js'

/** 骨架可选的内容模块。 */
const FEATURES = ['items', 'characters', 'events', 'localization', 'lua', 'csharp'] as const
type Feature = typeof FEATURES[number]

/** 默认开启的内容模块：物品 + 本地化（其余按需显式指定）。 */
const DEFAULT_FEATURES: readonly Feature[] = ['items', 'localization']

/** 收窄 features 入参。 */
function parseFeatures(value: unknown): Feature[] {
  const raw = asStringArray(value)
  if (raw.length === 0) return [...DEFAULT_FEATURES]
  const result: Feature[] = []
  for (const item of raw) {
    const lower = item.trim().toLowerCase()
    if (!(FEATURES as readonly string[]).includes(lower)) {
      throw new BarotraumaError('INVALID_ARGUMENT', `不支持的 feature：${item}（可用：${FEATURES.join(' / ')}）`)
    }
    if (!result.includes(lower as Feature)) result.push(lower as Feature)
  }
  return result
}

/** 由 mod 名推导标识符前缀（必须是 ASCII，否则用 fallback）。 */
function derivePrefix(name: string, explicit: string): { prefix: string; warning: string } {
  if (explicit.trim() !== '') {
    const cleaned = pascalCase(explicit) || slugify(explicit)
    if (cleaned === '') {
      throw new BarotraumaError('INVALID_ARGUMENT', `identifierPrefix「${explicit}」里没有可用的 ASCII 字符。`)
    }
    return { prefix: cleaned, warning: '' }
  }
  const derived = pascalCase(name)
  if (derived !== '') return { prefix: derived, warning: '' }
  return {
    prefix: 'MyMod',
    warning: `mod 名「${name}」不含 ASCII 字符，无法推导标识符前缀，已回退为 MyMod —— 建议显式传 identifierPrefix。`,
  }
}

// ── 骨架文件内容 ─────────────────────────────────────────────────────────────

/** 空物品文件（合法且可加载；生成器后续往里追加 `<Item>`）。 */
function emptyItemsXml(): string {
  return `${XML_HEADER}\n<Items>\n</Items>\n`
}

/** 空事件文件。 */
function emptyEventsXml(): string {
  return `${XML_HEADER}\n<Randomevents>\n</Randomevents>\n`
}

/** C# RunConfig.xml（真实样本只有 Standard/Forced 这一种组合）。 */
function runConfigXml(): string {
  return `${XML_HEADER}\n<RunConfig>\n  <Server>Standard</Server>\n  <Client>Forced</Client>\n</RunConfig>\n`
}

/**
 * C# 内存脚本骨架 —— **默认走旧 API（ACsMod）**。
 *
 * 理由：本机唯一真实 C# 样本 `BetterHealthUI (Updated)` 用的就是这套写法，
 * 且官方迁移指南明确说旧结构仍受支持；而 2026 重构后的 `IAssemblyPlugin`
 * 在本机 0 个样本中出现，兼容性未实测（见 refs/reference.md F.6）。
 */
function csharpLegacyStub(namespace: string, className: string, modName: string): string {
  return `using System;
using Barotrauma;
using Barotrauma.Networking;

namespace ${namespace} {
    partial class ${className} : ACsMod {
        public ${className}() {
            LuaCsSetup.PrintCsMessage("${modName}: ${className} constructed");
#if CLIENT
            // 客户端专用初始化写在这里
#endif
        }

        public override void Start() {
            LuaCsSetup.PrintCsMessage("${modName}: started");
        }

        public override void Stop() {
        }
    }
}
`
}

/**
 * C# 内存脚本骨架 —— 2026 春季重构后的官方写法。
 * ⚠️ 本机无样本，未实测；生成时会在 warnings 里提示。
 */
function csharpModernStub(namespace: string, className: string, modName: string): string {
  return `using System;
using Barotrauma;

// 让 .NET 运行时允许访问 Barotrauma 的 internal 类型与成员
[assembly: IgnoreAccessChecksTo("Barotrauma")]
[assembly: IgnoreAccessChecksTo("BarotraumaCore")]
[assembly: IgnoreAccessChecksTo("DedicatedServer")]

namespace ${namespace} {
    partial class ${className} : IAssemblyPlugin {
        public void Initialize() {
            LuaCsLogger.Log("${modName}: ${className} initialized");
        }

        public void OnLoadCompleted() {
        }

        // 官方文档标注为「暂不支持」
        public void PreInitPatching() {
        }

        public void Dispose() {
            LuaCsLogger.Log("${modName}: ${className} disposed");
        }
    }
}
`
}

/**
 * Lua autorun 骨架。
 *
 * 实测要点（refs/reference.md E.4/E.5）：
 *   - mod 根路径 = `table.pack(...)[1]`
 *   - `CLIENT` / `SERVER` / `Game.IsMultiplayer` 是全局
 *   - 钩子是 **大写** `Hook.Add(事件名, 唯一钩子名, 回调)`
 *   - `Lua/Autorun/` 是硬编码目录，**不需要**写进 filelist.xml
 */
function luaAutorunStub(modName: string, prefix: string): string {
  return `-- ${modName} — LuaCsForBarotrauma autorun 入口
-- 本文件由 dsh-tool-barotrauma 生成。
-- Lua/Autorun/ 是硬编码目录：放在这里就会自动执行，**不需要**写进 filelist.xml。
-- 依赖：LuaCsForBarotrauma（F3 控制台可用 cl_reloadluacs / reloadluacs 重载）

---@diagnostic disable-next-line: undefined-global
local MOD_PATH = table.pack(...)[1]

-- 注意：这里刻意不创建全局变量。LuaCs 的 require 命名空间是跨 mod 共享的，
-- 挂一个叫 MOD / Main 之类的全局很容易和别人的 mod 撞名。需要共享就用自己的前缀，
-- 例如 ${prefix} = ${prefix} or {}

-- 载入确认：进游戏后在 F3 控制台应能看到这行
Hook.Add("roundStart", "${prefix}.roundStart", function()
    print("[${modName}] loaded from " .. tostring(MOD_PATH))
end)

-- 示例：只在服务端（或单人）执行
Hook.Add("roundStart", "${prefix}.serverOnly", function()
    if CLIENT and Game.IsMultiplayer then return end
    -- 服务端逻辑写在这里
end)

-- 示例：只在客户端执行
Hook.Add("roundStart", "${prefix}.clientOnly", function()
    if not CLIENT then return end
    -- 客户端逻辑写在这里
end)
`
}

// ── 骨架规划 ─────────────────────────────────────────────────────────────────

interface PlannedFile {
  /** 相对 mod 根的路径（POSIX 风格）。 */
  file: string
  kind: string
  content: string
  /** 是否需要写进 filelist 及其内容类型。 */
  tag: string | null
  /** 说明。 */
  note: string
}

/** 依据 features 生成全部骨架文件。 */
function planSkeleton(input: {
  modName: string
  prefix: string
  features: readonly Feature[]
  csharpStyle: 'legacy' | 'modern'
}): { files: PlannedFile[]; directories: string[]; warnings: string[] } {
  const files: PlannedFile[] = []
  const directories: string[] = []
  const warnings: string[] = []
  const { modName, prefix, features } = input

  if (features.includes('items')) {
    directories.push('Items')
    files.push({
      file: `Items/${prefix}Items.xml`,
      kind: 'item',
      content: emptyItemsXml(),
      tag: CONTENT_TAGS.item,
      note: '物品定义；barotrauma_gen_item 会往这里追加 <Item>',
    })
  }

  if (features.includes('characters')) {
    // 角色文件根元素是单个 <Character SpeciesName="...">，空集合不合法，
    // 因此这里只建目录，等 barotrauma_gen_character 真正生成时再登记 filelist。
    directories.push('Characters')
    warnings.push('characters：只创建了目录。角色文件根是单个 <Character>，无法生成空占位，请用 barotrauma_gen_character 生成后再登记 filelist。')
  }

  if (features.includes('events')) {
    directories.push('Events')
    files.push({
      file: `Events/${prefix}Events.xml`,
      kind: 'event',
      content: emptyEventsXml(),
      tag: CONTENT_TAGS.randomEvents,
      note: '随机事件；barotrauma_gen_event 会往这里追加 EventPrefabs / EventSet',
    })
  }

  if (features.includes('localization')) {
    directories.push('Localization')
    const locale = LANGUAGES['zh-cn']
    files.push({
      file: 'Localization/SimplifiedChinese.xml',
      kind: 'text',
      content: buildLanguageFile({
        language: locale?.language ?? 'Simplified Chinese',
        translatedName: locale?.translatedName ?? '中文(简体)',
        noWhitespace: locale?.noWhitespace ?? true,
        entries: [],
      }),
      tag: CONTENT_TAGS.text,
      note: '简体中文本地化；barotrauma_translate 会填充条目',
    })
  }

  if (features.includes('lua')) {
    directories.push('Lua/Autorun')
    files.push({
      file: 'Lua/Autorun/init.lua',
      kind: 'lua',
      content: luaAutorunStub(modName, prefix),
      // 硬编码目录，自动加载；按社区建议不写进 filelist（宁可不写不要乱写）
      tag: null,
      note: 'Lua autorun 入口；Lua/Autorun/ 硬编码自动执行，无需 filelist 记录',
    })
  }

  if (features.includes('csharp')) {
    directories.push('CSharp/Shared', 'CSharp/Client', 'CSharp/Server')
    const className = `${prefix}Mod`
    const namespace = prefix
    const modern = input.csharpStyle === 'modern'
    files.push({
      file: 'CSharp/RunConfig.xml',
      kind: 'cs',
      content: runConfigXml(),
      tag: null,
      note: 'C# 编译目标声明（硬编码文件名）',
    })
    files.push({
      file: `CSharp/Shared/${className}.cs`,
      kind: 'cs',
      content: modern
        ? csharpModernStub(namespace, className, modName)
        : csharpLegacyStub(namespace, className, modName),
      tag: CONTENT_TAGS.other,
      note: modern ? 'C# 内存脚本（官方新写法，未实测）' : 'C# 内存脚本（ACsMod 旧写法，本机已验证可加载）',
    })
    if (modern) {
      warnings.push('csharp：使用了 2026 重构后的 IAssemblyPlugin 新写法，本机无样本，LuaCs 1.0.109 下的兼容性需进游戏实测；如果加载失败请改用 csharpStyle="legacy"。')
    }
  }

  return { files, directories, warnings }
}

// ── 工具注册 ─────────────────────────────────────────────────────────────────

/** 写文件；按 overwrite 决定是否覆盖已存在文件。 */
async function writePlanned(
  target: string,
  content: string,
  overwrite: boolean,
): Promise<'created' | 'skipped'> {
  if (!overwrite && await pathExists(target)) return 'skipped'
  await writeFileEnsured(target, content)
  return 'created'
}

/** 注册规划与骨架工具。 */
export function registerModTools(ctx: Context, config: BarotraumaPluginConfig): void {
  // ── barotrauma_plan ────────────────────────────────────────────────────────
  registerTool(ctx, defineTool({
    name: 'barotrauma_plan',
    description:
      '生成潜渊症 mod 的制作方案：目标目录、标识符前缀、要生成的文件与对应工具、' +
      'filelist 记录、里程碑、风险清单。这是做潜渊症 mod 的第一步（先 detect_env 再调它）。' +
      '传 outputRoot 会把方案写成 <outputRoot>/<modName>/plan.json。',
    parameters: {
      name: { type: 'string', required: true, description: 'mod 显示名（可含空格/中文，例如「等离子武器扩展」）。' },
      purpose: { type: 'string', description: '这个 mod 要做什么，例如「加入三把等离子武器和对应弹药」。' },
      features: {
        type: 'array',
        items: { type: 'string', enum: [...FEATURES] },
        description: `要包含的内容模块，默认 ${DEFAULT_FEATURES.join(' + ')}。`,
      },
      identifierPrefix: { type: 'string', description: '标识符前缀（纯 ASCII，PascalCase），默认由 name 推导。' },
      modVersion: { type: 'string', description: 'mod 版本号，默认 1.0.0。' },
      outputRoot: { type: 'string', description: '输出根目录，默认 LocalMods。' },
      gameDir: { type: 'string', description: '游戏目录覆盖值。' },
      localModsDir: { type: 'string', description: 'LocalMods 目录覆盖值。' },
      writePlan: { type: 'boolean', description: '是否把方案写成 <modDir>/plan.json，默认 false。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          modName: { type: 'string', required: true },
          identifierPrefix: { type: 'string', required: true },
          modDir: { type: 'string', required: true },
          gameVersion: { type: 'string', required: true },
          luaCsInstalled: { type: 'boolean', required: true },
          purpose: { type: 'string', required: true },
          features: { type: 'array', required: true, items: { type: 'string' } },
          steps: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                order: { type: 'integer', required: true },
                name: { type: 'string', required: true },
                goal: { type: 'string', required: true },
                tools: { type: 'array', required: true, items: { type: 'string' } },
              },
            },
          },
          plannedFiles: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                file: { type: 'string', required: true },
                kind: { type: 'string', required: true },
                note: { type: 'string', required: true },
              },
            },
          },
          filelistEntries: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                tag: { type: 'string', required: true },
                file: { type: 'string', required: true },
              },
            },
          },
          risks: { type: 'array', required: true, items: { type: 'string' } },
          nextTools: { type: 'array', required: true, items: { type: 'string' } },
          planFile: { type: 'string', required: true },
          warnings: { type: 'array', required: true, items: { type: 'string' } },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: [
          `潜渊症 mod 方案：${value.modName}（前缀 ${value.identifierPrefix}）`,
          `目标目录：${value.modDir}`,
          `游戏版本：${value.gameVersion || '(未探测到)'}　LuaCs：${value.luaCsInstalled ? '可用' : '不可用'}`,
          `模块：${value.features.join(' / ')}`,
          `文件 ${value.plannedFiles.length} 个，filelist 记录 ${value.filelistEntries.length} 条`,
          '',
          ...value.steps.map((step) => `${step.order}. ${step.name} → ${step.tools.join(' → ')}`),
          '',
          `下一步：${value.nextTools.join(' → ')}`,
          value.planFile !== '' ? `方案已写入：${value.planFile}` : '',
          ...value.warnings.map((warning) => `⚠️ ${warning}`),
        ].filter((line) => line !== '').join('\n'),
      }],
    },
    timeoutMs: 60_000,
    isConcurrencySafe: () => true,
    async execute(args) {
      const name = requireString(args.name, 'name')
      const purpose = asString(args.purpose)
      const features = parseFeatures(args.features)
      const modVersion = asString(args.modVersion, '1.0.0').trim() || '1.0.0'
      const { prefix, warning: prefixWarning } = derivePrefix(name, asString(args.identifierPrefix))

      const context = await requireOutputRoot(config, {
        gameDir: asString(args.gameDir) || undefined,
        localModsDir: asString(args.localModsDir) || undefined,
        outputRoot: asString(args.outputRoot) || undefined,
      })

      const modDirName = asString(args.name).trim()
      const modDir = resolveInside(context.outputRoot, modDirName)
      const skeleton = planSkeleton({ modName: name, prefix, features, csharpStyle: 'legacy' })

      const warnings = [...context.issues]
      if (prefixWarning !== '') warnings.push(prefixWarning)
      warnings.push(...skeleton.warnings)
      if (features.includes('lua') && !context.luaCsInstalled) {
        warnings.push('未检测到 LuaCsForBarotrauma —— 生成的 Lua 脚本不会被加载。')
      }

      const steps = [
        { order: 1, name: '建骨架', goal: '生成目录树 + filelist.xml + 空内容文件', tools: ['barotrauma_create_mod'] },
      ]
      const nextTools: string[] = ['barotrauma_create_mod']
      if (features.includes('items')) {
        steps.push({ order: steps.length + 1, name: '生成物品/武器', goal: '写入 <Item> 定义与配套弹药', tools: ['barotrauma_gen_item'] })
        nextTools.push('barotrauma_gen_item')
      }
      if (features.includes('characters')) {
        steps.push({ order: steps.length + 1, name: '生成怪物/角色', goal: '写入 <Character> 物种定义', tools: ['barotrauma_gen_character'] })
        nextTools.push('barotrauma_gen_character')
      }
      if (features.includes('events')) {
        steps.push({ order: steps.length + 1, name: '生成事件', goal: '写入 ScriptedEvent + EventSet', tools: ['barotrauma_gen_event'] })
        nextTools.push('barotrauma_gen_event')
      }
      if (features.includes('lua')) {
        steps.push({ order: steps.length + 1, name: '生成 Lua 脚本', goal: 'Hook.Add 逻辑骨架', tools: ['barotrauma_gen_lua'] })
        nextTools.push('barotrauma_gen_lua')
      }
      if (features.includes('csharp')) {
        steps.push({ order: steps.length + 1, name: '生成 C# 脚本', goal: 'ACsMod / IAssemblyPlugin 骨架', tools: ['barotrauma_gen_csharp'] })
        nextTools.push('barotrauma_gen_csharp')
      }
      steps.push({ order: steps.length + 1, name: '本地化', goal: '填充 entityname / entitydescription', tools: ['barotrauma_translate'] })
      steps.push({ order: steps.length + 1, name: '校验与打包', goal: 'XML 校验 + 打包成可上传 zip', tools: ['barotrauma_validate', 'barotrauma_pack'] })
      nextTools.push('barotrauma_validate', 'barotrauma_pack')

      const risks = [
        'XML 元素/属性名大小写不敏感，但**贴图路径大小写**在 Linux 服务端可能敏感（未实测）——建议贴图路径与磁盘实际大小写一致。',
        '并不存在 <Magazine> 元素：弹药要用 <ItemContainer> + <SpawnItem> 建模，武器用 <RequiredItems type="Contained"> 引用。',
        'filelist.xml 里没登记的文件不会被加载；Lua/Autorun/ 与 CSharp/{Shared,Client,Server}/ 例外（目录硬编码）。',
      ]
      if (features.includes('csharp')) {
        risks.push('C# 新旧 API（ACsMod vs IAssemblyPlugin）在 LuaCs 1.0.109 下的兼容性必须进游戏实测。')
      }

      const filelistEntries: FilelistEntry[] = skeleton.files
        .filter((file): file is PlannedFile & { tag: string } => file.tag !== null)
        .map((file) => ({ tag: file.tag, file: file.file }))

      // 方案落盘（仅在目标目录已存在或可创建时）
      let planFile = ''
      const plan: Record<string, unknown> = {
        name,
        purpose,
        modVersion,
        identifierPrefix: prefix,
        features,
        gameVersion: context.gameVersion,
        gameDir: context.gameDir,
        localModsDir: context.localModsDir,
        modDir,
        generatedAt: nowIso(),
        plannedFiles: skeleton.files.map((file) => ({ file: file.file, kind: file.kind, note: file.note })),
        filelistEntries,
        steps,
        risks,
        warnings,
      }
      if (asBoolean(args.writePlan, false)) {
        await ensureDir(modDir)
        const target = join(modDir, 'plan.json')
        await writeFileEnsured(target, `${JSON.stringify(plan, null, 2)}\n`)
        planFile = target
      }

      return {
        ok: true,
        modName: name,
        identifierPrefix: prefix,
        modDir,
        gameVersion: context.gameVersion,
        luaCsInstalled: context.luaCsInstalled,
        purpose,
        features: [...features],
        steps,
        plannedFiles: skeleton.files.map((file) => ({ file: file.file, kind: file.kind, note: file.note })),
        filelistEntries: filelistEntries.map((entry) => ({ tag: entry.tag, file: entry.file })),
        risks,
        nextTools,
        planFile,
        warnings,
      }
    },
  }))

  // ── barotrauma_create_mod ─────────────────────────────────────────────────
  registerTool(ctx, defineTool({
    name: 'barotrauma_create_mod',
    description:
      '在 LocalMods（或指定 outputRoot）下创建潜渊症内容包骨架：目录树、filelist.xml、空物品/事件 XML、' +
      '本地化文件、Lua/Autorun 入口、C# RunConfig 与脚本骨架。默认不覆盖已存在文件。',
    parameters: {
      name: { type: 'string', required: true, description: 'mod 显示名；同时作为目录名（可含空格/中文）。' },
      features: {
        type: 'array',
        items: { type: 'string', enum: [...FEATURES] },
        description: `要创建的内容模块，默认 ${DEFAULT_FEATURES.join(' + ')}。`,
      },
      identifierPrefix: { type: 'string', description: '标识符前缀（纯 ASCII，PascalCase），默认由 name 推导。' },
      modVersion: { type: 'string', description: 'modVersion 属性，默认 1.0.0。' },
      csharpStyle: { type: 'string', enum: ['legacy', 'modern'], description: 'C# 骨架写法，默认 legacy（ACsMod，本机已验证）。' },
      overwrite: { type: 'boolean', description: '是否覆盖已存在文件，默认 false。' },
      outputRoot: { type: 'string', description: '输出根目录，默认 LocalMods。' },
      gameDir: { type: 'string', description: '游戏目录覆盖值。' },
      localModsDir: { type: 'string', description: 'LocalMods 目录覆盖值。' },
      dryRun: { type: 'boolean', description: '只规划不写盘，默认 false。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          modDir: { type: 'string', required: true },
          modName: { type: 'string', required: true },
          identifierPrefix: { type: 'string', required: true },
          gameVersion: { type: 'string', required: true },
          filelistPath: { type: 'string', required: true },
          dryRun: { type: 'boolean', required: true },
          directories: { type: 'array', required: true, items: { type: 'string' } },
          created: { type: 'array', required: true, items: { type: 'string' } },
          skipped: { type: 'array', required: true, items: { type: 'string' } },
          filelistEntries: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                tag: { type: 'string', required: true },
                file: { type: 'string', required: true },
              },
            },
          },
          warnings: { type: 'array', required: true, items: { type: 'string' } },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: [
          `${value.dryRun ? '[dry-run] ' : ''}内容包骨架：${value.modName}`,
          `目录：${value.modDir}`,
          `filelist：${value.filelistPath}`,
          `目录 ${value.directories.length} 个 / 新建文件 ${value.created.length} 个 / 跳过 ${value.skipped.length} 个`,
          ...(value.created.length > 0 ? ['', '新建：', ...value.created.map((file) => `  + ${file}`)] : []),
          ...(value.skipped.length > 0 ? ['', '跳过（已存在）：', ...value.skipped.map((file) => `  = ${file}`)] : []),
          ...value.warnings.map((warning) => `⚠️ ${warning}`),
        ].join('\n'),
      }],
    },
    timeoutMs: 60_000,
    isConcurrencySafe: () => false,
    async execute(args) {
      const name = requireString(args.name, 'name')
      const features = parseFeatures(args.features)
      const modVersion = asString(args.modVersion, '1.0.0').trim() || '1.0.0'
      const csharpStyle = asString(args.csharpStyle, 'legacy') === 'modern' ? 'modern' : 'legacy'
      const overwrite = asBoolean(args.overwrite, false)
      const dryRun = asBoolean(args.dryRun, false)
      const { prefix, warning: prefixWarning } = derivePrefix(name, asString(args.identifierPrefix))

      const context = await requireOutputRoot(config, {
        gameDir: asString(args.gameDir) || undefined,
        localModsDir: asString(args.localModsDir) || undefined,
        outputRoot: asString(args.outputRoot) || undefined,
      })

      const modDir = resolveInside(context.outputRoot, name)
      const skeleton = planSkeleton({ modName: name, prefix, features, csharpStyle })

      const warnings = [...context.issues]
      if (prefixWarning !== '') warnings.push(prefixWarning)
      warnings.push(...skeleton.warnings)
      if (context.gameVersion !== '' && !/^1\.1[0-9]/.test(context.gameVersion)) {
        warnings.push(`游戏版本 ${context.gameVersion} 不在 1.10+ 区间，生成的字段名可能与该版本不符。`)
      }
      if (features.includes('lua') && !context.luaCsInstalled) {
        warnings.push('未检测到 LuaCsForBarotrauma —— 生成的 Lua 脚本不会被加载。')
      }
      if (await pathExists(modDir) && !overwrite) {
        warnings.push(`目标目录已存在：${modDir}（只写入缺失文件，不覆盖已有文件）。`)
      }

      const created: string[] = []
      const skipped: string[] = []
      const filelistEntries: FilelistEntry[] = skeleton.files
        .filter((file): file is PlannedFile & { tag: string } => file.tag !== null)
        .map((file) => ({ tag: file.tag, file: file.file }))

      const filelistPath = join(modDir, 'filelist.xml')
      const filelistContent = buildFilelist({
        name,
        modVersion,
        gameVersion: context.gameVersion === '' ? '1.13.4.0' : context.gameVersion,
        corePackage: false,
        entries: filelistEntries,
      })

      if (!dryRun) {
        await ensureDir(modDir)
        for (const dir of skeleton.directories) await ensureDir(resolveInside(modDir, dir))
        for (const file of skeleton.files) {
          const target = resolveInside(modDir, file.file)
          const outcome = await writePlanned(target, file.content, overwrite)
          if (outcome === 'created') created.push(file.file)
          else skipped.push(file.file)
        }
        const outcome = await writePlanned(filelistPath, filelistContent, overwrite)
        if (outcome === 'created') created.push('filelist.xml')
        else {
          skipped.push('filelist.xml')
          warnings.push('filelist.xml 已存在且未覆盖 —— 新目录/新文件不会被加载，请手工合并记录或传 overwrite=true。')
        }
      } else {
        created.push(...skeleton.files.map((file) => file.file), 'filelist.xml')
      }

      return {
        ok: true,
        modDir,
        modName: name,
        identifierPrefix: prefix,
        gameVersion: context.gameVersion,
        filelistPath,
        dryRun,
        directories: skeleton.directories,
        created,
        skipped,
        filelistEntries: filelistEntries.map((entry) => ({ tag: entry.tag, file: entry.file })),
        warnings,
      }
    },
  }))
}

/** 供其它模块复用：把相对 mod 根的文件路径变成绝对路径。 */
export function modFile(modDir: string, file: string): string {
  return resolveInside(modDir, file)
}
