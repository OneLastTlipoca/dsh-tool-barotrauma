/**
 * 阶段二测试：barotrauma_gen_item / barotrauma_gen_affliction
 * 产物落在 .scratch/，不碰真实 LocalMods。
 *
 * 用法：node tools/test-items.mjs
 */
import { mkdir, rm, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apply } from '../lib/index.js'

const here = fileURLToPath(new URL('..', import.meta.url))
const scratch = join(here, '.scratch')

const registry = new Map()
apply({
  effect: (factory) => { const d = factory(); return () => d?.() },
  tools: { register(def) { registry.set(def.name, def); return () => registry.delete(def.name) } },
}, {})

const call = (name, args) => registry.get(name).execute(args, { signal: AbortSignal.timeout(60_000) })
const render = (name, args, value) => registry.get(name).output.render(args, value).map((b) => b.text ?? '').join('\n')

await rm(scratch, { recursive: true, force: true })
await mkdir(scratch, { recursive: true })

const modDir = join(scratch, '等离子武器扩展')
await call('barotrauma_create_mod', {
  name: '等离子武器扩展',
  identifierPrefix: 'Plasma',
  features: ['items', 'localization'],
  outputRoot: scratch,
})

console.log('═══ 1. 远程武器（自动配套弹药 + 弹丸）═══')
console.log(render('barotrauma_gen_item', {}, await call('barotrauma_gen_item', {
  modDir, identifier: 'PlasmaRifle', kind: 'weapon_ranged',
  displayName: '等离子步枪', description: '灌注过热等离子，对血肉与装甲同样致命。',
  basePrice: 2200, skillLevel: 60, ammoTag: 'plasmaammo', shotsPerMagazine: 25,
  texture: '%ModDir%/Items/PlasmaRifle.png',
})))

console.log('\n═══ 2. 近战武器 ═══')
console.log(render('barotrauma_gen_item', {}, await call('barotrauma_gen_item', {
  modDir, identifier: 'PlasmaBlade', kind: 'weapon_melee',
  displayName: '等离子刃', basePrice: 900,
  damage: ['lacerations:40', 'bleeding:20', 'burn:15'],
  texture: '%ModDir%/Items/PlasmaBlade.png',
})))

console.log('\n═══ 3. 消耗品（医疗）═══')
console.log(render('barotrauma_gen_item', {}, await call('barotrauma_gen_item', {
  modDir, identifier: 'PlasmaGel', kind: 'consumable',
  displayName: '等离子凝胶', description: '快速止血并抑制灼伤。',
  basePrice: 120, reduce: ['bleeding:3', 'burn:2', 'lacerations:1'],
  texture: '%ModDir%/Items/PlasmaGel.png',
})))

console.log('\n═══ 4. 穿戴装备 ═══')
console.log(render('barotrauma_gen_item', {}, await call('barotrauma_gen_item', {
  modDir, identifier: 'PlasmaVest', kind: 'equipment',
  displayName: '等离子护甲', basePrice: 1500, armorSlot: 'Torso',
  texture: '%ModDir%/Items/PlasmaVest.png',
})))

console.log('\n═══ 5. 状态效果 ═══')
console.log(render('barotrauma_gen_affliction', {}, await call('barotrauma_gen_affliction', {
  modDir, identifier: 'plasmapoisoning',
  displayName: '等离子中毒', description: '等离子在体内沉积造成的组织损伤。',
  maxStrength: 50, targets: 'human', isBuff: false,
  effects: ['0-10:2', '10-50:0'], iconColors: '120,200,255,255;255,255,255,255',
})))

console.log('\n── 最终目录 ──')
async function walk(dir, prefix = '') {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix === '' ? e.name : `${prefix}/${e.name}`
    if (e.isDirectory()) { console.log(`  ${rel}/`); await walk(join(dir, e.name), rel) }
    else console.log(`  ${rel}  (${(await readFile(join(dir, e.name), 'utf8')).length} B)`)
  }
}
await walk(modDir)

console.log('\n── filelist.xml ──')
console.log(await readFile(join(modDir, 'filelist.xml'), 'utf8'))

console.log('── Localization/SimplifiedChinese.xml ──')
console.log(await readFile(join(modDir, 'Localization', 'SimplifiedChinese.xml'), 'utf8'))

console.log('── Items/PlasmaItems.xml（前 60 行）──')
const items = await readFile(join(modDir, 'Items', 'PlasmaItems.xml'), 'utf8')
console.log(items.split('\n').slice(0, 60).join('\n'))
console.log(`...（共 ${items.split('\n').length} 行）`)
