/**
 * 阶段一测试：barotrauma_plan + barotrauma_create_mod
 * 产物落在 .scratch/，不碰真实 LocalMods。
 *
 * 用法：node tools/test-planning.mjs
 */
import { mkdir, rm, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apply } from '../lib/index.js'

const here = fileURLToPath(new URL('..', import.meta.url))
const scratch = join(here, '.scratch')

const registry = new Map()
const ctx = {
  // 模拟 Cordis：effect 会立即执行工厂函数拿到 disposer
  effect: (factory) => {
    const disposer = factory()
    return () => disposer?.()
  },
  tools: {
    register(definition) {
      registry.set(definition.name, definition)
      return () => registry.delete(definition.name)
    },
  },
}
apply(ctx, {})

function call(name, args) {
  const definition = registry.get(name)
  if (definition === undefined) throw new Error(`工具未注册：${name}`)
  return definition.execute(args, { signal: AbortSignal.timeout(60_000) })
}

function render(name, args, value) {
  const definition = registry.get(name)
  return definition.output.render(args, value).map((block) => block.text ?? '').join('\n')
}

await rm(scratch, { recursive: true, force: true })
await mkdir(scratch, { recursive: true })

// ── plan ─────────────────────────────────────────────────────────────────────
const planArgs = {
  name: '等离子武器扩展',
  purpose: '加入三把等离子武器和对应弹药，带中文描述',
  features: ['items', 'events', 'lua', 'localization'],
  outputRoot: scratch,
  writePlan: true,
}
const plan = await call('barotrauma_plan', planArgs)
console.log('═══ barotrauma_plan ═══')
console.log(render('barotrauma_plan', planArgs, plan))
console.log(`\nplanFile = ${plan.planFile}`)

// ── create_mod ───────────────────────────────────────────────────────────────
const createArgs = {
  name: '等离子武器扩展',
  features: ['items', 'events', 'lua', 'localization'],
  outputRoot: scratch,
  modVersion: '0.1.0',
}
const created = await call('barotrauma_create_mod', createArgs)
console.log('\n═══ barotrauma_create_mod ═══')
console.log(render('barotrauma_create_mod', createArgs, created))

console.log('\n── 磁盘实际产物 ──')
async function walk(dir, prefix = '') {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`
    if (entry.isDirectory()) {
      console.log(`  ${rel}/`)
      await walk(join(dir, entry.name), rel)
    } else {
      const text = await readFile(join(dir, entry.name), 'utf8')
      console.log(`  ${rel}  (${text.length} B)`)
    }
  }
}
await walk(join(scratch, '等离子武器扩展'))

console.log('\n── filelist.xml 全文 ──')
console.log(await readFile(join(scratch, '等离子武器扩展', 'filelist.xml'), 'utf8'))

console.log('── Lua/Autorun/init.lua 全文 ──')
console.log(await readFile(join(scratch, '等离子武器扩展', 'Lua', 'Autorun', 'init.lua'), 'utf8'))
