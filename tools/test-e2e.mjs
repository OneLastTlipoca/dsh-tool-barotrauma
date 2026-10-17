/**
 * 端到端测试：走完整条链路，产出一个真实可加载的潜渊症内容包。
 * 产物落在 .scratch/e2e/，不碰真实 LocalMods。
 *
 * 用法：node tools/test-e2e.mjs
 */
import { mkdir, rm, readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apply, TOOL_NAMES } from '../lib/index.js'

const here = fileURLToPath(new URL('..', import.meta.url))
const scratch = join(here, '.scratch', 'e2e')

const registry = new Map()
apply({
  effect: (factory) => { const d = factory(); return () => d?.() },
  tools: { register(def) { registry.set(def.name, def); return () => registry.delete(def.name) } },
}, {})

const missing = TOOL_NAMES.filter((n) => !registry.has(n))
if (missing.length > 0) {
  console.error(`❌ TOOL_NAMES 与实注册不一致，缺少：${missing.join(', ')}`)
  process.exit(1)
}
console.log(`已注册 ${registry.size} 个工具：\n  ${[...registry.keys()].join('\n  ')}\n`)

const call = (name, args) => registry.get(name).execute(args, { signal: AbortSignal.timeout(120_000) })
const head = (title) => console.log(`\n═══ ${title} ═══`)

await rm(scratch, { recursive: true, force: true })
await mkdir(scratch, { recursive: true })

const MOD = '欧罗巴异种武器'
const modDir = join(scratch, MOD)

head('1. create_mod（骨架）')
const created = await call('barotrauma_create_mod', {
  name: MOD, identifierPrefix: 'Xeno', features: ['items', 'characters', 'events', 'lua', 'csharp', 'localization'],
  outputRoot: scratch, modVersion: '0.1.0',
})
console.log(`目录 ${created.directories.join(' | ')}`)
console.log(`新建 ${created.created.length} 个文件，filelist 记录 ${created.filelistEntries.length} 条`)
created.warnings.forEach((w) => console.log(`  ⚠️ ${w}`))

head('2. gen_item ×3')
for (const spec of [
  { identifier: 'XenoRifle', kind: 'weapon_ranged', displayName: '异种步枪', description: '用异种生物组织培育的活体枪械。', basePrice: 1800, skillLevel: 55, ammoTag: 'xenoammo', shotsPerMagazine: 30 },
  { identifier: 'XenoGland', kind: 'consumable', displayName: '异种腺体', basePrice: 90, reduce: ['bleeding:2', 'burn:1.5'] },
  { identifier: 'XenoPlate', kind: 'equipment', displayName: '异种甲壳', basePrice: 1200, armorSlot: 'Torso' },
]) {
  const r = await call('barotrauma_gen_item', { modDir, ...spec, texture: `%ModDir%/Items/${spec.identifier}.png` })
  console.log(`  ${r.identifier} → ${r.targetFile}（${r.appendOutcome}）生成 ${r.generatedIdentifiers.join('+')}，本地化 +${r.localizationEntries}`)
}

head('3. gen_affliction')
const aff = await call('barotrauma_gen_affliction', {
  modDir, identifier: 'xenoparasite', displayName: '异种寄生', description: '异种组织在宿主体内增殖。',
  maxStrength: 60, effects: ['0-20:3', '20-60:0'],
})
console.log(`  ${aff.identifier} → ${aff.targetFile}（${aff.appendOutcome}）filelist+${aff.filelistAdded ? 1 : 0}`)

head('4. gen_character')
const cha = await call('barotrauma_gen_character', {
  modDir, speciesName: 'XenoHound', displayName: '异种猎犬',
  vitality: 220, aiCombatStrength: 320, loot: ['hydroxyapatite:2', 'xenogland'],
})
console.log(`  ${cha.speciesName} → ${cha.targetFile}（written=${cha.written}）filelist+${cha.filelistAdded ? 1 : 0}`)

head('5. gen_event')
const evt = await call('barotrauma_gen_event', {
  modDir, identifier: 'xenohoundambush', commonness: 40,
  introText: '一只异种猎犬从走廊尽头扑过来。', optionTexts: ['开火', '撤退'],
  speciesName: 'XenoHound', spawnCount: 2, spriteTexture: '%ModDir%/UI/xeno_event.png',
  levelType: 'outpost', locationType: 'outpost,city',
})
console.log(`  ${evt.identifier} → ${evt.targetFile}（${evt.appendOutcome}）配图=${evt.spriteAdded} 本地化+${evt.localizationEntries}`)

head('6. gen_lua')
const lua = await call('barotrauma_gen_lua', {
  modDir, modName: MOD, hooks: ['roundStart', 'characterCreated'], side: 'server',
})
console.log(`  ${lua.targetFile}（written=${lua.written}），钩子 ${lua.hooks.join(', ')}`)

head('7. gen_csharp')
const cs = await call('barotrauma_gen_csharp', {
  modDir, className: 'XenoWeaponsMod', modName: MOD, style: 'legacy', targetFolder: 'Shared',
})
console.log(`  ${cs.targetFile}（written=${cs.written}）RunConfig=${cs.runConfigWritten} filelist+${cs.filelistAdded ? 1 : 0}`)

head('8. scan_l10n')
const scan = await call('barotrauma_scan_l10n', { modDir })
console.log(`  需要 ${scan.requiredKeyCount} 个键，缺失 ${scan.missingKeyCount}`)
for (const lang of scan.languages) console.log(`   ${lang.file}：已定义 ${lang.definedKeyCount}，缺 ${lang.missingKeys.length}`)

head('9. translate（翻译全部缺失键）')
const zh = {
  'entityname.XenoRifle': '异种步枪',
  'entitydescription.XenoRifle': '用异种生物组织培育的活体枪械。',
  'entityname.XenoRifleMagazine': '异种弹匣',
  'entitydescription.XenoRifleMagazine': '步枪弹药。',
  'entityname.XenoRifleRound': '异种子弹',
  'entitydescription.XenoRifleRound': '被异种组织包裹的弹丸。',
  'entityname.XenoGland': '异种腺体',
  'entitydescription.XenoGland': '可止血并抑制灼伤。',
  'entityname.XenoPlate': '异种甲壳',
  'entitydescription.XenoPlate': '活体甲壳，能分散冲击。',
  'afflictionname.xenoparasite': '异种寄生',
  'afflictiondescription.xenoparasite': '异种组织在宿主体内增殖。',
  'character.XenoHound': '异种猎犬',
  'eventtext.xenohoundambush.intro': '一只异种猎犬从走廊尽头扑过来。',
  'eventtext.xenohoundambush.opt1': '开火',
  'eventtext.xenohoundambush.opt2': '撤退',
}
const tr = await call('barotrauma_translate', { modDir, locale: 'zh-cn', translations: zh })
console.log(`  提交 ${tr.submitted} 条，写入 ${tr.written} 条，跳过 ${tr.skipped.length} 条`)
console.log(`  仍缺 ${tr.requiredKeys.length} 个键${tr.requiredKeys.length > 0 ? '：' + tr.requiredKeys.slice(0, 8).join(', ') : ''}`)

head('10. validate')
const val = await call('barotrauma_validate', { modDir, writeReport: true })
console.log(`  filelist ${val.registeredFileCount} 条 / XML ${val.scannedXmlCount} 个`)
console.log(`  问题：blocker ${val.blockerCount} / major ${val.majorCount} / minor ${val.minorCount}`)
for (const issue of val.issues) console.log(`   [${issue.severity}] ${issue.code}: ${issue.message}`)

head('11. pack')
const packed = await call('barotrauma_pack', { modDir })
console.log(`  ${packed.zipPath}（${packed.zipSizeText}，${packed.fileCount} 个文件）`)
packed.warnings.forEach((w) => console.log(`  ⚠️ ${w}`))

head('12. publish')
const pub = await call('barotrauma_publish', {
  modDir, summary: '异种生物改造的武器、护甲与寄生状态效果。',
  tags: ['Items', 'Weapons', 'Creatures', 'Chinese'], changelog: ['首次发布'],
  version: '0.1.0', authors: ['我'],
})
console.log(`  文档：${pub.documentPath}`)
console.log(`  阻塞项 ${pub.blockingIssues.length} 个${pub.blockingIssues.length > 0 ? '：' + pub.blockingIssues.join('；') : ''}`)

head('最终目录')
async function walk(dir, prefix = '') {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix === '' ? e.name : `${prefix}/${e.name}`
    if (e.isDirectory()) { console.log(`  ${rel}/`); await walk(join(dir, e.name), rel) }
    else { const s = await stat(join(dir, e.name)); console.log(`  ${rel}  (${s.size} B)`) }
  }
}
await walk(modDir)

head('filelist.xml')
console.log(await readFile(join(modDir, 'filelist.xml'), 'utf8'))

head('事件 XML')
console.log(await readFile(join(modDir, 'Events', 'XenoEvents.xml'), 'utf8'))
