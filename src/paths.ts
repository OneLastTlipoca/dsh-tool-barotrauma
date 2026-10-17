/**
 * dsh-tool-barotrauma — 路径上下文解析。
 *
 * 生成类工具都需要「游戏目录 / LocalMods / 本次输出根目录」三项；这里统一解析，
 * 保证优先级一致：**工具入参 > 插件配置 > 自动探测**。
 * @module dsh-tool-barotrauma/paths
 */

import { resolve } from 'node:path'
import type { BarotraumaPluginConfig } from './config.js'
import { detectEnv } from './env.js'
import { BarotraumaError } from './util.js'

/** 一次生成动作所需的全部路径事实。 */
export interface PathContext {
  /** 游戏安装目录；探测不到时为空串。 */
  gameDir: string
  /** 游戏版本号（如 1.13.4.0）；探测不到时为空串。 */
  gameVersion: string
  /** LocalMods 目录；探测不到时为空串。 */
  localModsDir: string
  /** 本次生成 mod 的默认输出根目录。 */
  outputRoot: string
  /** LuaCs 是否可用。 */
  luaCsInstalled: boolean
  /** 是否检测到 0Harmony.dll。 */
  harmonyPresent: boolean
  /** 探测过程中的告警。 */
  issues: string[]
}

/** 解析路径上下文。 */
export async function resolvePaths(
  config: BarotraumaPluginConfig,
  overrides: { gameDir?: string; localModsDir?: string; outputRoot?: string } = {},
): Promise<PathContext> {
  const gameDir = overrides.gameDir ?? config.gameDir ?? ''
  const localModsDir = overrides.localModsDir ?? config.localModsDir ?? ''
  const probe = await detectEnv(gameDir, localModsDir)

  const outputRoot =
    overrides.outputRoot ?? config.outputRoot ?? probe.localModsDir

  return {
    gameDir: probe.gameDir,
    gameVersion: probe.gameVersion,
    localModsDir: probe.localModsDir,
    outputRoot,
    luaCsInstalled: probe.luaCsInstalled,
    harmonyPresent: probe.harmonyPresent,
    issues: probe.issues,
  }
}

/**
 * 取一个必定存在的输出根目录。
 * 生成类工具在真正写盘前调用，避免在空串上拼出相对路径、把文件写到进程 cwd。
 */
export async function requireOutputRoot(
  config: BarotraumaPluginConfig,
  overrides: { gameDir?: string; localModsDir?: string; outputRoot?: string } = {},
): Promise<PathContext> {
  const context = await resolvePaths(config, overrides)
  if (context.outputRoot === '') {
    throw new BarotraumaError(
      'NO_OUTPUT_ROOT',
      '没能确定输出根目录：请用 outputRoot 参数指定，或在插件配置里设置 outputRoot / localModsDir / gameDir。',
    )
  }
  context.outputRoot = resolve(context.outputRoot)
  return context
}
