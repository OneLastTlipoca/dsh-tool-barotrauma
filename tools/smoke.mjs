/**
 * 冒烟测试：不装进 profile，直接把插件注册到一个假 ctx 上并调用工具。
 *
 * 用法：node tools/smoke.mjs
 */
import { apply, TOOL_NAMES } from '../lib/index.js'

const registered = new Map()

const fakeCtx = {
  effect(factory, _label) {
    const disposer = factory()
    return () => disposer?.()
  },
  tools: {
    register(definition) {
      registered.set(definition.name, definition)
      return () => registered.delete(definition.name)
    },
  },
}

apply(fakeCtx, {})

console.log(`已注册 ${registered.size} 个工具：${[...registered.keys()].join(', ')}`)
const missing = TOOL_NAMES.filter((name) => !registered.has(name))
if (missing.length > 0) {
  console.error(`❌ TOOL_NAMES 与实注册不一致，缺少：${missing.join(', ')}`)
  process.exitCode = 1
}

const definition = registered.get('barotrauma_detect_env')
if (definition === undefined) {
  console.error('❌ 没找到 barotrauma_detect_env')
  process.exit(1)
}

const started = Date.now()
const value = await definition.execute({}, { signal: AbortSignal.timeout(120_000) })
const blocks = definition.output.render({}, value)

console.log(`\n── ${definition.name} 执行耗时 ${Date.now() - started}ms ──`)
for (const block of blocks) {
  if (block.type === 'text') console.log(block.text)
}

console.log('\n── canonical 值（截断）──')
console.log(JSON.stringify({ ...value, installedMods: `<${value.installedMods.length} 条>` }, null, 2))
