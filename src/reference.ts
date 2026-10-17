/**
 * dsh-tool-barotrauma — 官方组件属性查询（`barotrauma_describe_component`）。
 *
 * 数据来自官方 BaroModDoc 的 85 个 `ItemComponents/*` 页面（609 条属性，见 `components.ts`）。
 *
 * **为什么做成"查询"而不是"校验"**：实测确认这些文档表**不完整** ——
 * 生成器用的 `Holdable.slots` / `Holdable.msg` / `RangedWeapon.combatPriority` /
 * `ItemContainer.canBeSelected` 都在原版 XML 里真实存在，但文档表里没有。
 * 所以它适合**写 XML 时查字段**，不适合当"未收录即错误"的判据。
 * @module dsh-tool-barotrauma/reference
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import type { BarotraumaPluginConfig } from './config.js'
import { COMPONENT_NAMES, COMPONENTS } from './components.js'
import { asBoolean, asString, registerTool } from './util.js'

/** 注册参考查询工具。 */
export function registerReferenceTools(ctx: Context, _config: BarotraumaPluginConfig): void {
  registerTool(ctx, defineTool({
    name: 'barotrauma_describe_component',
    description:
      '查询潜渊症**物品组件**（ItemComponent）的官方属性表：属性名、类型、默认值、说明，'
      + `以及该组件在官方示例里的子元素。数据来自官方 BaroModDoc 的 ${COMPONENT_NAMES.length} 个组件页（609 条属性）。`
      + '写物品/武器/护甲 XML 前先查一下字段名，能避免"属性拼错被静默忽略"。'
      + '⚠️ 文档表**不完整**（原版 XML 里有用到但表里没列的属性），所以"表里没有"不等于"非法"；'
      + '属性名大小写不敏感（文档用 PascalCase，XML 常写小写）。',
    parameters: {
      name: { type: 'string', description: '组件元素名，例如 Holdable / RangedWeapon / ItemContainer / Wearable。不传则列出全部组件。' },
      search: { type: 'string', description: '按子串过滤组件名或属性名，例如 "ammo"、"reload"。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          query: { type: 'string', required: true },
          matched: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                element: { type: 'string', required: true },
                url: { type: 'string', required: true },
                attributeCount: { type: 'integer', required: true },
                children: { type: 'array', required: true, items: { type: 'string' } },
                notes: { type: 'string', required: true },
                attributes: {
                  type: 'array',
                  required: true,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      name: { type: 'string', required: true },
                      type: { type: 'string', required: true },
                      default: { type: 'string', required: true },
                      description: { type: 'string', required: true },
                    },
                  },
                },
              },
            },
          },
          available: { type: 'array', required: true, items: { type: 'string' } },
        },
      },
      render: (_args, value) => {
        if (value.matched.length === 0) {
          return [{ type: 'text', text: `没匹配到组件「${value.query}」。\n可用组件（${value.available.length} 个）：${value.available.join(', ')}` }]
        }
        const lines = []
        for (const component of value.matched) {
          lines.push(`═══ <${component.element}> ═══`)
          if (component.notes !== '') lines.push(`备注：${component.notes}`)
          if (component.children.length > 0) lines.push(`示例里的子元素：${component.children.join(', ')}`)
          lines.push(`属性 ${component.attributeCount} 条：`)
          for (const a of component.attributes) {
            const type = a.type !== '' ? ` [${a.type}]` : ''
            const def = a.default !== '' ? ` 默认=${a.default}` : ''
            lines.push(`  ${a.name}${type}${def}${a.description !== '' ? ` — ${a.description}` : ''}`)
          }
          lines.push('')
        }
        lines.push('提示：属性名大小写不敏感；文档表不完整，"表里没有"不等于"非法"。')
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    timeoutMs: 30_000,
    isConcurrencySafe: () => true,
    async execute(args) {
      const name = asString(args.name).trim().toLowerCase()
      const search = asString(args.search).trim().toLowerCase()

      if (name === '' && search === '') {
        return {
          ok: true,
          query: '(全部)',
          matched: [],
          available: [...COMPONENT_NAMES],
        }
      }

      const matched = []
      for (const [key, info] of Object.entries(COMPONENTS)) {
        if (name !== '' && key !== name) continue
        if (search !== '') {
          const hitName = key.includes(search)
          const hitAttr = info.attributes.some((a) => a.name.toLowerCase().includes(search))
          if (!hitName && !hitAttr) continue
        }
        matched.push({
          element: info.element,
          url: info.url,
          attributeCount: info.attributes.length,
          children: [...info.children],
          notes: info.notes,
          attributes: info.attributes.map((a) => ({ ...a })),
        })
      }
      matched.sort((a, b) => a.element.localeCompare(b.element))
      void asBoolean
      return { ok: true, query: name !== '' ? name : search, matched, available: [...COMPONENT_NAMES] }
    },
  }))
}
