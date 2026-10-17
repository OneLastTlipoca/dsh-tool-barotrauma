/**
 * dsh-tool-barotrauma — 插件入口。
 *
 * 导出 Cordis 契约三件套：`name` / `inject` / `apply`。
 * `apply` 内通过 `ctx.tools.register(defineTool({...}))` 注册全部 `barotrauma_*` 工具，
 * 插件卸载时由 Cordis 自动注销（每个注册都绑在 fiber 的 effect 上）。
 *
 * 工具按潜渊症 mod 制作流程分 5 个阶段（权威清单见 {@link TOOL_NAMES}）：
 *   一 探测与规划（3）：detect_env / plan / create_mod
 *   二 内容 XML（4）  ：gen_item / gen_affliction / gen_character / gen_event
 *   三 脚本（2）      ：gen_lua / gen_csharp
 *   四 本地化（2）    ：scan_l10n / translate
 *   五 校验与发布（4）：validate / gen_icon / pack / publish
 *
 * 约定：execute 只返回一个 canonical 值；任何失败直接 throw（工具层记为 isError）。
 * @module dsh-tool-barotrauma
 */

import type { Context } from '@deepseek-ai/cordis'
import { normalizeConfig, type BarotraumaPluginConfig } from './config.js'
import { registerEnvTools } from './env.js'
import { registerModTools } from './mod.js'
import { registerItemTools } from './items.js'
import { registerCharacterTools } from './characters.js'
import { registerEventTools } from './events.js'
import { registerScriptTools } from './scripts.js'
import { registerL10nTools } from './l10n.js'
import { registerValidateTools } from './validate.js'
import { registerConvertTools } from './convert.js'
import { registerReferenceTools } from './reference.js'
import { registerPackTools } from './pack.js'
import { registerIconTools } from './icon.js'

/** 插件名（与 package.json 及 cordis.patch.yml 中的条目名一致）。 */
export const name = 'dsh-tool-barotrauma'

/** 依赖的 Host 服务：只依赖 tools。 */
export const inject = ['tools'] as const

/** Cordis 插件入口。 */
export function apply(ctx: Context, rawConfig?: unknown): void {
  const config: BarotraumaPluginConfig = normalizeConfig(rawConfig)
  registerEnvTools(ctx, config)
  registerModTools(ctx, config)
  registerItemTools(ctx, config)
  registerCharacterTools(ctx, config)
  registerEventTools(ctx, config)
  registerScriptTools(ctx, config)
  registerL10nTools(ctx, config)
  registerValidateTools(ctx, config)
  registerConvertTools(ctx, config)
  registerReferenceTools(ctx, config)
  registerIconTools(ctx, config)
  registerPackTools(ctx, config)
}

/** 已注册的工具名（权威清单，供自检与文档使用）。 */
export const TOOL_NAMES: readonly string[] = [
  'barotrauma_detect_env',
  'barotrauma_plan',
  'barotrauma_create_mod',
  'barotrauma_gen_item',
  'barotrauma_gen_affliction',
  'barotrauma_gen_character',
  'barotrauma_gen_event',
  'barotrauma_gen_lua',
  'barotrauma_gen_csharp',
  'barotrauma_scan_l10n',
  'barotrauma_translate',
  'barotrauma_validate',
  'barotrauma_convert_names',
  'barotrauma_describe_component',
  'barotrauma_gen_icon',
  'barotrauma_pack',
  'barotrauma_publish',
]

export type { BarotraumaPluginConfig }
