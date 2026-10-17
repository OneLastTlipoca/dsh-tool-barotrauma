/**
 * dsh-tool-barotrauma — 阶段五之三：图标生成（`barotrauma_gen_icon`）。
 *
 * 潜渊症物品图标是 64×64 的 PNG（`<InventoryIcon sourcerect="…,64,64">`），
 * 所以这里**直接向免 Key 的生图服务请求目标尺寸**，不依赖 sharp 之类的图像库做缩放
 * （插件跑在 DSH 宿主进程里，不能假设有原生图像模块可用）。
 *
 * 后端：Pollinations（免 Key）。它是外部服务，产出质量与可用性不受本插件控制；
 * 生成失败会明确报错，不会写出坏文件。
 * @module dsh-tool-barotrauma/icon
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import type { BarotraumaPluginConfig } from './config.js'
import {
  asBoolean,
  asNumber,
  asString,
  BarotraumaError,
  ensureDir,
  formatBytes,
  registerTool,
  resolveInside,
} from './util.js'

/** Pollinations 生图端点。 */
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt'

/** 生成请求 URL。 */
function buildUrl(prompt: string, width: number, height: number, model: string, seed: number | null): string {
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    model,
    nologo: 'true',
  })
  if (seed !== null) params.set('seed', String(seed))
  return `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`
}

/** 注册图标生成工具。 */
export function registerIconTools(ctx: Context, config: BarotraumaPluginConfig): void {
  registerTool(ctx, defineTool({
    name: 'barotrauma_gen_icon',
    description:
      '用 AI 生图（Pollinations，免 Key）生成潜渊症物品图标 / 事件插图 PNG。' +
      '默认 64×64（物品 InventoryIcon 的标准尺寸），也可生成 256×256 事件图。' +
      '这是外部服务，可能不可用或产出不理想；生成失败会报错而不是写出坏文件。',
    parameters: {
      modDir: { type: 'string', required: true, description: 'mod 根目录。' },
      prompt: { type: 'string', required: true, description: '英文提示词效果最好，例如 "sci-fi plasma rifle icon, side view, dark background"。' },
      relativePath: { type: 'string', description: '输出路径（相对 mod 根），默认 Items/icons/<name>.png。' },
      name: { type: 'string', description: '文件名（不含扩展名），默认 icon。' },
      width: { type: 'integer', description: '宽度，默认 64。' },
      height: { type: 'integer', description: '高度，默认 64。' },
      model: { type: 'string', description: '模型名，默认 flux。' },
      seed: { type: 'integer', description: '随机种子，便于复现。' },
      transparentHint: { type: 'boolean', description: '是否在提示词里强调"无背景/透明感"（默认 true；服务未必真给透明通道）。' },
      dryRun: { type: 'boolean', description: '只返回 URL 不下载，默认 false。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          modDir: { type: 'string', required: true },
          relativePath: { type: 'string', required: true },
          absolutePath: { type: 'string', required: true },
          url: { type: 'string', required: true },
          bytes: { type: 'integer', required: true },
          sizeText: { type: 'string', required: true },
          width: { type: 'integer', required: true },
          height: { type: 'integer', required: true },
          dryRun: { type: 'boolean', required: true },
          warnings: { type: 'array', required: true, items: { type: 'string' } },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: [
          `${value.dryRun ? '[dry-run] ' : ''}图标 → ${value.relativePath}（${value.width}×${value.height}，${value.sizeText}）`,
          `URL：${value.url}`,
          ...value.warnings.map((warning) => `⚠️ ${warning}`),
        ].join('\n'),
      }],
    },
    // 生图是网络操作，给足超时
    timeoutMs: 120_000,
    isConcurrencySafe: () => true,
    async execute(args) {
      const modDir = asString(args.modDir).trim()
      if (modDir === '') throw new BarotraumaError('MISSING_ARGUMENT', '缺少必填参数 modDir')
      const rawPrompt = asString(args.prompt).trim()
      if (rawPrompt === '') throw new BarotraumaError('MISSING_ARGUMENT', '缺少必填参数 prompt')

      const width = Math.max(16, Math.min(1024, Math.trunc(asNumber(args.width, 64))))
      const height = Math.max(16, Math.min(1024, Math.trunc(asNumber(args.height, 64))))
      const name = asString(args.name, 'icon').trim() || 'icon'
      const relativePath = (asString(args.relativePath).trim() || `Items/icons/${name}.png`).replace(/\\/g, '/')
      const model = asString(args.model).trim() || config.imageModel || 'flux'
      const seedRaw = asNumber(args.seed, Number.NaN)
      const seed = Number.isFinite(seedRaw) ? Math.trunc(seedRaw) : null
      const dryRun = asBoolean(args.dryRun, false)
      const warnings: string[] = []

      const prompt = asBoolean(args.transparentHint, true)
        ? `${rawPrompt}, game inventory icon, centered, clean silhouette, flat dark background, no text, no watermark`
        : rawPrompt

      const url = buildUrl(prompt, width, height, model, seed)

      if (dryRun) {
        return {
          ok: true, modDir, relativePath, absolutePath: '', url, bytes: 0, sizeText: '0 B',
          width, height, dryRun: true,
          warnings: ['dryRun=true：只返回了 URL，未下载。'],
        }
      }

      let response: Response
      try {
        response = await fetch(url, { signal: AbortSignal.timeout(100_000) })
      } catch (error) {
        throw new BarotraumaError('IMAGE_FETCH_FAILED', `生图服务请求失败：${error instanceof Error ? error.message : String(error)}（URL: ${url}）`)
      }
      if (!response.ok) {
        throw new BarotraumaError('IMAGE_HTTP_ERROR', `生图服务返回 HTTP ${response.status}（URL: ${url}）`)
      }
      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes('image')) {
        throw new BarotraumaError(
          'IMAGE_NOT_IMAGE',
          `生图服务返回的不是图片（content-type: ${contentType || '未知'}）——该服务可能限流或不可用。`,
        )
      }
      const bytes = new Uint8Array(await response.arrayBuffer())
      if (bytes.length < 128) {
        throw new BarotraumaError('IMAGE_TOO_SMALL', `返回的图片只有 ${bytes.length} 字节，明显不是有效 PNG。`)
      }

      const target = resolveInside(modDir, relativePath)
      await ensureDir(target.replace(/[\\/][^\\/]+$/, ''))
      const { writeFile } = await import('node:fs/promises')
      await writeFile(target, bytes)

      warnings.push('生成的图标是按提示词现画的，风格未必和游戏内其他物品一致；不满意就换 prompt 或 seed 重生成。')
      warnings.push('Pollinations 是第三方免 Key 服务，产出内容与可用性不受本插件控制。')

      return {
        ok: true,
        modDir,
        relativePath,
        absolutePath: target,
        url,
        bytes: bytes.length,
        sizeText: formatBytes(bytes.length),
        width,
        height,
        dryRun: false,
        warnings,
      }
    },
  }))
}
