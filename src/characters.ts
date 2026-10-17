/**
 * dsh-tool-barotrauma — 阶段二之二：角色 / 怪物（`barotrauma_gen_character`）。
 *
 * 照抄本机真实样本（refs/reference.md C 节）：
 *   - 根元素 = **单个** `<Character SpeciesName="...">`，一个文件一个物种；
 *   - `SpeciesName` 是必需属性，事件里的 `<SpawnAction speciesname="...">` 引用它；
 *   - 掉落 = `<Inventory>` + `<Item Identifier="...">`，用 `Commonness` 做权重；
 *   - 本地化键 = `character.<SpeciesName>`。
 * @module dsh-tool-barotrauma/characters
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import type { BarotraumaPluginConfig } from './config.js'
import { appendLanguageEntries, ensureRegistered, findLanguageFile, readFilelist } from './pack-io.js'
import { CONTENT_TAGS, characterNameKey } from './xml.js'
import {
  asBoolean,
  asNumber,
  asString,
  asStringArray,
  BarotraumaError,
  pascalCase,
  pathExists,
  registerTool,
  requireString,
  resolveInside,
  writeFileEnsured,
} from './util.js'

/** 解析 `tag:state:priority` 形式的目标优先级。 */
function parseTargetPriorities(
  raw: string[],
): Array<{ tag: string; state: string; priority: number }> {
  const defaults = [
    { tag: 'human', state: 'Attack', priority: 200 },
    { tag: 'dead', state: 'Eat', priority: 140 },
    { tag: 'wall', state: 'Attack', priority: 40 },
  ]
  if (raw.length === 0) return defaults
  return raw.map((entry) => {
    const [tag, state, priority] = entry.split(':')
    if (tag === undefined || tag.trim() === '') {
      throw new BarotraumaError('INVALID_ARGUMENT', `targetPriorities 格式应为 "tag:state:priority"，收到：${entry}`)
    }
    return {
      tag: tag.trim(),
      state: asString(state, 'Attack').trim() || 'Attack',
      priority: Math.trunc(asNumber(priority, 100)),
    }
  })
}

/** 生成一个 `<Character>` 全文。 */
function characterXml(i: {
  speciesName: string
  group: string
  humanoid: boolean
  vitality: number
  doesBleed: boolean
  crushDepth: string
  canEat: boolean
  aiCombatStrength: number
  aiSight: number
  aiHearing: number
  aggressiveBoarding: boolean
  fleeHealthThreshold: number
  aggressionGreed: number
  aggressionHurt: number
  targetPriorities: ReadonlyArray<{ tag: string; state: string; priority: number }>
  loot: ReadonlyArray<{ identifier: string; amount: number }>
  soundFile: string
}): string {
  const targets = i.targetPriorities
    // 官方 Character 页的示例用 `<target>`；本机原版内容也以 `<target>` 为主
    // （`<targetpriority>` 是旧写法，实测仍有 mod 在用，游戏两者都认）。
    .map((t) => `    <target tag="${t.tag}" state="${t.state}" priority="${t.priority}" />`)
    .join('\n')
  const loot = i.loot.length > 0
    ? `
  <Inventory slots="Any, Any" accessiblewhenalive="false" commonness="1">
${i.loot.map((item) => `    <Item identifier="${item.identifier}"${item.amount > 1 ? ` amount="${item.amount}"` : ''} />`).join('\n')}
  </Inventory>`
    : ''
  const sound = i.soundFile !== ''
    ? `
  <sound file="${i.soundFile}" state="Attack" range="1000" />`
    : ''

  return `${'<?xml version="1.0" encoding="utf-8"?>'}
<Character SpeciesName="${i.speciesName}" humanoid="${i.humanoid ? 'true' : 'false'}" group="${i.group}"
           needsair="${i.humanoid ? 'true' : 'false'}" needswater="${i.humanoid ? 'true' : 'false'}"
           caninteract="${i.humanoid ? 'true' : 'false'}" showhealthbar="true"
           usehumanai="${i.humanoid ? 'true' : 'false'}" hideinsonar="false">
  <ragdolls />
  <animations />
  <health vitality="${i.vitality}" doesbleed="${i.doesBleed ? 'true' : 'false'}" crushdepth="${i.crushDepth}" />
  <bloodemitter particle="blood" particleamount="1" />
  <damageemitter particle="brownchunks" particleamount="10" velocitymin="50" velocitymax="300"
                 anglemin="0" anglemax="360" scalemin="0.1" scalemax="0.3" />
  <gibemitter particle="gib" particleamount="20" velocitymin="200" velocitymax="700"
              anglemin="0" anglemax="360" />${sound}${loot}
  <ai combatstrength="${i.aiCombatStrength}" sight="${i.aiSight}" hearing="${i.aiHearing}"
      aggressiveboarding="${i.aggressiveBoarding ? 'true' : 'false'}"
      fleehealththreshold="${i.fleeHealthThreshold}"
      aggressiongreed="${i.aggressionGreed}" aggressionhurt="${i.aggressionHurt}">
${targets}
  </ai>
</Character>
`
}

/** 注册角色生成工具。 */
export function registerCharacterTools(ctx: Context, _config: BarotraumaPluginConfig): void {
  registerTool(ctx, defineTool({
    name: 'barotrauma_gen_character',
    description:
      '生成潜渊症角色/怪物定义（一个物种一个文件）并登记进 filelist.xml。' +
      '字段照抄本机真实样本：SpeciesName 必需、<health>、<bloodemitter>/<damageemitter>/<gibemitter>、' +
      '<Inventory> 掉落、<ai> 与 <target>。物种名写进本地化 character.<SpeciesName>。',
    parameters: {
      modDir: { type: 'string', required: true, description: 'mod 根目录。' },
      speciesName: { type: 'string', required: true, description: 'SpeciesName（物种 ID，事件 SpawnAction 引用它）。' },
      displayName: { type: 'string', description: '显示名（写进本地化 character.<SpeciesName>）。' },
      group: { type: 'string', description: 'group 属性，默认取 speciesName。' },
      humanoid: { type: 'boolean', description: 'humanoid，默认 false。' },
      vitality: { type: 'integer', description: 'health vitality，默认 120。' },
      doesBleed: { type: 'boolean', description: 'health doesbleed，默认 true。' },
      crushDepth: { type: 'string', description: 'health crushdepth，默认 Infinity。' },
      aiCombatStrength: { type: 'integer', description: 'ai combatstrength，默认 250。' },
      aiSight: { type: 'number', description: 'ai sight，默认 0.5。' },
      aiHearing: { type: 'number', description: 'ai hearing，默认 1.0。' },
      aggressiveBoarding: { type: 'boolean', description: 'ai aggressiveboarding，默认 true。' },
      fleeHealthThreshold: { type: 'integer', description: 'ai fleehealththreshold，默认 20。' },
      targetPriorities: { type: 'array', items: { type: 'string' }, description: '目标优先级，格式 ["human:Attack:200","dead:Eat:140","wall:Attack:40"]。' },
      loot: { type: 'array', items: { type: 'string' }, description: '掉落物，格式 ["molochbone"] 或 ["molochbone:2"]。' },
      soundFile: { type: 'string', description: '攻击音效路径（可选），例如 Content/Characters/Mudraptor/MUDRAPTOR_attack1.ogg。' },
      targetFile: { type: 'string', description: '目标 XML（相对 mod 根），默认 Characters/<SpeciesName>.xml。' },
      writeLocalization: { type: 'boolean', description: '是否写本地化，默认 true。' },
      overwrite: { type: 'boolean', description: '已存在同名文件时是否覆盖，默认 false。' },
      dryRun: { type: 'boolean', description: '只生成不写盘，默认 false。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          speciesName: { type: 'string', required: true },
          targetFile: { type: 'string', required: true },
          written: { type: 'boolean', required: true },
          filelistAdded: { type: 'boolean', required: true },
          localizationFile: { type: 'string', required: true },
          localizationEntries: { type: 'integer', required: true },
          dryRun: { type: 'boolean', required: true },
          xml: { type: 'string', required: true },
          warnings: { type: 'array', required: true, items: { type: 'string' } },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: [
          `生成角色 ${value.speciesName} → ${value.targetFile}`,
          `写入：${value.written ? '是' : '否（已存在或 dryRun）'}　filelist 登记：${value.filelistAdded ? '新增记录' : '已有记录'}`,
          `本地化：${value.localizationFile || '(未找到)'} 写入 ${value.localizationEntries} 条`,
          '',
          value.xml,
          ...value.warnings.map((warning) => `⚠️ ${warning}`),
        ].join('\n'),
      }],
    },
    timeoutMs: 60_000,
    isConcurrencySafe: () => false,
    async execute(args) {
      const modDir = asString(args.modDir).trim()
      if (modDir === '') throw new BarotraumaError('MISSING_ARGUMENT', '缺少必填参数 modDir')
      const speciesName = pascalCase(requireString(args.speciesName, 'speciesName')) || requireString(args.speciesName, 'speciesName')

      const warnings: string[] = []
      const targetPriorities = parseTargetPriorities(asStringArray(args.targetPriorities))
      const loot = asStringArray(args.loot).map((entry) => {
        const [identifier, amount] = entry.split(':')
        return { identifier: asString(identifier), amount: Math.max(1, Math.trunc(asNumber(amount, 1))) }
      }).filter((item) => item.identifier !== '')

      const xml = characterXml({
        speciesName,
        group: asString(args.group).trim() || speciesName,
        humanoid: asBoolean(args.humanoid, false),
        vitality: Math.max(1, Math.trunc(asNumber(args.vitality, 120))),
        doesBleed: asBoolean(args.doesBleed, true),
        crushDepth: asString(args.crushDepth, 'Infinity'),
        canEat: false,
        aiCombatStrength: Math.max(0, Math.trunc(asNumber(args.aiCombatStrength, 250))),
        aiSight: asNumber(args.aiSight, 0.5),
        aiHearing: asNumber(args.aiHearing, 1),
        aggressiveBoarding: asBoolean(args.aggressiveBoarding, true),
        fleeHealthThreshold: Math.trunc(asNumber(args.fleeHealthThreshold, 20)),
        aggressionGreed: 30,
        aggressionHurt: 100,
        targetPriorities,
        loot,
        soundFile: asString(args.soundFile).trim(),
      })

      const targetFile = (asString(args.targetFile).trim() || `Characters/${speciesName}.xml`).replace(/\\/g, '/')
      const dryRun = asBoolean(args.dryRun, false)
      const overwrite = asBoolean(args.overwrite, false)

      const displayName = asString(args.displayName)
      const l10nEntries: Array<{ key: string; text: string }> = []
      if (displayName.trim() !== '') l10nEntries.push({ key: characterNameKey(speciesName), text: displayName })

      let written = false
      let filelistAdded = false
      let localizationFile = ''
      let localizationEntries = 0

      if (!dryRun) {
        const target = resolveInside(modDir, targetFile)
        if (await pathExists(target) && !overwrite) {
          warnings.push(`${targetFile} 已存在且 overwrite=false —— 未覆盖。角色定义是一个文件一个物种，覆盖前请确认。`)
        } else {
          await writeFileEnsured(target, xml)
          written = true
          const registration = await ensureRegistered(modDir, CONTENT_TAGS.character, targetFile)
          filelistAdded = registration.added
        }
        if (written && asBoolean(args.writeLocalization, true) && l10nEntries.length > 0) {
          const languageFile = await findLanguageFile(modDir)
          if (languageFile === null) {
            warnings.push('mod 里没有语言文件记录，显示名未写入本地化。')
          } else {
            localizationFile = languageFile
            localizationEntries = await appendLanguageEntries(languageFile, l10nEntries)
          }
        }
      } else {
        warnings.push('dryRun=true：未写盘。')
      }

      // 已经登记过同名 file 时提示（避免重复登记）
      const doc = await readFilelist(modDir)
      if (doc.entries.some((entry) => entry.file.toLowerCase() === targetFile.toLowerCase() && entry.tag.toLowerCase() === 'character')) {
        warnings.push(`${targetFile} 已在 filelist 里登记过，未重复添加。`)
      }

      return {
        ok: true,
        speciesName,
        targetFile,
        written,
        filelistAdded,
        localizationFile,
        localizationEntries,
        dryRun,
        xml,
        warnings,
      }
    },
  }))
}
