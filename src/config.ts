/**
 * dsh-tool-barotrauma — 插件配置。
 *
 * 所有字段都可选：不给时由 `barotrauma_detect_env` 的探测结果兜底。
 * @module dsh-tool-barotrauma/config
 */

/** 插件配置（对应 cordis.patch.yml 里该条目的 config）。 */
export interface BarotraumaPluginConfig {
  /** 潜渊症安装目录；不填则自动探测 Steam 库。 */
  gameDir?: string
  /** LocalMods 目录；不填则用 `<gameDir>/LocalMods`。 */
  localModsDir?: string
  /** 生成 mod 的默认输出根目录；不填则用 LocalMods 目录。 */
  outputRoot?: string
  /** 默认生图模型（Pollinations，免 Key）。 */
  imageModel?: string
}

/** 从任意入参收窄出插件配置；字段类型不对就丢弃该字段而不是报错。 */
export function normalizeConfig(value: unknown): BarotraumaPluginConfig {
  if (typeof value !== 'object' || value === null) return {}
  const raw = value as Record<string, unknown>
  const config: BarotraumaPluginConfig = {}
  if (typeof raw.gameDir === 'string' && raw.gameDir.trim() !== '') config.gameDir = raw.gameDir.trim()
  if (typeof raw.localModsDir === 'string' && raw.localModsDir.trim() !== '') config.localModsDir = raw.localModsDir.trim()
  if (typeof raw.outputRoot === 'string' && raw.outputRoot.trim() !== '') config.outputRoot = raw.outputRoot.trim()
  if (typeof raw.imageModel === 'string' && raw.imageModel.trim() !== '') config.imageModel = raw.imageModel.trim()
  return config
}
