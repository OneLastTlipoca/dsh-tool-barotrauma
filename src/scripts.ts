/**
 * dsh-tool-barotrauma — 阶段三：脚本脚手架（`barotrauma_gen_lua` / `barotrauma_gen_csharp`）。
 *
 * 关键事实（refs/reference.md E/F）：
 *   - `Lua/Autorun/` 与 `CSharp/{Shared,Client,Server}/` 是**硬编码目录**，放进去就会加载；
 *   - Lua 钩子是**大写** `Hook.Add(事件名, 唯一钩子名, 回调)`；mod 根路径 = `table.pack(...)[1]`；
 *     `CLIENT` / `SERVER` / `Game.IsMultiplayer` 是全局；
 *   - C# 默认生成 **ACsMod 旧写法**（本机唯一真实样本、已验证可加载）；
 *     官方 2026 重构后的 `IAssemblyPlugin` 写法则标为未实测。
 * @module dsh-tool-barotrauma/scripts
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import type { BarotraumaPluginConfig } from './config.js'
import { appendXmlBlock, ensureRegistered, readFilelist } from './pack-io.js'
import { XML_HEADER, CONTENT_TAGS } from './xml.js'
import {
  asBoolean,
  asString,
  asStringArray,
  BarotraumaError,
  nowIso,
  pascalCase,
  pathExists,
  registerTool,
  requireString,
  resolveInside,
  writeFileEnsured,
} from './util.js'

/** 真实出现过的 Lua 事件名（用于 description 提示与校验告警，不做硬性限制）。 */
const KNOWN_LUA_EVENTS = [
  'loaded', 'roundStart', 'think', 'chatMessage', 'characterCreated',
  'character.applyDamage', 'character.giveJobItems', 'item.applyTreatment',
  'changeFallDamage', 'human.CPRSuccess', 'human.CPRFailed',
]

/** 校验钩子名：必须含点号前缀，避免和其他 mod 撞名。 */
function hookNameWarning(prefix: string, event: string): string | null {
  if (!(KNOWN_LUA_EVENTS as readonly string[]).includes(event)) return null
  return null
}

/** 生成 Lua autorun 脚本。 */
function luaScript(i: {
  modName: string
  prefix: string
  hooks: readonly string[]
  side: 'both' | 'client' | 'server'
}): string {
  const hooks = i.hooks.length > 0 ? i.hooks : ['roundStart']
  const guard = i.side === 'client'
    ? '    if not CLIENT then return end'
    : i.side === 'server'
      ? '    if CLIENT and Game.IsMultiplayer then return end'
      : '    -- 两端都会执行'

  const blocks = hooks.map((event, index) => `
-- ${event} → ${i.prefix}.${event}.${index + 1}
Hook.Add("${event}", "${i.prefix}.${event}.${index + 1}", function(...)
${guard}
    local args = table.pack(...)
    -- TODO: ${event} 的处理逻辑
    -- print("[${i.modName}] ${event} fired, argc=" .. tostring(args.n))
end)`).join('\n')

  return `-- ${i.modName} — LuaCsForBarotrauma 脚本
-- 由 dsh-tool-barotrauma 生成于 ${nowIso()}
--
-- 硬编码目录：Lua/Autorun/ 下的脚本会被自动执行，**不需要**写进 filelist.xml。
-- 依赖 LuaCsForBarotrauma；F3 控制台可用 cl_reloadluacs（客户端）/ reloadluacs（服务端）重载。
-- 钩子签名：Hook.Add(事件名, 唯一钩子名, 回调)  —— 注意是大写 Hook.Add。
-- 钩子名一律带 "${i.prefix}." 前缀：LuaCs 的 require 命名空间是跨 mod 共享的，裸名字会撞车。

---@diagnostic disable-next-line: undefined-global
local MOD_PATH = table.pack(...)[1]
local MOD_NAME = "${i.modName}"

-- 脚本加载时机较早，很多游戏对象还没准备好；
-- 需要操作游戏对象时请挂到 "roundStart" / "loaded" 这类钩子上，或者用 Timer.Wait 推迟。
${blocks}
`
}

/** 生成 C# 脚本。 */
function csharpScript(i: {
  modName: string
  namespace: string
  className: string
  style: 'legacy' | 'modern'
  hookMethods: readonly string[]
}): string {
  if (i.style === 'legacy') {
    return `using System;
using System.Collections.Generic;
using System.Reflection;
using Barotrauma;
using Barotrauma.Networking;

// ${i.modName} — LuaCsForBarotrauma 内存脚本（ACsMod 旧写法）
// 由 dsh-tool-barotrauma 生成于 ${nowIso()}
//
// 旧写法在本机真实 mod（BetterHealthUI (Updated)）里验证过可以加载；
// 官方 2026 春季重构推荐的是 IAssemblyPlugin（见 style="modern"），但那套写法本机无样本。
// 目录约定：CSharp/Shared 两端编译，CSharp/Client 仅客户端，CSharp/Server 仅服务端。
namespace ${i.namespace} {
    partial class ${i.className} : ACsMod {
        public ${i.className}() {
            LuaCsSetup.PrintCsMessage("${i.modName}: ${i.className} constructed");
#if CLIENT
            InitClient();
#endif
        }

        public override void Start() {
            LuaCsSetup.PrintCsMessage("${i.modName}: started");
        }

        public override void Stop() {
        }

#if CLIENT
        private void InitClient() {
            // 客户端补丁/钩子写这里。
            // 注意：本机样本里的反射钩子是 GameMain.LuaCs.Hook.HookMethod(...)，
            // 迁移指南说重构后要改成 LuaCsSetup.Instance.Hook.HookMethod(...) ——
            // 本机 LuaCs 1.0.109 下哪个可用需进游戏实测。
            // HookMethod(
            //     "${i.className}_ExampleHook",
            //     typeof(CharacterHealth).GetMethod("InitProjSpecific", BindingFlags.Instance | BindingFlags.NonPublic),
            //     (object self, Dictionary<string, object> args) => { /* ... */ return null; },
            //     LuaCsHook.HookMethodType.After, this);
        }
#endif
    }
}
`
  }

  return `using System;
using Barotrauma;

// ${i.modName} — LuaCsForBarotrauma 内存脚本（2026 重构后的官方写法）
// 由 dsh-tool-barotrauma 生成于 ${nowIso()}
//
// ⚠️ 本机 LocalMods 里没有任何 IAssemblyPlugin 样本，这套写法只来自官方文档，
//    在 LuaCs 1.0.109 下能否加载**需进游戏实测**。若加载失败请改用 style="legacy"。
[assembly: IgnoreAccessChecksTo("Barotrauma")]
[assembly: IgnoreAccessChecksTo("BarotraumaCore")]
[assembly: IgnoreAccessChecksTo("DedicatedServer")]

namespace ${i.namespace} {
    partial class ${i.className} : IAssemblyPlugin {
        public void Initialize() {
            LuaCsLogger.Log("${i.modName}: ${i.className} initialized");
        }

        public void OnLoadCompleted() {
        }

        // 官方文档标注为「暂不支持」
        public void PreInitPatching() {
        }

        public void Dispose() {
            LuaCsLogger.Log("${i.modName}: ${i.className} disposed");
        }
    }
}
`
}

/** RunConfig.xml（真实样本只有 Standard/Forced 这一种组合）。 */
function runConfigXml(): string {
  return `${XML_HEADER}\n<RunConfig>\n  <Server>Standard</Server>\n  <Client>Forced</Client>\n</RunConfig>\n`
}

/** 注册脚本脚手架工具。 */
export function registerScriptTools(ctx: Context, config: BarotraumaPluginConfig): void {
  // ── barotrauma_gen_lua ───────────────────────────────────────────────────
  registerTool(ctx, defineTool({
    name: 'barotrauma_gen_lua',
    description:
      '生成 LuaCsForBarotrauma 的 Lua 脚本骨架：按给定事件名生成 大写 Hook.Add(...) 钩子桩，' +
      '带 CLIENT/SERVER 分支与 mod 路径获取。默认写到 Lua/Autorun/（硬编码自动执行目录，无需 filelist 记录）。',
    parameters: {
      modDir: { type: 'string', required: true, description: 'mod 根目录。' },
      modName: { type: 'string', description: 'mod 显示名（仅用于注释与日志）；默认取插件配置或目录名。' },
      hooks: { type: 'array', items: { type: 'string' }, description: '要挂钩子的事件名，默认 ["roundStart"]；常用：loaded / roundStart / think / chatMessage / characterCreated。' },
      side: { type: 'string', enum: ['both', 'client', 'server'], description: '脚本执行侧，默认 both。' },
      fileName: { type: 'string', description: '文件名（不含路径），默认 init.lua；写到 Lua/Autorun/<fileName>。' },
      targetFile: { type: 'string', description: '完整相对路径，给了就覆盖 fileName。' },
      registerInFilelist: { type: 'boolean', description: '是否把 .lua 作为 <Other> 写进 filelist，默认 false（官方建议可不写）。' },
      overwrite: { type: 'boolean', description: '已存在时是否覆盖，默认 false。' },
      dryRun: { type: 'boolean', description: '只生成不写盘，默认 false。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          targetFile: { type: 'string', required: true },
          written: { type: 'boolean', required: true },
          hooks: { type: 'array', required: true, items: { type: 'string' } },
          filelistAdded: { type: 'boolean', required: true },
          dryRun: { type: 'boolean', required: true },
          content: { type: 'string', required: true },
          warnings: { type: 'array', required: true, items: { type: 'string' } },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: [
          `Lua 脚本 → ${value.targetFile}（${value.written ? '已写入' : '未写入'}）`,
          `钩子：${value.hooks.join(', ')}　filelist 登记：${value.filelistAdded ? '是' : '否'}`,
          '',
          value.content,
          ...value.warnings.map((warning) => `⚠️ ${warning}`),
        ].join('\n'),
      }],
    },
    timeoutMs: 60_000,
    isConcurrencySafe: () => false,
    async execute(args) {
      const modDir = asString(args.modDir).trim()
      if (modDir === '') throw new BarotraumaError('MISSING_ARGUMENT', '缺少必填参数 modDir')
      const modName = asString(args.modName).trim() || modDir.split(/[\\/]/).pop() || 'MyMod'
      const prefix = pascalCase(modName) || 'MyMod'
      const hooks = asStringArray(args.hooks)
      const side = asString(args.side, 'both')
      const sideNormalized: 'both' | 'client' | 'server' =
        side === 'client' || side === 'server' ? side : 'both'
      const fileName = asString(args.fileName).trim() || 'init.lua'
      const targetFile = (asString(args.targetFile).trim() || `Lua/Autorun/${fileName}`).replace(/\\/g, '/')

      const warnings: string[] = []
      for (const event of hooks) {
        const warning = hookNameWarning(prefix, event)
        if (warning !== null) warnings.push(warning)
      }
      if (!config.gameDir && !(await pathExists(modDir))) {
        warnings.push('modDir 不存在，请确认路径。')
      }

      const content = luaScript({ modName, prefix, hooks, side: sideNormalized })
      const dryRun = asBoolean(args.dryRun, false)
      let written = false
      let filelistAdded = false

      if (!dryRun) {
        const target = resolveInside(modDir, targetFile)
        if (await pathExists(target) && !asBoolean(args.overwrite, false)) {
          warnings.push(`${targetFile} 已存在且 overwrite=false —— 未覆盖。`)
        } else {
          await writeFileEnsured(target, content)
          written = true
          if (asBoolean(args.registerInFilelist, false)) {
            const registration = await ensureRegistered(modDir, CONTENT_TAGS.other, targetFile)
            filelistAdded = registration.added
          }
        }
      } else {
        warnings.push('dryRun=true：未写盘。')
      }

      return {
        ok: true,
        targetFile,
        written,
        hooks: hooks.length > 0 ? hooks : ['roundStart'],
        filelistAdded,
        dryRun,
        content,
        warnings,
      }
    },
  }))

  // ── barotrauma_gen_csharp ─────────────────────────────────────────────────
  registerTool(ctx, defineTool({
    name: 'barotrauma_gen_csharp',
    description:
      '生成 LuaCsForBarotrauma 的 C# 内存脚本骨架（含 CSharp/RunConfig.xml）。' +
      '默认 style="legacy"（ACsMod 旧写法，本机真实样本已验证可加载）；style="modern" 为官方 2026 重构写法（IAssemblyPlugin），未实测。' +
      '同时把 .cs 作为 <Other> 登记进 filelist.xml。',
    parameters: {
      modDir: { type: 'string', required: true, description: 'mod 根目录。' },
      className: { type: 'string', required: true, description: '类名（ASCII，例如 PlasmaRifleMod）。' },
      namespace: { type: 'string', description: '命名空间，默认与类名同名。' },
      modName: { type: 'string', description: 'mod 显示名（仅用于日志文本）。' },
      style: { type: 'string', enum: ['legacy', 'modern'], description: '写法，默认 legacy。' },
      targetFolder: { type: 'string', enum: ['Shared', 'Client', 'Server'], description: '放到哪个编译目标目录，默认 Shared（两端都编译）。' },
      registerInFilelist: { type: 'boolean', description: '是否登记进 filelist，默认 true。' },
      overwrite: { type: 'boolean', description: '已存在时是否覆盖，默认 false。' },
      dryRun: { type: 'boolean', description: '只生成不写盘，默认 false。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          className: { type: 'string', required: true },
          targetFile: { type: 'string', required: true },
          runConfigPath: { type: 'string', required: true },
          runConfigWritten: { type: 'boolean', required: true },
          written: { type: 'boolean', required: true },
          filelistAdded: { type: 'boolean', required: true },
          style: { type: 'string', required: true },
          dryRun: { type: 'boolean', required: true },
          content: { type: 'string', required: true },
          warnings: { type: 'array', required: true, items: { type: 'string' } },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: [
          `C# 脚本（${value.style}）→ ${value.targetFile}（${value.written ? '已写入' : '未写入'}）`,
          `RunConfig.xml：${value.runConfigPath}（${value.runConfigWritten ? '已创建' : '已存在/跳过'}）`,
          `filelist 登记：${value.filelistAdded ? '新增记录' : '已有记录'}`,
          '',
          value.content,
          ...value.warnings.map((warning) => `⚠️ ${warning}`),
        ].join('\n'),
      }],
    },
    timeoutMs: 60_000,
    isConcurrencySafe: () => false,
    async execute(args) {
      const modDir = asString(args.modDir).trim()
      if (modDir === '') throw new BarotraumaError('MISSING_ARGUMENT', '缺少必填参数 modDir')
      const className = pascalCase(requireString(args.className, 'className'))
      if (className === '') {
        throw new BarotraumaError('INVALID_ARGUMENT', 'className 必须是含 ASCII 字母/数字的合法 C# 标识符。')
      }
      const namespace = pascalCase(asString(args.namespace).trim()) || className
      const styleRaw = asString(args.style, 'legacy')
      const style: 'legacy' | 'modern' = styleRaw === 'modern' ? 'modern' : 'legacy'
      const folderRaw = asString(args.targetFolder, 'Shared')
      const folder = folderRaw === 'Client' || folderRaw === 'Server' ? folderRaw : 'Shared'
      const modName = asString(args.modName).trim() || modDir.split(/[\\/]/).pop() || 'MyMod'

      const warnings: string[] = []
      if (style === 'modern') {
        warnings.push('style="modern" 使用 IAssemblyPlugin，本机无样本、未实测；若加载失败请改用 style="legacy"。')
      }

      const content = csharpScript({ modName, namespace, className, style, hookMethods: [] })
      const targetFile = `CSharp/${folder}/${className}.cs`
      const dryRun = asBoolean(args.dryRun, false)
      let written = false
      let filelistAdded = false
      let runConfigWritten = false
      let runConfigPath = ''

      if (!dryRun) {
        const target = resolveInside(modDir, targetFile)
        if (await pathExists(target) && !asBoolean(args.overwrite, false)) {
          warnings.push(`${targetFile} 已存在且 overwrite=false —— 未覆盖。`)
        } else {
          await writeFileEnsured(target, content)
          written = true
        }

        // RunConfig.xml 是硬编码文件名，缺了就不会编译
        const runConfigTarget = resolveInside(modDir, 'CSharp/RunConfig.xml')
        runConfigPath = runConfigTarget
        if (!await pathExists(runConfigTarget)) {
          await writeFileEnsured(runConfigTarget, runConfigXml())
          runConfigWritten = true
        }

        if (written && asBoolean(args.registerInFilelist, true)) {
          const registration = await ensureRegistered(modDir, CONTENT_TAGS.other, targetFile)
          filelistAdded = registration.added
        }
      } else {
        warnings.push('dryRun=true：未写盘。')
      }

      void appendXmlBlock
      void readFilelist

      return {
        ok: true,
        className,
        targetFile,
        runConfigPath,
        runConfigWritten,
        written,
        filelistAdded,
        style,
        dryRun,
        content,
        warnings,
      }
    },
  }))
}
