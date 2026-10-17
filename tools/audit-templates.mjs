/**
 * 模板校核：把 `barotrauma_gen_item` 生成的 XML 里的**组件属性**，
 * 逐条对照官方 ItemComponents 文档的属性表（`src/components.ts`）。
 *
 * 目的：发现生成器里写错/写歪的属性名（拼错的属性会被游戏静默忽略，功能不生效）。
 *
 * 注意两条已确认的限制（见 components.ts 头部注释）：
 *   1. 文档表是 PascalCase，生成器写小写 → 比对一律**大小写不敏感**
 *   2. 文档表**不完整** → "未收录"不等于"错"，需要人工判断
 *
 * 用法：node tools/audit-templates.mjs
 */
import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apply } from '../lib/index.js'
import { COMPONENTS } from '../lib/components.js'

const here = fileURLToPath(new URL('..', import.meta.url))
const scratch = join(here, '.scratch', 'audit')
await rm(scratch, { recursive: true, force: true })
await mkdir(scratch, { recursive: true })

const registry = new Map()
apply({
  effect: (factory) => { const d = factory(); return () => d?.() },
  tools: { register(def) { registry.set(def.name, def); return () => registry.delete(def.name) } },
}, {})

const call = (name, args) => registry.get(name).execute(args, { signal: AbortSignal.timeout(60_000) })

// 建包骨架（只为拿一个合法 modDir）
await call('barotrauma_create_mod', {
  name: 'audit', identifierPrefix: 'Audit', features: ['items', 'localization'], outputRoot: scratch,
})
const modDir = join(scratch, 'audit')

/** 各 kind 的生成参数（尽量覆盖模板里的每个分支）。 */
const specs = [
  { identifier: 'AuditGun', kind: 'weapon_ranged', basePrice: 1000, ammoTag: 'auditammo' },
  { identifier: 'AuditMelee', kind: 'weapon_melee', basePrice: 500 },
  { identifier: 'AuditAmmo', kind: 'ammo', basePrice: 100 },
  { identifier: 'AuditMeds', kind: 'consumable', basePrice: 80, reduce: ['bleeding:2'] },
  { identifier: 'AuditArmor', kind: 'equipment', basePrice: 800 },
  { identifier: 'AuditTool', kind: 'tool', basePrice: 150 },
  { identifier: 'AuditMat', kind: 'material', basePrice: 20 },
]

/** lower 组件名 → 文档属性名集合。 */
const docAttrs = new Map()
for (const [key, info] of Object.entries(COMPONENTS)) {
  docAttrs.set(key, new Set(info.attributes.map((a) => a.name.toLowerCase())))
}

/** 从一段 XML 里取出「组件元素 → 实际用到的属性名集合」。 */
function componentsIn(xml) {
  const found = new Map()
  const tagPattern = /<([A-Za-z_][\w.:-]*)((?:"[^"]*"|[^>"])*)>/g
  let match = tagPattern.exec(xml)
  while (match !== null) {
    const element = (match[1] ?? '').toLowerCase()
    const rawAttrs = match[2] ?? ''
    if (docAttrs.has(element)) {
      const set = found.get(element) ?? new Set()
      for (const attr of rawAttrs.matchAll(/([A-Za-z_][\w.:-]*)\s*=\s*"/g)) {
        const name = (attr[1] ?? '').toLowerCase()
        if (name) set.add(name)
      }
      found.set(element, set)
    }
    match = tagPattern.exec(xml)
  }
  return found
}

console.log('═══ 生成器用到的组件属性 vs 官方文档 ═══\n')
const problems = []
const gaps = []

for (const spec of specs) {
  const result = await call('barotrauma_gen_item', { modDir, ...spec, dryRun: true })
  const used = componentsIn(result.xml)
  console.log(`【${spec.kind}】${[...used.keys()].join(', ') || '(无组件)'}`)
  for (const [element, attrs] of used) {
    const documented = docAttrs.get(element) ?? new Set()
    const undocumented = [...attrs].filter((a) => !documented.has(a))
    const unused = [...documented].filter((a) => !attrs.has(a))
    if (undocumented.length > 0) console.log(`   <${element}> ⚠️ 未在文档表里的属性：${undocumented.join(', ')}`)
    for (const a of undocumented) problems.push({ kind: spec.kind, element, attr: a })
    if (unused.length > 0) gaps.push({ kind: spec.kind, element, count: unused.length, sample: unused.slice(0, 10) })
  }
}

console.log('\n═══ 汇总 ═══')
if (problems.length === 0) {
  console.log('✅ 生成器用到的组件属性，全部都能在官方文档表里找到（大小写不敏感）')
} else {
  console.log(`⚠️ ${problems.length} 处属性未在文档表里（需人工判断是"拼错"还是"文档漏列"）：`)
  const byElement = new Map()
  for (const p of problems) {
    const key = p.element
    const list = byElement.get(key) ?? []
    list.push(`${p.attr}（${p.kind}）`)
    byElement.set(key, list)
  }
  for (const [element, list] of byElement) console.log(`   <${element}>: ${list.join(', ')}`)
}

console.log('\n═══ 文档里有、但生成器没用的属性（信息性，用于评估模板完整度）═══')
const seen = new Set()
for (const g of gaps) {
  if (seen.has(g.element)) continue
  seen.add(g.element)
  console.log(`   <${g.element}> 未用 ${g.count} 条，例如：${g.sample.join(', ')}`)
}
